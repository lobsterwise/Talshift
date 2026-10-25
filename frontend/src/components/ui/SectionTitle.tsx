import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

const tones = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-700',
  amber: 'bg-amber-50 text-amber-600',
}

// The small uppercase section label used across pages, with a tinted icon badge.
export default function SectionTitle({ icon: Icon, tone = 'blue', as: Tag = 'h2', children }: {
  icon: LucideIcon
  tone?: keyof typeof tones
  as?: 'h2' | 'h3'
  children: ReactNode
}) {
  return (
    <Tag className="flex items-center gap-2 border-b border-gray-200 pb-1.5 text-xs font-semibold tracking-wide text-gray-500 uppercase">
      <span aria-hidden="true" className={`flex size-6 shrink-0 items-center justify-center rounded-md ${tones[tone]}`}>
        <Icon className="size-3.5" strokeWidth={2} />
      </span>
      {children}
    </Tag>
  )
}
