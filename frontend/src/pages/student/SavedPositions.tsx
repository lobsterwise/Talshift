import { useEffect, useState } from 'react'
import { Bookmark, BookmarkMinus, ExternalLink } from 'lucide-react'
import { getSavedStudentPostings, setStudentPostingSaved, type SavedStudentPosting } from '../../api/studentDiscovery'
import EmptyState from '../../components/ui/EmptyState'
import PageHeading from '../../components/ui/PageHeading'
import StatusText from '../../components/ui/StatusText'

export default function SavedPositions() {
  const [items, setItems] = useState<SavedStudentPosting[]>([])
  const [loading, setLoading] = useState(true)
  const [removingId, setRemovingId] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    getSavedStudentPostings()
      .then((saved) => { if (!cancelled) setItems(saved) })
      .catch((caught: unknown) => { if (!cancelled) setError(caught instanceof Error ? caught.message : 'Unable to load saved positions.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  async function remove(id: string) {
    setRemovingId(id)
    setError('')
    try {
      await setStudentPostingSaved(id, false)
      setItems((saved) => saved.filter((posting) => posting.id !== id))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to remove this position.')
    } finally {
      setRemovingId('')
    }
  }

  return (
    <section className="flex flex-col gap-5" aria-live="polite">
      <PageHeading icon={Bookmark} title="Saved positions" />
      {error && <StatusText tone="error">{error}</StatusText>}
      {loading ? <StatusText tone="loading">Loading saved positions…</StatusText> : items.length === 0
        ? <EmptyState icon={Bookmark} title="No saved positions yet">Positions you save from Discover will appear here.</EmptyState>
        : <div className="divide-y divide-gray-200 border-y border-gray-200">
          {items.map((posting) => (
            <article key={posting.id} className="flex flex-col gap-2 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-gray-900">{posting.title}</h2>
                  {posting.organization && <p className="text-sm text-gray-600">{posting.organization}</p>}
                </div>
                <button type="button" className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50" onClick={() => void remove(posting.id)} disabled={removingId === posting.id}>
                  <BookmarkMinus aria-hidden="true" className="size-4" />
                  {removingId === posting.id ? 'Removing…' : 'Remove'}
                </button>
              </div>
              {posting.description && <p className="whitespace-pre-line text-sm leading-6 text-gray-700">{posting.description}</p>}
              {posting.application_url
                ? (
                  <a href={posting.application_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 self-start rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white no-underline hover:bg-blue-700 hover:text-white">
                    Apply online
                    <ExternalLink aria-hidden="true" className="size-4" />
                  </a>
                )
                : <p className="text-sm text-gray-500">The poster hasn&apos;t added an application link yet.</p>}
            </article>
          ))}
        </div>}
    </section>
  )
}