import { useEffect, useState } from 'react'
import { getSavedStudentPostings, setStudentPostingSaved, type SavedStudentPosting } from '../../api/studentDiscovery'

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
      <header><h1 className="text-2xl font-semibold text-gray-900">Saved positions</h1></header>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {loading ? <p className="text-sm text-gray-500">Loading saved positions…</p> : items.length === 0
        ? <p className="text-sm text-gray-500">Positions you save from Discover will appear here.</p>
        : <div className="divide-y divide-gray-200 border-y border-gray-200">
          {items.map((posting) => (
            <article key={posting.id} className="flex flex-col gap-2 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-gray-900">{posting.title}</h2>
                  {posting.organization && <p className="text-sm text-gray-600">{posting.organization}</p>}
                </div>
                <button type="button" className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50" onClick={() => void remove(posting.id)} disabled={removingId === posting.id}>
                  {removingId === posting.id ? 'Removing…' : 'Remove'}
                </button>
              </div>
              {posting.description && <p className="whitespace-pre-line text-sm leading-6 text-gray-700">{posting.description}</p>}
            </article>
          ))}
        </div>}
    </section>
  )
}