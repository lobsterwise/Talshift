export type StudentDiscoveryMode = 'mentors' | 'postings'

export interface StudentOpportunity {
  id: string
  kind: 'mentor' | 'position'
  name?: string
  title: string
  organization: string
  score: number
  matches: { goalOrSkill: string; offeredAttribute: string; similarity: number }[]
}

export interface SavedStudentPosting {
  id: string
  title: string
  description: string
  organization: string | null
  saved_at: string
}

async function savedRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('rungs.session')
  if (!token) throw new Error('Your session has expired. Please sign in again.')
  const response = await fetch(`/api/student/discovery${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...options.headers },
  })
  if (!response.ok) {
    const result = await response.json().catch(() => null) as { error?: string } | null
    throw new Error(result?.error ?? 'Unable to update saved positions.')
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export async function getSavedStudentPostings() {
  return (await savedRequest<{ items: SavedStudentPosting[] }>('/saved-postings')).items
}

export function setStudentPostingSaved(postingId: string, saved: boolean) {
  return savedRequest<{ postingId: string; saved: boolean }>(`/saved-postings/${encodeURIComponent(postingId)}`, {
    method: saved ? 'PUT' : 'DELETE',
  })
}

export async function searchStudentDiscovery(
  mode: StudentDiscoveryMode,
  query: string,
  includeProfile: boolean,
  offset: number,
) {
  const token = localStorage.getItem('rungs.session')
  if (!token) throw new Error('Your session has expired. Please sign in again.')
  const params = new URLSearchParams({ limit: '20', offset: String(offset), includeProfile: String(includeProfile) })
  if (query.trim()) params.set('query', query.trim())
  const response = await fetch(`/api/student/discovery/${mode}?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    const result = await response.json().catch(() => null) as { error?: string } | null
    throw new Error(result?.error ?? 'Unable to search right now.')
  }
  return response.json() as Promise<{
    items: StudentOpportunity[]
    total: number
    limit?: number
    offset?: number
    message?: string
  }>
}