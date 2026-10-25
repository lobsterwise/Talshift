import { useEffect, useState } from 'react'
import { BookmarkMinus, Link2, Mail, Phone, UsersRound } from 'lucide-react'
import { getSavedCandidates, setCandidateSaved, type SavedCandidate } from '../../api/professionalSearch'
import EmptyState from '../../components/ui/EmptyState'
import PageHeading from '../../components/ui/PageHeading'
import StatusText from '../../components/ui/StatusText'

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
      <PageHeading icon={UsersRound} title="Saved candidates" />
      {error && <StatusText tone="error">{error}</StatusText>}
      {loading ? <StatusText tone="loading">Loading saved candidates…</StatusText> : items.length === 0
        ? <EmptyState icon={UsersRound} title="No saved candidates yet">Candidates you save from Find students will appear here.</EmptyState>
        : <div className="divide-y divide-gray-200 border-y border-gray-200">
          {items.map((candidate) => (
            <article key={candidate.id} className="flex flex-col gap-2 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-gray-900">{candidate.name}</h2>
                  {candidate.headline && <p className="text-sm text-gray-700">{candidate.headline}</p>}
                  <p className="text-sm text-gray-500">{[candidate.field_of_study, candidate.institution, candidate.location].filter(Boolean).join(' · ')}</p>
                </div>
                <button type="button" className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50" onClick={() => void remove(candidate.id)} disabled={removingId === candidate.id}>
                  <BookmarkMinus aria-hidden="true" className="size-4" />
                  {removingId === candidate.id ? 'Removing…' : 'Remove'}
                </button>
              </div>
              {candidate.summary && <p className="whitespace-pre-line text-sm leading-6 text-gray-700">{candidate.summary}</p>}
              {candidate.email || candidate.phone || candidate.linkedin
                ? (
                  <ul aria-label={`Contact ${candidate.name}`} className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
                    {candidate.email && (
                      <li><a className="inline-flex items-center gap-1.5" href={`mailto:${candidate.email}`}><Mail aria-hidden="true" className="size-4 shrink-0" />{candidate.email}</a></li>
                    )}
                    {candidate.phone && (
                      <li><a className="inline-flex items-center gap-1.5" href={`tel:${candidate.phone.replace(/[^\d+]/g, '')}`}><Phone aria-hidden="true" className="size-4 shrink-0" />{candidate.phone}</a></li>
                    )}
                    {candidate.linkedin && (
                      <li><a className="inline-flex items-center gap-1.5" href={candidate.linkedin} target="_blank" rel="noopener noreferrer"><Link2 aria-hidden="true" className="size-4 shrink-0" />LinkedIn</a></li>
                    )}
                  </ul>
                )
                : <p className="text-sm text-gray-500">This student hasn&apos;t added contact details yet.</p>}
            </article>
          ))}
        </div>}
    </section>
  )
}