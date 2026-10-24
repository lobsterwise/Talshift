// ─────────────────────────────────────────────────────────────────────────────
// ProfileTab.jsx — Student step 1: upload resume + GitHub, pick a target role,
// see the Standardized Score, the Recruiter Transparency Checklist, and the
// structured data model the AI extracted.
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react'
import {
  Upload, Github, Sparkles, Bot, Brain, Layers, PenTool, CheckCircle2, XCircle, Loader2,
  Gauge, ListChecks, FileJson, Lightbulb, ArrowRight, Link2, Check, Code2, Target, RefreshCw,
} from 'lucide-react'
import { Card, CardHeader, Badge, Button, ProgressBar, ScoreRing, Label, inputClass, cx, Segmented } from './ui'
import { ROLES, SKILLS } from '../api/mockData.js'
import { DIMENSIONS, nextTier, RECRUITER_DEFAULTS } from '../api/client.js'

const ROLE_ICONS = { robotics: Bot, ml: Brain, fullstack: Layers, ux: PenTool }
export const ANALYSIS_STEPS = [
  'Parsing resume into sections',
  'Extracting skills, projects & experience',
  'Checking GitHub repos for demos and contributors',
  'Matching evidence to the role rubric',
  'Standardizing scores against OSU peers',
]

export default function ProfileTab({
  input, setInput, roleId, setRoleId, onAnalyze, analyzing, analysisStep,
  parsed, result, scoreDelta, onGoToPlan, onEdit, editing,
}) {
  const showForm = !parsed || editing
  return (
    <div className="space-y-6">
      {showForm ? (
        <InputCard input={input} setInput={setInput} roleId={roleId} setRoleId={setRoleId}
          onAnalyze={onAnalyze} analyzing={analyzing} analysisStep={analysisStep} />
      ) : (
        <Results parsed={parsed} result={result} roleId={roleId} setRoleId={setRoleId}
          scoreDelta={scoreDelta} onGoToPlan={onGoToPlan} onEdit={onEdit} />
      )}
    </div>
  )
}

