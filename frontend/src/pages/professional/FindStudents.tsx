import { useEffect, useState } from 'react'
import { getProfile } from '../../api/auth'
import { getPostings, type ProfessionalPosting } from '../../api/postings'
import { searchStudents, type StudentSearchResult } from '../../api/professionalSearch'

export default function FindStudents() {
  const [postings, setPostings] = useState<ProfessionalPosting[]>([])
  const [hasDemandSummary, setHasDemandSummary] = useState(false)
  const [sourceType, setSourceType] = useState<'professional_demand' | 'job_posting'>('professional_demand')
  const [sourceId, setSourceId] = useState('profile')
  const [results, setResults] = useState<StudentSearchResult[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [refreshVersion, setRefreshVersion] = useState(0)
  const [loading, setLoading] = useState(true)
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
    searchStudents(sourceType, sourceId, offset)
      .then((result) => {
        if (cancelled) return
        setResults(result.items)
        setTotal(result.total)
        setNotice(result.message ?? '')
      })
      .catch((caught: unknown) => {
        if (!cancelled) setError(caught instanceof Error ? caught.message : 'Unable to search students.')
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [ready, sourceType, sourceId, offset, refreshVersion])

  function changeSource(value: string) {
    if (value === 'professional_demand:profile') {
      setSourceType('professional_demand')
      setSourceId('profile')
    } else {
      setSourceType('job_posting')
      setSourceId(value.slice('job_posting:'.length))
    }
    setOffset(0)
  }

  return (
    <section className="flex flex-col gap-5" aria-live="polite">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">Find students</h1>
        <p className="mt-1 text-sm text-gray-600">Discover students whose indexed skills match your hiring priorities.</p>
      </header>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-64 flex-col gap-1 text-sm" htmlFor="search-source">
          <span className="font-medium text-gray-700">Hiring criteria</span>
          <select id="search-source" className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm" value={`${sourceType}:${sourceId}`} onChange={(event) => changeSource(event.target.value)}>
            <option value="professional_demand:profile" disabled={!hasDemandSummary}>General hiring summary</option>
            {postings.map((posting) => <option key={posting.id} value={`job_posting:${posting.id}`}>{posting.title}{posting.status === 'draft' ? ' · draft' : ''}</option>)}
          </select>
        </label>
        <button type="button" className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50" onClick={() => setRefreshVersion((version) => version + 1)}>
          Refresh results
        </button>
      </div>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="text-sm text-gray-600">{notice}</p>}
      {loading
        ? <p className="text-sm text-gray-500">Searching…</p>
        : results.length === 0
          ? <p className="text-sm text-gray-500">No matching discoverable students yet.</p>
          : <>
            <p className="text-xs text-gray-500">{total} matching students</p>
            <div className="divide-y divide-gray-200 border-y border-gray-200">
              {results.map((student) => (
                <article key={student.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h2 className="font-semibold text-gray-900">{student.name}</h2>
                      <span className="text-sm text-gray-600">{student.headline}</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{[student.fieldOfStudy, student.institution, student.location].filter(Boolean).join(' · ')}</p>
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {student.matches.map((match) => (
                        <li key={`${match.requirement}:${match.skill}`} className="rounded border border-gray-200 px-2 py-1 text-xs text-gray-700">
                          {match.requirement} ↔ {match.skill} <span className="tabular-nums text-gray-500">{Math.round(match.similarity * 100)}% similarity</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-gray-800">{Math.round(student.similarity * 100)}% similarity</span>
                </article>
              ))}
            </div>
            <div className="flex items-center justify-between gap-3">
              <button type="button" className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 disabled:opacity-40" onClick={() => setOffset(Math.max(0, offset - 20))} disabled={offset === 0 || loading}>Previous</button>
              <span className="text-xs text-gray-500">{offset + 1}–{Math.min(offset + results.length, total)} of {total}</span>
              <button type="button" className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 disabled:opacity-40" onClick={() => setOffset(offset + 20)} disabled={offset + 20 >= total || loading}>Next</button>
            </div>
          </>}
    </section>
  )
}
