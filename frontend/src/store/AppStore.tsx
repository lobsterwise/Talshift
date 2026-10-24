import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import * as client from '../api/client.ts'
import type { Candidate, HiringRoleId, Invite, PublishedReview, ReviewDraft, StudentOverview } from '../api/types.ts'
import { AppStoreContext, type AppStore, type StudentNotification, type TrackedReview } from './appStoreContext.ts'

// Sam Okafor is the student in the demo; his keyboard case is the project that gets reviewed.
const DEMO_STUDENT_ID = 'so'
const DEMO_PROJECT_ID = 'p-so'
// How long the AI quality check takes in the design's tracker.
const QUALITY_CHECK_MS = 1600

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [reviews, setReviews] = useState<TrackedReview[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [notifications, setNotifications] = useState<StudentNotification[]>([])
  const [overview, setOverview] = useState<StudentOverview | null>(null)
  const timers = useRef<number[]>([])

  useEffect(() => {
    client.getInvites().then(setInvites)
    client.getStudentOverview().then(setOverview)
    const pending = timers.current
    return () => pending.forEach((t) => clearTimeout(t))
  }, [])

  const notifyStudent = useCallback((kind: StudentNotification['kind'], text: string) => {
    setNotifications((list) => [{ id: `${kind}-${Date.now()}`, kind, text, read: false }, ...list])
  }, [])

  const submitReview = useCallback(async (projectId: string, draft: ReviewDraft) => {
    const review = await client.submitReview(projectId, draft)
    setReviews((list) => [...list.filter((r) => r.projectId !== projectId), { ...review, qualityChecked: false }])
    timers.current.push(
      window.setTimeout(() => {
        setReviews((list) => list.map((r) => (r.id === review.id ? { ...r, qualityChecked: true } : r)))
      }, QUALITY_CHECK_MS),
    )
  }, [])

  const withdrawReview = useCallback(async (reviewId: string) => {
    await client.withdrawReview(reviewId)
    setReviews((list) => list.filter((r) => r.id !== reviewId || r.status === 'verified'))
  }, [])

  const verifyNow = useCallback(
    (reviewId: string) => {
      const review = reviews.find((r) => r.id === reviewId)
      if (!review || review.status === 'verified') return
      setReviews((list) => list.map((r) => (r.id === reviewId ? { ...r, status: 'verified', qualityChecked: true } : r)))
      if (review.projectId === DEMO_PROJECT_ID && overview) {
        const { reviewerName, projectTitle } = overview.designReview
        notifyStudent('review', `${reviewerName} reviewed your ${projectTitle}`)
      }
    },
    [reviews, overview, notifyStudent],
  )

  const isInvited = useCallback((studentId: string) => invites.some((i) => i.studentId === studentId), [invites])

  const sendInvite = useCallback(
    async (candidate: Candidate, roleId: HiringRoleId) => {
      if (isInvited(candidate.id)) return
      const invite = await client.sendInvite(candidate, roleId)
      setInvites((list) => [invite, ...list])
      if (candidate.id === DEMO_STUDENT_ID && overview) {
        notifyStudent('invite', `${overview.designReview.reviewerName} invited you · ${invite.detail}`)
      }
    },
    [isInvited, overview, notifyStudent],
  )

  const markNotificationsRead = useCallback(() => {
    setNotifications((list) => list.map((n) => ({ ...n, read: true })))
  }, [])

  const store = useMemo<AppStore>(() => {
    const reviewFor = (projectId: string) => reviews.find((r) => r.projectId === projectId)
    const verifiedStarsFor = (projectId: string) => {
      const review = reviewFor(projectId)
      return review?.status === 'verified' && review.stars > 0 ? [review.stars] : []
    }

    const samReview = reviewFor(DEMO_PROJECT_ID)
    const samVerified = samReview?.status === 'verified' ? samReview : undefined
    const studentReview: PublishedReview | null =
      samVerified && overview ? { ...overview.designReview, stars: samVerified.stars, note: samVerified.note } : null
    // A note-only review is published but doesn't change the score.
    const studentScore = overview
      ? samVerified && samVerified.stars > 0
        ? overview.scoreAfterReview
        : overview.scoreBeforeReview
      : null

    return {
      reviewFor,
      verifiedStarsFor,
      submitReview,
      withdrawReview,
      verifyNow,
      invites,
      isInvited,
      sendInvite,
      withLiveScore: (candidate) =>
        candidate.id === DEMO_STUDENT_ID && studentScore !== null
          ? { ...candidate, score: studentScore, reviews: samVerified ? 1 : 0 }
          : candidate,
      studentScore,
      studentReview,
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
      markNotificationsRead,
    }
  }, [reviews, invites, notifications, overview, submitReview, withdrawReview, verifyNow, isInvited, sendInvite, markNotificationsRead])

  return <AppStoreContext.Provider value={store}>{children}</AppStoreContext.Provider>
}
