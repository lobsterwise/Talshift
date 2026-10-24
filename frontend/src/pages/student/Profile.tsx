import { useEffect, useState, type ReactNode } from 'react'
import { getProfile } from '../../api/auth'
import { getStudentProfile, saveStudentProfile, type SkillLevel, type StudentProfile } from '../../api/studentProfile'

const levels: SkillLevel[] = ['beginner', 'intermediate', 'advanced']

const inputClass = 'w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-600 focus:outline-none'
const buttonClass = 'rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50'
const primaryClass = 'rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50'

function formatMonth(value: string | null) {
  if (!value) return 'Present'
  const [year, month] = value.split('-').map(Number)
  return new Date(year, month - 1).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
}

function formatYears(start: number | null, end: number | null) {
  if (start && end) return `${start} – ${end}`
  return String(start ?? end ?? '')
}

// ───────────── View ─────────────

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="border-b border-gray-200 pb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase">{title}</h2>
      {children}
    </section>
  )
}

function Entry({ title, meta, children }: { title: string; meta: string; children?: ReactNode }) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <span className="text-sm text-gray-500">{meta}</span>
      </div>
      {children}
    </div>
  )
}

function Description({ text }: { text: string }) {
  return text ? <p className="mt-1 text-sm whitespace-pre-line text-gray-700">{text}</p> : null
}

function ProfileView({ profile, fullName }: { profile: StudentProfile; fullName: string }) {
  const empty = !profile.headline && !profile.summary && !profile.education.length && !profile.jobs.length
    && !profile.projects.length && !profile.skills.length && !profile.links.length

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">{fullName}</h1>
        {profile.headline && <p className="text-gray-700">{profile.headline}</p>}
        {profile.location && <p className="text-sm text-gray-500">{profile.location}</p>}
        {profile.links.length > 0 && (
          <p className="mt-1 flex flex-wrap gap-x-4 text-sm">
            {profile.links.map((link, index) => (
              <a key={index} href={link.url} target="_blank" rel="noopener noreferrer">{link.label}</a>
            ))}
          </p>
        )}
      </header>

      {empty && <p className="text-sm text-gray-500">Your profile is empty. Select Edit to add your experience.</p>}

      {profile.summary && <Section title="Summary"><Description text={profile.summary} /></Section>}

      {profile.jobs.length > 0 && (
        <Section title="Experience">
          {profile.jobs.map((job, index) => (
            <Entry key={index} title={`${job.title} · ${job.company}`}
              meta={`${formatMonth(job.startDate)} – ${formatMonth(job.endDate)}`}>
              {job.location && <p className="text-sm text-gray-500">{job.location}</p>}
              <Description text={job.description} />
            </Entry>
          ))}
        </Section>
      )}

      {profile.projects.length > 0 && (
        <Section title="Projects">
          {profile.projects.map((project, index) => (
            <Entry key={index} title={project.name} meta="">
              {project.url && <a className="text-sm" href={project.url} target="_blank" rel="noopener noreferrer">{project.url}</a>}
              <Description text={project.description} />
              {project.skills.length > 0 && (
                <p className="mt-1 flex flex-wrap gap-1.5">
                  {project.skills.map((skill) => (
                    <span key={skill} className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700">{skill}</span>
                  ))}
                </p>
              )}
            </Entry>
          ))}
        </Section>
      )}

      {profile.education.length > 0 && (
        <Section title="Education">
          {profile.education.map((item, index) => (
            <Entry key={index} title={item.institution} meta={formatYears(item.startYear, item.endYear)}>
              <p className="text-sm text-gray-700">{[item.degree, item.field].filter(Boolean).join(', ')}</p>
              <Description text={item.description} />
            </Entry>
          ))}
        </Section>
      )}

      {profile.skills.length > 0 && (
        <Section title="Skills">
          <p className="flex flex-wrap gap-2">
            {profile.skills.map((skill, index) => (
              <span key={index} className="rounded-full border border-gray-200 px-2.5 py-0.5 text-sm">
                {skill.name} <span className="text-xs text-gray-500">· {skill.level}</span>
              </span>
            ))}
          </p>
        </Section>
      )}
    </div>
  )
}

