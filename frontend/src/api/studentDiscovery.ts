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