// ─────────────────────────────────────────────────────────────────────────────
// MentorRecruiterPortal.jsx — the industry side. Two distinct workflows:
//   MentorPortal    → review a project in under 90 seconds, host 15-min hours
//   RecruiterPortal → publish a transparent rubric, filter verified students,
//                     send a two-way fast-track invite
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useMemo, useState } from 'react'
import {
  Play, Github, Sparkles, CheckCircle2, AlertTriangle, Timer, Send, ShieldCheck, Inbox,
  CalendarClock, Star, Filter, TrendingUp, UserCheck, Mail, Gauge, ListChecks, Loader2, Award, Clock,
} from 'lucide-react'
import { Card, CardHeader, Badge, Button, Avatar, Stars, Modal, ProgressBar, Segmented, Label, inputClass, cx } from './ui'
import { QUICK_TAGS, ROLES } from '../api/mockData.js'

// ═════════════════════════════════════════════════════════════════════════════
// MENTOR
// ═════════════════════════════════════════════════════════════════════════════
export function MentorPortal({ mentor, projects, onSubmitReview, hostedSlots, onToggleSlot, stats }) {
  const queue = projects
  const firstOpen = queue.find((p) => !p.reviews.some((r) => r.mentor === mentor.name)) || queue[0]
  const [selectedId, setSelectedId] = useState(firstOpen?.id)
  const project = queue.find((p) => p.id === selectedId) || firstOpen
  const reviewedByMe = (p) => p.reviews.some((r) => r.mentor === mentor.name)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile icon={Inbox} label="In your queue" value={queue.filter((p) => !reviewedByMe(p)).length} />
        <StatTile icon={Timer} label="Your avg review time" value={stats.avgSeconds ? `${stats.avgSeconds}s` : '-'} />
        <StatTile icon={Award} label="Students endorsed" value={stats.endorsed} />
        <StatTile icon={CalendarClock} label="Office-hour slots live" value={hostedSlots.length} />
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-4">
          <CardHeader icon={Inbox} title="Project Showcase" subtitle="AI already read the code. You add the judgment." />
          <ul className="divide-y divide-zinc-800/80">
            {queue.map((p) => {
              const done = reviewedByMe(p)
              return (
                <li key={p.id}>
                  <button onClick={() => setSelectedId(p.id)}
                    className={cx('w-full px-4 py-3 text-left transition-colors', p.id === project.id ? 'bg-zinc-800/60' : 'hover:bg-zinc-800/30')}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-zinc-100">{p.title}</span>
                      {done ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" /> : <Badge tone="amber">New</Badge>}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                      <span className="truncate">{p.ownerName}</span>
                      <span>·</span>
                      <span className="font-mono">AI {p.ai.score}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1"><Play className="h-3 w-3" />{p.demoLength}</span>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        </Card>

        <div className="lg:col-span-8">
          <ReviewPanel key={project.id} project={project} mentor={mentor} alreadyReviewed={reviewedByMe(project)}
            onSubmit={async (review) => {
              await onSubmitReview(project.id, review)
            }}
            onNext={() => {
              const next = queue.find((p) => p.id !== project.id && !reviewedByMe(p))
              if (next) setSelectedId(next.id)
            }} />
        </div>
      </div>

      <OfficeHoursHost hostedSlots={hostedSlots} onToggleSlot={onToggleSlot} />
    </div>
  )
}

function StatTile({ icon: Icon, label, value }) {
  return (
    <Card className="px-4 py-3">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-zinc-500"><Icon className="h-3.5 w-3.5" />{label}</div>
      <div className="mt-1 font-mono text-2xl font-semibold tabular-nums text-zinc-50">{value}</div>
    </Card>
  )
}

function ReviewPanel({ project, mentor, alreadyReviewed, onSubmit, onNext }) {
  const [stars, setStars] = useState(0)
  const [tags, setTags] = useState([])
  const [note, setNote] = useState('')
  const [endorse, setEndorse] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [status, setStatus] = useState(alreadyReviewed ? 'done' : 'idle')
  const [result, setResult] = useState(null)

  // Review timer: the product promise is "under 90 seconds".
  useEffect(() => {
    if (status !== 'idle') return undefined
    const t = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [status])

  const starters = [
    `Next, fix: ${project.ai.risks[0].toLowerCase()}.`,
    `Strongest part: ${project.ai.strengths[0].toLowerCase()}. Keep going.`,
  ]
  const toggleTag = (t) => setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : cur.length >= 2 ? cur : [...cur, t]))
  const canSubmit = stars > 0 && note.trim().length >= 10

  const submit = async () => {
    setStatus('saving')
    const before = await onSubmit({ mentor: mentor.name, stars, note: note.trim(), tags, endorse, seconds })
    setResult(before)
    setStatus('done')
  }

  const mm = String(Math.floor(seconds / 60)).padStart(1, '0')
  const ss = String(seconds % 60).padStart(2, '0')
  const myReview = project.reviews.find((r) => r.mentor === mentor.name)

  return (
    <Card>
      <CardHeader icon={Sparkles} title={project.title} subtitle={`${project.team} · ${project.repo}`}
        right={status === 'idle' ? (
          <div className={cx('flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-xs tabular-nums', seconds > 90 ? 'border-amber-500/40 text-amber-300' : 'border-zinc-700 text-zinc-300')}>
            <Timer className="h-3.5 w-3.5" />{mm}:{ss}<span className="text-zinc-600">/ 1:30</span>
          </div>
        ) : null} />

      <div className="grid gap-5 p-5 md:grid-cols-2">
        {/* Evidence */}
        <div className="space-y-4">
          <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-lg border border-zinc-800 bg-[radial-gradient(ellipse_at_center,_#27272a_0%,_#09090b_70%)]">
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-[repeating-linear-gradient(90deg,transparent_0,transparent_46%,#3f3f46_46%,#3f3f46_54%,transparent_54%)] opacity-40 [transform:perspective(200px)_rotateX(55deg)]" />
            <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white/90"><Play className="ml-0.5 h-5 w-5 fill-zinc-900 text-zinc-900" /></div>
            <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 font-mono text-[11px] text-zinc-200">{project.demoLength}</span>
          </div>
          <p className="text-sm text-zinc-300">{project.summary}</p>
          <div className="flex flex-wrap gap-1.5">{project.stack.map((s) => <Badge key={s}>{s}</Badge>)}</div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400"><Sparkles className="h-3.5 w-3.5 text-violet-300" />AI baseline</span>
              <span className="font-mono text-sm text-zinc-100">{project.ai.score}<span className="text-zinc-600">/100</span></span>
            </div>
            <ProgressBar value={project.ai.score} tone="violet" className="mt-2" />
            <ul className="mt-3 space-y-1.5">
              {project.ai.strengths.map((s) => <li key={s} className="flex gap-2 text-xs text-zinc-300"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />{s}</li>)}
              {project.ai.risks.map((s) => <li key={s} className="flex gap-2 text-xs text-zinc-300"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />{s}</li>)}
            </ul>
          </div>
        </div>

        {/* Decision */}
        {status === 'done' ? (
          <div className="flex flex-col justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-300"><CheckCircle2 className="h-4 w-4" />Review sent to {project.ownerName.split(' ')[0]}</div>
            {myReview && (
              <div className="mt-3 space-y-2">
                <Stars value={myReview.stars} size="sm" />
                <p className="text-sm text-zinc-200">"{myReview.note}"</p>
                {myReview.endorse && <Badge tone="violet" icon={ShieldCheck}>Growth endorsed (visible to recruiters)</Badge>}
              </div>
            )}
            {result?.ownerIsMe && (
              <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-zinc-500">Student score</div>
                  <div className="font-mono text-lg text-zinc-50">{result.before} → <span className="text-emerald-300">{result.after}</span></div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-zinc-500">Time spent</div>
                  <div className="font-mono text-lg text-zinc-50">{result.seconds}s</div>
                </div>
              </div>
            )}
            <Button variant="secondary" size="sm" className="mt-5" onClick={onNext}>Next project</Button>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <Label>1 · Overall rating</Label>
              <Stars value={stars} onChange={setStars} />
            </div>
            <div>
              <Label>2 · Quick tags (pick up to 2, optional)</Label>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_TAGS.map((t) => (
                  <button key={t} onClick={() => toggleTag(t)}
                    className={cx('rounded-md border px-2 py-1 text-xs transition-colors', tags.includes(t) ? 'border-zinc-300 bg-zinc-100 text-zinc-950' : 'border-zinc-700 text-zinc-300 hover:border-zinc-500')}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="note">3 · One actionable sentence</Label>
              <textarea id="note" rows={3} maxLength={140} value={note} onChange={(e) => setNote(e.target.value)}
                placeholder="What should they do next?" className={inputClass} />
              <div className="mt-1 flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {starters.map((s) => (
                    <button key={s} onClick={() => setNote(s.slice(0, 140))} className="rounded border border-dashed border-zinc-700 px-1.5 py-0.5 text-[11px] text-zinc-400 hover:border-zinc-500 hover:text-zinc-200">
                      {s.length > 46 ? `${s.slice(0, 46)}…` : s}
                    </button>
                  ))}
                </div>
                <span className="font-mono text-[11px] text-zinc-600">{note.length}/140</span>
              </div>
            </div>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-3">
              <input type="checkbox" checked={endorse} onChange={(e) => setEndorse(e.target.checked)} className="mt-0.5 h-4 w-4 accent-violet-500" />
              <span>
                <span className="block text-sm text-zinc-100">Endorse this student's growth</span>
                <span className="block text-xs text-zinc-500">Your name appears as a verifier on their profile. Recruiters can filter by it.</span>
              </span>
            </label>
            <Button variant="scarlet" icon={status === 'saving' ? Loader2 : Send} className="w-full" disabled={!canSubmit || status === 'saving'} onClick={submit}>
              {status === 'saving' ? 'Submitting…' : 'Submit review'}
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}

const SLOT_OPTIONS = ['Tue 4:00–4:15 PM', 'Wed 12:00–12:15 PM', 'Thu 4:00–4:15 PM', 'Fri 9:00–9:15 AM']
function OfficeHoursHost({ hostedSlots, onToggleSlot }) {
  return (
    <Card>
      <CardHeader icon={CalendarClock} title="Host micro office hours" subtitle="15-minute slots. Students arrive with AI-prepared questions about their gaps." />
      <div className="flex flex-wrap gap-2 p-5">
        {SLOT_OPTIONS.map((s) => {
          const on = hostedSlots.includes(s)
          return (
            <button key={s} onClick={() => onToggleSlot(s)}
              className={cx('flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors', on ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200' : 'border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200')}>
              {on ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}{s}
            </button>
          )
        })}
        <span className="ml-auto self-center text-xs text-zinc-500">{hostedSlots.length * 15} min/week total</span>
      </div>
    </Card>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// RECRUITER
// ═════════════════════════════════════════════════════════════════════════════
export function passesCriteria(c, criteria) {
  const mustOk = criteria.mustHaves.every((id) => c.rubric.items.find((i) => i.id === id)?.met)
  return c.overall >= criteria.minOverall && c.rubric.coverage >= criteria.minCoverage && (!criteria.requireVerified || c.verified) && mustOk
}

export function RecruiterPortal({ recruiter, candidates, roleId, setRoleId, criteria, setCriteria, invites, onInvite }) {
  const [onlyPassing, setOnlyPassing] = useState(false)
  const [sortBy, setSortBy] = useState('overall')
  const [inviteTarget, setInviteTarget] = useState(null)
  const role = ROLES[roleId]

  const rows = useMemo(() => candidates
    .map((c) => ({ ...c, passes: passesCriteria(c, criteria) }))
    .filter((c) => !onlyPassing || c.passes)
    .sort((a, b) => (sortBy === 'growth' ? b.growth30d - a.growth30d : b.overall - a.overall)),
  [candidates, criteria, onlyPassing, sortBy])
  const passingCount = candidates.filter((c) => passesCriteria(c, criteria)).length

  const toggleMust = (id) => setCriteria({ ...criteria, mustHaves: criteria.mustHaves.includes(id) ? criteria.mustHaves.filter((x) => x !== id) : [...criteria.mustHaves, id] })

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="space-y-6 lg:col-span-4">
        <Card>
          <CardHeader icon={ListChecks} title="Your published rubric" subtitle="Students see this exact list. No hidden filters." />
          <div className="space-y-4 p-5">
            <Segmented size="sm" value={roleId} onChange={setRoleId} options={Object.values(ROLES).map((r) => ({ value: r.id, label: r.short }))} />
            <ul className="space-y-1">
              {role.requirements.map((r) => {
                const must = criteria.mustHaves.includes(r.id)
                return (
                  <li key={r.id}>
                    <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-zinc-800/40">
                      <input type="checkbox" checked={must} onChange={() => toggleMust(r.id)} className="h-3.5 w-3.5 accent-[#BA0C2F]" />
                      <span className={cx('flex-1 text-xs', must ? 'text-zinc-100' : 'text-zinc-400')}>{r.label}</span>
                      {must && <Badge tone="scarlet">Must</Badge>}
                    </label>
                  </li>
                )
              })}
            </ul>
            <Slider label="Min standardized score" value={criteria.minOverall} onChange={(v) => setCriteria({ ...criteria, minOverall: v })} />
            <Slider label="Min rubric coverage" suffix="%" value={criteria.minCoverage} onChange={(v) => setCriteria({ ...criteria, minCoverage: v })} />
            <label className="flex cursor-pointer items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5">
              <span className="flex items-center gap-2 text-sm text-zinc-200"><ShieldCheck className="h-4 w-4 text-violet-300" />Require mentor verification</span>
              <input type="checkbox" checked={criteria.requireVerified} onChange={(e) => setCriteria({ ...criteria, requireVerified: e.target.checked })} className="h-4 w-4 accent-violet-500" />
            </label>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-300"><Mail className="h-3.5 w-3.5" />Two-way by design</div>
          <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">Every invite states what your team offers the student (mentorship, a project seat, a fast-track interview), not just what you want from them.</p>
        </Card>
      </div>

      <Card className="lg:col-span-8">
        <CardHeader icon={UserCheck} title="Verified talent" subtitle={`${passingCount} of ${candidates.length} students clear your ${role.short} rubric`}
          right={(
            <div className="flex items-center gap-2">
              <Segmented size="sm" value={sortBy} onChange={setSortBy} options={[{ value: 'overall', label: 'Score', icon: Gauge }, { value: 'growth', label: 'Growth', icon: TrendingUp }]} />
              <Button size="sm" variant={onlyPassing ? 'primary' : 'secondary'} icon={Filter} onClick={() => setOnlyPassing(!onlyPassing)}>Passing</Button>
            </div>
          )} />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-left text-[11px] uppercase tracking-wider text-zinc-500">
                <th className="px-5 py-2.5 font-medium">Student</th>
                <th className="px-3 py-2.5 font-medium">Score</th>
                <th className="px-3 py-2.5 font-medium">Rubric</th>
                <th className="px-3 py-2.5 font-medium">Mentor</th>
                <th className="px-3 py-2.5 font-medium">30d</th>
                <th className="px-5 py-2.5 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {rows.map((c) => {
                const invited = invites.some((i) => i.studentId === c.id)
                const isMe = c.id === 'me'
                return (
                  <tr key={c.id} className={cx('transition-colors', isMe && c.passes && 'bg-emerald-500/5')}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar initials={c.initials} size="sm" highlight={isMe} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 text-zinc-100">{c.name}{isMe && c.justVerified && <Badge tone="green">Newly verified</Badge>}</div>
                          <div className="truncate text-xs text-zinc-500">{c.major}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 font-mono tabular-nums text-zinc-100">{c.overall}</td>
                    <td className="px-3 py-3">
                      <div className="w-20">
                        <div className="mb-1 font-mono text-xs text-zinc-400">{c.rubric.metCount}/{c.rubric.total}</div>
                        <ProgressBar value={c.rubric.coverage} tone={c.rubric.coverage >= criteria.minCoverage ? 'green' : 'amber'} />
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      {c.verified
                        ? <span className="flex items-center gap-1 text-xs text-violet-300"><ShieldCheck className="h-3.5 w-3.5" />{c.endorsements}</span>
                        : <span className="text-xs text-zinc-600">None</span>}
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-emerald-400">+{c.growth30d}</td>
                    <td className="px-5 py-3 text-right">
                      {invited ? (
                        <Badge tone="green" icon={CheckCircle2}>Invited</Badge>
                      ) : c.passes ? (
                        <Button size="sm" variant="scarlet" icon={Send} onClick={() => setInviteTarget(c)}>Invite</Button>
                      ) : (
                        <span className="text-xs text-zinc-600">Below bar</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <InviteModal target={inviteTarget} recruiter={recruiter} role={role} onClose={() => setInviteTarget(null)}
        onSend={async (payload) => { await onInvite(payload); setInviteTarget(null) }} />
    </div>
  )
}

function Slider({ label, value, onChange, suffix = '' }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="text-zinc-400">{label}</span>
        <span className="font-mono text-zinc-100">{value}{suffix}</span>
      </div>
      <input type="range" min={0} max={100} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-[#BA0C2F]" />
    </div>
  )
}

const OFFERS = [
  { id: 'fast', label: 'Fast-track to a technical interview', detail: 'Skip the resume screen' },
  { id: 'project', label: 'Seat on the next company project', detail: 'Work with our engineers for 4–6 weeks' },
  { id: 'call', label: '15-min intro call with an engineer', detail: 'Ask anything, no interview' },
]

function InviteModal({ target, recruiter, role, onClose, onSend }) {
  const [offers, setOffers] = useState(['fast', 'project'])
  const [note, setNote] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!target) return
    const proof = target.topReview
      ? `Your ${target.topReview.project} earned ${target.topReview.stars}★ from ${target.topReview.mentor}, and your rubric shows ${target.rubric.metCount}/${target.rubric.total} verified.`
      : `Your profile shows ${target.rubric.metCount}/${target.rubric.total} verified on our ${role.short} rubric.`
    setNote(`Hi ${target.name.split(' ')[0]}, ${proof} We'd like to invest in your growth, and here's what we can offer.`)
    setOffers(['fast', 'project'])
  }, [target, role])

  if (!target) return null
  const toggle = (id) => setOffers((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))
  const send = async () => {
    setSending(true)
    await onSend({ studentId: target.id, from: recruiter, roleLabel: role.label, offers: OFFERS.filter((o) => offers.includes(o.id)).map((o) => o.label), note })
    setSending(false)
  }
  const strongest = target.rubric.items.filter((i) => i.met).slice(0, 3)

  return (
    <Modal open onClose={onClose} width="max-w-xl" title={`Two-way fast-track invite · ${target.name}`}
      subtitle="Lead with what you offer. The student sees the exact evidence you saw."
      footer={(
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="scarlet" icon={sending ? Loader2 : Send} disabled={sending || offers.length === 0} onClick={send}>{sending ? 'Sending…' : 'Send Two-Way Fast-Track Invite'}</Button>
        </>
      )}>
      <div className="space-y-5">
        <div>
          <Label>Evidence you're inviting on</Label>
          <div className="flex flex-wrap gap-1.5">
            <Badge tone="neutral" icon={Gauge}>Score {target.overall}</Badge>
            {target.verified && <Badge tone="violet" icon={ShieldCheck}>{target.endorsements} mentor endorsement{target.endorsements === 1 ? '' : 's'}</Badge>}
            {strongest.map((i) => <Badge key={i.id} tone="green" icon={CheckCircle2}>{i.label.split(' (')[0]}</Badge>)}
          </div>
        </div>
        <div>
          <Label>What your team offers</Label>
          <div className="space-y-2">
            {OFFERS.map((o) => (
              <label key={o.id} className={cx('flex cursor-pointer items-start gap-3 rounded-lg border p-3', offers.includes(o.id) ? 'border-zinc-500 bg-zinc-900' : 'border-zinc-800')}>
                <input type="checkbox" checked={offers.includes(o.id)} onChange={() => toggle(o.id)} className="mt-0.5 h-4 w-4 accent-[#BA0C2F]" />
                <span><span className="block text-sm text-zinc-100">{o.label}</span><span className="block text-xs text-zinc-500">{o.detail}</span></span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <Label htmlFor="invite-note">Personal note</Label>
          <textarea id="invite-note" rows={4} value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} />
        </div>
        <p className="flex items-center gap-1.5 text-xs text-zinc-500"><Star className="h-3.5 w-3.5" />The student can accept, ask a question, or decline. Their reply is visible only to you.</p>
      </div>
    </Modal>
  )
}
