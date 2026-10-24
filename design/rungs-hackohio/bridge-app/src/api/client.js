// ─────────────────────────────────────────────────────────────────────────────
// client.js — the ONLY file the UI talks to for data.
//
// How to wire up the real backend:
//   Each exported `async` function below has a matching endpoint noted above it.
//   Replace the body with the fetch() shown in the comment and keep the same
//   return shape. The UI components never change.
//
// The pure helpers (scoreProfile, rubricFor, buildPlan, compareProfiles) are
// what the demo uses to simulate the AI. The backend can return the same shapes.
// ─────────────────────────────────────────────────────────────────────────────
import {
  SKILLS, ROLES, PEERS, EVENTS, OFFICE_HOURS, SHOWCASE_PROJECTS,
} from './mockData.js'

const API_BASE = (import.meta.env||{}).VITE_API_BASE || '/api'
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

export const WEIGHTS = { technical: 0.3, shipping: 0.3, teamwork: 0.2, verification: 0.2 }
export const DIMENSIONS = [
  { key: 'technical', label: 'Technical Depth', hint: 'Skills proven in code, weighted toward your target role' },
  { key: 'shipping', label: 'Real-World Execution', hint: 'Public repos with demos, things people can actually run' },
  { key: 'teamwork', label: 'Cross-Functional Teamwork', hint: 'Projects with 3+ people across majors, leadership' },
  { key: 'verification', label: 'Mentor Verification', hint: 'Industry mentor ratings and endorsements of your work' },
]

export const RECRUITER_DEFAULTS = { minOverall: 62, minCoverage: 70, requireVerified: true }

const clamp = (n, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(n)))

export function overallOf(scores) {
  return clamp(Object.entries(WEIGHTS).reduce((sum, [k, w]) => sum + scores[k] * w, 0))
}

// ── Resume parsing (simulated AI) ───────────────────────────────────────────
export function parseResume(text, githubUrl) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  const skills = Object.keys(SKILLS).filter((k) => SKILLS[k].pattern.test(text))

  const projectLines = lines.filter((l) => /^project\s*:/i.test(l))
  const projects = projectLines.map((l) => {
    const body = l.replace(/^project\s*:\s*/i, '')
    const [name, ...rest] = body.split(/\s+[—–-]\s+/)
    const desc = rest.join(' — ')
    const teamMatch = body.match(/team of (\d+)/i)
    const teamSize = teamMatch ? Number(teamMatch[1]) : 1
    const hasRepo = /github\.com|gitlab\.com/i.test(body)
    const hasDemo = /demo|video|live|deployed/i.test(body)
    return {
      name: name.trim(),
      desc: desc.trim(),
      stack: Object.keys(SKILLS).filter((k) => SKILLS[k].pattern.test(body)).map((k) => SKILLS[k].label),
      teamSize,
      team: teamSize >= 3,
      hasRepo,
      shipped: hasRepo && hasDemo,
    }
  })

  const expStart = lines.findIndex((l) => /^experience/i.test(l))
  const experience = expStart >= 0
    ? lines.slice(expStart + 1).filter((l) => !/^[A-Z ]{4,}$/.test(l)).slice(0, 6)
    : lines.filter((l) => /assistant|intern|engineer|tutor|president|lead/i.test(l) && !/^project/i.test(l))
  const leadership = experience.filter((l) => /\bled\b|lead|president|founder|captain|teaching assistant|tutor|mentor/i.test(l)).length

  return { skills, projects, experience, leadership, githubUrl: githubUrl.trim() }
}

// ── Rubric: which recruiter requirements are proven ─────────────────────────
// facts = { skills: [], shipped: bool, team: bool, mentorVerified: bool }
export function rubricFor(roleId, facts) {
  const role = ROLES[roleId]
  const items = role.requirements.map((req) => {
    let met = false
    let evidence = ''
    if (req.skills) {
      const found = req.skills.filter((s) => facts.skills.includes(s))
      met = found.length > 0
      evidence = met ? `Found: ${found.map((s) => SKILLS[s].label).join(', ')}` : `Missing proof: ${req.proof}`
    } else if (req.evidence === 'shipped') {
      met = facts.shipped
      evidence = met ? 'Public repo with a demo detected' : `Missing proof: ${req.proof}`
    } else if (req.evidence === 'team') {
      met = facts.team
      evidence = met ? 'Team project with 3+ contributors detected' : `Missing proof: ${req.proof}`
    } else if (req.evidence === 'mentor') {
      met = facts.mentorVerified
      evidence = met ? 'Verified by an industry mentor' : `Missing proof: ${req.proof}`
    }
    return { ...req, met, evidence }
  })
  const metCount = items.filter((i) => i.met).length
  return { items, metCount, total: items.length, coverage: Math.round((metCount / items.length) * 100) }
}

