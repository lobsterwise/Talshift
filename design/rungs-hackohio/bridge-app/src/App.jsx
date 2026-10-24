// ─────────────────────────────────────────────────────────────────────────────
// App.jsx — the shell. Holds ALL shared state so the 3 personas stay in sync:
// a mentor review changes the student's score, leaderboard rank and recruiter
// status instantly, and a recruiter invite lights up the student's bell.
//
// File map (one owner each):
//   components/ProfileTab.jsx           → Student: upload + score + checklist
//   components/ActionPlanTab.jsx        → Student: Weekend / Week / Month plan
//   components/CommunityCompareTab.jsx  → Student: Tale of the Tape + leaderboard
//   components/MentorRecruiterPortal.jsx→ Mentor view + Recruiter view
//   components/ui.jsx                   → shared buttons, cards, bars
//   api/client.js                       → every data call (swap mocks for fetch here)
//   api/mockData.js                     → sample data
// ─────────────────────────────────────────────────────────────────────────────
import { useCallback, useMemo, useState } from 'react'
import {
  GraduationCap, MessagesSquare, Briefcase, Bell, UserRound, Target, Users, CheckCircle2,
  ShieldCheck, Star, Mail, X, ChevronDown, ChevronUp, PlayCircle, HeartHandshake, Sparkles,
} from 'lucide-react'
import { Badge, Button, Avatar, Segmented, EmptyState, Toast, cx } from './components/ui'
import ProfileTab, { ANALYSIS_STEPS } from './components/ProfileTab'
import ActionPlanTab from './components/ActionPlanTab'
import CommunityCompareTab from './components/CommunityCompareTab'
import { MentorPortal, RecruiterPortal } from './components/MentorRecruiterPortal'
import {
  PEERS, SHOWCASE_PROJECTS, SAMPLE_RESUME, SAMPLE_GITHUB, ROLES, CURRENT_MENTOR, CURRENT_RECRUITER,
} from './api/mockData.js'
import {
  analyzeProfile, scoreProfile, buildPlan, peerSnapshot, currentRung, submitMentorReview,
  commitAction, requestTeamUp, sendInvite, RECRUITER_DEFAULTS,
} from './api/client.js'

const MY_PROJECT_ID = 'proj-me'
const LADDER = ['Look around', 'Show up', 'Try something small', 'Join a project', 'Give back']

function nameFromResume(text) {
  const first = (text.split('\n')[0] || '').split(/\s+[—–-]\s+/)[0].trim()
  return first && first.length < 40 ? first : 'You'
}
const initialsOf = (name) => name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()

