import type { ComponentType } from 'react'
import StudentOverview from './pages/student/Overview.tsx'
import StudentPlan from './pages/student/Plan.tsx'
import StudentEvents from './pages/student/Events.tsx'
import StudentNetwork from './pages/student/Network.tsx'
import StudentResume from './pages/student/Resume.tsx'
import ProfessionalFeed from './pages/professional/Feed.tsx'
import ProfessionalFindStudents from './pages/professional/FindStudents.tsx'
import ProfessionalInvites from './pages/professional/Invites.tsx'
import ProfessionalProfile from './pages/professional/Profile.tsx'

// Matches the backend's account types.
export type PersonaId = 'student' | 'professional'

export interface Tab {
  slug: string
  label: string
  // Count shown next to the label while the tab isn't selected.
  badge?: number
  page: ComponentType
}

export interface Persona {
  id: PersonaId
  label: string
  tabs: Tab[]
  // Signed-in user's initials in the header.
  avatar: { initials: string; name: string; className: string }
}

// One entry per persona. The routes in App.tsx and the Header are built from this list,
// so adding a tab here adds both its URL (/persona/slug) and its link.
export const personas: Persona[] = [
  {
    id: 'student',
    label: 'Student',
    avatar: { initials: 'SO', name: 'Sam Okafor', className: 'bg-blue-600 text-white' },
    tabs: [
      { slug: 'overview', label: 'Overview', page: StudentOverview },
      { slug: 'plan', label: 'Plan', page: StudentPlan },
      { slug: 'events', label: 'Events', badge: 4, page: StudentEvents },
      { slug: 'network', label: 'Network', badge: 2, page: StudentNetwork },
      { slug: 'resume', label: 'Resume', page: StudentResume },
    ],
  },
  {
    id: 'professional',
    label: 'Professional',
    avatar: { initials: 'RM', name: 'Rina Matsuda', className: 'bg-blue-50 text-blue-700' },
    tabs: [
      { slug: 'feed', label: 'Project feed', page: ProfessionalFeed },
      { slug: 'search', label: 'Find students', page: ProfessionalFindStudents },
      { slug: 'invites', label: 'Invites', page: ProfessionalInvites },
      { slug: 'profile', label: 'My profile', page: ProfessionalProfile },
    ],
  },
]