// ── Standardized score (0–100 on 4 dimensions) ──────────────────────────────
// `reviews` are mentor reviews on this student's projects; they move the score live.
export function scoreProfile(parsed, roleId, reviews = []) {
  const role = ROLES[roleId]
  const goodReviews = reviews.filter((r) => r.stars >= 4)
  const facts = {
    skills: parsed.skills,
    shipped: parsed.projects.some((p) => p.shipped),
    team: parsed.projects.some((p) => p.team),
    mentorVerified: goodReviews.length > 0,
  }
  const rubric = rubricFor(roleId, facts)
  const skillReqsMet = rubric.items.filter((i) => i.skills && i.met).length

  const scores = {
    technical: clamp(28 + Math.min(parsed.skills.length, 10) * 2.5 + skillReqsMet * 7),
    shipping: clamp(25 + parsed.projects.filter((p) => p.shipped).length * 18
      + parsed.projects.filter((p) => p.hasRepo).length * 6 + (parsed.githubUrl ? 6 : 0)),
    teamwork: clamp(25 + parsed.projects.filter((p) => p.team).length * 20 + parsed.leadership * 10),
    verification: clamp((parsed.githubUrl ? 15 : 5)
      + reviews.reduce((s, r) => s + r.stars * 8 + (r.endorse ? 10 : 0), 0), 0, 96),
  }

  const gaps = rubric.items.filter((i) => !i.met)
  return {
    scores,
    overall: overallOf(scores),
    rubric,
    facts,
    gaps,
    strong: overallOf(scores) >= 80,
    roleLabel: role.label,
  }
}

// The next score "tier" for the goal-gradient marker on each bar.
export function nextTier(value) {
  const tiers = [40, 60, 75, 90, 100]
  return tiers.find((t) => t > value) ?? 100
}

// ── Peers: standardized view used by Compare, Leaderboard and Recruiter ─────
export function peerSnapshot(peer, roleId = peer.role) {
  const facts = {
    skills: peer.skills,
    shipped: peer.scores.shipping >= 60,
    team: peer.scores.teamwork >= 65,
    mentorVerified: peer.endorsements > 0,
  }
  return { ...peer, overall: overallOf(peer.scores), rubric: rubricFor(roleId, facts), verified: facts.mentorVerified }
}

// ── Tale of the Tape: what two students can learn from each other ───────────
export function compareProfiles(me, peer, roleId) {
  const mine = new Set(me.skills)
  const theirs = new Set(peer.skills)
  const both = [...mine].filter((s) => theirs.has(s))
  const onlyMe = [...mine].filter((s) => !theirs.has(s))
  const onlyThem = [...theirs].filter((s) => !mine.has(s))
  const union = new Set([...mine, ...theirs]).size || 1
  const overlap = both.length / union

  const role = ROLES[roleId]
  const skillReqs = role.requirements.filter((r) => r.skills)
  const theyTeach = skillReqs.filter((r) => r.skills.some((s) => theirs.has(s)) && !r.skills.some((s) => mine.has(s)))
  const youTeach = skillReqs.filter((r) => r.skills.some((s) => mine.has(s)) && !r.skills.some((s) => theirs.has(s)))
  const teamCloses = role.requirements.filter((r) => r.evidence === 'team' || r.evidence === 'mentor')

  const myGap = theyTeach[0]
  const advice = []
  if (theyTeach.length) advice.push(`${peer.name.split(' ')[0]} can unblock your ${theyTeach.map((r) => r.label.split(' (')[0].toLowerCase()).join(' and ')} gap.`)
  if (youTeach.length) advice.push(`You bring ${youTeach.map((r) => r.label.split(' (')[0].toLowerCase()).join(' and ')}, which ${peer.name.split(' ')[0]} hasn't proven yet.`)
  advice.push(`Shipping one thing together proves "${teamCloses[0].label.toLowerCase()}" for both of you, a box neither of you can check alone.`)

  return {
    both, onlyMe, onlyThem,
    matchType: overlap >= 0.35 ? 'Similar' : 'Complementary',
    overlapPct: Math.round(overlap * 100),
    theyTeach, youTeach, advice,
    weekendPick: myGap ? myGap.challenge : role.requirements.find((r) => r.evidence === 'team').challenge,
    monthPick: role.capstone,
  }
}

