param(
  [Parameter(Mandatory = $true)]
  [string]$KeyPairName,

  [Parameter(Mandatory = $true)]
  [string]$KeyFile,

  [Parameter(Mandatory = $true)]
  [string]$SshCidr,

  [string]$StackName = "talshift",
  [string]$Region = "us-east-1"
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
  throw "Install and configure the AWS CLI before deploying."
}
if (-not (Get-Command ssh -ErrorAction SilentlyContinue) -or
    -not (Get-Command scp -ErrorAction SilentlyContinue)) {
  throw "OpenSSH client (ssh and scp) is required."
}
if (-not (Test-Path $KeyFile -PathType Leaf)) {
  throw "SSH private key not found: $KeyFile"
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$template = Join-Path $PSScriptRoot "template.yaml"
$keyPath = (Resolve-Path $KeyFile).Path
$archive = Join-Path $env:TEMP "talshift-deploy-$PID.zip"
$staging = Join-Path $env:TEMP "talshift-deploy-$PID"

try {
  & aws cloudformation deploy `
    --template-file $template `
    --stack-name $StackName `
    --region $Region `
    --capabilities CAPABILITY_IAM `
    --parameter-overrides "KeyPairName=$KeyPairName" "SshCidr=$SshCidr"
  if ($LASTEXITCODE -ne 0) {
    throw "CloudFormation deployment failed."
  }

  $outputs = & aws cloudformation describe-stacks `
    --stack-name $StackName `
    --region $Region `
    --query "Stacks[0].Outputs" `
    --output json | ConvertFrom-Json
  if ($LASTEXITCODE -ne 0) {
    throw "Could not read CloudFormation stack outputs."
  }

  $publicIp = ($outputs | Where-Object OutputKey -eq "ApplicationPublicIp").OutputValue
  $secretArn = ($outputs | Where-Object OutputKey -eq "DatabaseSecretArn").OutputValue
  if (-not $publicIp -or -not $secretArn) {
    throw "The stack did not return the application address and database secret ARN."
  }

  $payload = @(
    "Dockerfile",
    ".dockerignore",
    "frontend/package.json",
    "frontend/package-lock.json",
    "frontend/index.html",
    "frontend/vite.config.ts",
    "frontend/tsconfig.json",
    "frontend/tsconfig.app.json",
    "frontend/tsconfig.node.json",
    "frontend/src",
    "frontend/public",
    "backend/package.json",
    "backend/package-lock.json",
    "backend/tsconfig.json",
    "backend/src"
  )
  New-Item -ItemType Directory -Path $staging -Force | Out-Null
  foreach ($relativePath in $payload) {
    $source = Join-Path $repoRoot $relativePath
    $destination = Join-Path $staging $relativePath
    New-Item -ItemType Directory -Path (Split-Path $destination -Parent) -Force | Out-Null
    Copy-Item -Path $source -Destination $destination -Recurse -Force
  }
  Compress-Archive -Path (Join-Path $staging "*") -DestinationPath $archive -Force

  $sshTarget = "ec2-user@$publicIp"
  $sshOptions = @(
    "-i", $keyPath,
    "-o", "BatchMode=yes",
    "-o", "ConnectTimeout=5",
    "-o", "StrictHostKeyChecking=accept-new"
  )

  $ready = $false
  for ($attempt = 0; $attempt -lt 60; $attempt++) {
    & ssh @sshOptions $sshTarget "sudo test -x /usr/bin/docker && sudo test -f /etc/systemd/system/talshift.service" 2>$null
    if ($LASTEXITCODE -eq 0) {
      $ready = $true
      break
    }
    Start-Sleep -Seconds 10
  }
  if (-not $ready) {
    throw "The EC2 instance did not finish initialization in time."
  }

  & scp -i $keyPath -o BatchMode=yes -o StrictHostKeyChecking=accept-new `
    $archive "${sshTarget}:/tmp/talshift-deploy.zip"
  if ($LASTEXITCODE -ne 0) {
    throw "Could not upload the application source."
  }

  & ssh @sshOptions $sshTarget `
    "sudo unzip -oq /tmp/talshift-deploy.zip -d /opt/talshift/source && sudo docker build -t talshift:current /opt/talshift/source && sudo systemctl restart talshift.service"
  if ($LASTEXITCODE -ne 0) {
    throw "The application image build or restart failed."
  }

  $url = "http://$publicIp/api/health"
  for ($attempt = 0; $attempt -lt 30; $attempt++) {
    try {
      $health = Invoke-RestMethod -Uri $url -TimeoutSec 5
      if ($health.status -eq "ok") {
        Write-Host "Talshift is live at http://$publicIp"
        return
      }
    }
    catch {
      Start-Sleep -Seconds 5
    }
  }
  throw "Deployment finished, but the health check did not return ok: $url"
}
finally {
  Remove-Item $archive -Force -ErrorAction SilentlyContinue
  Remove-Item $staging -Recurse -Force -ErrorAction SilentlyContinue
}