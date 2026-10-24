import type { ComponentType } from 'react'
import StudentOverview from './pages/student/Overview.tsx'
import StudentPlan from './pages/student/Plan.tsx'
import StudentEvents from './pages/student/Events.tsx'
import StudentNetwork from './pages/student/Network.tsx'
import StudentResume from './pages/student/Resume.tsx'
import MentorFeed from './pages/mentor/Feed.tsx'
import MentorFindStudents from './pages/mentor/FindStudents.tsx'
import MentorProfile from './pages/mentor/Profile.tsx'
import RecruiterFindStudents from './pages/recruiter/FindStudents.tsx'
import RecruiterInvites from './pages/recruiter/Invites.tsx'
import RecruiterProfile from './pages/recruiter/Profile.tsx'

export type PersonaId = 'student' | 'mentor' | 'recruiter'

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
  // Signed-in user's initials in the header; the mentor design has none.
  avatar?: { initials: string; name: string; className: string }
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
    id: 'mentor',
    label: 'Mentor',
    tabs: [
      { slug: 'feed', label: 'Project feed', page: MentorFeed },
      { slug: 'search', label: 'Find students', page: MentorFindStudents },
      { slug: 'profile', label: 'My profile', page: MentorProfile },
    ],
  },
  {
    id: 'recruiter',
    label: 'Recruiter',
    avatar: { initials: 'JC', name: 'Jamie Cole', className: 'bg-blue-50 text-blue-700' },
    tabs: [
      { slug: 'search', label: 'Find students', page: RecruiterFindStudents },
      { slug: 'invites', label: 'Invites', page: RecruiterInvites },
      { slug: 'profile', label: 'My profile', page: RecruiterProfile },
    ],
  },
]
