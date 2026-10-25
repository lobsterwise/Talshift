import { useEffect, useState } from 'react'
import { getProfile } from '../../api/auth'
import { getPostings, type ProfessionalPosting } from '../../api/postings'
import { getReviewQueue, startReviewQueue, submitCandidateReview, type ReviewQueue } from '../../api/professionalSearch'

export default function FindStudents() {
  const [postings, setPostings] = useState<ProfessionalPosting[]>([])
  const [hasDemandSummary, setHasDemandSummary] = useState(false)
  const [sourceType, setSourceType] = useState<'professional_demand' | 'job_posting'>('professional_demand')
  const [sourceId, setSourceId] = useState('profile')
  const [queue, setQueue] = useState<ReviewQueue | null>(null)
  const [rating, setRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [restartVersion, setRestartVersion] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    const token = localStorage.getItem('talshift.session') ?? ''
    Promise.all([getProfile(token), getPostings()])
      .then(([profileResult, postingResults]) => {
        if (cancelled) return
        const hasDemand = Boolean(profileResult.profile?.demandSummary?.trim())
        setHasDemandSummary(hasDemand)
        setPostings(postingResults)
        if (!hasDemand && postingResults.length > 0) {
          setSourceType('job_posting')
          setSourceId(postingResults[0].id)
        }
        setReady(true)
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : 'Unable to load search sources.')
          setLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!ready) return
    let cancelled = false
    setLoading(true)
    setError('')
    setNotice('')
    setRating(0)
    setReviewText('')
    startReviewQueue(sourceType, sourceId, restartVersion > 0)
      .then((result) => {
        if (cancelled) return
        setQueue(result)
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setQueue(null)
          setError(caught instanceof Error ? caught.message : 'Unable to load the review queue.')
        }
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [ready, sourceType, sourceId, restartVersion])

  function changeSource(value: string) {
    setRestartVersion(0)
    if (value === 'professional_demand:profile') {
      setSourceType('professional_demand')
      setSourceId('profile')
    } else {
      setSourceType('job_posting')
      setSourceId(value.slice('job_posting:'.length))
    }
    setQueue(null)
  }

  async function submitReview() {
    if (!queue?.current || rating < 1 || submitting) return
    setSubmitting(true)
    setError('')
    try {
      const updated = await submitCandidateReview(queue.queueId, queue.cursor, rating, reviewText)
      setQueue(updated)
      setRating(0)
      setReviewText('')
      setNotice(updated.current ? 'Review saved. Next candidate is ready.' : 'Review saved. This queue is complete.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save this review.')
    } finally {
      setSubmitting(false)
    }
  }

  async function refreshQueue() {
    if (!queue) return
    setLoading(true)
    setError('')
    try {
      setQueue(await getReviewQueue(queue.queueId))
      setRating(0)
      setReviewText('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to refresh the review queue.')
    } finally {
      setLoading(false)
    }
  }

  async function reloadQueue() {
    if (queue) {
      await refreshQueue()
      return
    }
    setLoading(true)
    setError('')
    try {
      setQueue(await startReviewQueue(sourceType, sourceId))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load the review queue.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="flex flex-col gap-5" aria-live="polite">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">Find students</h1>
        <p className="mt-1 text-sm text-gray-600">Review one eligible candidate at a time and leave a rating to continue.</p>
      </header>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-64 flex-col gap-1 text-sm" htmlFor="search-source">
          <span className="font-medium text-gray-700">Hiring criteria</span>
          <select id="search-source" className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm" value={`${sourceType}:${sourceId}`} onChange={(event) => changeSource(event.target.value)}>
            <option value="professional_demand:profile" disabled={!hasDemandSummary}>General hiring summary</option>
            {postings.map((posting) => <option key={posting.id} value={`job_posting:${posting.id}`}>{posting.title}{posting.status === 'draft' ? ' · draft' : ''}</option>)}
          </select>
        </label>
        {queue?.status === 'completed' && <button type="button" className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50" onClick={() => setRestartVersion((version) => version + 1)}>Start a new queue</button>}
      </div>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {error && <button type="button" className="self-start rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50" onClick={() => void reloadQueue()}>Reload queue</button>}
      {notice && <p role="status" className="text-sm text-gray-600">{notice}</p>}
      {loading && <p className="text-sm text-gray-500">Preparing review queue…</p>}
      {!loading && queue?.current && (
        <>
          <div className="flex items-center justify-between gap-3 border-y border-gray-200 py-3">
            <p className="text-sm font-medium text-gray-800">Candidate {queue.cursor + 1} of {queue.total}</p>
            <p className="text-xs text-gray-500">Queue resumes automatically</p>
          </div>
          <article className="flex flex-col gap-5 py-1">
            <header className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-xl font-semibold text-gray-900">{queue.current.name}</h2>
                {queue.current.headline && <p className="mt-1 text-sm text-gray-700">{queue.current.headline}</p>}
                <p className="mt-1 text-sm text-gray-500">{[queue.current.fieldOfStudy, queue.current.institution, queue.current.location].filter(Boolean).join(' · ')}</p>
              </div>
              <div className="flex gap-6 text-sm">
                <div><p className="text-xs text-gray-500">Match</p><p className="font-semibold tabular-nums text-gray-900">{Math.round(queue.current.relevance * 100)}%</p></div>
                <div><p className="text-xs text-gray-500">Reputation</p><p className="font-semibold tabular-nums text-gray-900">{queue.current.reputationStars.toFixed(1)} / 5</p><p className="text-xs text-gray-500">{queue.current.reviewCount} reviews</p></div>
              </div>
            </header>
            <ul className="flex flex-col divide-y divide-gray-100 border-y border-gray-200">
              {queue.current.matches.map((match) => (
                <li key={`${match.requirement}:${match.skill}`} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3 text-sm">
                  <span className="text-gray-800">{match.requirement} <span className="text-gray-400">matches</span> {match.skill}</span>
                  <span className="tabular-nums text-gray-500">{Math.round(match.similarity * 100)}%</span>
                </li>
              ))}
            </ul>
            {queue.current.candidateProfile.summary && <p className="whitespace-pre-line text-sm leading-6 text-gray-700">{queue.current.candidateProfile.summary}</p>}
            {queue.current.candidateProfile.jobs.length > 0 && (
              <section className="flex flex-col gap-3">
                <h3 className="text-xs font-semibold uppercase text-gray-500">Experience</h3>
                {queue.current.candidateProfile.jobs.map((job, index) => (
                  <div key={`${job.company}:${job.title}:${index}`}>
                    <div className="flex flex-wrap justify-between gap-x-4 text-sm"><strong className="text-gray-900">{job.title} · {job.company}</strong><span className="text-gray-500">{job.startDate.slice(0, 4)}–{job.endDate?.slice(0, 4) ?? 'Present'}</span></div>
                    {job.location && <p className="text-xs text-gray-500">{job.location}</p>}
                    {job.description && <p className="mt-1 whitespace-pre-line text-sm text-gray-700">{job.description}</p>}
                  </div>
                ))}
              </section>
            )}
            {queue.current.candidateProfile.projects.length > 0 && (
              <section className="flex flex-col gap-3">
                <h3 className="text-xs font-semibold uppercase text-gray-500">Projects</h3>
                {queue.current.candidateProfile.projects.map((project, index) => (
                  <div key={`${project.name}:${index}`}>
                    <strong className="text-sm text-gray-900">{project.name}</strong>
                    {project.description && <p className="mt-1 whitespace-pre-line text-sm text-gray-700">{project.description}</p>}
                    {project.skills.length > 0 && <p className="mt-1 text-xs text-gray-500">{project.skills.join(' · ')}</p>}
                  </div>
                ))}
              </section>
            )}
            {queue.current.candidateProfile.education.length > 0 && (
              <section className="flex flex-col gap-3">
                <h3 className="text-xs font-semibold uppercase text-gray-500">Education</h3>
                {queue.current.candidateProfile.education.map((item, index) => (
                  <div key={`${item.institution}:${index}`}>
                    <strong className="text-sm text-gray-900">{item.institution}</strong>
                    <p className="text-sm text-gray-700">{[item.degree, item.field].filter(Boolean).join(' · ')}{item.startYear || item.endYear ? ` · ${item.startYear ?? ''}${item.endYear ? `–${item.endYear}` : ''}` : ''}</p>
                    {item.description && <p className="mt-1 whitespace-pre-line text-sm text-gray-600">{item.description}</p>}
                  </div>
                ))}
              </section>
            )}
            {queue.current.candidateProfile.skills.length > 0 && (
              <section className="flex flex-col gap-2">
                <h3 className="text-xs font-semibold uppercase text-gray-500">Skills</h3>
                <p className="text-sm text-gray-700">{queue.current.candidateProfile.skills.map((skill) => `${skill.name} · ${skill.level}`).join('  /  ')}</p>
              </section>
            )}
            <form className="flex flex-col gap-4" onSubmit={(event) => { event.preventDefault(); void submitReview() }}>
              <fieldset>
                <legend className="text-sm font-semibold text-gray-900">Your candidate rating <span className="text-red-700">required</span></legend>
                <p className="mt-1 text-xs text-gray-600">1 serious concern · 2 below expectations · 3 meets expectations · 4 strong · 5 exceptional</p>
                <div className="mt-2 flex gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <label key={value} className="cursor-pointer">
                      <input type="radio" name="candidate-rating" value={value} checked={rating === value} required={value === 1} onChange={() => setRating(value)} className="peer sr-only" />
                      <span className={`flex size-11 items-center justify-center rounded-md border text-lg peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-blue-700 ${rating >= value ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-gray-300 text-gray-400'}`} aria-hidden="true">★</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className="flex flex-col gap-1 text-sm" htmlFor="candidate-review-text">
                <span className="font-medium text-gray-800">Short note for the student <span className="font-normal text-gray-500">optional</span></span>
                <textarea id="candidate-review-text" maxLength={500} rows={3} value={reviewText} onChange={(event) => setReviewText(event.target.value)} className="w-full resize-y rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none" placeholder="Share concise, constructive feedback" />
                <span className="self-end text-xs tabular-nums text-gray-500">{reviewText.length}/500</span>
              </label>
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs text-gray-500">Your note is only visible to this student.</p>
                <button type="submit" disabled={rating === 0 || submitting} className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50">
                  {submitting ? 'Saving…' : 'Rate and continue'}
                </button>
              </div>
            </form>
          </article>
        </>
      )}
      {!loading && queue?.status === 'completed' && !queue.current && (
        <div className="border-y border-gray-200 py-8">
          <h2 className="text-lg font-semibold text-gray-900">Queue complete</h2>
          <p className="mt-1 text-sm text-gray-600">You reviewed {queue.total} {queue.total === 1 ? 'candidate' : 'candidates'} for this hiring source.</p>
        </div>
      )}
      {!loading && !queue && !error && <p className="text-sm text-gray-500">No eligible candidates match this hiring source yet.</p>}
    </section>
  )
}
