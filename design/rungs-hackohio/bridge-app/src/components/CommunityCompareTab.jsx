// ─────────────────────────────────────────────────────────────────────────────
// CommunityCompareTab.jsx — Student step 3: "Tale of the Tape" peer comparison,
// AI mutual-growth advice, team-up requests, and the Community Leaderboard.
// Comparison is framed as "who should I build with", never "who is better".
// ─────────────────────────────────────────────────────────────────────────────
import { useMemo, useState } from 'react'
import {
  Swords, Handshake, Sparkles, ArrowUpRight, TrendingUp, HeartHandshake, Gauge, Trophy,
  CheckCircle2, Clock, Zap, Briefcase, ShieldCheck, ArrowUp, Loader2,
} from 'lucide-react'
import { Card, CardHeader, Badge, Button, Avatar, Segmented, cx } from './ui'
import { SKILLS } from '../api/mockData.js'
import { DIMENSIONS, compareProfiles } from '../api/client.js'

export default function CommunityCompareTab({ me, peers, roleId, teamRequests, onTeamUp, baselineOverall }) {
  // Show peers in the same track first, then everyone else; complementary first.
  const ranked = useMemo(() => peers
    .map((p) => ({ ...p, cmp: compareProfiles(me, p, roleId) }))
    .sort((a, b) => (b.role === roleId) - (a.role === roleId) || b.cmp.theyTeach.length - a.cmp.theyTeach.length),
  [peers, me, roleId])

  const [selectedId, setSelectedId] = useState(ranked[0]?.id)
  const peer = ranked.find((p) => p.id === selectedId) || ranked[0]

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-4">
          <CardHeader icon={Handshake} title="People to build with" subtitle="Matched on what you can teach each other" />
          <ul className="max-h-[640px] divide-y divide-zinc-800/80 overflow-y-auto">
            {ranked.map((p) => {
              const req = teamRequests[p.id]
              return (
                <li key={p.id}>
                  <button onClick={() => setSelectedId(p.id)}
                    className={cx('flex w-full items-center gap-3 px-4 py-3 text-left transition-colors', p.id === peer.id ? 'bg-zinc-800/60' : 'hover:bg-zinc-800/30')}>
                    <Avatar initials={p.initials} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-medium text-zinc-100">{p.name}</span>
                        {p.verified && <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-violet-300" />}
                      </div>
                      <div className="truncate text-xs text-zinc-500">{p.major} {p.year}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge tone={p.cmp.matchType === 'Complementary' ? 'blue' : 'neutral'}>{p.cmp.matchType}</Badge>
                      {req && <span className="text-[10px] text-emerald-300">{req.status === 'accepted' ? 'Teammate' : 'Request sent'}</span>}
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        </Card>

        <div className="space-y-6 lg:col-span-8">
          <TaleOfTheTape me={me} peer={peer} request={teamRequests[peer.id]} onTeamUp={onTeamUp} />
        </div>
      </div>

      <Leaderboard me={me} peers={peers} baselineOverall={baselineOverall} />
    </div>
  )
}

// ── Tale of the Tape ────────────────────────────────────────────────────────
function TaleOfTheTape({ me, peer, request, onTeamUp }) {
  const cmp = peer.cmp
  const first = peer.name.split(' ')[0]
  const [sending, setSending] = useState(null)

  const send = async (kind) => {
    setSending(kind)
    await onTeamUp(peer.id, kind)
    setSending(null)
  }

  return (
    <Card>
      <CardHeader icon={Swords} title="Tale of the Tape" subtitle="Same standardized dimensions, side by side. Gaps on one side are strengths on the other."
        right={<Badge tone={cmp.matchType === 'Complementary' ? 'blue' : 'neutral'}>{cmp.overlapPct}% skill overlap</Badge>} />
      <div className="p-5">
        {/* Headline */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <div className="flex items-center gap-3">
            <Avatar initials={me.initials} size="lg" highlight />
            <div className="min-w-0">
              <div className="text-sm font-semibold text-zinc-50">You</div>
              <div className="truncate text-xs text-zinc-500">{me.major}</div>
            </div>
          </div>
          <div className="text-center">
            <div className="font-mono text-2xl font-semibold tabular-nums text-zinc-50">{me.overall}<span className="mx-2 text-zinc-600">·</span>{peer.overall}</div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-500">Standardized</div>
          </div>
          <div className="flex items-center justify-end gap-3 text-right">
            <div className="min-w-0">
              <div className="flex items-center justify-end gap-1 text-sm font-semibold text-zinc-50">{peer.name}{peer.verified && <ShieldCheck className="h-3.5 w-3.5 text-violet-300" />}</div>
              <div className="truncate text-xs text-zinc-500">{peer.major} {peer.year}</div>
            </div>
            <Avatar initials={peer.initials} size="lg" />
          </div>
        </div>

        {/* Mirrored bars */}
        <div className="mt-6 space-y-3">
          {DIMENSIONS.map((d) => {
            const a = me.scores[d.key]
            const b = peer.scores[d.key]
            return (
              <div key={d.key} className="grid grid-cols-[2.5rem_1fr_9.5rem_1fr_2.5rem] items-center gap-2">
                <span className={cx('text-right font-mono text-xs tabular-nums', a >= b ? 'text-zinc-50' : 'text-zinc-500')}>{a}</span>
                <div className="flex h-2 justify-end rounded-full bg-zinc-800">
                  <div className={cx('h-full rounded-full transition-all duration-700', a >= b ? 'bg-[#e0334f]' : 'bg-zinc-600')} style={{ width: `${a}%` }} />
                </div>
                <span className="text-center text-[11px] text-zinc-400">{d.label}</span>
                <div className="h-2 rounded-full bg-zinc-800">
                  <div className={cx('h-full rounded-full transition-all duration-700', b > a ? 'bg-sky-400' : 'bg-zinc-600')} style={{ width: `${b}%` }} />
                </div>
                <span className={cx('font-mono text-xs tabular-nums', b > a ? 'text-zinc-50' : 'text-zinc-500')}>{b}</span>
              </div>
            )
          })}
        </div>

        {/* Skill distribution */}
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <SkillColumn title="You bring" tone="scarlet" skills={cmp.onlyMe} />
          <SkillColumn title="Shared" tone="neutral" skills={cmp.both} />
          <SkillColumn title={`${first} brings`} tone="blue" skills={cmp.onlyThem} />
        </div>

        {/* AI advice */}
        <div className="mt-6 rounded-lg border border-violet-500/30 bg-violet-500/5 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-violet-300"><Sparkles className="h-3.5 w-3.5" /> AI mutual-growth advice</div>
          <ul className="mt-2.5 space-y-1.5">
            {cmp.advice.map((a) => <li key={a} className="flex gap-2 text-sm leading-relaxed text-zinc-200"><ArrowUpRight className="mt-1 h-3.5 w-3.5 shrink-0 text-violet-300" />{a}</li>)}
          </ul>
          <p className="mt-3 text-xs text-zinc-500">{first} is looking for: "{peer.lookingFor}"</p>
        </div>

        {/* Team up */}
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <TeamOption icon={Zap} label="Weekend challenge" title={cmp.weekendPick.title} meta={`${cmp.weekendPick.hours}h · this Sat/Sun`}
            state={request?.kind === 'weekend' ? request.status : null} busy={sending === 'weekend'} disabled={Boolean(request)}
            onClick={() => send('weekend')} />
          <TeamOption icon={Briefcase} label={`${cmp.monthPick.weeks}-week project`} title={cmp.monthPick.title} meta={`${cmp.monthPick.company} · starts ${cmp.monthPick.starts}`}
            state={request?.kind === 'month' ? request.status : null} busy={sending === 'month'} disabled={Boolean(request)}
            onClick={() => send('month')} />
        </div>
      </div>
    </Card>
  )
}

function SkillColumn({ title, tone, skills }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
      <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-zinc-500">{title}</div>
      <div className="flex flex-wrap gap-1.5">
        {skills.length ? skills.map((s) => <Badge key={s} tone={tone}>{SKILLS[s].label}</Badge>) : <span className="text-xs text-zinc-600">None</span>}
      </div>
    </div>
  )
}

function TeamOption({ icon: Icon, label, title, meta, state, busy, disabled, onClick }) {
  return (
    <div className={cx('rounded-lg border p-3', state ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-zinc-800 bg-zinc-950')}>
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-zinc-500"><Icon className="h-3.5 w-3.5" />{label}</div>
      <div className="mt-1.5 text-sm font-medium text-zinc-100">{title}</div>
      <div className="mt-0.5 text-xs text-zinc-500">{meta}</div>
      <div className="mt-3">
        {state === 'accepted' ? (
          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-300"><CheckCircle2 className="h-3.5 w-3.5" /> Teamed up. You both get credit.</div>
        ) : state === 'sent' ? (
          <div className="flex items-center gap-1.5 text-xs text-zinc-400"><Clock className="h-3.5 w-3.5" /> Request sent, waiting for a reply…</div>
        ) : (
          <Button size="sm" variant="scarlet" className="w-full" icon={busy ? Loader2 : HeartHandshake} disabled={disabled || busy} onClick={onClick}>
            {busy ? 'Sending…' : 'Team up'}
          </Button>
        )}
      </div>
    </div>
  )
}

// ── Leaderboard ─────────────────────────────────────────────────────────────
const METRICS = {
  overall: { label: 'Standardized', icon: Gauge, get: (p) => p.overall, fmt: (v) => v },
  growth: { label: '30-day growth', icon: TrendingUp, get: (p) => p.growth30d, fmt: (v) => `+${v}` },
  helped: { label: 'Peers helped', icon: HeartHandshake, get: (p) => p.helped, fmt: (v) => v },
}

function Leaderboard({ me, peers, baselineOverall }) {
  const [metric, setMetric] = useState('overall')
  const [scope, setScope] = useState('near')
  const m = METRICS[metric]

  const everyone = [me, ...peers]
  const sorted = [...everyone].sort((a, b) => m.get(b) - m.get(a))
  const myIndex = sorted.findIndex((p) => p.id === 'me')

  const baselineRank = [...everyone].map((p) => (p.id === 'me' ? { ...p, overall: baselineOverall } : p))
    .sort((a, b) => b.overall - a.overall).findIndex((p) => p.id === 'me')
  const rankChange = metric === 'overall' ? baselineRank - myIndex : 0

  const rows = scope === 'near'
    ? sorted.slice(Math.max(0, myIndex - 2), Math.max(0, myIndex - 2) + 5)
    : sorted
  const above = sorted[myIndex - 1]
  const gapToNext = above ? m.get(above) - m.get(me) + 1 : 0

  return (
    <Card>
      <CardHeader icon={Trophy} title="Community Growth Leaderboard"
        subtitle="Points come from shipped work, mentor ratings and helping peers. Nothing here comes from resume wording."
        right={<Segmented size="sm" value={scope} onChange={setScope} options={[{ value: 'near', label: 'Near me' }, { value: 'all', label: 'Everyone' }]} />} />
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 px-5 py-3">
        <Segmented size="sm" value={metric} onChange={setMetric}
          options={Object.entries(METRICS).map(([k, v]) => ({ value: k, label: v.label, icon: v.icon }))} />
        <div className="flex items-center gap-3 text-xs text-zinc-400">
          {rankChange > 0 && <Badge tone="green" icon={ArrowUp}>Up {rankChange} since your mentor review</Badge>}
          {above
            ? <span><span className="font-mono text-zinc-100">{gapToNext}</span> to pass {above.name.split(' ')[0]}</span>
            : <span className="text-emerald-300">You're #1 on this board</span>}
        </div>
      </div>
      <ul className="divide-y divide-zinc-800/80">
        {rows.map((p) => {
          const rank = sorted.indexOf(p) + 1
          const isMe = p.id === 'me'
          return (
            <li key={p.id} className={cx('flex items-center gap-4 px-5 py-3 transition-colors', isMe && 'bg-[#BA0C2F]/10')}>
              <span className={cx('w-6 text-right font-mono text-sm tabular-nums', rank <= 3 ? 'text-amber-300' : 'text-zinc-500')}>{rank}</span>
              <Avatar initials={p.initials} size="sm" highlight={isMe} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-sm text-zinc-100">
                  {isMe ? 'You' : p.name}
                  {p.verified && <ShieldCheck className="h-3.5 w-3.5 text-violet-300" />}
                  {isMe && rankChange > 0 && <span className="font-mono text-xs text-emerald-400">▲{rankChange}</span>}
                </div>
                <div className="truncate text-xs text-zinc-500">{p.major}</div>
              </div>
              <div className="hidden w-40 sm:block">
                <div className="h-1.5 rounded-full bg-zinc-800">
                  <div className={cx('h-full rounded-full transition-all duration-700', isMe ? 'bg-[#e0334f]' : 'bg-zinc-500')}
                    style={{ width: `${Math.min(100, (m.get(p) / Math.max(...everyone.map(m.get))) * 100)}%` }} />
                </div>
              </div>
              <span className="w-12 text-right font-mono text-sm tabular-nums text-zinc-100">{m.fmt(m.get(p))}</span>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
