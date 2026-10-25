import { useEffect, useState } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import {
  getCurrentAccount,
  getProfile,
  logout,
  saveProfile as saveProfileRequest,
  type Account,
  type AuthSession,
  type Profile,
} from './api/auth.ts'
import { clearResumeDraft } from './api/studentProfile.ts'
import Header from './components/Header.tsx'
import AuthFlow from './pages/auth/AuthFlow.tsx'
import { personas, type Persona } from './personas.tsx'

type AuthScreen = 'signup' | 'login' | 'onboarding' | 'welcome'

function screenForPath(path: string): AuthScreen {
  if (path === '/login') return 'login'
  if (path.startsWith('/onboarding/')) return 'onboarding'
  if (path === '/welcome') return 'welcome'
  return 'signup'
}

function workspacePath(account: Account) {
  const persona = personas.find((item) => item.id === account.accountType)
  return `/${account.accountType}/${persona?.tabs[0].slug ?? ''}`
}

function PersonaLayout({
  persona,
  account,
  profile,
  onSignOut,
}: {
  persona: Persona
  account: Account
  profile: Profile | null
  onSignOut: () => Promise<void>
}) {
  return (
    <div className="min-h-screen bg-white">
      <Header persona={persona} account={account} profile={profile} onSignOut={onSignOut} />
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
      .then(async ({ account: currentAccount }) => {
        if (cancelled) return
        setAccount(currentAccount)
        const { profile: currentProfile } = await getProfile(token)
        if (!cancelled) setProfile(currentProfile)
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
    const { profile: savedProfile } = await getProfile(session.token)
    setProfile(savedProfile)
    navigate(savedProfile?.onboardingCompleted
      ? '/welcome'
      : `/onboarding/${session.account.accountType}`)
  }

  async function saveProfile(profileToSave: Profile) {
    if (!token) throw new Error('Your session has expired. Please sign in again.')
    const { profile: savedProfile } = await saveProfileRequest(token, profileToSave)
    setProfile(savedProfile)
  }

  async function signOut() {
    if (token) await logout(token).catch(() => undefined)
    localStorage.removeItem('talshift.session')
    clearResumeDraft()
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
  const profileDestination = account
    ? profile?.onboardingCompleted ? '/welcome' : `/onboarding/${account.accountType}`
    : '/signup'
  const protectedAuthPage = restoring
    ? <main className="auth-loading" aria-live="polite">Checking your session…</main>
    : token && account
      ? screenForPath(location.pathname) === 'welcome' && !profile?.onboardingCompleted
        ? <Navigate to={profileDestination} replace />
        : screenForPath(location.pathname) === 'onboarding' && profile?.onboardingCompleted
          ? <Navigate to="/welcome" replace />
          : location.pathname.startsWith('/onboarding/') && location.pathname !== `/onboarding/${account.accountType}`
            ? <Navigate to={`/onboarding/${account.accountType}`} replace />
            : authPage
      : <Navigate to="/signup" replace />
  const publicAuthPage = restoring
    ? <main className="auth-loading" aria-live="polite">Checking your session…</main>
    : token && account
      ? <Navigate to={profileDestination} replace />
      : authPage

  return (
    <Routes>
      <Route path="/" element={token && account ? <Navigate to={profileDestination} replace /> : <Navigate to="/signup" replace />} />
      <Route path="/signup" element={publicAuthPage} />
      <Route path="/login" element={publicAuthPage} />
      <Route path="/onboarding/:accountType" element={protectedAuthPage} />
      <Route path="/welcome" element={protectedAuthPage} />
      {personas.map((persona) => {
        const firstTab = persona.tabs[0].slug
        return (
          <Route key={persona.id} path={persona.id} element={
            restoring
              ? <main className="auth-loading" aria-live="polite">Checking your session…</main>
              : !token || !account
                ? <Navigate to="/login" replace />
                : account.accountType !== persona.id
                  ? <Navigate to={workspacePath(account)} replace />
                  : profile?.onboardingCompleted
                    ? <PersonaLayout persona={persona} account={account} profile={profile} onSignOut={signOut} />
                    : <Navigate to={`/onboarding/${account.accountType}`} replace />
          }>
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
