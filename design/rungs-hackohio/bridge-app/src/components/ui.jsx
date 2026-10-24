// ─────────────────────────────────────────────────────────────────────────────
// ui.jsx — small, reusable building blocks. Every tab imports from here, so a
// style change in one place updates the whole app.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect } from 'react'
import { X, Star } from 'lucide-react'

export function cx(...classes) {
  return classes.filter(Boolean).join(' ')
}

export function Card({ className, children, ...rest }) {
  return (
    <div className={cx('rounded-xl border border-zinc-800 bg-zinc-900/50', className)} {...rest}>
      {children}
    </div>
  )
}

export function CardHeader({ icon: Icon, title, subtitle, right, className }) {
  return (
    <div className={cx('flex items-start justify-between gap-4 border-b border-zinc-800 px-5 py-4', className)}>
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-zinc-800 bg-zinc-950">
            <Icon className="h-3.5 w-3.5 text-zinc-300" />
          </div>
        )}
        <div className="min-w-0">
          <h3 className="text-sm font-semibold tracking-tight text-zinc-100">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-zinc-500">{subtitle}</p>}
        </div>
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  )
}

const BADGE_TONES = {
  neutral: 'border-zinc-700 bg-zinc-800/60 text-zinc-300',
  green: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  amber: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  red: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
  blue: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
  violet: 'border-violet-500/30 bg-violet-500/10 text-violet-300',
  scarlet: 'border-[#BA0C2F]/50 bg-[#BA0C2F]/15 text-[#ff8a98]',
}

export function Badge({ tone = 'neutral', icon: Icon, children, className }) {
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium leading-none whitespace-nowrap', BADGE_TONES[tone], className)}>
      {Icon && <Icon className="h-3 w-3" />}
      {children}
    </span>
  )
}

const SOURCE_TONES = { Handshake: 'blue', 'OSU Student Org': 'scarlet', Platform: 'violet', 'Honda 99P Labs': 'green', 'Honda Research Institute': 'green', Mentor: 'violet' }
export function SourceBadge({ source }) {
  return <Badge tone={SOURCE_TONES[source] || 'neutral'}>{source}</Badge>
}

const BUTTON_VARIANTS = {
  primary: 'bg-zinc-100 text-zinc-950 hover:bg-white disabled:bg-zinc-700 disabled:text-zinc-400',
  scarlet: 'bg-[#BA0C2F] text-white hover:bg-[#d0123a] disabled:bg-zinc-700 disabled:text-zinc-400',
  secondary: 'border border-zinc-700 bg-zinc-900 text-zinc-200 hover:border-zinc-600 hover:bg-zinc-800',
  ghost: 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100',
  success: 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
}

export function Button({ variant = 'primary', size = 'md', icon: Icon, children, className, ...rest }) {
  const sizes = { sm: 'h-7 px-2.5 text-xs gap-1.5', md: 'h-9 px-3.5 text-sm gap-2', lg: 'h-11 px-5 text-sm gap-2' }
  return (
    <button
      className={cx('inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:cursor-not-allowed', sizes[size], BUTTON_VARIANTS[variant], className)}
      {...rest}
    >
      {Icon && <Icon className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />}
      {children}
    </button>
  )
}

// A data bar with an optional dashed "next tier" marker (goal-gradient cue).
export function ProgressBar({ value, marker, tone = 'zinc', height = 'h-1.5', className }) {
  const fills = {
    zinc: 'bg-zinc-200', green: 'bg-emerald-400', amber: 'bg-amber-400',
    blue: 'bg-sky-400', violet: 'bg-violet-400', scarlet: 'bg-[#e0334f]',
  }
  return (
    <div className={cx('relative w-full overflow-visible rounded-full bg-zinc-800', height, className)}>
      <div className={cx('h-full rounded-full transition-all duration-700 ease-out', fills[tone])} style={{ width: `${value}%` }} />
      {marker != null && marker > value && (
        <div className="absolute -top-1 -bottom-1 w-px border-l border-dashed border-zinc-400" style={{ left: `${marker}%` }} title={`Next tier: ${marker}`} />
      )}
    </div>
  )
}

