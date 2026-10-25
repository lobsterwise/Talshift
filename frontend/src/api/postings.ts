export type PostingStatus = 'draft' | 'published'

export interface ProfessionalPosting {
  id: string
  title: string
  description: string
  status: PostingStatus
  createdAt: string
  updatedAt: string
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('talshift.session')
  if (!token) throw new Error('Your session has expired. Please sign in again.')
  const response = await fetch(`/api/professional/postings${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })
  if (!response.ok) {
    const result = await response.json().catch(() => null) as { error?: string } | null
    throw new Error(result?.error ?? 'Unable to save this posting.')
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export async function getPostings() {
  return (await request<{ items: ProfessionalPosting[] }>('/')).items
}

export async function createPosting(posting: Omit<ProfessionalPosting, 'id' | 'createdAt' | 'updatedAt'>) {
  return (await request<{ posting: ProfessionalPosting }>('/', {
    method: 'POST',
    body: JSON.stringify(posting),
  })).posting
}

export async function updatePosting(id: string, posting: Omit<ProfessionalPosting, 'id' | 'createdAt' | 'updatedAt'>) {
  return (await request<{ posting: ProfessionalPosting }>(`/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(posting),
  })).posting
}

export function deletePosting(id: string) {
  return request<void>(`/${encodeURIComponent(id)}`, { method: 'DELETE' })
}