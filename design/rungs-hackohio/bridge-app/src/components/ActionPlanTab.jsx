// ─────────────────────────────────────────────────────────────────────────────
// ActionPlanTab.jsx — Student step 2: the Weekend / Week / Month action engine.
// Every card says which gap it closes, and "Commit" turns it into an if-then
// plan (implementation intention) instead of a vague to-do.
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react'
import {
  CalendarDays, Clock, MapPin, Zap, Users, Briefcase, CheckCircle2, ChevronDown, ChevronUp,
  MessageSquareQuote, Code2, Trophy, Sparkles, Building2,
} from 'lucide-react'
import { Card, Badge, Button, SourceBadge, Modal, cx, Label, Avatar } from './ui'

const WHEN_PRESETS = {
  weekend: ['Saturday 10:00 AM', 'Saturday 2:00 PM', 'Sunday 10:00 AM'],
  week: ['Monday after class', 'Tuesday 4:00 PM', 'Thursday evening'],
  month: ['Every Monday 6:00 PM', 'Every Tuesday & Thursday 7:00 PM', 'Saturday mornings'],
}
const WHERE_PRESETS = ['Thompson Library', '18th Ave Library', 'Dreese Labs', 'My dorm desk', 'Virtual']

export default function ActionPlanTab({ plan, commitments, onCommit, roleLabel, overall }) {
  const [pending, setPending] = useState(null)
  const committedIds = new Set(commitments.map((c) => c.itemId))
  const committedHours = commitments.reduce((s, c) => s + (c.hours || 1), 0)

  const open = (item) => setPending({ ...item, ifWhen: item.fixedWhen || WHEN_PRESETS[item.horizon][0], ifWhere: item.fixedWhere || WHERE_PRESETS[0] })

  return (
    <div className="space-y-6">
      <Card className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-300" />
            <h2 className="text-sm font-semibold text-zinc-100">Your next 30 days, built from your gaps</h2>
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            {roleLabel} · score {overall} · pulled from <span className="text-sky-300">Handshake</span>, <span className="text-[#ff8a98]">OSU student orgs</span>, mentor office hours and 1-day challenges
          </p>
        </div>
        <div className="flex items-center gap-6 text-right">
          <Stat label="Committed" value={commitments.length} />
          <Stat label="Hours planned" value={committedHours} />
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* WEEKEND */}
        <Column icon={Zap} title="This weekend" range="Sat Oct 24 – Sun Oct 25" rung="Rung 3 · Try something small">
          {plan.weekend.core.type === 'challenge' ? (
            <PlanCard
              highlight
              badge={<Badge tone="violet">1-Day Challenge</Badge>}
              title={plan.weekend.core.title}
              meta={[{ icon: Clock, text: `${plan.weekend.core.hours} hours · mentor-reviewed` }]}
              why={[plan.weekend.core.why.replace('Closes your gap: ', '')]}
              extra={<p className="text-xs text-zinc-500">Ship: {plan.weekend.core.deliverable}</p>}
              committed={committedIds.has(plan.weekend.core.id)}
              commitment={commitments.find((c) => c.itemId === plan.weekend.core.id)}
              onCommit={() => open({ itemId: plan.weekend.core.id, horizon: 'weekend', title: plan.weekend.core.title, hours: plan.weekend.core.hours })}
              cta="Commit to challenge"
            />
          ) : (
            <PlanCard
              highlight
              badge={<Badge tone="blue" icon={Code2}>Interview patterns</Badge>}
              title={plan.weekend.core.title}
              meta={[{ icon: Clock, text: `${plan.weekend.core.hours} hours across the weekend` }]}
              extra={(
                <ul className="space-y-1">
                  {plan.weekend.core.patterns.map((p) => <li key={p} className="text-xs text-zinc-300">• {p}</li>)}
                  <li className="pt-1 text-xs text-zinc-500">{plan.weekend.core.why}</li>
                </ul>
              )}
              committed={committedIds.has(plan.weekend.core.id)}
              commitment={commitments.find((c) => c.itemId === plan.weekend.core.id)}
              onCommit={() => open({ itemId: plan.weekend.core.id, horizon: 'weekend', title: plan.weekend.core.title, hours: plan.weekend.core.hours })}
              cta="Commit to practice"
            />
          )}
          {plan.weekend.events.map((e) => (
            <PlanCard key={e.id}
              badge={<><SourceBadge source={e.source} /><Badge>{e.kind}</Badge></>}
              title={e.title}
              meta={[{ icon: CalendarDays, text: e.when }, { icon: MapPin, text: e.where }]}
              why={e.why}
              committed={committedIds.has(e.id)}
              commitment={commitments.find((c) => c.itemId === e.id)}
              onCommit={() => open({ itemId: e.id, horizon: 'weekend', title: e.title, hours: 3, fixedWhen: e.when, fixedWhere: e.where })}
              cta="RSVP on Handshake"
            />
          ))}
        </Column>

        {/* WEEK */}
        <Column icon={Users} title="This week" range="Mon Oct 26 – Fri Oct 30" rung="Rung 2 · Show up">
          {plan.week.hours.map((o) => (
            <OfficeHourCard key={o.id} o={o}
              committed={committedIds.has(o.id)}
              commitment={commitments.find((c) => c.itemId === o.id)}
              onCommit={() => open({ itemId: o.id, horizon: 'week', title: `15 min with ${o.mentor}`, hours: 0.25, fixedWhen: o.when, fixedWhere: o.where })} />
          ))}
          {plan.week.events.map((e) => (
            <PlanCard key={e.id}
              badge={<><SourceBadge source={e.source} /><Badge>{e.kind}</Badge></>}
              title={e.title}
              meta={[{ icon: CalendarDays, text: e.when }, { icon: MapPin, text: e.where }]}
              why={e.why}
              committed={committedIds.has(e.id)}
              commitment={commitments.find((c) => c.itemId === e.id)}
              onCommit={() => open({ itemId: e.id, horizon: 'week', title: e.title, hours: 1.5, fixedWhen: e.when, fixedWhere: e.where })}
              cta="Add to my week"
            />
          ))}
        </Column>

        {/* MONTH */}
        <Column icon={Briefcase} title="This month" range={`${plan.month.weeks}-week project · starts ${plan.month.starts}`} rung="Rung 4 · Join a project">
          <PlanCard
            highlight
            badge={<><SourceBadge source={plan.month.company} /><Badge tone="green">{plan.month.weeks} weeks</Badge></>}
            title={plan.month.title}
            meta={[{ icon: Clock, text: plan.month.commitment }, { icon: Users, text: plan.month.team }]}
            why={plan.month.closesOpen}
            extra={(
              <div className="space-y-3">
                <p className="text-xs leading-relaxed text-zinc-400">{plan.month.blurb}</p>
                <div>
                  <div className="mb-1.5 text-[11px] uppercase tracking-wider text-zinc-500">Proves on your rubric</div>
                  <div className="flex flex-wrap gap-1.5">
                    {plan.month.closesLabels.map((l) => <Badge key={l} tone={plan.month.closesOpen.includes(l) ? 'amber' : 'green'}>{l.split(' (')[0]}</Badge>)}
                  </div>
                </div>
              </div>
            )}
            committed={committedIds.has('month-capstone')}
            commitment={commitments.find((c) => c.itemId === 'month-capstone')}
            onCommit={() => open({ itemId: 'month-capstone', horizon: 'month', title: plan.month.title, hours: 30 })}
            cta="Apply with verified profile"
          />
          <Card className="p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-300"><Trophy className="h-3.5 w-3.5 text-amber-300" /> After the project: Rung 5</div>
            <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">Teams that ship get invited to mentor the next cohort's 1-day challenges and help pick the next company project.</p>
          </Card>
        </Column>
      </div>

      <CommitModal pending={pending} setPending={setPending} onConfirm={async () => { await onCommit(pending); setPending(null) }} />
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div>
      <div className="font-mono text-xl font-semibold tabular-nums text-zinc-50">{value}</div>
      <div className="text-[11px] uppercase tracking-wider text-zinc-500">{label}</div>
    </div>
  )
}

