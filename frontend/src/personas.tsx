import type { ComponentType } from 'react'
import { Bookmark, ChartNoAxesColumn, Compass, Route, Search, UserRound, UsersRound, type LucideIcon } from 'lucide-react'
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
  icon: LucideIcon
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
      { slug: 'network', label: 'Network', icon: Compass, page: StudentNetwork },
      { slug: 'compare', label: 'Compare', icon: ChartNoAxesColumn, page: StudentPeerComparison },
      { slug: 'saved', label: 'Saved positions', icon: Bookmark, page: StudentSavedPositions },
      { slug: 'roadmap', label: 'Roadmap', icon: Route, page: StudentRoadmap },
      { slug: 'profile', label: 'Profile', icon: UserRound, page: StudentProfile },
    ],
  },
  {
    id: 'professional',
    label: 'Professional',
    tabs: [
      { slug: 'search', label: 'Find students', icon: Search, page: ProfessionalFindStudents },
      { slug: 'saved', label: 'Saved candidates', icon: UsersRound, page: ProfessionalSavedCandidates },
      { slug: 'profile', label: 'My profile', icon: UserRound, page: ProfessionalProfile },
    ],
  },
]
