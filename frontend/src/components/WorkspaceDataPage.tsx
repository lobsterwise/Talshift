import { useEffect, useState } from 'react'
import { getWorkspaceItems } from '../api/workspace'
import type { PersonaId } from '../personas'

interface WorkspaceDataPageProps {
  persona: PersonaId
  resource: string
  title: string
  emptyMessage: string
}

export default function WorkspaceDataPage({ persona, resource, title, emptyMessage }: WorkspaceDataPageProps) {
  const [items, setItems] = useState<unknown[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    getWorkspaceItems(persona, resource)
      .then((result) => {
        if (!cancelled) setItems(result)
      })
      .catch((caught: unknown) => {
        if (!cancelled) setError(caught instanceof Error ? caught.message : 'Unable to load this page.')
      })
    return () => { cancelled = true }
  }, [persona, resource])

  return (
    <section aria-live="polite" className="flex flex-col gap-3">
      <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
      {error
        ? <p role="alert" className="text-sm text-red-700">{error}</p>
        : items === null
          ? <p className="text-sm text-gray-500">Loading…</p>
          : items.length === 0
            ? <p className="text-sm text-gray-500">{emptyMessage}</p>
            : null}
    </section>
  )
}