function Column({ icon: Icon, title, range, rung, children }) {
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-2 px-1">
        <div>
          <div className="flex items-center gap-2"><Icon className="h-4 w-4 text-zinc-400" /><h3 className="text-sm font-semibold text-zinc-100">{title}</h3></div>
          <div className="mt-0.5 text-xs text-zinc-500">{range}</div>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">{rung}</span>
      </div>
      {children}
    </section>
  )
}

function PlanCard({ badge, title, meta = [], why = [], extra, committed, commitment, onCommit, cta, highlight }) {
  return (
    <Card className={cx('p-4 transition-colors', highlight && !committed && 'border-zinc-700 bg-zinc-900', committed && 'border-emerald-500/40')}>
      <div className="flex flex-wrap items-center gap-1.5">{badge}</div>
      <h4 className="mt-2.5 text-sm font-semibold leading-snug text-zinc-100">{title}</h4>
      {meta.length > 0 && (
        <div className="mt-2 space-y-1">
          {meta.map((m) => {
            const I = m.icon
            return <div key={m.text} className="flex items-center gap-1.5 text-xs text-zinc-400"><I className="h-3.5 w-3.5 text-zinc-500" />{m.text}</div>
          })}
        </div>
      )}
      {why.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-zinc-500">Closes:</span>
          {why.map((w) => <Badge key={w} tone="amber">{w.split(' (')[0]}</Badge>)}
        </div>
      )}
      {extra && <div className="mt-3">{extra}</div>}
      <div className="mt-4">
        {committed ? (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-300"><CheckCircle2 className="h-3.5 w-3.5" /> Committed</div>
            <p className="mt-1 text-xs text-zinc-300">If it's <span className="text-zinc-50">{commitment.ifWhen}</span>, I'll be at <span className="text-zinc-50">{commitment.ifWhere}</span> working on this.</p>
          </div>
        ) : (
          <Button variant={highlight ? 'primary' : 'secondary'} size="sm" className="w-full" onClick={onCommit}>{cta}</Button>
        )}
      </div>
    </Card>
  )
}

