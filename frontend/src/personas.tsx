import type { ComponentType } from 'react'
import StudentNetwork from './pages/student/Network.tsx'
import StudentPeerComparison from './pages/student/PeerComparison.tsx'
import StudentRoadmap from './pages/student/Roadmap.tsx'
import StudentProfile from './pages/student/Profile.tsx'
import ProfessionalFindStudents from './pages/professional/FindStudents.tsx'
import StudentSavedPositions from './pages/student/SavedPositions.tsx'
import ProfessionalSavedCandidates from './pages/professional/SavedCandidates.tsx'
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
      { slug: 'compare', label: 'Compare', page: StudentPeerComparison },
      { slug: 'saved', label: 'Saved positions', page: StudentSavedPositions },
      { slug: 'roadmap', label: 'Roadmap', page: StudentRoadmap },
      { slug: 'profile', label: 'Profile', page: StudentProfile },
    ],
  },
  {
    id: 'professional',
    label: 'Professional',
    tabs: [
      { slug: 'search', label: 'Find students', page: ProfessionalFindStudents },
      { slug: 'saved', label: 'Saved candidates', page: ProfessionalSavedCandidates },
      { slug: 'profile', label: 'My profile', page: ProfessionalProfile },
    ],
  },
]
