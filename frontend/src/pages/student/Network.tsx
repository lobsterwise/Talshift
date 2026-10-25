import { useEffect, useState } from 'react'
import { searchStudentDiscovery, type StudentDiscoveryMode, type StudentOpportunity } from '../../api/studentDiscovery'

export default function Network() {
  const [mode, setMode] = useState<StudentDiscoveryMode>('mentors')
  const [queryDraft, setQueryDraft] = useState('')
  const [query, setQuery] = useState('')
  const [includeProfile, setIncludeProfile] = useState(true)
  const [offset, setOffset] = useState(0)
  const [items, setItems] = useState<StudentOpportunity[]>([])
  const [total, setTotal] = useState(0)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    setNotice('')
    searchStudentDiscovery(mode, query, includeProfile, offset)
      .then((result) => {
        if (cancelled) return
        setItems(result.items)
        setTotal(result.total)
        setNotice(result.message ?? '')
      })
      .catch((caught: unknown) => {
        if (!cancelled) setError(caught instanceof Error ? caught.message : 'Unable to search right now.')
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [mode, query, includeProfile, offset])

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setOffset(0)
    setQuery(queryDraft.trim())
  }

  return (
    <section className="flex flex-col gap-5" aria-live="polite">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">Discover</h1>
      </header>
      <div className="flex w-fit rounded-md border border-gray-300 p-0.5" role="group" aria-label="Search category">
        {(['mentors', 'postings'] as const).map((item) => (
          <button key={item} type="button" className={`rounded px-3 py-1.5 text-sm font-medium ${mode === item ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
            aria-pressed={mode === item} onClick={() => { setMode(item); setOffset(0) }}>
            {item === 'mentors' ? 'Mentors' : 'Positions'}
          </button>
        ))}
      </div>
      <form className="flex flex-col gap-3" onSubmit={submitSearch}>
        <label className="flex flex-col gap-1 text-sm" htmlFor="discovery-query">
          <span className="font-medium text-gray-700">Search</span>
          <textarea id="discovery-query" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none" rows={2} maxLength={1000} value={queryDraft}
            onChange={(event) => setQueryDraft(event.target.value)} placeholder={mode === 'mentors' ? 'Topics you want to learn' : 'Skills or roles you are looking for'} />
        </label>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={includeProfile} onChange={(event) => { setIncludeProfile(event.target.checked); setOffset(0) }} />
            Include saved profile
          </label>
          <button type="submit" className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">Search</button>
        </div>
      </form>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="text-sm text-gray-600">{notice}</p>}
      {loading
        ? <p className="text-sm text-gray-500">Searching…</p>
        : items.length === 0
          ? !notice && <p className="text-sm text-gray-500">No matching {mode === 'mentors' ? 'mentors' : 'positions'} yet.</p>
          : <>
            <p className="text-xs text-gray-500">{total} results</p>
            <div className="divide-y divide-gray-200 border-y border-gray-200">
              {items.map((item) => (
                <article key={`${item.kind}:${item.id}`} className="flex flex-col gap-2 py-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <h2 className="font-semibold text-gray-900">{item.name ?? item.title}</h2>
                      {item.name && <p className="text-sm text-gray-600">{item.title}</p>}
                      {item.organization && <p className="text-sm text-gray-600">{item.organization}</p>}
                    </div>
                    <span className="text-xs tabular-nums text-gray-600">{Math.round(item.score * 100)}% similarity</span>
                  </div>
                  <ul className="flex flex-wrap gap-2">
                    {item.matches.map((match) => (
                      <li key={`${match.goalOrSkill}:${match.offeredAttribute}`} className="rounded border border-gray-200 px-2 py-1 text-xs text-gray-700">
                        {match.goalOrSkill} ↔ {match.offeredAttribute}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
            <div className="flex items-center justify-between gap-3">
              <button type="button" className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 disabled:opacity-40" onClick={() => setOffset(Math.max(0, offset - 20))} disabled={offset === 0 || loading}>Previous</button>
              <span className="text-xs text-gray-500">{offset + 1}–{Math.min(offset + items.length, total)} of {total}</span>
              <button type="button" className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 disabled:opacity-40" onClick={() => setOffset(offset + 20)} disabled={offset + 20 >= total || loading}>Next</button>
            </div>
          </>}
    </section>
  )
}