// ── Action Engine: Weekend / Week / Month ───────────────────────────────────
export function buildPlan(roleId, result, topProjectName) {
  const role = ROLES[roleId]
  const gapIds = new Set(result.gaps.map((g) => g.id))
  const relevance = (e) => (e.closes || []).filter((c) => gapIds.has(c)).length
  const byRelevance = (a, b) => relevance(b) - relevance(a)
  const gapLabel = (id) => role.requirements.find((r) => r.id === id)?.label

  // Prefer a skill gap for the 1-day challenge; evidence gaps come after.
  const skillGap = result.gaps.find((g) => g.skills) || result.gaps[0]

  const weekendCore = result.strong || !skillGap
    ? { id: 'w-leet', type: 'leetcode', title: 'Advanced interview patterns', patterns: role.leetcode, hours: 6,
        why: 'Your proof-of-work already clears this role\'s bar, so the bottleneck is now interviews.' }
    : { id: `w-${skillGap.id}`, type: 'challenge', title: skillGap.challenge.title, hours: skillGap.challenge.hours,
        closes: [skillGap.id], why: `Closes your gap: ${skillGap.label}`, deliverable: skillGap.proof }

  const weekendEvents = EVENTS.filter((e) => e.horizon === 'weekend' && e.roles.includes(roleId)).sort(byRelevance)
  const weekEvents = EVENTS.filter((e) => e.horizon === 'week' && e.roles.includes(roleId)).sort(byRelevance)
  const hours = OFFICE_HOURS.filter((o) => o.roles.includes(roleId)).map((o) => ({
    ...o,
    talkingPoints: [
      `"I'm working on ${(skillGap?.label || 'my next project').split(' (')[0].toLowerCase()}. How does your team validate that before it ships?"`,
      `Show the 60-second clip of ${topProjectName || 'your best project'} and ask: "What one metric would you add?"`,
      `"Is the ${role.capstone.title} team still looking for someone with my background?"`,
    ],
  }))

  return {
    weekend: { core: weekendCore, events: weekendEvents.map((e) => ({ ...e, why: e.closes.filter((c) => gapIds.has(c)).map(gapLabel).filter(Boolean) })) },
    week: { hours, events: weekEvents.map((e) => ({ ...e, why: e.closes.filter((c) => gapIds.has(c)).map(gapLabel).filter(Boolean) })) },
    month: { ...role.capstone, closesLabels: role.capstone.closes.map(gapLabel), closesOpen: role.capstone.closes.filter((c) => gapIds.has(c)).map(gapLabel) },
  }
}

// ── Ladder rung: where the student is on the 5-step participation ladder ────
export function currentRung({ analyzed, commitments, teamed, reviews, mentoring }) {
  if (mentoring) return 5
  if (commitments.some((c) => c.horizon === 'month')) return 4
  if (teamed || commitments.some((c) => c.horizon === 'weekend') || reviews.length > 0) return 3
  if (commitments.some((c) => c.horizon === 'week')) return 2
  void analyzed
  return 1
}

// ═════════════════════════════════════════════════════════════════════════════
// Async API layer. Same signatures the backend should expose.
// ═════════════════════════════════════════════════════════════════════════════

// POST {API_BASE}/profile/analyze  body: FormData(resume, githubUrl, roleId)
//   const res = await fetch(`${API_BASE}/profile/analyze`, { method: 'POST', body: formData })
//   return res.json()  // → { parsed }
export async function analyzeProfile({ resumeText, githubUrl, roleId }) {
  void API_BASE; void roleId
  await wait(300)
  return { parsed: parseResume(resumeText, githubUrl) }
}

// GET {API_BASE}/community/peers?role=robotics
export async function fetchPeers() {
  await wait(50)
  return PEERS
}

// GET {API_BASE}/showcase/projects
export async function fetchShowcase() {
  await wait(50)
  return SHOWCASE_PROJECTS
}

// POST {API_BASE}/showcase/projects/:id/reviews  body: { stars, note, tags, endorse }
export async function submitMentorReview(projectId, review) {
  await wait(400)
  return { projectId, review: { ...review, at: new Date().toISOString() } }
}

// POST {API_BASE}/plan/commit  body: { itemId, horizon, ifWhen, ifWhere }
export async function commitAction(commitment) {
  await wait(200)
  return { ...commitment, id: `c-${Date.now()}`, at: new Date().toISOString() }
}

// POST {API_BASE}/community/team-requests  body: { peerId, kind }
export async function requestTeamUp(peerId, kind) {
  await wait(300)
  return { peerId, kind, status: 'sent' }
}

// POST {API_BASE}/recruiter/invites  body: { studentId, offer, note }
export async function sendInvite(payload) {
  await wait(500)
  return { ...payload, id: `inv-${Date.now()}`, status: 'sent' }
}
