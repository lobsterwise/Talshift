import { useNavigate } from 'react-router-dom'
import { storeResumeDraft } from '../../api/studentProfile'
import ResumeUpload from '../../components/ResumeUpload'

export default function Resume() {
  const navigate = useNavigate()

  return (
    <section className="flex flex-col gap-3">
      <h1 className="text-2xl font-semibold text-gray-900">Resume</h1>
      <p className="text-sm text-gray-600">
        Upload your latest resume and we'll fill in your profile's experience, projects, education, skills, and links.
        You'll review everything before it's saved, and anything already on your profile that isn't on this resume is kept.
      </p>
      <ResumeUpload onParsed={(profile) => {
        storeResumeDraft(profile)
        navigate('/student/profile')
      }} />
    </section>
  )
}
