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
  // YYYY-MM-DD; endDate is null for a current job.
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
  learningGoals: string
  location: string
  education: Education[]
  jobs: Job[]
  projects: Project[]
  skills: Skill[]
  links: Link[]
}

export interface StudentTalentSkill {
  name: string
  score: number
  evidence: string
}

export interface StudentTalent {
  hardSkills: StudentTalentSkill[]
  softSkills: StudentTalentSkill[]
  learningGoals?: StudentTalentSkill[]
  generatedAt: string
  model: string
}

interface StudentProfileResult {
  profile: StudentProfile
  studentTalent: StudentTalent | null
  searchAttributeCount: number
}

export class StudentProfileRequestError extends Error {
  constructor(message: string, readonly field: string | null = null) {
    super(message)
    this.name = 'StudentProfileRequestError'
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('talshift.session')
  if (!token) throw new Error('Your session has expired. Please sign in again.')

  const response = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    const result = await response.json().catch(() => null) as { error?: string; field?: string } | null
    throw new StudentProfileRequestError(
      result?.error ?? 'Something went wrong. Please try again.',
      result?.field || null,
    )
  }
  return response.json() as Promise<T>
}

export async function getStudentProfile() {
  return request<StudentProfileResult>('/api/student/profile')
}

export async function saveStudentProfile(profile: StudentProfile) {
  return request<StudentProfileResult>('/api/student/profile', {
    method: 'PUT',
    body: JSON.stringify(profile),
  })
}

export const maxResumeBytes = 5 * 1024 * 1024

// Sends a PDF to be read by Gemini. Returns a draft merged with the saved profile;
// nothing is stored until the student saves the draft from the profile form.
export async function parseResume(file: File) {
  const token = localStorage.getItem('talshift.session')
  if (!token) throw new Error('Your session has expired. Please sign in again.')

  const response = await fetch('/api/student/resume/parse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/pdf', Authorization: `Bearer ${token}` },
    body: file,
  })
  if (!response.ok) {
    const result = await response.json().catch(() => null) as { error?: string } | null
    throw new StudentProfileRequestError(result?.error ?? 'Unable to read your resume. Please try again.')
  }
  return (await response.json() as { profile: StudentProfile }).profile
}

// A resume parsed during onboarding, waiting for review. It is handed to the
// profile page through sessionStorage so it survives the move out of onboarding.
const resumeDraftKey = 'talshift.resumeDraft'

export function storeResumeDraft(profile: StudentProfile) {
  try {
    sessionStorage.setItem(resumeDraftKey, JSON.stringify(profile))
  } catch {
    // Storage can be unavailable (private mode, quota); the draft is then lost,
    // and the student can upload again.
  }
}

export function readResumeDraft(): StudentProfile | null {
  try {
    const stored = sessionStorage.getItem(resumeDraftKey)
    return stored ? JSON.parse(stored) as StudentProfile : null
  } catch {
    return null
  }
}

export function clearResumeDraft() {
  try {
    sessionStorage.removeItem(resumeDraftKey)
  } catch {
    // Nothing to clear.
  }
}

export async function generateStudentTalent() {
  return request<{
    studentTalent: StudentTalent
    searchReady: boolean
    searchAttributeCount: number
    searchIndexingError?: string
  }>('/api/student/talent', {
    method: 'POST',
  })
}

export async function indexStudentTalent() {
  return request<{
    studentTalent: StudentTalent
    searchReady: boolean
    searchAttributeCount: number
    searchIndexingError?: string
  }>('/api/student/talent/index', {
    method: 'POST',
  })
}
