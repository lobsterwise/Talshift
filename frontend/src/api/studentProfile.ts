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
  // Normalized GitHub usernames (up to 5); the form also accepts "@user" or profile links.
  githubUsernames: string[]
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

export type StudentKeywordCategory = 'hard_skill' | 'soft_skill' | 'attribute' | 'location' | 'technology' | 'job_title' | 'industry' | 'education' | 'learning_goal' | 'other'

export interface StudentKeyword extends StudentTalentSkill {
  category: StudentKeywordCategory
}

export interface StudentTalent {
  keywords: StudentKeyword[]
  learningGoals?: StudentTalentSkill[]
  generatedAt: string
  model: string
}

export interface RepositoryEvidence {
  fullName: string
  url: string
  description: string
  // False for someone else's repository the student contributed commits to.
  ownedByStudent: boolean
  isFork: boolean
  parentFullName: string | null
  languages: string[]
  commitCount: number
  // The student's accounts that authored at least one of those commits.
  commitAuthors: string[]
  activeDays: number
  firstCommitAt: string | null
  lastCommitAt: string | null
}

export interface ProjectCredibility {
  projectName: string
  score: number
  status: 'verified' | 'unverified'
  repository: RepositoryEvidence | null
  findings: string[]
  // Present only when the project could not be fully verified.
  reviewerNote: string | null
  reviewerQuestion: string | null
}

export interface CredibilityReport {
  githubUsernames: string[]
  // Listed accounts GitHub could not find.
  unavailableAccounts: string[]
  projects: ProjectCredibility[]
  generatedAt: string
  model: string
}

interface StudentProfileResult {
  profile: StudentProfile
  studentTalent: StudentTalent | null
  credibility: CredibilityReport | null
  searchAttributeCount: number
}

export interface StudentReputation {
  reviewCount: number
  stars: number
  score: number
  reviews: { id: string; rating: number; reviewText: string; updatedAt: string }[]
}

export class StudentProfileRequestError extends Error {
  constructor(message: string, readonly field: string | null = null) {
    super(message)
    this.name = 'StudentProfileRequestError'
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('rungs.session')
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

export async function getStudentReputation() {
  return request<StudentReputation>('/api/student/reputation')
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
  const token = localStorage.getItem('rungs.session')
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
const resumeDraftKey = 'rungs.resumeDraft'

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

export async function verifyStudentCredibility() {
  return (await request<{ credibility: CredibilityReport }>('/api/student/credibility', {
    method: 'POST',
  })).credibility
}
