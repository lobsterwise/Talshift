import { useEffect, useState } from 'react'
import { getSavedStudentPostings, searchStudentDiscovery, setStudentPostingSaved, type StudentOpportunity } from '../../api/studentDiscovery'
import { Link } from 'react-router-dom'
import { Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, Compass, Route, Search, SearchX, Sparkles } from 'lucide-react'
import EmptyState from '../../components/ui/EmptyState'
import PageHeading from '../../components/ui/PageHeading'
import StatusText from '../../components/ui/StatusText'

export default function Network() {
  const [queryDraft, setQueryDraft] = useState('')
  const [query, setQuery] = useState('')
  const [includeProfile, setIncludeProfile] = useState(true)
  const [offset, setOffset] = useState(0)
  const [items, setItems] = useState<StudentOpportunity[]>([])
  const [savedIds, setSavedIds] = useState<string[]>([])
  const [savingId, setSavingId] = useState('')
  const [total, setTotal] = useState(0)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    setNotice('')
    Promise.all([searchStudentDiscovery('postings', query, includeProfile, offset), getSavedStudentPostings()])
      .then(([result, saved]) => {
        if (cancelled) return
        setItems(result.items)
        setTotal(result.total)
        setNotice(result.message ?? '')
        setSavedIds(saved.map((posting) => posting.id))
      })
      .catch((caught: unknown) => {
        if (!cancelled) setError(caught instanceof Error ? caught.message : 'Unable to search right now.')
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [query, includeProfile, offset])

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setOffset(0)
    setQuery(queryDraft.trim())
  }

  async function toggleSaved(postingId: string) {
    const saved = savedIds.includes(postingId)
    setSavingId(postingId)
    setError('')
    try {
      await setStudentPostingSaved(postingId, !saved)
      setSavedIds((ids) => saved ? ids.filter((id) => id !== postingId) : [...ids, postingId])
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to update saved positions.')
    } finally {
      setSavingId('')
    }
  }

  return (
    <section className="flex flex-col gap-5" aria-live="polite">
      <PageHeading icon={Compass} title="Discover" />
      <form className="flex flex-col gap-3" onSubmit={submitSearch}>
        <label className="flex flex-col gap-1 text-sm" htmlFor="discovery-query">
          <span className="font-medium text-gray-700">Search</span>
          <textarea id="discovery-query" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none" rows={2} maxLength={1000} value={queryDraft}
            onChange={(event) => setQueryDraft(event.target.value)} placeholder="Skills or roles you are looking for" />
        </label>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={includeProfile} onChange={(event) => { setIncludeProfile(event.target.checked); setOffset(0) }} />
            Include saved profile
          </label>
          <button type="submit" className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
            <Search aria-hidden="true" className="size-4" />
            Search
          </button>
        </div>
      </form>
      {error && <StatusText tone="error">{error}</StatusText>}
      {notice && <StatusText tone="info">{notice}</StatusText>}
      {loading
        ? <StatusText tone="loading">Searching…</StatusText>
        : items.length === 0
          ? !notice && <EmptyState icon={SearchX} title="No matching positions yet">Try different skills or roles, or include your saved profile.</EmptyState>
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
                    <span className="inline-flex items-center gap-1 text-xs tabular-nums text-gray-600">
                      <Sparkles aria-hidden="true" className="size-3.5 text-blue-500" />
                      {Math.round(item.score * 100)}% similarity
                    </span>
                  </div>
                  {item.kind === 'position' && <button type="button" className="inline-flex items-center gap-1.5 self-start rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50" onClick={() => void toggleSaved(item.id)} disabled={savingId === item.id} aria-pressed={savedIds.includes(item.id)}>
                    {savedIds.includes(item.id)
                      ? <BookmarkCheck aria-hidden="true" className="size-4 text-blue-600" />
                      : <Bookmark aria-hidden="true" className="size-4" />}
                    {savingId === item.id ? 'Saving…' : savedIds.includes(item.id) ? 'Saved' : 'Save position'}
                  </button>}
                  <ul className="flex flex-wrap gap-2">
                    {item.matches.map((match) => (
                      <li key={`${match.goalOrSkill}:${match.offeredAttribute}`} className="rounded border border-gray-200 px-2 py-1 text-xs text-gray-700">
                        {match.goalOrSkill} ↔ {match.offeredAttribute}
                      </li>
                    ))}
                  </ul>
                  {item.kind === 'position' && (
                    <Link to={`/student/roadmap?postingId=${encodeURIComponent(item.id)}`}
                      className="inline-flex items-center gap-1.5 self-start rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 no-underline hover:bg-gray-50">
                      <Route aria-hidden="true" className="size-4" />
                      Build roadmap for this position
                    </Link>
                  )}
                </article>
              ))}
            </div>
            <div className="flex items-center justify-between gap-3">
              <button type="button" className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 disabled:opacity-40" onClick={() => setOffset(Math.max(0, offset - 20))} disabled={offset === 0 || loading}>
                <ChevronLeft aria-hidden="true" className="size-4" />
                Previous
              </button>
              <span className="text-xs text-gray-500">{offset + 1}–{Math.min(offset + items.length, total)} of {total}</span>
              <button type="button" className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 disabled:opacity-40" onClick={() => setOffset(offset + 20)} disabled={offset + 20 >= total || loading}>
                Next
                <ChevronRight aria-hidden="true" className="size-4" />
              </button>
            </div>
          </>}
    </section>
  )
}