// ── 1. Input form ───────────────────────────────────────────────────────────
function InputCard({ input, setInput, roleId, setRoleId, onAnalyze, analyzing, analysisStep }) {
  const [fileNote, setFileNote] = useState('')

  const onFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      const reader = new FileReader()
      reader.onload = () => {
        setInput({ ...input, resumeText: String(reader.result) })
        setFileNote(`Loaded ${file.name}`)
      }
      reader.readAsText(file)
    } else {
      // PDFs are sent to the backend as-is; text extraction happens server-side.
      setInput({ ...input, resumeFile: file })
      setFileNote(`${file.name} attached. The server extracts PDF text; the pasted text below is used for this demo.`)
    }
  }

  return (
    <Card>
      <CardHeader icon={Sparkles} title="Build your verified profile"
        subtitle="Paste your resume, add GitHub, pick a direction. The AI reads your real work. It never writes fake polish." />
      <div className="grid gap-6 p-5 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="resume">Resume</Label>
              <label className="mb-1.5 inline-flex cursor-pointer items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200">
                <Upload className="h-3.5 w-3.5" /> Upload PDF / TXT
                <input type="file" accept=".pdf,.txt,.md" className="hidden" onChange={onFile} />
              </label>
            </div>
            <textarea id="resume" rows={13} value={input.resumeText}
              onChange={(e) => setInput({ ...input, resumeText: e.target.value })}
              className={cx(inputClass, 'font-mono text-xs leading-relaxed')} />
            {fileNote && <p className="mt-1.5 text-xs text-zinc-500">{fileNote}</p>}
          </div>
          <div>
            <Label htmlFor="gh">GitHub or portfolio link</Label>
            <div className="relative">
              <Github className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input id="gh" value={input.githubUrl} onChange={(e) => setInput({ ...input, githubUrl: e.target.value })}
                className={cx(inputClass, 'pl-9')} placeholder="https://github.com/you" />
            </div>
          </div>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <div>
            <Label>Target role / career track</Label>
            <div className="grid gap-2">
              {Object.values(ROLES).map((r) => {
                const Icon = ROLE_ICONS[r.id]
                const active = roleId === r.id
                return (
                  <button key={r.id} onClick={() => setRoleId(r.id)}
                    className={cx('flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors',
                      active ? 'border-zinc-400 bg-zinc-800/70' : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700')}>
                    <Icon className={cx('h-4 w-4', active ? 'text-zinc-100' : 'text-zinc-500')} />
                    <div className="min-w-0 flex-1">
                      <div className={cx('text-sm font-medium', active ? 'text-zinc-50' : 'text-zinc-300')}>{r.label}</div>
                      <div className="text-xs text-zinc-500">{r.requirements.length} rubric items · {r.capstone.company} project</div>
                    </div>
                    <div className={cx('h-3.5 w-3.5 rounded-full border', active ? 'border-zinc-100 bg-zinc-100' : 'border-zinc-600')} />
                  </button>
                )
              })}
            </div>
          </div>

          {analyzing ? (
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
              <ul className="space-y-2.5">
                {ANALYSIS_STEPS.map((s, i) => (
                  <li key={s} className="flex items-center gap-2.5 text-sm">
                    {i < analysisStep ? <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      : i === analysisStep ? <Loader2 className="h-4 w-4 animate-spin text-zinc-300" />
                        : <div className="h-4 w-4 rounded-full border border-zinc-700" />}
                    <span className={i <= analysisStep ? 'text-zinc-200' : 'text-zinc-600'}>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <Button variant="scarlet" size="lg" icon={Sparkles} className="w-full" onClick={onAnalyze}
              disabled={input.resumeText.trim().length < 40}>
              Analyze my real work
            </Button>
          )}
          <p className="text-xs leading-relaxed text-zinc-500">
            Scores are standardized on the same 4 dimensions for every OSU student, so a recruiter or mentor can compare fairly without reading 500 different resume formats.
          </p>
        </div>
      </div>
    </Card>
  )
}

// ── 2. Results ──────────────────────────────────────────────────────────────
function Results({ parsed, result, roleId, setRoleId, scoreDelta, onGoToPlan, onEdit }) {
  const [copied, setCopied] = useState(false)
  const [showJson, setShowJson] = useState(false)
  const role = ROLES[roleId]
  const target = RECRUITER_DEFAULTS.minCoverage
  const toClear = Math.max(0, Math.ceil((target / 100) * result.rubric.total) - result.rubric.metCount)

  const copyLink = () => {
    navigator.clipboard?.writeText(`https://rungs.osu.dev/p/jordan-patel?role=${roleId}`).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  const dataModel = {
    skills: parsed.skills.map((s) => SKILLS[s].label),
    projects: parsed.projects.map((p) => ({ name: p.name, stack: p.stack, teamSize: p.teamSize, shipped: p.shipped })),
    experience: parsed.experience,
    missingGaps: result.gaps.map((g) => g.label),
    standardizedRating: { overall: result.overall, ...result.scores },
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented size="sm" value={roleId} onChange={setRoleId}
          options={Object.values(ROLES).map((r) => ({ value: r.id, label: r.short, icon: ROLE_ICONS[r.id] }))} />
        <Button variant="ghost" size="sm" icon={RefreshCw} onClick={onEdit}>Edit resume / GitHub</Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Score card */}
        <Card className="lg:col-span-2">
          <CardHeader icon={Gauge} title="Standardized Rating" subtitle={`Scored for ${role.label}`} />
          <div className="p-5">
            <div className="flex items-center gap-5">
              <ScoreRing value={result.overall} delta={scoreDelta} />
              <div className="space-y-1.5 text-sm">
                <p className="text-zinc-300">
                  <span className="font-mono text-zinc-50">{nextTier(result.overall) - result.overall}</span> points to the next tier
                  {' '}(<span className="font-mono">{nextTier(result.overall)}</span>).
                </p>
                <p className="text-xs text-zinc-500">The dashed line on each bar is your next tier. Close the smallest gap first.</p>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              {DIMENSIONS.map((d) => {
                const v = result.scores[d.key]
                const tier = nextTier(v)
                return (
                  <div key={d.key}>
                    <div className="mb-1.5 flex items-baseline justify-between">
                      <span className="text-xs font-medium text-zinc-300">{d.label}</span>
                      <span className="font-mono text-xs text-zinc-400">
                        <span className="text-zinc-100">{v}</span>
                        <span className="text-zinc-600"> / next {tier}</span>
                      </span>
                    </div>
                    <ProgressBar value={v} marker={tier} tone={d.key === 'verification' ? 'violet' : v >= 75 ? 'green' : v >= 50 ? 'zinc' : 'amber'} />
                    <p className="mt-1 text-[11px] text-zinc-600">{d.hint}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </Card>

        {/* Recruiter transparency checklist */}
        <Card className="lg:col-span-3">
          <CardHeader icon={ListChecks} title="What recruiters & industry teams actually look for"
            subtitle={`${role.label} rubric · published by hiring teams, identical for every applicant`}
            right={<Badge tone={result.rubric.coverage >= target ? 'green' : 'amber'}>{result.rubric.metCount}/{result.rubric.total} proven</Badge>} />
          <div className="p-5">
            <div className="mb-1.5 flex items-baseline justify-between text-xs">
              <span className="text-zinc-400">
                {toClear > 0
                  ? <><span className="font-medium text-zinc-100">{toClear} more proof{toClear > 1 ? 's' : ''}</span> to clear the {target}% verified bar</>
                  : <span className="font-medium text-emerald-300">You clear the {target}% verified bar for this role</span>}
              </span>
              <span className="font-mono text-zinc-500">{result.rubric.coverage}%</span>
            </div>
            <ProgressBar value={result.rubric.coverage} marker={target} tone={result.rubric.coverage >= target ? 'green' : 'amber'} height="h-2" />

            <ul className="mt-5 divide-y divide-zinc-800/80">
              {result.rubric.items.map((item) => (
                <li key={item.id} className="flex items-start gap-3 py-3">
                  {item.met
                    ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />}
                  <div className="min-w-0 flex-1">
                    <div className={cx('text-sm', item.met ? 'text-zinc-200' : 'text-zinc-100 font-medium')}>{item.label}</div>
                    <div className={cx('mt-0.5 text-xs', item.met ? 'text-zinc-500' : 'text-amber-200/70')}>{item.evidence}</div>
                  </div>
                  {!item.met && (
                    <button onClick={onGoToPlan}
                      className="inline-flex shrink-0 items-center gap-1 rounded-md border border-zinc-700 px-2 py-1 text-[11px] text-zinc-300 hover:border-zinc-500 hover:text-zinc-50">
                      Close it · {item.challenge.hours}h <ArrowRight className="h-3 w-3" />
                    </button>
                  )}
                </li>
              ))}
            </ul>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3">
              <p className="text-xs text-zinc-400">
                <span className="font-medium text-zinc-200">Stop rewriting your resume.</span> Share one verified link; every recruiter sees the same proof.
              </p>
              <Button size="sm" variant="secondary" icon={copied ? Check : Link2} onClick={copyLink}>{copied ? 'Copied' : 'Copy verified link'}</Button>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* AI advice */}
        <Card className="lg:col-span-2">
          <CardHeader icon={Lightbulb} title="AI diagnosis" subtitle="What moves your score fastest, based on your gaps" />
          <div className="space-y-4 p-5">
            {result.strong ? (
              <>
                <p className="text-sm text-zinc-300">Your proof-of-work already clears the bar. The bottleneck is interviews, so practice these patterns:</p>
                <ul className="space-y-2">
                  {role.leetcode.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-sm text-zinc-200"><Code2 className="h-3.5 w-3.5 text-sky-400" />{p}</li>
                  ))}
                </ul>
              </>
            ) : (
              <>
                <p className="text-sm text-zinc-300">
                  Your biggest gap is <span className="font-medium text-amber-300">{(result.gaps.find((g) => g.skills) || result.gaps[0])?.label}</span>.
                  A mentor-reviewed 1-day build closes it faster than any resume rewrite.
                </p>
                <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                  <div className="flex items-center gap-2"><Badge tone="violet">1-Day Challenge</Badge><span className="font-mono text-xs text-zinc-500">{(result.gaps.find((g) => g.skills) || result.gaps[0])?.challenge.hours}h</span></div>
                  <div className="mt-2 text-sm font-medium text-zinc-100">{(result.gaps.find((g) => g.skills) || result.gaps[0])?.challenge.title}</div>
                  <div className="mt-1 text-xs text-zinc-500">Deliverable: {(result.gaps.find((g) => g.skills) || result.gaps[0])?.proof}</div>
                </div>
                <div className="text-xs text-zinc-500">Already solid? Interview patterns for this role: {role.leetcode.slice(0, 2).join(' · ')}</div>
              </>
            )}
            <Button variant="primary" icon={Target} className="w-full" onClick={onGoToPlan}>See my Weekend / Week / Month plan</Button>
          </div>
        </Card>

        {/* Parsed data model */}
        <Card className="lg:col-span-3">
          <CardHeader icon={FileJson} title="Structured profile (what the AI extracted)"
            subtitle="Unstructured resume text → one standard data model"
            right={<Button size="sm" variant="ghost" onClick={() => setShowJson(!showJson)}>{showJson ? 'Visual' : 'JSON'}</Button>} />
          {showJson ? (
            <pre className="max-h-96 overflow-auto p-5 font-mono text-[11px] leading-relaxed text-zinc-300">{JSON.stringify(dataModel, null, 2)}</pre>
          ) : (
            <div className="space-y-5 p-5">
              <Section title="Skills">
                <div className="flex flex-wrap gap-1.5">
                  {parsed.skills.map((s) => <Badge key={s}>{SKILLS[s].label}</Badge>)}
                </div>
              </Section>
              <Section title="Projects">
                <ul className="space-y-2">
                  {parsed.projects.map((p) => (
                    <li key={p.name} className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="mr-1 text-sm font-medium text-zinc-100">{p.name}</span>
                        {p.shipped && <Badge tone="green">Shipped + demo</Badge>}
                        {p.hasRepo && !p.shipped && <Badge tone="blue">Repo, no demo</Badge>}
                        {p.team ? <Badge tone="violet">Team of {p.teamSize}</Badge> : <Badge>Solo</Badge>}
                      </div>
                      {p.desc && <p className="mt-1 text-xs text-zinc-500">{p.desc}</p>}
                    </li>
                  ))}
                  {parsed.projects.length === 0 && <li className="text-xs text-zinc-500">No lines starting with "Project:" found.</li>}
                </ul>
              </Section>
              <Section title="Experience">
                <ul className="space-y-1">
                  {parsed.experience.map((e) => <li key={e} className="text-xs text-zinc-400">• {e}</li>)}
                </ul>
              </Section>
              <Section title="Missing gaps">
                <div className="flex flex-wrap gap-1.5">
                  {result.gaps.map((g) => <Badge key={g.id} tone="amber" icon={XCircle}>{g.label}</Badge>)}
                  {result.gaps.length === 0 && <Badge tone="green">None for this role</Badge>}
                </div>
              </Section>
            </div>
          )}
        </Card>
      </div>
    </>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-zinc-500">{title}</div>
      {children}
    </div>
  )
}
