import { useLayoutEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import type { Account, Profile } from '../api/auth'
import type { Persona } from '../personas.tsx'

interface HeaderProps {
  persona: Persona
  account: Account
  profile: Profile | null
  onSignOut: () => void | Promise<void>
}

// The blue underline and the icon color travel together, so both use the same timing.
const slide = 'duration-300 ease-out'

export default function Header({ persona, account, profile, onSignOut }: HeaderProps) {
  const displayName = profile?.fullName || account.email
  const initials = displayName
    .trim()
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')

  const { pathname } = useLocation()
  const activeIndex = persona.tabs.findIndex((tab) => pathname.startsWith(`/${persona.id}/${tab.slug}`))
  const tabRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const [underline, setUnderline] = useState<{ left: number; width: number } | null>(null)
  // The first placement snaps into position; only later tab changes slide.
  const [ready, setReady] = useState(false)

  useLayoutEffect(() => {
    function measure() {
      const tab = tabRefs.current[activeIndex]
      setUnderline(tab ? { left: tab.offsetLeft, width: tab.offsetWidth } : null)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [activeIndex])

  useLayoutEffect(() => {
    if (underline && !ready) requestAnimationFrame(() => setReady(true))
  }, [underline, ready])

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
          <button type="button" onClick={onSignOut} className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900">
            <LogOut aria-hidden="true" className="size-4" />
            Sign out
          </button>
        </div>
      </div>

      <nav aria-label={`${persona.label} sections`} className="relative mx-auto flex max-w-[832px] gap-1 overflow-x-auto px-6">
        {persona.tabs.map((tab, index) => {
          const active = index === activeIndex
          // Hidden icons are clipped on the side the underline will arrive from, so the
          // color sweeps in (and back out) in the same direction the underline travels.
          const clip = active
            ? 'inset(0 0 0 0)'
            : activeIndex === -1 || index > activeIndex
              ? 'inset(0 100% 0 0)'
              : 'inset(0 0 0 100%)'
          return (
            <NavLink
              key={tab.slug}
              ref={(element) => { tabRefs.current[index] = element }}
              to={`/${persona.id}/${tab.slug}`}
              className={`group inline-flex min-h-12 items-center gap-2 whitespace-nowrap border-b-2 border-transparent px-3.5 text-[15px] no-underline transition-colors ${slide} ${
                active ? 'font-semibold text-gray-900 hover:text-gray-900' : 'font-medium text-gray-600 hover:text-gray-900'
              }`}
            >
              <span aria-hidden="true" className="relative size-4 shrink-0">
                <tab.icon className="absolute inset-0 size-4 text-gray-300 transition-colors group-hover:text-gray-500" strokeWidth={2} />
                <span
                  className={`absolute inset-0 text-blue-600 motion-safe:transition-[clip-path] ${slide}`}
                  style={{ clipPath: clip }}
                >
                  <tab.icon className="size-4" strokeWidth={2} />
                </span>
              </span>
              {tab.label}
            </NavLink>
          )
        })}
        {underline && (
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute bottom-0 left-0 h-0.5 bg-blue-600 ${ready ? `motion-safe:transition-[transform,width] ${slide}` : ''}`}
            style={{ width: underline.width, transform: `translateX(${underline.left}px)` }}
          />
        )}
      </nav>
    </header>
  )
}
