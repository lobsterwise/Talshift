// Score math from design/build-spec.dc.html (#10). Only VERIFIED reviews go into these;
// a pending review never changes a score.

// How much mentor stars count against the AI rating: 0 reviews → 0%, 1 → 25%, 3 → 50%, 5+ → 60%.
export function mentorWeight(verifiedCount: number): number {
  return Math.min(0.6, verifiedCount / (verifiedCount + 3))
}

export function average(stars: number[]): number {
  return stars.length ? stars.reduce((sum, s) => sum + s, 0) / stars.length : 0
}

// Overall project rating out of 100: the AI rating blended with verified mentor stars.
// e.g. overall(72, [5]) === 79, Sam's keyboard case after the demo review.
export function overall(ai: number, stars: number[]): number {
  if (stars.length === 0) return ai
  const w = mentorWeight(stars.length)
  return Math.round(ai * (1 - w) + average(stars) * 20 * w)
}

// Feed order: fewest verified reviews first, then AI rating high → low.
export function sortFeed<T extends { ai: number; ratings: number[] }>(projects: T[]): T[] {
  return [...projects].sort((a, b) => a.ratings.length - b.ratings.length || b.ai - a.ai)
}

// Each input is 0–100. verifiedOrReplyRate is "advice verified" for mentors and
// "reply rate" for recruiters.
export interface CredibilityInputs {
  verifiedOrReplyRate: number
  replySpeed: number
  activeDays30: number
  outcomes: number
  studentRating: number
}

export function credibility(c: CredibilityInputs): number {
  return Math.round(
    0.35 * c.verifiedOrReplyRate + 0.2 * c.replySpeed + 0.15 * c.activeDays30 + 0.2 * c.outcomes + 0.1 * c.studentRating,
  )
}

// Ranking of a mentor or recruiter on a student's Network tab. Both inputs are 0–100.
export function networkRank(relevanceToTrack: number, credibilityScore: number): number {
  return 0.6 * relevanceToTrack + 0.4 * credibilityScore
}
