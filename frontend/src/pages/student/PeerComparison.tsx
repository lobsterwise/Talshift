import { useEffect, useState } from 'react'
import {
  comparePeer,
  getPeerAnalysis,
  getPeers,
  getTeamUpRequests,
  requestTeamUp,
  respondToTeamUp,
  type Assessment,
  type Leader,
  type PeerAnalysis,
  type PeerComparison as Comparison,
  type PeerSummary,
  type TeamUpRequest,
} from '../../api/peers'

const buttonClass = 'rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50'
const primaryClass = 'rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50'

// Level names match the rubric the backend gives the AI.
const dimensionLevels = ['No evidence', 'Minimal', 'Developing', 'Strong', 'Exceptional']

function firstName(name: string) {
  return name.split(/\s+/)[0] || name
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="border-b border-gray-200 pb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase">{title}</h2>
      {children}
    </section>
  )
}

function LevelBar({ assessment, levels, leads }: { assessment: Assessment; levels: string[]; leads: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className={leads ? 'font-semibold text-green-800' : 'font-medium text-gray-700'}>{levels[assessment.level]}</span>
        {leads && <span className="rounded-full bg-green-50 px-1.5 py-0.5 text-[11px] font-medium text-green-800">Stronger</span>}
      </div>
      <div className="grid grid-cols-4 gap-0.5" aria-hidden="true">
        {[1, 2, 3, 4].map((step) => (
          <span key={step} className={`h-1.5 rounded-sm ${step <= assessment.level ? (leads ? 'bg-green-600' : 'bg-gray-500') : 'bg-gray-200'}`} />
        ))}
      </div>
      <p className="text-xs text-gray-600">{assessment.evidence}</p>
    </div>
  )
}

function ComparisonRow({ label, you, peer, leader, levels }: { label: string; you: Assessment; peer: Assessment; leader: Leader; levels: string[] }) {
  return (
    <div className="flex flex-col gap-2 border-t border-gray-100 pt-3 first:border-t-0 first:pt-0">
      <h3 className="text-sm font-semibold text-gray-900">{label}</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <LevelBar assessment={you} levels={levels} leads={leader === 'you'} />
        <LevelBar assessment={peer} levels={levels} leads={leader === 'peer'} />
      </div>
    </div>
  )
}

function HeadToHead({ comparison, analysis }: { comparison: Comparison; analysis: PeerAnalysis }) {
  return (
    <section className="flex flex-col gap-4 rounded-lg border border-gray-200 p-4" aria-label="Head-to-head resume comparison">
      <header className="flex flex-col gap-3">
        <p className="text-xs text-gray-500">Compared as candidates for <span className="font-medium text-gray-800">{analysis.targetRole}</span></p>
        <div className="hidden grid-cols-2 gap-4 sm:grid">
          <div>
            <p className="text-xs text-gray-500">You</p>
            <p className="font-semibold text-gray-900">{comparison.you.name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Peer</p>
            <p className="font-semibold text-gray-900">{comparison.peer.name}</p>
          </div>
        </div>
      </header>
      {analysis.dimensions.map((dimension) => (
        <ComparisonRow key={dimension.key} label={dimension.label} you={dimension.you} peer={dimension.peer}
          leader={dimension.leader} levels={dimensionLevels} />
      ))}
    </section>
  )
}

function Edges({ analysis, peerName }: { analysis: PeerAnalysis; peerName: string }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <Section title={`How ${peerName} currently edges you out`}>
        {analysis.peerEdges.length === 0
          ? <p className="text-sm text-gray-600">From a recruiter&apos;s view, {peerName}&apos;s resume isn&apos;t stronger than yours in any area right now.</p>
          : (
            <ul className="flex flex-col gap-2">
              {analysis.peerEdges.map((edge) => (
                <li key={edge.area} className="text-sm text-gray-700"><span className="font-medium text-gray-900">{edge.area}:</span> {edge.detail}</li>
              ))}
            </ul>
          )}
      </Section>
      <Section title="Where you're ahead">
        {analysis.yourEdges.length === 0
          ? <p className="text-sm text-gray-600">No clear advantage yet. The growth plan below targets the biggest gaps.</p>
          : (
            <ul className="flex flex-col gap-2">
              {analysis.yourEdges.map((edge) => (
                <li key={edge.area} className="text-sm text-gray-700"><span className="font-medium text-gray-900">{edge.area}:</span> {edge.detail}</li>
              ))}
            </ul>
          )}
      </Section>
    </div>
  )
}

