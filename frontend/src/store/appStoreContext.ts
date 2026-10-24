import { createContext, useContext } from 'react'
import type { Candidate, HiringRoleId, Invite, PublishedReview, Review, ReviewDraft } from '../api/types.ts'

export interface TrackedReview extends Review {
  // Step 2 of the verification tracker (the AI quality check) has finished.
  qualityChecked: boolean
}

export interface StudentNotification {
  id: string
  kind: 'review' | 'invite'
  text: string
  read: boolean
}

// Shared state for the cross-persona demo loop (CLAUDE.md §5). Read it in any page with
// `const store = useAppStore()`. Everything resets when the page reloads.
export interface AppStore {
  // ── Professional: reviews ──
  // The professional's review of a project, pending or verified.
  reviewFor(projectId: string): TrackedReview | undefined
  // Stars to add to a project's own `ratings` when computing its overall score:
  // the professional's stars, but only once the review is verified.
  verifiedStarsFor(projectId: string): number[]
  submitReview(projectId: string, draft: ReviewDraft): Promise<void>
  withdrawReview(reviewId: string): Promise<void>
  // The "Demo: verify now" button. Stands in for the backend's AI check plus a second mentor.
  verifyNow(reviewId: string): void

  // ── Professional: invites ──
  // Starts with the invites from the design; new ones are added to the top.
  invites: Invite[]
  isInvited(studentId: string): boolean
  sendInvite(candidate: Candidate, roleId: HiringRoleId): Promise<void>
  // Puts Sam's live score and verified review count on his search result.
  withLiveScore(candidate: Candidate): Candidate

  // ── Student (Sam) ──
  // 56 before the professional's rated review is verified, 65 after. null while loading.
  studentScore: number | null
  // The verified review to show on Overview, or null for the pre-review state.
  studentReview: PublishedReview | null
  notifications: StudentNotification[]
  unreadCount: number
  markNotificationsRead(): void
}

export const AppStoreContext = createContext<AppStore | null>(null)

export function useAppStore(): AppStore {
  const store = useContext(AppStoreContext)
  if (!store) throw new Error('useAppStore must be used inside <AppStoreProvider>')
  return store
}
