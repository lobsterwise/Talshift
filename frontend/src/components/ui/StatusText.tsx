import { CircleAlert, CircleCheck, Info, LoaderCircle } from 'lucide-react'
import type { ReactNode } from 'react'

const tones = {
  error: { icon: CircleAlert, role: 'alert', className: 'text-red-700' },
  success: { icon: CircleCheck, role: 'status', className: 'text-green-700' },
  info: { icon: Info, role: 'status', className: 'text-gray-600' },
  loading: { icon: LoaderCircle, role: 'status', className: 'text-gray-500' },
} as const

// One-line feedback with an icon whose shape and color carry the meaning.
export default function StatusText({ tone, children }: { tone: keyof typeof tones; children: ReactNode }) {
  const { icon: Icon, role, className } = tones[tone]
  return (
    <p role={role} className={`flex items-start gap-1.5 text-sm ${className}`}>
      <Icon aria-hidden="true" className={`mt-0.5 size-4 shrink-0 ${tone === 'loading' ? 'animate-spin' : ''}`} />
      <span>{children}</span>
    </p>
  )
}
