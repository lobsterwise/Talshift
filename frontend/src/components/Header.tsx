import { Link, NavLink } from 'react-router-dom'
import { personas, type Persona } from '../personas.tsx'

export default function Header({ persona }: { persona: Persona }) {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div
        className={`mx-auto flex max-w-[832px] flex-wrap items-center justify-between gap-3 px-6 ${
          persona.avatar ? 'min-h-[72px]' : 'min-h-[76px]'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div aria-hidden="true" className="flex size-8 items-center justify-center rounded-lg bg-blue-600">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round">
              <path d="M7 3v18M17 3v18M7 8h10M7 13h10M7 18h10" />
            </svg>
          </div>
          <span className="text-[17px] font-semibold">Rungs</span>
        </div>

        <div className="flex items-center gap-2.5">
          <nav aria-label="Switch view" className="flex gap-0.5 rounded-full bg-gray-100 p-1">
            {personas.map((p) =>
              p.id === persona.id ? (
                <span
                  key={p.id}
                  aria-current="page"
                  className="flex min-h-9 items-center rounded-full bg-white px-4 text-sm font-semibold text-gray-900 shadow-[0_1px_2px_rgba(17,24,39,.08)]"
                >
                  {p.label}
                </span>
              ) : (
                <Link
                  key={p.id}
                  to={`/${p.id}/${p.tabs[0].slug}`}
                  className="flex min-h-9 items-center rounded-full px-4 text-sm font-medium text-gray-600 no-underline hover:text-gray-900"
                >
                  {p.label}
                </Link>
              ),
            )}
          </nav>
          {persona.avatar && (
            <div
              role="img"
              aria-label={persona.avatar.name}
              className={`flex size-9 items-center justify-center rounded-full text-[13px] font-semibold ${persona.avatar.className}`}
            >
              {persona.avatar.initials}
            </div>
          )}
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
            {({ isActive }) => (
              <>
                {tab.label}
                {tab.badge && !isActive && (
                  <span className="ml-1.5 rounded-full bg-blue-600 px-1.5 py-px text-[11px] font-bold text-white">
                    {tab.badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}
