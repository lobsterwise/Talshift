import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

// Friendly placeholder for "nothing here yet", so an empty list reads as a next step rather than an error.
export default function EmptyState({ icon: Icon, title, children, compact = false }: {
  icon: LucideIcon
  title?: ReactNode
  children?: ReactNode
  compact?: boolean
}) {
  return (
    <div className={`flex flex-col items-center gap-2 rounded-lg border border-dashed border-gray-200 px-4 text-center ${compact ? 'py-5' : 'py-8'}`}>
      <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-full bg-gray-50 text-gray-400">
        <Icon className="size-5" strokeWidth={1.75} />
      </span>
      {title && <p className="text-sm font-semibold text-gray-900">{title}</p>}
      {children && <div className="max-w-sm text-sm text-gray-500">{children}</div>}
    </div>
  )
}
