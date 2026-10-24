# Talshift

Talshift is a blank React single-page app served by an Express HTTP server. The backend exposes the API and connects to PostgreSQL through `pg`.

## Requirements

- Node.js 20.19 or newer (Node.js 22 LTS recommended) and npm
- A reachable PostgreSQL database

## Configure PostgreSQL

Set `DATABASE_URL` in the shell where the backend will run. For PowerShell:

```powershell
$env:DATABASE_URL = "postgres://postgres:password@localhost:5432/talshift"
```

For Command Prompt:

```bat
set DATABASE_URL=postgres://postgres:password@localhost:5432/talshift
```

Use credentials appropriate for your local database; do not commit them.

## Development

Start the backend from `backend/` in one terminal:

```powershell
cd backend
npm install
npm run dev
```

Then, in another terminal, start Vite:

```sh
cd frontend
npm install
npm run dev
```

Open the URL it prints; requests to `/api/*` are proxied to the backend at `http://127.0.0.1:3000`.

## Production Build

Build the frontend, then build and start the backend:

```sh
cd frontend
npm ci
npm run build
cd ../backend
npm ci
npm run build
npm start
```

The backend serves `frontend/dist` by default. Set `FRONTEND_DIST` to use another build directory, or `PORT` to change the HTTP port.

## Deploy to AWS

The `infra/template.yaml` CloudFormation stack creates one small EC2 application server and a single-AZ PostgreSQL RDS instance in private subnets. RDS encrypts storage and creates/rotates its master password in Secrets Manager. The application instance role can read only that database secret; no database password is placed in the deployment script or instance configuration. Database access is limited to the application server security group.

The stack keeps the server and database running, so AWS charges continue until you remove them. RDS has seven-day backups; deleting the stack creates a final database snapshot that remains billable. This is a low-traffic starter setup, not a highly available design. The public endpoint uses HTTP; configure HTTPS with a domain and a TLS-terminating proxy before using it for sign-in or other sensitive browser traffic.

Prerequisites: an AWS account with permissions to create CloudFormation, EC2, IAM, VPC, and RDS resources; AWS CLI configured for the target account; and the Windows OpenSSH client. Create or choose an EC2 key pair in the target region and keep its private key file. Find your public IPv4 address and use it as an SSH `/32` CIDR.

From the repository root in PowerShell:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
./infra/deploy.ps1 -KeyPairName "my-key-pair" -KeyFile "$HOME/.ssh/my-key-pair.pem" -SshCidr "203.0.113.10/32" -Region "us-east-1"
```

The script creates or updates the stack, builds the combined frontend/backend container on the EC2 instance, restarts the service, and checks `/api/health`. Subsequent runs deploy code updates. The database secret ARN is available in the CloudFormation stack outputs; its value is never printed by the script. Restrict SSH to your current IP and delete the stack when it is no longer needed, keeping in mind the final snapshot.

## Checks

```sh
cd frontend
npm run typecheck
npm run build
cd ../backend
npm run typecheck
npm run build
```

`GET /api/health` runs `SELECT 1` and returns `{"status":"ok"}` when the database is available, or HTTP 503 when it is not. Unknown API routes return a JSON 404. No database schema or migrations are required for this starter.