export default function App() {
  // ── navigation ──
  const [persona, setPersona] = useState('student')
  const [studentTab, setStudentTab] = useState('profile')

  // ── student profile ──
  const [input, setInput] = useState({ resumeText: SAMPLE_RESUME, githubUrl: SAMPLE_GITHUB })
  const [roleId, setRoleId] = useState('robotics')
  const [parsed, setParsed] = useState(null)
  const [editing, setEditing] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisStep, setAnalysisStep] = useState(0)

  // ── shared community state ──
  const [commitments, setCommitments] = useState([])
  const [teamRequests, setTeamRequests] = useState({})
  const [projects, setProjects] = useState(SHOWCASE_PROJECTS)
  const [notifications, setNotifications] = useState([])
  const [notifOpen, setNotifOpen] = useState(false)
  const [invites, setInvites] = useState([])
  const [hostedSlots, setHostedSlots] = useState(['Tue 4:00–4:15 PM'])
  const [mentorLog, setMentorLog] = useState([])
  const [recruiterRoleId, setRecruiterRoleId] = useState('robotics')
  const [criteria, setCriteria] = useState({ ...RECRUITER_DEFAULTS, mustHaves: ['r-perc'] })
  const [toast, setToast] = useState(null)

  const showToast = useCallback((text, icon = CheckCircle2) => {
    setToast({ text, icon })
    setTimeout(() => setToast(null), 2600)
  }, [])
  const notify = (n) => setNotifications((cur) => [{ id: `n-${Date.now()}-${Math.random()}`, read: false, at: new Date(), ...n }, ...cur])

  // ── derived data (recomputes whenever a review, role or resume changes) ──
  const myReviews = projects.find((p) => p.id === MY_PROJECT_ID).reviews
  const result = useMemo(() => (parsed ? scoreProfile(parsed, roleId, myReviews) : null), [parsed, roleId, myReviews])
  const baselineOverall = useMemo(() => (parsed ? scoreProfile(parsed, roleId, []).overall : 0), [parsed, roleId])
  const plan = useMemo(() => (result ? buildPlan(roleId, result, parsed.projects[0]?.name) : null), [result, roleId, parsed])
  const myName = nameFromResume(input.resumeText)

  const me = useMemo(() => (result ? {
    id: 'me', name: myName, initials: initialsOf(myName), major: 'Computer Science & Eng.', year: "'28",
    skills: parsed.skills, scores: result.scores, overall: result.overall,
    growth30d: 5 + (result.overall - baselineOverall),
    helped: 1 + Object.values(teamRequests).filter((r) => r.status === 'accepted').length,
    verified: result.facts.mentorVerified, endorsements: myReviews.filter((r) => r.endorse).length,
  } : null), [result, parsed, myName, baselineOverall, teamRequests, myReviews])

  const peers = useMemo(() => PEERS.map((p) => peerSnapshot(p)), [])

  const candidates = useMemo(() => {
    const list = PEERS.map((p) => {
      const proj = projects.find((x) => x.ownerId === p.id)
      const top = proj?.reviews[0]
      return { ...peerSnapshot(p, recruiterRoleId), topReview: top ? { project: proj.title, stars: top.stars, mentor: top.mentor } : null }
    })
    if (parsed) {
      const r = scoreProfile(parsed, recruiterRoleId, myReviews)
      const top = [...myReviews].sort((a, b) => b.stars - a.stars)[0]
      list.push({
        id: 'me', name: myName, initials: initialsOf(myName), major: 'Computer Science & Eng.',
        overall: r.overall, rubric: r.rubric, verified: r.facts.mentorVerified, endorsements: myReviews.filter((x) => x.endorse).length,
        growth30d: 5 + (r.overall - scoreProfile(parsed, recruiterRoleId, []).overall),
        justVerified: r.facts.mentorVerified,
        topReview: top ? { project: projects.find((x) => x.id === MY_PROJECT_ID).title, stars: top.stars, mentor: top.mentor } : null,
      })
    }
    return list
  }, [parsed, recruiterRoleId, myReviews, projects, myName])

  const rung = currentRung({ analyzed: Boolean(parsed), commitments, teamed: Object.keys(teamRequests).length > 0, reviews: [], mentoring: false })
  const unread = notifications.filter((n) => !n.read).length
  const myInvite = invites.find((i) => i.studentId === 'me')

  // ── actions ──
  const handleAnalyze = async () => {
    setAnalyzing(true)
    setAnalysisStep(0)
    for (let i = 1; i <= ANALYSIS_STEPS.length; i += 1) {
      await new Promise((r) => setTimeout(r, 520))
      setAnalysisStep(i)
    }
    const res = await analyzeProfile({ resumeText: input.resumeText, githubUrl: input.githubUrl, roleId })
    setParsed(res.parsed)
    setEditing(false)
    setAnalyzing(false)
    showToast('Profile analyzed and standardized', Sparkles)
  }

  const handleCommit = async (pending) => {
    const saved = await commitAction({ itemId: pending.itemId, horizon: pending.horizon, title: pending.title, hours: pending.hours, ifWhen: pending.ifWhen, ifWhere: pending.ifWhere })
    setCommitments((cur) => [...cur.filter((c) => c.itemId !== saved.itemId), saved])
    showToast(`Committed: ${pending.title}`)
  }

  const handleTeamUp = async (peerId, kind) => {
    const res = await requestTeamUp(peerId, kind)
    setTeamRequests((cur) => ({ ...cur, [peerId]: { kind, status: res.status } }))
    const peer = PEERS.find((p) => p.id === peerId)
    showToast(`Team-up request sent to ${peer.name.split(' ')[0]}`, HeartHandshake)
    setTimeout(() => {
      setTeamRequests((cur) => ({ ...cur, [peerId]: { kind, status: 'accepted' } }))
      notify({ kind: 'team', title: `${peer.name} accepted your team-up`, body: kind === 'weekend' ? 'You\'re building this weekend\'s challenge together. You both earn teamwork proof.' : 'You\'re applying to the company project as a pair.' })
    }, 2500)
  }

  const handleSubmitReview = async (projectId, review) => {
    const before = result?.overall ?? 0
    const res = await submitMentorReview(projectId, review)
    const nextProjects = projects.map((p) => (p.id === projectId ? { ...p, reviews: [...p.reviews, res.review] } : p))
    setProjects(nextProjects)
    setMentorLog((cur) => [...cur, { seconds: review.seconds, endorse: review.endorse }])
    const ownerIsMe = projectId === MY_PROJECT_ID && Boolean(parsed)
    const after = ownerIsMe ? scoreProfile(parsed, roleId, nextProjects.find((p) => p.id === MY_PROJECT_ID).reviews).overall : before
    if (ownerIsMe) {
      notify({ kind: 'review', title: `${review.mentor} rated your project ${review.stars}★`, body: `"${review.note}"${review.endorse ? ' · Growth endorsed' : ''}`, delta: after - before })
    }
    showToast(ownerIsMe ? `Review sent · ${myName.split(' ')[0]}'s score ${before} → ${after}` : 'Review sent')
    return { ownerIsMe, before, after, seconds: review.seconds }
  }

  const handleInvite = async (payload) => {
    const saved = await sendInvite(payload)
    setInvites((cur) => [...cur, { ...saved, reply: null }])
    const name = payload.studentId === 'me' ? myName : PEERS.find((p) => p.id === payload.studentId)?.name
    if (payload.studentId === 'me') {
      notify({ kind: 'invite', inviteId: saved.id, title: `${payload.from.title.split(', ')[1] || 'A company'} sent you a Two-Way Fast-Track invite`, body: payload.note, offers: payload.offers })
    }
    showToast(`Invite sent to ${name}`, Mail)
  }

  const replyToInvite = (inviteId, reply) => {
    setInvites((cur) => cur.map((i) => (i.id === inviteId ? { ...i, reply } : i)))
    showToast(reply === 'accepted' ? 'Accepted. 99P Labs will reach out to schedule.' : 'Question sent to the recruiter')
  }

  const switchRecruiterRole = (id) => {
    setRecruiterRoleId(id)
    setCriteria((c) => ({ ...c, mustHaves: [] }))
  }

  const goStudent = (tab) => { setPersona('student'); setStudentTab(tab) }

  const identity = persona === 'student'
    ? { name: myName, initials: initialsOf(myName), title: 'OSU Student' }
    : persona === 'mentor' ? CURRENT_MENTOR : CURRENT_RECRUITER

  const mentorStats = {
    avgSeconds: mentorLog.length ? Math.round(mentorLog.reduce((s, r) => s + r.seconds, 0) / mentorLog.length) : 0,
    endorsed: mentorLog.filter((r) => r.endorse).length + 3,
  }

  const demoSteps = [
    { label: 'Analyze resume + GitHub', done: Boolean(parsed), go: () => goStudent('profile') },
    { label: 'Commit to a plan item', done: commitments.length > 0, go: () => goStudent('plan') },
    { label: 'Compare + team up', done: Object.keys(teamRequests).length > 0, go: () => goStudent('community') },
    { label: 'Mentor reviews project', done: myReviews.length > 0, go: () => setPersona('mentor') },
    { label: 'Recruiter sends invite', done: Boolean(myInvite), go: () => setPersona('recruiter') },
  ]

  return (
    <div className="min-h-screen bg-[#08080a] text-zinc-100 antialiased">
      {/* ── Top bar ── */}
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-[#08080a]/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <LadderMark />
            <span className="text-sm font-semibold tracking-tight">Rungs</span>
            <span className="hidden text-xs text-zinc-600 md:inline">OSU × Industry</span>
          </div>

          <div className="mx-auto">
            <Segmented value={persona} onChange={(v) => { setPersona(v); setNotifOpen(false) }} options={[
              { value: 'student', label: 'Student View', icon: GraduationCap, badge: persona !== 'student' && unread ? unread : 0 },
              { value: 'mentor', label: 'Mentor View', icon: MessagesSquare },
              { value: 'recruiter', label: 'Recruiter View', icon: Briefcase },
            ]} />
          </div>

          <div className="flex items-center gap-3">
            {persona === 'student' && (
              <div className="relative">
                <button onClick={() => { setNotifOpen(!notifOpen); setNotifications((cur) => cur.map((n) => ({ ...n, read: true }))) }}
                  className="relative rounded-lg border border-zinc-800 p-2 text-zinc-400 hover:border-zinc-700 hover:text-zinc-100" aria-label="Notifications">
                  <Bell className="h-4 w-4" />
                  {unread > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#BA0C2F] px-1 text-[10px] font-semibold text-white">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#BA0C2F] opacity-60" />
                      <span className="relative">{unread}</span>
                    </span>
                  )}
                </button>
                {notifOpen && <NotificationPanel notifications={notifications} invites={invites} onReply={replyToInvite} onClose={() => setNotifOpen(false)} />}
              </div>
            )}
            <div className="hidden items-center gap-2 sm:flex">
              <Avatar initials={identity.initials} size="sm" highlight={persona === 'student'} />
              <div className="leading-tight">
                <div className="text-xs font-medium text-zinc-200">{identity.name}</div>
                <div className="max-w-[180px] truncate text-[11px] text-zinc-500">{identity.title}</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6">
        {persona === 'student' && (
          <>
            {myInvite && !myInvite.reply && (
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3">
                <div className="flex items-center gap-2.5 text-sm text-emerald-100">
                  <Mail className="h-4 w-4 text-emerald-300" />
                  <span><span className="font-semibold">{myInvite.from.name}</span> ({myInvite.from.title}) sent you a Two-Way Fast-Track invite.</span>
                </div>
                <Button size="sm" variant="success" onClick={() => setNotifOpen(true)}>View invite</Button>
              </div>
            )}

            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-xl font-semibold tracking-tight">Prove what you can do, then go do more of it.</h1>
                <p className="mt-1 text-sm text-zinc-500">Your work, scored on the same scale as everyone else's, with a plan for this weekend.</p>
              </div>
              <Segmented value={studentTab} onChange={setStudentTab} options={[
                { value: 'profile', label: 'Profile & Score', icon: UserRound },
                { value: 'plan', label: 'Action Plan', icon: Target },
                { value: 'community', label: 'Compare & Team', icon: Users },
              ]} />
            </div>

            <LadderStrip rung={rung} />

            <div className="mt-6">
              {studentTab === 'profile' && (
                <ProfileTab input={input} setInput={setInput} roleId={roleId} setRoleId={setRoleId}
                  onAnalyze={handleAnalyze} analyzing={analyzing} analysisStep={analysisStep}
                  parsed={parsed} result={result} scoreDelta={result ? result.overall - baselineOverall : 0}
                  onGoToPlan={() => setStudentTab('plan')} onEdit={() => setEditing(true)} editing={editing} />
              )}
              {studentTab === 'plan' && (plan
                ? <ActionPlanTab plan={plan} commitments={commitments} onCommit={handleCommit} roleLabel={ROLES[roleId].label} overall={result.overall} />
                : <NeedsProfile onGo={() => setStudentTab('profile')} />)}
              {studentTab === 'community' && (me
                ? <CommunityCompareTab me={me} peers={peers} roleId={roleId} teamRequests={teamRequests} onTeamUp={handleTeamUp} baselineOverall={baselineOverall} />
                : <NeedsProfile onGo={() => setStudentTab('profile')} />)}
            </div>
          </>
        )}

        {persona === 'mentor' && (
          <>
            <PersonaHeader title="Review real work in 90 seconds." body="The AI reads the code and drafts the baseline. You add the human judgment that no resume can fake." />
            <MentorPortal mentor={CURRENT_MENTOR} projects={projects} onSubmitReview={handleSubmitReview}
              hostedSlots={hostedSlots} stats={mentorStats}
              onToggleSlot={(s) => setHostedSlots((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]))} />
          </>
        )}

        {persona === 'recruiter' && (
          <>
            <PersonaHeader title="Find students who ship, not students who polish." body="Filter on standardized scores and mentor-verified work. Every invite says what your team offers back." />
            <RecruiterPortal recruiter={CURRENT_RECRUITER} candidates={candidates} roleId={recruiterRoleId} setRoleId={switchRecruiterRole}
              criteria={criteria} setCriteria={setCriteria} invites={invites} onInvite={handleInvite} />
          </>
        )}
      </main>

      <DemoGuide steps={demoSteps} />
      <Toast toast={toast} />

      <footer className="border-t border-zinc-800/80 py-5 text-center text-xs text-zinc-600">
        HackOHI/O 2026 · Bridge Builder Challenge (Honda Research Institute × 99P Labs) · All people and events are sample data
      </footer>
    </div>
  )
}

