export type SkillLevel = 'beginner' | 'intermediate' | 'advanced'

export interface Education {
  institution: string
  degree: string
  field: string
  startYear: number | null
  endYear: number | null
  description: string
}

export interface Job {
  title: string
  company: string
  location: string
  // YYYY-MM; endDate is null for a current job.
  startDate: string
  endDate: string | null
  description: string
}

export interface Project {
  name: string
  description: string
  url: string
  skills: string[]
}

export interface Skill {
  name: string
  level: SkillLevel
}

export interface Link {
  label: string
  url: string
}

export interface StudentProfile {
  headline: string
  summary: string
  location: string
  education: Education[]
  jobs: Job[]
  projects: Project[]
  skills: Skill[]
  links: Link[]
}

async function request<T>(options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('talshift.session')
  if (!token) throw new Error('Your session has expired. Please sign in again.')

  const response = await fetch('/api/student/profile', {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    const result = await response.json().catch(() => null) as { error?: string } | null
    throw new Error(result?.error ?? 'Something went wrong. Please try again.')
  }
  return response.json() as Promise<T>
}

export async function getStudentProfile() {
  return (await request<{ profile: StudentProfile }>()).profile
}

export async function saveStudentProfile(profile: StudentProfile) {
  return (await request<{ profile: StudentProfile }>({
    method: 'PUT',
    body: JSON.stringify(profile),
  })).profile
}
