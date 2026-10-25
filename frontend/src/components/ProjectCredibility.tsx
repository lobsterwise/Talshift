import { MessageCircleQuestion, ShieldAlert, ShieldCheck } from 'lucide-react'
import type { ProjectCredibility } from '../api/studentProfile'

export function CredibilityBadge({ credibility }: { credibility: ProjectCredibility }) {
  return credibility.status === 'verified'
    ? <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-medium text-green-800"><ShieldCheck aria-hidden="true" className="size-3.5" />AI Commit-Verified</span>
    : <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-900"><ShieldAlert aria-hidden="true" className="size-3.5" />Unverified on GitHub — Note for Reviewer</span>
}

// Profile-level badge shown once any project is commit-verified. Display only: it never feeds ranking or reputation.
export function VerifiedExperienceBadge({ projects }: { projects: ProjectCredibility[] | undefined }) {
  const verified = projects?.filter((project) => project.status === 'verified').length ?? 0
  if (!projects?.length || verified === 0) return null
  const label = verified === projects.length ? 'all projects' : `${verified} of ${projects.length} projects`
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-800"
      title="Project experience matched against the student's public GitHub commit history">
      <ShieldCheck aria-hidden="true" className="size-3.5" />
      AI-Verified Experience · {label}
    </span>
  )
}

// Score, badge, GitHub findings and — for unverified projects — the AI reviewer note and live question.
export default function ProjectCredibilityPanel({ credibility }: { credibility: ProjectCredibility }) {
  const verified = credibility.status === 'verified'
  return (
    <div className="mt-2 flex flex-col gap-2 rounded-md border border-gray-200 p-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <CredibilityBadge credibility={credibility} />
        <span className="text-sm font-medium tabular-nums text-gray-800">{credibility.score}% credibility</span>
        {credibility.repository && (
          <a className="text-xs" href={credibility.repository.url} target="_blank" rel="noopener noreferrer">{credibility.repository.fullName}</a>
        )}
        {credibility.repository?.ownedByStudent === false && (
          <span className="rounded border border-gray-200 px-1.5 py-0.5 text-xs text-gray-600">Contributor</span>
        )}
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-gray-200">
        <div className={`h-full rounded-full ${verified ? 'bg-green-600' : 'bg-amber-500'}`} style={{ width: `${credibility.score}%` }} />
      </div>
      <ul className="flex flex-col gap-0.5 text-xs text-gray-600">
        {credibility.findings.map((finding) => <li key={finding}>{finding}</li>)}
      </ul>
      {!verified && (credibility.reviewerNote || credibility.reviewerQuestion) && (
        <div className="rounded bg-amber-50 p-2 text-xs text-amber-950">
          <p className="flex items-center gap-1 font-semibold"><MessageCircleQuestion aria-hidden="true" className="size-3.5" />Note for reviewer</p>
          {credibility.reviewerNote && <p className="mt-0.5">{credibility.reviewerNote}</p>}
          {credibility.reviewerQuestion && <p className="mt-1"><span className="font-medium">Ask live:</span> {credibility.reviewerQuestion}</p>}
        </div>
      )}
    </div>
  )
}