export function ScoreRing({ value, size = 120, stroke = 9, label = 'Standardized', delta }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const color = value >= 75 ? '#34d399' : value >= 60 ? '#e4e4e7' : '#fbbf24'
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#27272a" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (value / 100) * c}
          style={{ transition: 'stroke-dashoffset 900ms ease-out, stroke 300ms' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-3xl font-semibold tabular-nums text-zinc-50">{value}</span>
        <span className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</span>
        {delta > 0 && <span className="mt-0.5 font-mono text-[11px] text-emerald-400">+{delta}</span>}
      </div>
    </div>
  )
}

export function Stars({ value, onChange, size = 'md' }) {
  const s = size === 'sm' ? 'h-3.5 w-3.5' : 'h-7 w-7'
  return (
    <div className="flex items-center gap-1" role={onChange ? 'radiogroup' : undefined}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value
        const icon = <Star className={cx(s, filled ? 'fill-amber-400 text-amber-400' : 'text-zinc-600')} />
        return onChange ? (
          <button key={n} type="button" onClick={() => onChange(n)} className="rounded p-0.5 transition-transform hover:scale-110" aria-label={`${n} star${n > 1 ? 's' : ''}`}>
            {icon}
          </button>
        ) : <span key={n}>{icon}</span>
      })}
    </div>
  )
}

const AVATAR_TONES = ['bg-sky-500/20 text-sky-200', 'bg-violet-500/20 text-violet-200', 'bg-emerald-500/20 text-emerald-200', 'bg-amber-500/20 text-amber-200', 'bg-rose-500/20 text-rose-200']
export function Avatar({ initials, size = 'md', highlight }) {
  const tone = AVATAR_TONES[(initials.charCodeAt(0) + initials.charCodeAt(1 % initials.length)) % AVATAR_TONES.length]
  const sizes = { sm: 'h-6 w-6 text-[10px]', md: 'h-8 w-8 text-xs', lg: 'h-11 w-11 text-sm' }
  return (
    <div className={cx('flex shrink-0 items-center justify-center rounded-full font-semibold', sizes[size], highlight ? 'bg-[#BA0C2F] text-white' : tone)}>
      {initials}
    </div>
  )
}

export function Modal({ open, onClose, title, subtitle, children, footer, width = 'max-w-lg' }) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={cx('relative w-full rounded-xl border border-zinc-700 bg-zinc-950 shadow-2xl', width)}>
        <div className="flex items-start justify-between gap-4 border-b border-zinc-800 px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
            {subtitle && <p className="mt-0.5 text-xs text-zinc-500">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-zinc-800 px-5 py-3">{footer}</div>}
      </div>
    </div>
  )
}

export function Segmented({ options, value, onChange, size = 'md' }) {
  return (
    <div className="inline-flex rounded-lg border border-zinc-800 bg-zinc-950 p-0.5">
      {options.map((o) => {
        const Icon = o.icon
        const active = o.value === value
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={cx(
              'inline-flex items-center gap-1.5 rounded-md font-medium transition-colors',
              size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm',
              active ? 'bg-zinc-800 text-zinc-50 shadow-sm' : 'text-zinc-500 hover:text-zinc-200',
            )}
          >
            {Icon && <Icon className="h-3.5 w-3.5" />}
            {o.label}
            {o.badge ? <span className="ml-0.5 rounded-full bg-[#BA0C2F] px-1.5 text-[10px] font-semibold text-white">{o.badge}</span> : null}
          </button>
        )
      })}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, body, action }) {
  return (
    <Card className="flex flex-col items-center justify-center px-6 py-16 text-center">
      {Icon && <Icon className="h-6 w-6 text-zinc-500" />}
      <h3 className="mt-3 text-sm font-semibold text-zinc-100">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-zinc-500">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </Card>
  )
}

export function Label({ children, htmlFor }) {
  return <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-medium text-zinc-400">{children}</label>
}

export const inputClass = 'w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none'

export function Toast({ toast }) {
  if (!toast) return null
  const Icon = toast.icon
  return (
    <div className="fixed bottom-5 left-1/2 z-[60] -translate-x-1/2">
      <div className="flex items-center gap-2.5 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-100 shadow-2xl">
        {Icon && <Icon className="h-4 w-4 text-emerald-400" />}
        {toast.text}
      </div>
    </div>
  )
}
