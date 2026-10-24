import { useEffect, useState } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import {
  getCurrentAccount,
  logout,
  type Account,
  type AuthSession,
  type Profile,
} from './api/auth.ts'
import Header from './components/Header.tsx'
import AuthFlow from './pages/auth/AuthFlow.tsx'
import { personas, type Persona } from './personas.tsx'

type AuthScreen = 'signup' | 'login' | 'onboarding' | 'welcome'

function profileStorageKey(accountId: string) {
  return `talshift.profile.${accountId}`
}

function readProfile(accountId: string): Profile | null {
  try {
    const saved = localStorage.getItem(profileStorageKey(accountId))
    return saved ? JSON.parse(saved) as Profile : null
  } catch {
    return null
  }
}

function screenForPath(path: string): AuthScreen {
  if (path === '/login') return 'login'
  if (path.startsWith('/onboarding/')) return 'onboarding'
  if (path === '/welcome') return 'welcome'
  return 'signup'
}

function PersonaLayout({ persona }: { persona: Persona }) {
  return (
    <div className="min-h-screen bg-white">
      <Header persona={persona} />
      <main className="mx-auto flex max-w-[832px] flex-col gap-6 px-6 pt-9 pb-24">
        <Outlet />
      </main>
    </div>
  )
}

function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('talshift.session'))
  const [account, setAccount] = useState<Account | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [restoring, setRestoring] = useState(() => Boolean(localStorage.getItem('talshift.session')))

  useEffect(() => {
    if (!token) {
      setRestoring(false)
      return
    }

    let cancelled = false
    getCurrentAccount(token)
      .then(({ account: currentAccount }) => {
        if (cancelled) return
        setAccount(currentAccount)
        setProfile(readProfile(currentAccount.id))
      })
      .catch(() => {
        if (cancelled) return
        localStorage.removeItem('talshift.session')
        setToken(null)
        setAccount(null)
        setProfile(null)
      })
      .finally(() => {
        if (!cancelled) setRestoring(false)
      })

    return () => { cancelled = true }
  }, [token])

  async function authenticated(session: AuthSession) {
    localStorage.setItem('talshift.session', session.token)
    setToken(session.token)
    setAccount(session.account)
    const savedProfile = readProfile(session.account.id)
    setProfile(savedProfile)
    navigate(savedProfile?.onboardingCompleted
      ? '/welcome'
      : `/onboarding/${session.account.accountType}`)
  }

  function saveProfile(profileToSave: Profile) {
    if (!account) return
    localStorage.setItem(profileStorageKey(account.id), JSON.stringify(profileToSave))
    setProfile(profileToSave)
  }

  async function signOut() {
    if (token) await logout(token).catch(() => undefined)
    localStorage.removeItem('talshift.session')
    setToken(null)
    setAccount(null)
    setProfile(null)
    navigate('/signup')
  }

  const authScreen = screenForPath(location.pathname)
  const authPage = (
    <AuthFlow
      screen={authScreen}
      account={account}
      profile={profile}
      onNavigate={navigate}
      onAuthenticated={authenticated}
      onProfileSaved={saveProfile}
      onLogout={signOut}
    />
  )
  const protectedAuthPage = restoring
    ? <main className="auth-loading" aria-live="polite">Checking your session…</main>
    : token && account
      ? authPage
      : <Navigate to="/signup" replace />

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/signup" replace />} />
      <Route path="/signup" element={authPage} />
      <Route path="/login" element={authPage} />
      <Route path="/onboarding/:accountType" element={protectedAuthPage} />
      <Route path="/welcome" element={protectedAuthPage} />
      {personas.map((persona) => {
        const firstTab = persona.tabs[0].slug
        return (
          <Route key={persona.id} path={persona.id} element={<PersonaLayout persona={persona} />}>
            <Route index element={<Navigate to={firstTab} replace />} />
            {persona.tabs.map((tab) => (
              <Route key={tab.slug} path={tab.slug} element={<tab.page />} />
            ))}
            <Route path="*" element={<Navigate to={firstTab} replace />} />
          </Route>
        )
      })}
      <Route path="*" element={<Navigate to="/signup" replace />} />
    </Routes>
  )
}

export default App
