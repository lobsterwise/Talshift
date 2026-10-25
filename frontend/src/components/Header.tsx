import { NavLink } from 'react-router-dom'
import type { Account, Profile } from '../api/auth'
import type { Persona } from '../personas.tsx'

interface HeaderProps {
  persona: Persona
  account: Account
  profile: Profile | null
  onSignOut: () => void | Promise<void>
}

export default function Header({ persona, account, profile, onSignOut }: HeaderProps) {
  const displayName = profile?.fullName || account.email
  const initials = displayName
    .trim()
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex min-h-[72px] max-w-[832px] flex-wrap items-center justify-between gap-3 px-6">
        <div className="flex items-center gap-2.5">
          <div aria-hidden="true" className="flex size-8 items-center justify-center rounded-lg bg-blue-600">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round">
              <path d="M4 22L9 2M14 22l5-20" />
              <path d="M7.75 7L17.75 7M6.5 12L16.5 12M5.25 17L15.25 17" strokeLinecap="butt" />
            </svg>
          </div>
          <span className="text-[17px] font-semibold">Rungs</span>
        </div>

        <div className="flex items-center gap-3">
          <div
            role="img"
            aria-label={displayName}
            title={displayName}
            className="flex size-9 items-center justify-center rounded-full bg-blue-600 text-[13px] font-semibold text-white"
          >
            {initials}
          </div>
          <button type="button" onClick={onSignOut} className="text-sm font-medium text-gray-600 hover:text-gray-900">Sign out</button>
        </div>
      </div>

      <nav aria-label={`${persona.label} sections`} className="mx-auto flex max-w-[832px] gap-1 overflow-x-auto px-6">
        {persona.tabs.map((tab) => (
          <NavLink
            key={tab.slug}
            to={`/${persona.id}/${tab.slug}`}
            className={({ isActive }) =>
              `inline-flex min-h-12 items-center whitespace-nowrap border-b-2 px-3.5 text-[15px] no-underline ${
                isActive
                  ? 'border-blue-600 font-semibold text-gray-900 hover:text-gray-900'
                  : 'border-transparent font-medium text-gray-600 hover:text-gray-900'
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}