// ───────────── Edit ─────────────

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-gray-700">{label}</span>
      {children}
    </label>
  )
}

// An editable list: a section with a card per item, Remove buttons, and an Add button.
function ListEditor<T>({ title, items, blank, onChange, render }: {
  title: string
  items: T[]
  blank: T
  onChange: (items: T[]) => void
  render: (item: T, update: (patch: Partial<T>) => void) => ReactNode
}) {
  return (
    <Section title={title}>
      {items.map((item, index) => (
        <div key={index} className="flex flex-col gap-3 rounded-md border border-gray-200 p-3">
          {render(item, (patch) => onChange(items.map((existing, i) => (i === index ? { ...existing, ...patch } : existing))))}
          <button type="button" className={`${buttonClass} self-start`}
            onClick={() => onChange(items.filter((_, i) => i !== index))}>
            Remove
          </button>
        </div>
      ))}
      <button type="button" className={`${buttonClass} self-start`} onClick={() => onChange([...items, blank])}>
        Add {title.toLowerCase()}
      </button>
    </Section>
  )
}

const numberOrNull = (value: string) => (value === '' ? null : Number(value))

function ProfileForm({ initial, saving, error, onSave, onCancel }: {
  initial: StudentProfile
  saving: boolean
  error: string
  onSave: (profile: StudentProfile) => void
  onCancel: () => void
}) {
  const [draft, setDraft] = useState(initial)
  const set = (patch: Partial<StudentProfile>) => setDraft((current) => ({ ...current, ...patch }))

  return (
    <form className="flex flex-col gap-6" onSubmit={(event) => { event.preventDefault(); onSave(draft) }}>
      <Section title="About">
        <Field label="Headline">
          <input className={inputClass} maxLength={160} value={draft.headline}
            onChange={(e) => set({ headline: e.target.value })} placeholder="Mechanical engineering student" />
        </Field>
        <Field label="Location">
          <input className={inputClass} maxLength={120} value={draft.location}
            onChange={(e) => set({ location: e.target.value })} />
        </Field>
        <Field label="Summary">
          <textarea className={inputClass} rows={4} maxLength={2000} value={draft.summary}
            onChange={(e) => set({ summary: e.target.value })} />
        </Field>
      </Section>

      <ListEditor title="Experience" items={draft.jobs} onChange={(jobs) => set({ jobs })}
        blank={{ title: '', company: '', location: '', startDate: '', endDate: null, description: '' }}
        render={(job, update) => (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Title"><input required className={inputClass} maxLength={120} value={job.title} onChange={(e) => update({ title: e.target.value })} /></Field>
              <Field label="Company"><input required className={inputClass} maxLength={120} value={job.company} onChange={(e) => update({ company: e.target.value })} /></Field>
              <Field label="Location"><input className={inputClass} maxLength={120} value={job.location} onChange={(e) => update({ location: e.target.value })} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Start"><input required type="month" className={inputClass} value={job.startDate} onChange={(e) => update({ startDate: e.target.value })} /></Field>
                <Field label="End"><input type="month" className={inputClass} value={job.endDate ?? ''} min={job.startDate}
                  onChange={(e) => update({ endDate: e.target.value || null })} /></Field>
              </div>
            </div>
            <p className="-mt-1 text-xs text-gray-500">Leave End empty for a current job.</p>
            <Field label="Description"><textarea className={inputClass} rows={3} maxLength={2000} value={job.description} onChange={(e) => update({ description: e.target.value })} /></Field>
          </>
        )} />

      <ListEditor title="Projects" items={draft.projects} onChange={(projects) => set({ projects })}
        blank={{ name: '', description: '', url: '', skills: [] }}
        render={(project, update) => (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Name"><input required className={inputClass} maxLength={120} value={project.name} onChange={(e) => update({ name: e.target.value })} /></Field>
              <Field label="URL"><input type="url" className={inputClass} maxLength={500} value={project.url} onChange={(e) => update({ url: e.target.value })} placeholder="https://" /></Field>
            </div>
            <Field label="Skills used (comma separated)">
              <input className={inputClass} defaultValue={project.skills.join(', ')}
                onBlur={(e) => update({ skills: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} />
            </Field>
            <Field label="Description"><textarea className={inputClass} rows={3} maxLength={2000} value={project.description} onChange={(e) => update({ description: e.target.value })} /></Field>
          </>
        )} />

      <ListEditor title="Education" items={draft.education} onChange={(education) => set({ education })}
        blank={{ institution: '', degree: '', field: '', startYear: null, endYear: null, description: '' }}
        render={(item, update) => (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Institution"><input required className={inputClass} maxLength={120} value={item.institution} onChange={(e) => update({ institution: e.target.value })} /></Field>
              <Field label="Degree"><input className={inputClass} maxLength={120} value={item.degree} onChange={(e) => update({ degree: e.target.value })} placeholder="BSc" /></Field>
              <Field label="Field of study"><input className={inputClass} maxLength={120} value={item.field} onChange={(e) => update({ field: e.target.value })} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Start year"><input type="number" min={1950} max={2100} className={inputClass} value={item.startYear ?? ''} onChange={(e) => update({ startYear: numberOrNull(e.target.value) })} /></Field>
                <Field label="End year"><input type="number" min={1950} max={2100} className={inputClass} value={item.endYear ?? ''} onChange={(e) => update({ endYear: numberOrNull(e.target.value) })} /></Field>
              </div>
            </div>
            <Field label="Description"><textarea className={inputClass} rows={2} maxLength={1000} value={item.description} onChange={(e) => update({ description: e.target.value })} /></Field>
          </>
        )} />

      <ListEditor title="Skills" items={draft.skills} onChange={(skills) => set({ skills })}
        blank={{ name: '', level: 'beginner' as SkillLevel }}
        render={(skill, update) => (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Skill"><input required className={inputClass} maxLength={60} value={skill.name} onChange={(e) => update({ name: e.target.value })} /></Field>
            <Field label="Level">
              <select className={inputClass} value={skill.level} onChange={(e) => update({ level: e.target.value as SkillLevel })}>
                {levels.map((level) => <option key={level} value={level}>{level}</option>)}
              </select>
            </Field>
          </div>
        )} />

      <ListEditor title="Links" items={draft.links} onChange={(links) => set({ links })}
        blank={{ label: '', url: '' }}
        render={(link, update) => (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Label"><input required className={inputClass} maxLength={60} value={link.label} onChange={(e) => update({ label: e.target.value })} placeholder="GitHub" /></Field>
            <Field label="URL"><input required type="url" className={inputClass} maxLength={500} value={link.url} onChange={(e) => update({ url: e.target.value })} placeholder="https://" /></Field>
          </div>
        )} />

      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" className={primaryClass} disabled={saving}>{saving ? 'Saving…' : 'Save profile'}</button>
        <button type="button" className={buttonClass} onClick={onCancel} disabled={saving}>Cancel</button>
      </div>
    </form>
  )
}

// ───────────── Page ─────────────

export default function Profile() {
  const [fullName, setFullName] = useState('')
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    const token = localStorage.getItem('talshift.session') ?? ''
    Promise.all([getStudentProfile(), getProfile(token)])
      .then(([result, account]) => {
        if (cancelled) return
        setProfile(result)
        setFullName(account.profile?.fullName ?? '')
      })
      .catch((caught: unknown) => {
        if (!cancelled) setError(caught instanceof Error ? caught.message : 'Unable to load your profile.')
      })
    return () => { cancelled = true }
  }, [])

  async function save(draft: StudentProfile) {
    setSaving(true)
    setError('')
    try {
      setProfile(await saveStudentProfile(draft))
      setEditing(false)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save your profile.')
    } finally {
      setSaving(false)
    }
  }

  if (!profile) {
    return error
      ? <p role="alert" className="text-sm text-red-700">{error}</p>
      : <p className="text-sm text-gray-500">Loading…</p>
  }

  return (
    <div className="flex flex-col gap-4">
      {editing
        ? <ProfileForm initial={profile} saving={saving} error={error} onSave={save}
            onCancel={() => { setEditing(false); setError('') }} />
        : (
          <>
            <button type="button" className={`${buttonClass} self-end`} onClick={() => setEditing(true)}>Edit</button>
            <ProfileView profile={profile} fullName={fullName} />
          </>
        )}
    </div>
  )
}
