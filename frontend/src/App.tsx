import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import Header from './components/Header.tsx'
import { personas, type Persona } from './personas.tsx'

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
  return (
    <Routes>
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
      <Route path="*" element={<Navigate to="/student/overview" replace />} />
    </Routes>
  )
}

export default App