function OfficeHourCard({ o, committed, commitment, onCommit }) {
  const [openPoints, setOpenPoints] = useState(false)
  const seatsLeft = committed ? o.seats - 1 : o.seats
  return (
    <Card className={cx('p-4', committed && 'border-emerald-500/40')}>
      <div className="flex flex-wrap items-center gap-1.5">
        <SourceBadge source="Mentor" /><Badge tone="green">15 min</Badge>
        <span className="ml-auto font-mono text-[11px] text-zinc-500">{seatsLeft} seat{seatsLeft === 1 ? '' : 's'} left</span>
      </div>
      <div className="mt-3 flex items-center gap-2.5">
        <Avatar initials={o.initials} />
        <div className="min-w-0">
          <div className="text-sm font-semibold text-zinc-100">Office hours: {o.mentor}</div>
          <div className="flex items-center gap-1 truncate text-xs text-zinc-500"><Building2 className="h-3 w-3" />{o.title}</div>
        </div>
      </div>
      <div className="mt-2.5 space-y-1">
        <div className="flex items-center gap-1.5 text-xs text-zinc-400"><CalendarDays className="h-3.5 w-3.5 text-zinc-500" />{o.when} · {o.where}</div>
        <div className="text-xs text-zinc-500">Topic: {o.topic}</div>
      </div>
      <button onClick={() => setOpenPoints(!openPoints)} className="mt-3 flex w-full items-center justify-between rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-300 hover:border-zinc-700">
        <span className="flex items-center gap-1.5"><MessageSquareQuote className="h-3.5 w-3.5 text-violet-300" />AI talking points (so 15 min is enough)</span>
        {openPoints ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>
      {openPoints && (
        <ol className="mt-2 space-y-1.5 pl-1">
          {o.talkingPoints.map((t, i) => (
            <li key={t} className="flex gap-2 text-xs leading-relaxed text-zinc-300"><span className="font-mono text-zinc-600">{i + 1}.</span>{t}</li>
          ))}
        </ol>
      )}
      <div className="mt-4">
        {committed ? (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-xs text-zinc-300">
            <div className="mb-0.5 flex items-center gap-1.5 font-medium text-emerald-300"><CheckCircle2 className="h-3.5 w-3.5" /> Booked</div>
            If it's {commitment.ifWhen}, I'll join from {commitment.ifWhere} with my 3 questions ready.
          </div>
        ) : (
          <Button variant="secondary" size="sm" className="w-full" onClick={onCommit} disabled={seatsLeft <= 0}>Book 15-min slot</Button>
        )}
      </div>
    </Card>
  )
}

function CommitModal({ pending, setPending, onConfirm }) {
  const [saving, setSaving] = useState(false)
  if (!pending) return null
  const fixed = Boolean(pending.fixedWhen)
  const confirm = async () => {
    setSaving(true)
    await onConfirm()
    setSaving(false)
  }
  return (
    <Modal open onClose={() => setPending(null)} title="Lock in an if-then plan"
      subtitle="People who decide when and where they'll act follow through far more often than people who just intend to."
      footer={(
        <>
          <Button variant="ghost" onClick={() => setPending(null)}>Cancel</Button>
          <Button variant="scarlet" onClick={confirm} disabled={saving}>{saving ? 'Saving…' : 'Commit'}</Button>
        </>
      )}>
      <div className="space-y-4">
        <div className="text-sm font-medium text-zinc-100">{pending.title}</div>
        <div>
          <Label>When</Label>
          {fixed ? (
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-300">{pending.fixedWhen}</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {WHEN_PRESETS[pending.horizon].map((w) => (
                <Chip key={w} active={pending.ifWhen === w} onClick={() => setPending({ ...pending, ifWhen: w })}>{w}</Chip>
              ))}
            </div>
          )}
        </div>
        <div>
          <Label>Where</Label>
          {fixed ? (
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-300">{pending.fixedWhere}</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {WHERE_PRESETS.map((w) => (
                <Chip key={w} active={pending.ifWhere === w} onClick={() => setPending({ ...pending, ifWhere: w })}>{w}</Chip>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-3 text-sm leading-relaxed text-zinc-200">
          "If it's <span className="font-semibold text-white">{pending.ifWhen}</span>, then I'll be at <span className="font-semibold text-white">{pending.ifWhere}</span> working on <span className="font-semibold text-white">{pending.title}</span>."
        </div>
      </div>
    </Modal>
  )
}

function Chip({ active, children, onClick }) {
  return (
    <button onClick={onClick}
      className={cx('rounded-md border px-2.5 py-1.5 text-xs transition-colors', active ? 'border-zinc-300 bg-zinc-100 text-zinc-950' : 'border-zinc-700 text-zinc-300 hover:border-zinc-500')}>
      {children}
    </button>
  )
}
