// Shapes of the data the pages get from api/client.ts.
// The backend should return JSON in these same shapes, so swapping mock data for real
// requests later doesn't change any page.

// ───────────── Student ─────────────

export interface ScoreDimension {
  label: string
  value: number
  // Next tier, drawn as the dashed tick on the bar.
  next: number
}

export interface SkillGap {
  label: string
  evidence: string
  hours: number
}

export interface PublishedReview {
  reviewerName: string
  reviewerInitials: string
  reviewerRole: string
  projectTitle: string
  stars: number
  note: string
}

export interface StudentOverview {
  firstName: string
  track: string
  // Score before any mentor review is verified, and after Rina's review is (demo loop, CLAUDE.md §5).
  scoreBeforeReview: number
  scoreAfterReview: number
  weeklyChange: number
  nextTier: number
  dimensions: ScoreDimension[]
  // "What recruiters look for"
  provenCount: number
  requiredCount: number
  hiddenProven: string[]
  gaps: SkillGap[]
  // The review card as drawn in the design. In the demo loop, show the review the
  // professional actually submitted instead.
  designReview: PublishedReview
}

export interface ScoreExplanation {
  label: string
  value: number
  weight: string
  items: { sign: '+' | '−'; text: string }[]
}

export type EventKind = 'hack' | 'recruit' | 'workshop' | 'fair'

export interface CampusEvent {
  id: string
  kind: EventKind
  month: string
  day: string
  title: string
  when: string
  where: string
  source: string
  why: string
}

export type ContactType = 'mentor' | 'recruiter' | 'student'

export interface NetworkContact {
  id: string
  type: ContactType
  initials: string
  name: string
  role: string
  // Mentors and recruiters have a credibility score; students have a match type instead.
  credibility?: number
  match?: string
  why: string[]
  opener: string
  action: string
}

export type FeedbackSeverity = 'good' | 'warn' | 'miss'

export interface ResumeFeedback {
  severity: FeedbackSeverity
  type: string
  where: string
  // Empty when the feedback is about the whole resume rather than one line.
  quote: string
  note: string
}

export interface ResumeRole {
  id: string
  label: string
  summary: string
  items: ResumeFeedback[]
}

// ───────────── Professional ─────────────

export type ProjectArea = 'cad' | 'ml' | 'backend'

export interface FeedProject {
  id: string
  studentId: string
  studentName: string
  initials: string
  major: string
  targeting: string
  area: ProjectArea
  title: string
  summary: string
  // area is '' when the tag isn't tied to one area.
  tags: { label: string; area: ProjectArea | '' }[]
  strength: string
  risk: string
  ai: number
  // Stars from VERIFIED reviews only. Pending reviews never count.
  ratings: number[]
  quotes: { text: string; who: string }[]
  related: { title: string; ai: number }[]
  skills: { label: string; score: number; area: ProjectArea | '' }[]
}

export interface ReviewDraft {
  // 0 means no rating; a review can be a note only.
  stars: number
  note: string
  endorse: boolean
}

export type ReviewStatus = 'pending' | 'verified'

export interface Review extends ReviewDraft {
  id: string
  projectId: string
  status: ReviewStatus
}

export type HiringRoleId = 'de' | 'ml' | 'be'

export interface HiringRole {
  id: HiringRoleId
  label: string
}

export interface Candidate {
  id: string
  role: HiringRoleId
  initials: string
  name: string
  major: string
  project: string
  skills: string[]
  // The first `skillHits` skills match the role and are highlighted.
  skillHits: number
  match: number
  score: number
  rubric: { proven: number; total: number }
  reviews: number
  growth: number
}

export interface CandidateSearch {
  role: HiringRoleId
  query: string
  verifiedOnly: boolean
  // "Clears my 70% bar": at least 70% of the rubric proven.
  clearsBarOnly: boolean
  sort: 'match' | 'growth'
}

export type InviteStatus = 'accepted' | 'question' | 'pending'

export interface Invite {
  id: string
  studentId: string
  initials: string
  name: string
  detail: string
  status: InviteStatus
}

export interface CredibilityPart {
  label: string
  value: string
  // Bar width, 0–100.
  percent: number
}

export interface ProfessionalProfile {
  initials: string
  name: string
  title: string
  credibility: number
  credibilityLabel: string
  rankLine: string
  suggestedThisWeek: number
  suggestedChange: string
  parts: CredibilityPart[]
  tips: string[]
  footnote: string
}