function GrowthPlan({ analysis }: { analysis: PeerAnalysis }) {
  return (
    <Section title="How to overtake & level up together">
      <ol className="flex flex-col gap-4">
        {analysis.growth.map((step, index) => (
          <li key={step.skill} className="flex flex-col gap-1.5">
            <p className="text-sm font-semibold text-gray-900">{index + 1}. Build depth in {step.skill}</p>
            <p className="text-sm text-gray-700">{step.why}</p>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-medium text-gray-600">Learn:</span>
              {step.concepts.map((concept) => (
                <span key={concept} className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-800">{concept}</span>
              ))}
            </div>
            <p className="text-sm text-gray-700"><span className="font-medium text-gray-900">Apply it:</span> {step.apply}</p>
          </li>
        ))}
      </ol>
    </Section>
  )
}

function TeamUpCard({ comparison, analysis, onTeamUp }: {
  comparison: Comparison
  analysis: PeerAnalysis
  onTeamUp: (message: string) => Promise<void>
}) {
  const peerName = firstName(comparison.peer.name)
  const [composing, setComposing] = useState(false)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const connection = comparison.connection
  const { teamUp } = analysis

  async function send() {
    setSending(true)
    setSendError('')
    try {
      await onTeamUp(message)
      setComposing(false)
    } catch (caught) {
      setSendError(caught instanceof Error ? caught.message : 'Unable to send your team-up request.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-blue-200 bg-blue-50 p-3">
      <p className="text-sm font-semibold text-blue-950">Team-up project: {teamUp.title}</p>
      <p className="text-sm text-blue-900">{teamUp.description}</p>
      {(teamUp.youBring || teamUp.peerBrings) && (
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          {teamUp.youBring && <div><dt className="text-xs font-medium text-blue-950">You bring</dt><dd className="text-blue-900">{teamUp.youBring}</dd></div>}
          {teamUp.peerBrings && <div><dt className="text-xs font-medium text-blue-950">{peerName} brings</dt><dd className="text-blue-900">{teamUp.peerBrings}</dd></div>}
        </dl>
      )}
      {connection?.status === 'accepted' ? (
        <p role="status" className="text-sm font-medium text-green-800">You&apos;re teamed up with {peerName}. Their contact details are under Team-up requests.</p>
      ) : connection?.direction === 'outgoing' ? (
        <p role="status" className="text-sm text-blue-900">Team-up request sent. You&apos;ll see {peerName}&apos;s contact details once they accept.</p>
      ) : composing ? (
        <div className="flex flex-col gap-2">
          <label className="flex flex-col gap-1 text-sm" htmlFor="team-up-message">
            <span className="font-medium text-blue-950">Note to {peerName}</span>
            <textarea id="team-up-message" rows={3} maxLength={500} value={message} onChange={(event) => setMessage(event.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-600 focus:outline-none" />
          </label>
          {sendError && <p role="alert" className="text-sm text-red-700">{sendError}</p>}
          <div className="flex gap-2">
            <button type="button" className={primaryClass} disabled={sending} onClick={() => void send()}>{sending ? 'Sending…' : 'Send request'}</button>
            <button type="button" className={buttonClass} disabled={sending} onClick={() => setComposing(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <button type="button" className={`${primaryClass} self-start`} disabled={sending} onClick={() => {
            if (connection?.direction === 'incoming') {
              // Answering their pending request accepts it; no note needed.
              void send()
              return
            }
            setMessage(`Hi ${peerName}! Want to team up on "${teamUp.title}"? ${teamUp.description}`.slice(0, 500))
            setComposing(true)
          }}>
            {connection?.direction === 'incoming' ? `Accept ${peerName}'s team-up request` : 'Team up / Connect'}
          </button>
          {sendError && <p role="alert" className="text-sm text-red-700">{sendError}</p>}
        </>
      )}
    </div>
  )
}

function TeamUpRequests({ requests, onRespond }: { requests: TeamUpRequest[]; onRespond: (id: string, action: 'accept' | 'decline') => void }) {
  if (!requests.length) return null
  return (
    <Section title="Team-up requests">
      <ul className="flex flex-col divide-y divide-gray-100">
        {requests.map((request) => (
          <li key={request.id} className="flex flex-col gap-1 py-2">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-sm font-medium text-gray-900">{request.peer.name}
                {request.peer.headline && <span className="font-normal text-gray-600"> · {request.peer.headline}</span>}</span>
              <span className="text-xs text-gray-500">
                {request.status === 'accepted' ? 'Teamed up' : request.direction === 'incoming' ? 'Wants to team up' : 'Waiting for reply'}
              </span>
            </div>
            {request.message && <p className="text-sm whitespace-pre-line text-gray-700">{request.message}</p>}
            {request.status === 'accepted' && request.peer.email && (
              <a className="text-sm" href={`mailto:${request.peer.email}`}>{request.peer.email}</a>
            )}
            {request.status === 'pending' && request.direction === 'incoming' && (
              <div className="flex gap-2">
                <button type="button" className={primaryClass} onClick={() => onRespond(request.id, 'accept')}>Accept</button>
                <button type="button" className={buttonClass} onClick={() => onRespond(request.id, 'decline')}>Decline</button>
              </div>
            )}
          </li>
        ))}
      </ul>
      <p className="text-xs text-gray-500">Email addresses are shared only after both students agree to team up.</p>
    </Section>
  )
}

export default function PeerComparison() {
  const [queryDraft, setQueryDraft] = useState('')
  const [query, setQuery] = useState('')
  const [peers, setPeers] = useState<PeerSummary[]>([])
  const [peersNotice, setPeersNotice] = useState('')
  const [peersLoading, setPeersLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [comparison, setComparison] = useState<Comparison | null>(null)
  const [comparisonLoading, setComparisonLoading] = useState(false)
  const [analysis, setAnalysis] = useState<PeerAnalysis | null>(null)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [analysisError, setAnalysisError] = useState('')
  const [analysisVersion, setAnalysisVersion] = useState(0)
  const [requests, setRequests] = useState<TeamUpRequest[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setPeersLoading(true)
    getPeers(query)
      .then((result) => {
        if (cancelled) return
        setPeers(result.items)
        setPeersNotice(result.message ?? '')
      })
      .catch((caught: unknown) => { if (!cancelled) setError(caught instanceof Error ? caught.message : 'Unable to load peers.') })
      .finally(() => { if (!cancelled) setPeersLoading(false) })
    return () => { cancelled = true }
  }, [query])

  useEffect(() => {
    let cancelled = false
    getTeamUpRequests()
      .then((items) => { if (!cancelled) setRequests(items) })
      .catch(() => { /* The comparison still works without the request list. */ })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!selectedId) return
    let cancelled = false
    setComparisonLoading(true)
    setComparison(null)
    setAnalysis(null)
    setError('')
    comparePeer(selectedId)
      .then((result) => { if (!cancelled) setComparison(result) })
      .catch((caught: unknown) => { if (!cancelled) setError(caught instanceof Error ? caught.message : 'Unable to compare right now.') })
      .finally(() => { if (!cancelled) setComparisonLoading(false) })
    return () => { cancelled = true }
  }, [selectedId])

  const comparedPeerId = comparison?.peer.id
  useEffect(() => {
    if (!comparedPeerId) return
    let cancelled = false
    setAnalysis(null)
    setAnalysisLoading(true)
    setAnalysisError('')
    getPeerAnalysis(comparedPeerId)
      .then((result) => { if (!cancelled) setAnalysis(result) })
      .catch((caught: unknown) => { if (!cancelled) setAnalysisError(caught instanceof Error ? caught.message : 'Unable to compare resumes right now.') })
      .finally(() => { if (!cancelled) setAnalysisLoading(false) })
    return () => { cancelled = true }
  }, [comparedPeerId, analysisVersion])

  async function teamUp(message: string) {
    if (!comparison) return
    const connection = await requestTeamUp(comparison.peer.id, message)
    setComparison({ ...comparison, connection })
    setRequests(await getTeamUpRequests().catch(() => requests))
  }

  async function respond(id: string, action: 'accept' | 'decline') {
    try {
      await respondToTeamUp(id, action)
      setRequests(await getTeamUpRequests())
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to update that request.')
    }
  }

  const bestMatch = peers.find((peer) => peer.similarity !== null)
  const peerName = comparison ? firstName(comparison.peer.name) : ''

  return (
    <section className="flex flex-col gap-6" aria-live="polite">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">Peer comparison</h1>
        <p className="mt-1 text-sm text-gray-600">
          Compare your resume with a peer the way a recruiter would: by what your experience and projects actually show.
          Then learn from each other.
        </p>
      </header>

      <TeamUpRequests requests={requests} onRespond={(id, action) => void respond(id, action)} />

      <section className="flex flex-col gap-3">
        <form className="flex flex-wrap items-end gap-2" onSubmit={(event) => { event.preventDefault(); setQuery(queryDraft.trim()) }}>
          <label className="flex min-w-64 flex-1 flex-col gap-1 text-sm" htmlFor="peer-query">
            <span className="font-medium text-gray-700">Find a student</span>
            <input id="peer-query" className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-600 focus:outline-none"
              maxLength={100} value={queryDraft} onChange={(event) => setQueryDraft(event.target.value)} placeholder="Name or headline" />
          </label>
          <button type="submit" className={buttonClass}>Search</button>
          <button type="button" className={primaryClass} disabled={!bestMatch} onClick={() => bestMatch && setSelectedId(bestMatch.id)}>
            Auto-match me
          </button>
        </form>
        {peersNotice && <p role="status" className="text-sm text-gray-600">{peersNotice}</p>}
        {peersLoading
          ? <p className="text-sm text-gray-500">Loading students…</p>
          : peers.length === 0
            ? <p className="text-sm text-gray-500">No other students found{query ? ` for "${query}"` : ' yet'}.</p>
            : (
              <ul className="flex max-h-64 flex-col divide-y divide-gray-100 overflow-y-auto rounded-md border border-gray-200">
                {peers.map((peer) => (
                  <li key={peer.id}>
                    <button type="button" aria-pressed={selectedId === peer.id} onClick={() => setSelectedId(peer.id)}
                      className={`flex w-full flex-wrap items-baseline justify-between gap-2 px-3 py-2 text-left ${selectedId === peer.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                      <span className="text-sm">
                        <span className="font-medium text-gray-900">{peer.name}</span>
                        {(peer.headline || peer.institution) && <span className="text-gray-600"> · {[peer.headline, peer.institution].filter(Boolean).join(' · ')}</span>}
                      </span>
                      {peer.similarity !== null && <span className="text-xs tabular-nums text-gray-500">{Math.round(peer.similarity * 100)}% skill overlap</span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
      </section>

      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {comparisonLoading && <p role="status" className="text-sm text-gray-500">Loading profiles…</p>}
      {comparison && analysisLoading && (
        <p role="status" className="text-sm text-gray-500">Reviewing both resumes like a recruiter would… this can take up to a minute the first time.</p>
      )}
      {comparison && analysisError && (
        <div className="flex flex-wrap items-center gap-3">
          <p role="alert" className="text-sm text-red-700">{analysisError}</p>
          <button type="button" className={buttonClass} onClick={() => setAnalysisVersion((version) => version + 1)}>Try again</button>
        </div>
      )}
      {comparison && analysis && (
        <>
          <HeadToHead comparison={comparison} analysis={analysis} />
          <Edges analysis={analysis} peerName={peerName} />
          <GrowthPlan analysis={analysis} />
          <TeamUpCard key={comparison.peer.id} comparison={comparison} analysis={analysis} onTeamUp={teamUp} />
          <p className="text-xs text-gray-500">
            AI assessment of what each resume shows, not a judgment of either person. It only uses resume content: experience,
            projects, education and skills. Contact details and links are never sent to the AI, and your email is shared with
            a peer only after you both agree to team up.
          </p>
        </>
      )}
    </section>
  )
}
