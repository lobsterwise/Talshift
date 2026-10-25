import { useEffect, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { buildRoadmap, getRoadmap, type RequirementMatch, type Roadmap as RoadmapData, type RoadmapTarget } from '../../api/roadmap'

const primaryClass = 'rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50'
const inputClass = 'w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-600 focus:outline-none'

const statusStyles: Record<RequirementMatch['status'], string> = {
  covered: 'border-green-200 bg-green-50 text-green-800',
  partial: 'border-amber-200 bg-amber-50 text-amber-900',
  missing: 'border-gray-200 bg-white text-gray-600',
}

function MatchBar({ label, percent, tone }: { label: string; percent: number; tone: 'current' | 'projected' }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold tabular-nums text-gray-900">{percent}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-200">
        <div className={`h-full rounded-full ${tone === 'projected' ? 'bg-green-600' : 'bg-blue-600'}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

function MatchSummary({ roadmap }: { roadmap: RoadmapData }) {
  const { match, target } = roadmap
  const covered = match.requirements.filter((item) => item.status === 'covered').length
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4">
      <div>
        <p className="text-xs text-gray-500">Target</p>
        <h2 className="font-semibold text-gray-900">{target.title}{target.organization && <span className="font-normal text-gray-600"> · {target.organization}</span>}</h2>
      </div>
      <MatchBar label="Your qualification match today" percent={match.percent} tone="current" />
      <p className="text-xs text-gray-500">
        Your resume covers {covered} of {match.requirements.length} requirements. Each requirement counts by its priority, and
        coverage depends on how closely your skills match it and how strongly your experience and projects show them.
      </p>
      <ul className="flex flex-wrap gap-1.5">
        {match.requirements.map((requirement) => (
          <li key={requirement.name} title={requirement.bestSkill ? `Closest skill: ${requirement.bestSkill}` : 'No related skill on your resume yet'}
            className={`rounded border px-1.5 py-0.5 text-xs ${statusStyles[requirement.status]}`}>
            {requirement.status === 'covered' ? '✓ ' : requirement.status === 'partial' ? '◐ ' : ''}{requirement.name}
          </li>
        ))}
      </ul>
      <p className="text-xs text-gray-500">✓ covered · ◐ partly covered · plain: not on your resume yet</p>
    </section>
  )
}

function Step({ index, when, duration, last, children }: { index: number; when: string; duration: string; last?: boolean; children: ReactNode }) {
  return (
    <li className="relative flex gap-4">
      <div className="flex flex-col items-center" aria-hidden="true">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">{index}</span>
        {!last && <span className="mt-1 w-0.5 flex-1 bg-blue-200" />}
      </div>
      <div className={`flex min-w-0 flex-1 flex-col gap-3 ${last ? '' : 'pb-8'}`}>
        <h2 className="text-lg font-semibold text-gray-900">{when} <span className="text-sm font-normal text-gray-500">· {duration}</span></h2>
        {children}
      </div>
    </li>
  )
}

function Card({ label, title, children }: { label: string; title?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-md border border-gray-200 p-3">
      <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">{label}</p>
      {title && <p className="text-sm font-semibold text-gray-900">{title}</p>}
      {children}
    </div>
  )
}

function Timeline({ roadmap }: { roadmap: RoadmapData }) {
  const { weekend, week, month, match } = roadmap
  const boost = month.projectedPercent - match.percent
  return (
    <ol className="flex flex-col" aria-label="Action timeline">
      <Step index={1} when="This Weekend" duration="1–2 days">
        <Card label="Technical micro-project" title={weekend.microProject.title}>
          {weekend.microProject.skill && <p className="text-xs text-gray-600">Closes a gap in <span className="font-medium text-gray-800">{weekend.microProject.skill}</span></p>}
          <ol className="list-decimal pl-5 text-sm text-gray-700">
            {weekend.microProject.steps.map((step) => <li key={step}>{step}</li>)}
          </ol>
          <p className="text-sm text-gray-700"><span className="font-medium text-gray-900">Done when:</span> {weekend.microProject.doneWhen}</p>
        </Card>
        <Card label="Hackathon or career event" title={weekend.event.kind}>
          <p className="text-sm text-gray-700">{weekend.event.why}</p>
          <p className="text-sm text-gray-700"><span className="font-medium text-gray-900">Where to find one:</span> {weekend.event.howToFind}</p>
        </Card>
      </Step>

      <Step index={2} when="This Week" duration="7 days">
        <Card label={week.networking.mentor ? 'Mentor review session' : 'Networking action'}>
          <p className="text-sm text-gray-700">{week.networking.action}</p>
          {week.networking.why && <p className="text-sm text-gray-600">{week.networking.why}</p>}
          {week.networking.mentor && (
            <p className="text-xs text-gray-600">
              <span className="font-medium text-gray-900">{week.networking.mentor.name}</span>
              {[week.networking.mentor.title, week.networking.mentor.organization].filter(Boolean).length > 0 &&
                ` · ${[week.networking.mentor.title, week.networking.mentor.organization].filter(Boolean).join(', ')}`}
              {week.networking.mentor.matchedOffers.length > 0 && ` · mentors on ${week.networking.mentor.matchedOffers.join(', ')}`}.
              {' '}Find them under Network → Mentors.
            </p>
          )}
        </Card>
        {week.interviewPrep && (
          <Card label="Interview prep" title={week.interviewPrep.focus}>
            <ul className="list-disc pl-5 text-sm text-gray-700">
              {week.interviewPrep.plan.map((step) => <li key={step}>{step}</li>)}
            </ul>
          </Card>
        )}
      </Step>

      <Step index={3} when="This Month" duration="4–6 weeks" last>
        <Card label={month.milestone.teamProject ? 'Team project' : 'Qualification milestone'} title={month.milestone.title}>
          <p className="text-sm text-gray-700">{month.milestone.description}</p>
          {month.milestone.fills.length > 0 && (
            <p className="text-xs text-gray-600">Fills: <span className="font-medium text-gray-800">{month.milestone.fills.join(', ')}</span></p>
          )}
          <p className="text-sm text-gray-700"><span className="font-medium text-gray-900">Done when:</span> {month.milestone.doneWhen}</p>
          <div className="mt-2 flex flex-col gap-2">
            <MatchBar label="Match today" percent={match.percent} tone="current" />
            <MatchBar label="Estimated match once completed and added to your profile" percent={month.projectedPercent} tone="projected" />
            <p className="text-xs text-gray-500">
              {boost > 0 ? `+${boost} points. ` : ''}Calculated with the same formula as today&apos;s match, counting the requirements this
              milestone fills as {month.milestone.level === 'applied' ? 'applied in depth' : 'used'}. It only counts once the work is real and on your profile.
            </p>
          </div>
        </Card>
      </Step>
    </ol>
  )
}

export default function Roadmap() {
  const [postings, setPostings] = useState<RoadmapTarget[]>([])
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null)
  const [mode, setMode] = useState<'posting' | 'role'>('posting')
  const [postingId, setPostingId] = useState('')
  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(true)
  const [building, setBuilding] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  // Set by the "Build roadmap for this position" button on a posting in Network.
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedPostingId = searchParams.get('postingId')

  async function runBuild(target: { postingId: string } | { role: string }) {
    setBuilding(true)
    setError('')
    try {
      setRoadmap(await buildRoadmap(target))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to build your roadmap.')
    } finally {
      setBuilding(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    getRoadmap()
      .then((result) => {
        if (cancelled) return
        setPostings(result.postings)
        setRoadmap(result.roadmap)
        setNotice(result.message ?? '')
        if (requestedPostingId) {
          // Drop the parameter so refreshing the page doesn't build again.
          setSearchParams({}, { replace: true })
          setMode('posting')
          if (!result.postings.some((posting) => posting.id === requestedPostingId)) {
            setPostingId(result.postings[0]?.id ?? '')
            setError("That position isn't available for a roadmap yet. Choose another below.")
            return
          }
          setPostingId(requestedPostingId)
          const alreadyBuilt = result.roadmap?.target.type === 'posting' && result.roadmap.target.id === requestedPostingId
          if (!alreadyBuilt && !result.message) void runBuild({ postingId: requestedPostingId })
          return
        }
        if (result.roadmap?.target.type === 'role') {
          setMode('role')
          setRole(result.roadmap.target.title)
        } else {
          setPostingId(result.roadmap?.target.id ?? result.postings[0]?.id ?? '')
          if (!result.postings.length) setMode('role')
        }
      })
      .catch((caught: unknown) => { if (!cancelled) setError(caught instanceof Error ? caught.message : 'Unable to load your roadmap.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
    // Runs once on arrival; the posting id is read from the URL a single time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function build(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void runBuild(mode === 'posting' ? { postingId } : { role: role.trim() })
  }

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>

  return (
    <section className="flex flex-col gap-6" aria-live="polite">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">Qualification roadmap</h1>
        <p className="mt-1 text-sm text-gray-600">
          A plan for becoming genuinely more qualified for a position: real skills, real projects and real conversations,
          from this weekend to this month.
        </p>
      </header>

      <form className="flex flex-col gap-3" onSubmit={(event) => void build(event)}>
        <div className="flex w-fit rounded-md border border-gray-300 p-0.5" role="group" aria-label="Target type">
          {(['posting', 'role'] as const).map((item) => (
            <button key={item} type="button" aria-pressed={mode === item} disabled={item === 'posting' && !postings.length}
              className={`rounded px-3 py-1.5 text-sm font-medium disabled:opacity-40 ${mode === item ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              onClick={() => setMode(item)}>
              {item === 'posting' ? 'Job posting' : 'Target role'}
            </button>
          ))}
        </div>
        {mode === 'posting' ? (
          <label className="flex flex-col gap-1 text-sm" htmlFor="roadmap-posting">
            <span className="font-medium text-gray-700">Position</span>
            <select id="roadmap-posting" className={inputClass} value={postingId} onChange={(event) => setPostingId(event.target.value)} required>
              {postings.map((posting) => (
                <option key={posting.id} value={posting.id}>
                  {posting.title}{posting.organization ? ` · ${posting.organization}` : ''}{posting.match !== null ? ` · ${posting.match}% match` : ''}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label className="flex flex-col gap-1 text-sm" htmlFor="roadmap-role">
            <span className="font-medium text-gray-700">Role you&apos;re aiming for</span>
            <input id="roadmap-role" className={inputClass} maxLength={120} value={role} onChange={(event) => setRole(event.target.value)}
              placeholder="e.g. Backend software engineer intern" required />
          </label>
        )}
        <button type="submit" className={`${primaryClass} self-start`} disabled={building || Boolean(notice) || (mode === 'posting' ? !postingId : !role.trim())}>
          {building ? 'Building your roadmap…' : roadmap ? 'Rebuild roadmap' : 'Build my roadmap'}
        </button>
      </form>

      {notice && <p role="status" className="text-sm text-gray-600">{notice}</p>}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {building && <p role="status" className="text-sm text-gray-500">Analyzing your resume against the requirements… this can take up to a minute.</p>}

      {roadmap && !building && (
        <>
          <MatchSummary roadmap={roadmap} />
          <Timeline roadmap={roadmap} />
          <p className="text-xs text-gray-500">
            Built {new Date(roadmap.generatedAt).toLocaleDateString()} from your current resume. Editing your profile clears it so you can rebuild.
          </p>
          <p className="text-xs text-gray-500">
            Events aren&apos;t pulled from a live calendar, so the plan names the kind of event and where to look rather than a specific date.
          </p>
        </>
      )}
    </section>
  )
}
