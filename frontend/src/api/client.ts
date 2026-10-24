// The ONLY place pages get data from. Every function is async and returns mock data for now.
// The comment above each one is the backend endpoint it will call once that exists; to switch,
// replace the body with a fetch() to that endpoint and keep the same return type.
//
// Mock functions return copies, so changing what you get back never changes the mock data.

import * as mock from './mockData.ts'
import { sortFeed } from './scoring.ts'
import type {
  CampusEvent,
  Candidate,
  CandidateSearch,
  EventScanInfo,
  FeedProject,
  HiringRole,
  HiringRoleId,
  Invite,
  NetworkContact,
  ProfessionalProfile,
  ProfessionalWeek,
  ProjectArea,
  ResumeFile,
  ResumeRole,
  Review,
  ReviewDraft,
  ScoreExplanation,
  StudentOverview,
  StudentPlan,
} from './types.ts'

function copy<T>(value: T): Promise<T> {
  return Promise.resolve(structuredClone(value))
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

// ───────────── Student ─────────────

// GET /api/students/me/overview
export async function getStudentOverview(): Promise<StudentOverview> {
  return copy(mock.studentOverview)
}

// GET /api/students/me/score/explanation
export async function getScoreExplanation(): Promise<ScoreExplanation[]> {
  return copy(mock.scoreExplanation)
}

// GET /api/students/me/plan
export async function getStudentPlan(): Promise<StudentPlan> {
  return copy(mock.studentPlan)
}

// GET /api/events
// The backend's event scraper/feeds (Handshake, Devpost, OSU Events, …) plug in here.
export async function getEvents(): Promise<CampusEvent[]> {
  return copy(mock.events)
}

// GET /api/events/scan-info
// When the event feeds were last scanned, and which sources they came from.
export async function getEventScanInfo(): Promise<EventScanInfo> {
  return copy(mock.eventScanInfo)
}

// GET /api/students/me/saved-events
export async function getSavedEventIds(): Promise<string[]> {
  return copy(mock.savedEventIds)
}

// PUT /api/students/me/saved-events/:eventId to save, DELETE to unsave
export async function setEventSaved(eventId: string, saved: boolean): Promise<{ eventId: string; saved: boolean }> {
  return copy({ eventId, saved })
}

// POST /api/students/me/plan/commitments  { slot }
export async function commitToPlan(slot: string): Promise<{ slot: string }> {
  return copy({ slot })
}

// GET /api/students/me/network
export async function getNetwork(): Promise<NetworkContact[]> {
  return copy(mock.network)
}

// POST /api/students/me/network/:contactId/contact  { opener }
// Message, Connect, Request 15 min and Team up all go through this.
export async function contactPerson(contactId: string, opener: string): Promise<{ contactId: string; opener: string }> {
  return copy({ contactId, opener })
}

// GET /api/students/me/resume/feedback
// Feedback only. There is deliberately no endpoint that rewrites the resume.
export async function getResumeFeedback(): Promise<ResumeRole[]> {
  return copy(mock.resumeRoles)
}

// GET /api/students/me/resume
export async function getResumeFile(): Promise<ResumeFile> {
  return copy(mock.resumeFile)
}

// ───────────── Professional ─────────────

// GET /api/professionals/me/week
export async function getProfessionalWeek(): Promise<ProfessionalWeek> {
  return copy(mock.professionalWeek)
}

// GET /api/projects/areas
export async function getProjectAreas(): Promise<typeof mock.projectAreas> {
  return copy(mock.projectAreas)
}

// GET /api/projects/feed?area=
// Sorted fewest verified reviews first, then AI rating high → low.
export async function getFeedProjects(area: ProjectArea | 'all' = 'all'): Promise<FeedProject[]> {
  const matching = mock.feedProjects.filter((p) => area === 'all' || p.area === area)
  return copy(sortFeed(matching))
}

// POST /api/projects/:projectId/reviews  { stars, note, endorse }
// A new review is always 'pending'. The backend verifies it (AI quality check + a second
// mentor); until then it changes no score and the student can't see it.
export async function submitReview(projectId: string, draft: ReviewDraft): Promise<Review> {
  return copy({ ...draft, id: newId('review'), projectId, status: 'pending' as const })
}

// DELETE /api/reviews/:reviewId
export async function withdrawReview(reviewId: string): Promise<{ reviewId: string }> {
  return copy({ reviewId })
}

// GET /api/hiring-roles
export async function getHiringRoles(): Promise<HiringRole[]> {
  return copy(mock.hiringRoles)
}

// GET /api/students/search?role=&q=&verified=&clears=&sort=
// Live search over name, project and skills.
export async function searchCandidates(search: CandidateSearch): Promise<Candidate[]> {
  const q = search.query.trim().toLowerCase()
  const results = mock.candidates
    .filter((c) => {
      if (c.role !== search.role) return false
      if (search.verifiedOnly && c.reviews === 0) return false
      if (search.clearsBarOnly && c.rubric.proven / c.rubric.total < 0.7) return false
      if (q && !`${c.name} ${c.project} ${c.skills.join(' ')}`.toLowerCase().includes(q)) return false
      return true
    })
    .sort((a, b) => (search.sort === 'growth' ? b.growth - a.growth : b.match - a.match))
  return copy(results)
}

// GET /api/invites
export async function getInvites(): Promise<Invite[]> {
  return copy(mock.invites)
}

// POST /api/invites  { studentId, roleId }
// The new invite starts as 'pending' (shown as "Waiting").
export async function sendInvite(candidate: Candidate, roleId: HiringRoleId): Promise<Invite> {
  const role = mock.hiringRoles.find((r) => r.id === roleId)
  return copy({
    id: newId('invite'),
    studentId: candidate.id,
    initials: candidate.initials,
    name: candidate.name,
    detail: `${role?.label ?? ''} · sent just now`,
    status: 'pending' as const,
  })
}

// GET /api/professionals/me
export async function getProfessionalProfile(): Promise<ProfessionalProfile> {
  return copy(mock.professionalProfile)
}
