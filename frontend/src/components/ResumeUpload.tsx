import { useRef, useState, type DragEvent } from 'react'
import { FileCheck2, FileUp, LoaderCircle } from 'lucide-react'
import StatusText from './ui/StatusText'
import { maxResumeBytes, parseResume, type StudentProfile } from '../api/studentProfile'

// A drop zone that reads a PDF resume into a profile draft. Used during
// onboarding and on the Resume tab.
export default function ResumeUpload({ onParsed, onParsingChange }: {
  onParsed: (profile: StudentProfile, fileName: string) => void
  onParsingChange?: (parsing: boolean) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [parsing, setParsing] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')
  const [parsedName, setParsedName] = useState('')

  async function upload(file: File | undefined) {
    if (!file || parsing) return
    setError('')
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Upload your resume as a PDF file.')
      return
    }
    if (file.size > maxResumeBytes) {
      setError('Your resume must be 5 MB or smaller.')
      return
    }

    setParsing(true)
    onParsingChange?.(true)
    try {
      const profile = await parseResume(file)
      setParsedName(file.name)
      onParsed(profile, file.name)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to read your resume. Please try again.')
    } finally {
      setParsing(false)
      onParsingChange?.(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function drop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    void upload(event.dataTransfer.files[0])
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        onDragOver={(event) => { event.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={drop}
        className={`flex flex-col items-center gap-2 rounded-md border-2 border-dashed px-4 py-6 text-center text-sm ${
          dragging ? 'border-blue-600 bg-blue-50' : 'border-gray-300'
        }`}
      >
        {parsing ? (
          <>
            <LoaderCircle aria-hidden="true" className="size-6 animate-spin text-blue-600" />
            <p role="status" className="text-gray-700">Reading your resume… this can take up to a minute.</p>
          </>
        ) : (
          <>
            <span aria-hidden="true" className={`flex size-10 items-center justify-center rounded-full ${parsedName ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-600'}`}>
              {parsedName ? <FileCheck2 className="size-5" strokeWidth={1.75} /> : <FileUp className="size-5" strokeWidth={1.75} />}
            </span>
            <p className="text-gray-700">
              {parsedName ? <>Read <strong>{parsedName}</strong>. Drop another PDF to replace it.</> : 'Drag a PDF resume here, or'}
            </p>
            <button type="button" onClick={() => inputRef.current?.click()}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50">
              {parsedName ? 'Choose a different file' : 'Choose a PDF'}
            </button>
            <p className="text-xs text-gray-500">PDF, up to 5 MB. The file itself isn't stored.</p>
          </>
        )}
        <input ref={inputRef} type="file" accept="application/pdf,.pdf" hidden
          onChange={(event) => void upload(event.target.files?.[0])} />
      </div>
      {error && <StatusText tone="error">{error}</StatusText>}
    </div>
  )
}
