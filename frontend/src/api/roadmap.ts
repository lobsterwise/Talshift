export interface RoadmapTarget {
  id: string
  title: string
  organization: string
  // Current qualification match for this posting (0–100); null until skill rankings exist.
  match: number | null
}

export interface RequirementMatch {
  name: string
  priority: number
  credit: number
  status: 'covered' | 'partial' | 'missing'
  bestSkill: string | null
}

export interface Roadmap {
  target: { type: 'posting' | 'role'; id: string | null; title: string; organization: string }
  match: { percent: number; requirements: RequirementMatch[] }
  weekend: {
    microProject: { title: string; skill: string; steps: string[]; doneWhen: string }
    event: { kind: string; why: string; howToFind: string }
  }
  week: {
    networking: {
      action: string
      why: string
      mentor: { id: string; name: string; title: string; organization: string; matchedOffers: string[] } | null
    }
    interviewPrep: { focus: string; plan: string[] } | null
  }
  month: {
    milestone: { title: string; description: string; teamProject: boolean; fills: string[]; level: 'used' | 'applied'; doneWhen: string }
    projectedPercent: number
  }
  generatedAt: string
  model: string
}

async function request<T>(options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('rungs.session')
  if (!token) throw new Error('Your session has expired. Please sign in again.')
  const response = await fetch('/api/student/roadmap', {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    const result = await response.json().catch(() => null) as { error?: string } | null
    throw new Error(result?.error ?? 'Something went wrong. Please try again.')
  }
  return response.json() as Promise<T>
}

export async function getRoadmap() {
  return request<{ postings: RoadmapTarget[]; roadmap: Roadmap | null; message?: string }>()
}

export async function buildRoadmap(target: { postingId: string } | { role: string }) {
  return (await request<{ roadmap: Roadmap }>({ method: 'POST', body: JSON.stringify(target) })).roadmap
}
