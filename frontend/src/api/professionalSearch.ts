import type { ProjectCredibility } from './studentProfile'

export type ProfessionalAttributeSource = 'professional_offer' | 'professional_demand' | 'job_posting'

export interface ProfessionalAttribute {
  id: string
  source_type: ProfessionalAttributeSource
  source_id: string
  name: string
  priority: number
  evidence: string | null
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('rungs.session')
  if (!token) throw new Error('Your session has expired. Please sign in again.')
  const response = await fetch(`/api/professional/search${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })
  if (!response.ok) {
    const result = await response.json().catch(() => null) as { error?: string } | null
    throw new Error(result?.error ?? 'Unable to prepare professional search attributes.')
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export async function getProfessionalAttributes() {
  return (await request<{ items: ProfessionalAttribute[] }>('/attributes')).items
}

export async function indexProfessionalSource(sourceType: ProfessionalAttributeSource, sourceId?: string) {
  return (await request<{ items: ProfessionalAttribute[] }>('/index', {
    method: 'POST',
    body: JSON.stringify({ sourceType, ...(sourceId ? { sourceId } : {}) }),
  })).items
}

export async function updateProfessionalPriority(id: string, priority: number) {
  return (await request<{ attribute: Pick<ProfessionalAttribute, 'id' | 'name' | 'priority'> }>(`/attributes/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ priority }),
  })).attribute
}

export interface StudentSearchResult {
  id: string
  name: string
  headline: string
  location: string
  fieldOfStudy?: string
  institution?: string
  score: number
  similarity: number
  relevance: number
  reputation: number
  reputationStars: number
  reviewCount: number
  finalScore: number
  candidateProfile: {
    summary: string
    education: { institution: string; degree: string; field: string; startYear: number | null; endYear: number | null; description: string }[]
    jobs: { title: string; company: string; location: string; startDate: string; endDate: string | null; description: string }[]
    projects: { name: string; description: string; skills: string[] }[]
    skills: { name: string; level: string }[]
  }
  // Missing on queue entries snapshotted before credibility checks existed.
  projectCredibility?: ProjectCredibility[]
  matches: { requirement: string; skill: string; similarity: number }[]
}

export interface ReviewQueue {
  queueId: string
  sourceType: 'professional_demand' | 'job_posting'
  sourceId: string
  cursor: number
  total: number
  status: 'active' | 'completed'
  current: (StudentSearchResult & { position: number }) | null
}

export async function searchStudents(sourceType: 'professional_demand' | 'job_posting', sourceId: string, offset = 0) {
  const query = new URLSearchParams({ sourceType, sourceId, limit: '20', offset: String(offset) })
  return request<{ items: StudentSearchResult[]; total: number; limit: number; offset: number; message?: string }>(`/students?${query}`)
}

export async function startReviewQueue(sourceType: 'professional_demand' | 'job_posting', sourceId: string, restart = false) {
  return request<ReviewQueue>('/queues', {
    method: 'POST',
    body: JSON.stringify({ sourceType, sourceId, restart }),
  })
}

export async function getReviewQueue(queueId: string) {
  return request<ReviewQueue>(`/queues/${encodeURIComponent(queueId)}`)
}

export async function submitCandidateReview(queueId: string, expectedPosition: number, rating: number, reviewText: string) {
  return request<ReviewQueue>(`/queues/${encodeURIComponent(queueId)}/review`, {
    method: 'POST',
    body: JSON.stringify({ expectedPosition, rating, reviewText }),
  })
}