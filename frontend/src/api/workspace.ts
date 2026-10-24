import type { PersonaId } from '../personas'

export async function getWorkspaceItems(persona: PersonaId, resource: string): Promise<unknown[]> {
  const token = localStorage.getItem('talshift.session')
  if (!token) throw new Error('Your session has expired. Please sign in again.')

  const response = await fetch(`/api/workspace/${persona}/${resource}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    const result = await response.json().catch(() => null) as { error?: string } | null
    throw new Error(result?.error ?? 'Unable to load this page.')
  }

  const result = await response.json() as { items: unknown[] }
  return result.items
}