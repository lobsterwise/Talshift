import type { ComponentType } from 'react'
import StudentNetwork from './pages/student/Network.tsx'
import StudentProfile from './pages/student/Profile.tsx'
import ProfessionalFindStudents from './pages/professional/FindStudents.tsx'
import ProfessionalProfile from './pages/professional/Profile.tsx'

// Matches the backend's account types.
export type PersonaId = 'student' | 'professional'

export interface Tab {
  slug: string
  label: string
  page: ComponentType
}

export interface Persona {
  id: PersonaId
  label: string
  tabs: Tab[]
}

// One entry per persona. The routes in App.tsx and the Header are built from this list,
// so adding a tab here adds both its URL (/persona/slug) and its link.
export const personas: Persona[] = [
  {
    id: 'student',
    label: 'Student',
    tabs: [
      { slug: 'network', label: 'Network', page: StudentNetwork },
      { slug: 'profile', label: 'Profile', page: StudentProfile },
    ],
  },
  {
    id: 'professional',
    label: 'Professional',
    tabs: [
      { slug: 'search', label: 'Find students', page: ProfessionalFindStudents },
      { slug: 'profile', label: 'My profile', page: ProfessionalProfile },
    ],
  },
]
