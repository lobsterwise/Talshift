import { useEffect, useState } from 'react'
import { getSavedCandidates, setCandidateSaved, type SavedCandidate } from '../../api/professionalSearch'

export default function SavedCandidates() {
  const [items, setItems] = useState<SavedCandidate[]>([])
  const [loading, setLoading] = useState(true)
  const [removingId, setRemovingId] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    getSavedCandidates()
      .then((saved) => { if (!cancelled) setItems(saved) })
      .catch((caught: unknown) => { if (!cancelled) setError(caught instanceof Error ? caught.message : 'Unable to load saved candidates.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  async function remove(id: string) {
    setRemovingId(id)
    setError('')
    try {
      await setCandidateSaved(id, false)
      setItems((saved) => saved.filter((candidate) => candidate.id !== id))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to remove this candidate.')
    } finally {
      setRemovingId('')
    }
  }

  return (
    <section className="flex flex-col gap-5" aria-live="polite">
      <header><h1 className="text-2xl font-semibold text-gray-900">Saved candidates</h1></header>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {loading ? <p className="text-sm text-gray-500">Loading saved candidates…</p> : items.length === 0
        ? <p className="text-sm text-gray-500">Candidates you save from Find students will appear here.</p>
        : <div className="divide-y divide-gray-200 border-y border-gray-200">
          {items.map((candidate) => (
            <article key={candidate.id} className="flex flex-col gap-2 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-gray-900">{candidate.name}</h2>
                  {candidate.headline && <p className="text-sm text-gray-700">{candidate.headline}</p>}
                  <p className="text-sm text-gray-500">{[candidate.field_of_study, candidate.institution, candidate.location].filter(Boolean).join(' · ')}</p>
                </div>
                <button type="button" className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50" onClick={() => void remove(candidate.id)} disabled={removingId === candidate.id}>
                  {removingId === candidate.id ? 'Removing…' : 'Remove'}
                </button>
              </div>
              {candidate.summary && <p className="whitespace-pre-line text-sm leading-6 text-gray-700">{candidate.summary}</p>}
            </article>
          ))}
        </div>}
    </section>
  )
}