import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

// Page title with a soft blue icon badge. Matches the nav icon for the same tab.
export default function PageHeading({ icon: Icon, title, children }: {
  icon: LucideIcon
  title: ReactNode
  children?: ReactNode
}) {
  return (
    <header className="flex items-start gap-3">
      <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
        <Icon className="size-5" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
        {children}
      </div>
    </header>
  )
}