// ── small shell pieces ──────────────────────────────────────────────────────
function LadderMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <rect x="0.5" y="0.5" width="21" height="21" rx="5.5" fill="#BA0C2F" />
      <path d="M7 4.5v13M15 4.5v13" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M7 7.5h8M7 11h8M7 14.5h8" stroke="white" strokeWidth="1.6" strokeLinecap="round" opacity="0.9" />
    </svg>
  )
}

function PersonaHeader({ title, body }) {
  return (
    <div className="mb-6">
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-1 text-sm text-zinc-500">{body}</p>
    </div>
  )
}

function LadderStrip({ rung }) {
  return (
    <div className="grid grid-cols-5 gap-1.5">
      {LADDER.map((label, i) => {
        const n = i + 1
        const done = n < rung
        const current = n === rung
        return (
          <div key={label} className={cx('rounded-lg border px-3 py-2', current ? 'border-[#BA0C2F]/60 bg-[#BA0C2F]/10' : done ? 'border-zinc-700 bg-zinc-900' : 'border-zinc-800/70')}>
            <div className="flex items-center gap-1.5">
              {done ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <span className={cx('font-mono text-[11px]', current ? 'text-[#ff8a98]' : 'text-zinc-600')}>{n}</span>}
              <span className={cx('truncate text-xs', current ? 'font-medium text-zinc-50' : done ? 'text-zinc-300' : 'text-zinc-600')}>{label}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function NeedsProfile({ onGo }) {
  return (
    <EmptyState icon={Sparkles} title="Analyze your profile first"
      body="Your plan, peer matches and leaderboard spot are all built from your real gaps. It takes about 3 seconds."
      action={<Button variant="scarlet" onClick={onGo}>Go to Profile & Score</Button>} />
  )
}

function NotificationPanel({ notifications, invites, onReply, onClose }) {
  const ICONS = { review: Star, invite: Mail, team: HeartHandshake }
  return (
    <div className="absolute right-0 top-11 z-50 w-[380px] rounded-xl border border-zinc-700 bg-zinc-950 shadow-2xl">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <span className="text-sm font-semibold">Notifications</span>
        <button onClick={onClose} className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200" aria-label="Close"><X className="h-4 w-4" /></button>
      </div>
      <ul className="max-h-[440px] divide-y divide-zinc-800 overflow-y-auto">
        {notifications.length === 0 && <li className="px-4 py-8 text-center text-sm text-zinc-500">Nothing yet. Ship something and a mentor will see it.</li>}
        {notifications.map((n) => {
          const Icon = ICONS[n.kind] || Bell
          const invite = n.kind === 'invite' ? invites.find((i) => i.id === n.inviteId) : null
          return (
            <li key={n.id} className="px-4 py-3">
              <div className="flex gap-3">
                <div className={cx('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border',
                  n.kind === 'invite' ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' : n.kind === 'review' ? 'border-amber-500/40 bg-amber-500/10 text-amber-300' : 'border-sky-500/40 bg-sky-500/10 text-sky-300')}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-zinc-100">{n.title}</div>
                  <p className="mt-0.5 text-xs leading-relaxed text-zinc-400">{n.body}</p>
                  {n.delta > 0 && <Badge tone="green" className="mt-2">Standardized score +{n.delta}</Badge>}
                  {n.offers && (
                    <ul className="mt-2 space-y-1">
                      {n.offers.map((o) => <li key={o} className="flex items-center gap-1.5 text-xs text-zinc-300"><ShieldCheck className="h-3 w-3 text-emerald-400" />{o}</li>)}
                    </ul>
                  )}
                  {invite && (
                    invite.reply ? (
                      <div className="mt-2.5 text-xs text-emerald-300">{invite.reply === 'accepted' ? 'You accepted' : 'Question sent'}</div>
                    ) : (
                      <div className="mt-2.5 flex gap-2">
                        <Button size="sm" variant="scarlet" onClick={() => onReply(invite.id, 'accepted')}>Accept</Button>
                        <Button size="sm" variant="secondary" onClick={() => onReply(invite.id, 'question')}>Ask a question</Button>
                      </div>
                    )
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function DemoGuide({ steps }) {
  const [open, setOpen] = useState(true)
  const done = steps.filter((s) => s.done).length
  return (
    <div className="fixed bottom-4 right-4 z-40 w-64 rounded-xl border border-zinc-700 bg-zinc-950/95 shadow-2xl backdrop-blur">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between px-3.5 py-2.5">
        <span className="flex items-center gap-2 text-xs font-semibold text-zinc-200"><PlayCircle className="h-4 w-4 text-[#ff8a98]" />Demo flow · {done}/{steps.length}</span>
        {open ? <ChevronDown className="h-4 w-4 text-zinc-500" /> : <ChevronUp className="h-4 w-4 text-zinc-500" />}
      </button>
      {open && (
        <ol className="space-y-0.5 border-t border-zinc-800 p-2">
          {steps.map((s, i) => (
            <li key={s.label}>
              <button onClick={s.go} className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left hover:bg-zinc-800/60">
                {s.done ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" /> : <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-zinc-600 font-mono text-[9px] text-zinc-500">{i + 1}</span>}
                <span className={cx('text-xs', s.done ? 'text-zinc-500 line-through' : 'text-zinc-200')}>{s.label}</span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
