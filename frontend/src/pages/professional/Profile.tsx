import { useEffect, useState, type FormEvent } from 'react'
import { getProfile, saveProfile, type Profile as ProfessionalProfile } from '../../api/auth'
import { createPosting, deletePosting, getPostings, updatePosting, type ProfessionalPosting, type PostingStatus } from '../../api/postings'
import { getProfessionalAttributes, indexProfessionalSource, updateProfessionalPriority, type ProfessionalAttribute } from '../../api/professionalSearch'

export default function Profile() {
  const [profile, setProfile] = useState<ProfessionalProfile | null>(null)
  const [offerSummary, setOfferSummary] = useState('')
  const [demandSummary, setDemandSummary] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [postings, setPostings] = useState<ProfessionalPosting[] | null>(null)
  const [postingTitle, setPostingTitle] = useState('')
  const [postingDescription, setPostingDescription] = useState('')
  const [postingStatus, setPostingStatus] = useState<PostingStatus>('draft')
  const [addingPosting, setAddingPosting] = useState(true)
  const [editingPosting, setEditingPosting] = useState<ProfessionalPosting | null>(null)
  const [postingError, setPostingError] = useState('')
  const [postingSaving, setPostingSaving] = useState(false)
  const [attributes, setAttributes] = useState<ProfessionalAttribute[]>([])
  const [priorityDrafts, setPriorityDrafts] = useState<Record<string, number>>({})
  const [attributeError, setAttributeError] = useState('')
  const [prioritiesSaving, setPrioritiesSaving] = useState(false)
  const [indexingPostingId, setIndexingPostingId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const token = localStorage.getItem('rungs.session') ?? ''
    getProfile(token)
      .then(({ profile: result }) => {
        if (cancelled || !result) return
        setProfile(result)
        setOfferSummary(result.offerSummary ?? '')
        setDemandSummary(result.demandSummary ?? '')
      })
      .catch((caught: unknown) => {
        if (!cancelled) setError(caught instanceof Error ? caught.message : 'Unable to load your profile.')
      })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    getProfessionalAttributes()
      .then((result) => {
        if (cancelled) return
        setAttributes(result)
        setPriorityDrafts(Object.fromEntries(result.map((attribute) => [attribute.id, attribute.priority])))
      })
      .catch((caught: unknown) => {
        if (!cancelled) setAttributeError(caught instanceof Error ? caught.message : 'Unable to load search attributes.')
      })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    getPostings()
      .then((result) => { if (!cancelled) setPostings(result) })
      .catch((caught: unknown) => {
        if (!cancelled) setPostingError(caught instanceof Error ? caught.message : 'Unable to load your postings.')
      })
    return () => { cancelled = true }
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!profile) return
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const token = localStorage.getItem('rungs.session') ?? ''
      const result = await saveProfile(token, { ...profile, offerSummary, demandSummary })
      setProfile(result.profile)
      setSaved(true)
      try {
        await Promise.all([
          indexProfessionalSource('professional_offer'),
          indexProfessionalSource('professional_demand'),
        ])
        const refreshed = await getProfessionalAttributes()
        setAttributes(refreshed)
        setPriorityDrafts(Object.fromEntries(refreshed.map((attribute) => [attribute.id, attribute.priority])))
        setAttributeError('')
      } catch (caught) {
        setAttributeError(caught instanceof Error ? caught.message : 'Summaries saved, but search attributes could not be refreshed.')
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save your profile.')
    } finally {
      setSaving(false)
    }
  }

  async function submitPosting(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPostingSaving(true)
    setPostingError('')
    try {
      const posting = await createPosting({ title: postingTitle, description: postingDescription, status: postingStatus })
      setPostings((current) => [posting, ...(current ?? [])])
      try {
        await indexProfessionalSource('job_posting', posting.id)
        const refreshed = await getProfessionalAttributes()
        setAttributes(refreshed)
        setPriorityDrafts(Object.fromEntries(refreshed.map((attribute) => [attribute.id, attribute.priority])))
        setAttributeError('')
      } catch (caught) {
        setAttributeError(caught instanceof Error ? caught.message : 'Position saved, but search attributes could not be prepared.')
      }
      setPostingTitle('')
      setPostingDescription('')
      setPostingStatus('draft')
      setAddingPosting(false)
    } catch (caught) {
      setPostingError(caught instanceof Error ? caught.message : 'Unable to create this posting.')
    } finally {
      setPostingSaving(false)
    }
  }

  async function savePosting(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editingPosting) return
    setPostingSaving(true)
    setPostingError('')
    try {
      const updated = await updatePosting(editingPosting.id, {
        title: editingPosting.title,
        description: editingPosting.description,
        status: editingPosting.status,
      })
      setPostings((current) => (current ?? []).map((posting) => posting.id === updated.id ? updated : posting))
      try {
        await indexProfessionalSource('job_posting', updated.id)
        const refreshed = await getProfessionalAttributes()
        setAttributes(refreshed)
        setPriorityDrafts(Object.fromEntries(refreshed.map((attribute) => [attribute.id, attribute.priority])))
        setAttributeError('')
      } catch (caught) {
        setAttributeError(caught instanceof Error ? caught.message : 'Position saved, but search attributes could not be refreshed.')
      }
      setEditingPosting(null)
    } catch (caught) {
      setPostingError(caught instanceof Error ? caught.message : 'Unable to update this posting.')
    } finally {
      setPostingSaving(false)
    }
  }

  async function removePosting(id: string) {
    setPostingError('')
    try {
      await deletePosting(id)
      setPostings((current) => (current ?? []).filter((posting) => posting.id !== id))
      setAttributes((current) => current.filter((attribute) => !(attribute.source_type === 'job_posting' && attribute.source_id === id)))
      if (editingPosting?.id === id) setEditingPosting(null)
    } catch (caught) {
      setPostingError(caught instanceof Error ? caught.message : 'Unable to delete this posting.')
    }
  }

  async function refreshPostingKeywords(postingId: string) {
    setIndexingPostingId(postingId)
    setAttributeError('')
    try {
      await indexProfessionalSource('job_posting', postingId)
      const refreshed = await getProfessionalAttributes()
      setAttributes(refreshed)
      setPriorityDrafts(Object.fromEntries(refreshed.map((attribute) => [attribute.id, attribute.priority])))
    } catch (caught) {
      setAttributeError(caught instanceof Error ? caught.message : 'Unable to refresh position keywords.')
    } finally {
      setIndexingPostingId(null)
    }
  }

  async function savePriorities() {
    const changed = attributes.filter((attribute) => priorityDrafts[attribute.id] !== attribute.priority)
    if (!changed.length) return
    setPrioritiesSaving(true)
    setAttributeError('')
    try {
      const updated = await Promise.all(changed.map((attribute) => updateProfessionalPriority(attribute.id, priorityDrafts[attribute.id])))
      const priorities = new Map(updated.map((attribute) => [attribute.id, attribute.priority]))
      setAttributes((current) => current.map((attribute) => ({
        ...attribute,
        priority: priorities.get(attribute.id) ?? attribute.priority,
      })))
    } catch (caught) {
      setAttributeError(caught instanceof Error ? caught.message : 'Unable to save search priorities.')
    } finally {
      setPrioritiesSaving(false)
    }
  }

  function sourceLabel(attribute: ProfessionalAttribute) {
    if (attribute.source_type === 'professional_offer') return 'Mentor offer'
    if (attribute.source_type === 'professional_demand') return 'General hiring'
    return postings?.find((posting) => posting.id === attribute.source_id)?.title ?? 'Position'
  }

  if (error && !profile) return <p role="alert" className="text-sm text-red-700">{error}</p>
  if (!profile) return <p className="text-sm text-gray-500">Loading…</p>

  return (
    <div className="flex flex-col gap-8">
      <form className="flex flex-col gap-6" onSubmit={submit}>
        <header>
          <h1 className="text-2xl font-semibold text-gray-900">My profile</h1>
          <p className="mt-1 text-sm text-gray-600">Keep mentoring expertise and hiring needs separate so each search has the right signal.</p>
        </header>
        <section className="flex flex-col gap-3">
          <h2 className="border-b border-gray-200 pb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase">Company Information</h2>
          <label className="flex flex-col gap-1 text-sm" htmlFor="offer-summary">
            <span className="font-medium text-gray-700">What you can offer</span>
            <textarea id="offer-summary" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none" rows={5} maxLength={3000} value={offerSummary} onChange={(event) => setOfferSummary(event.target.value)} placeholder="Topics you can mentor on, experience you can share, and the kind of support you offer." />
          </label>
        </section>
        <section className="flex flex-col gap-3">
          <h2 className="border-b border-gray-200 pb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase">Hiring</h2>
          <label className="flex flex-col gap-1 text-sm" htmlFor="demand-summary">
            <span className="font-medium text-gray-700">What you look for across roles</span>
            <textarea id="demand-summary" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none" rows={5} maxLength={3000} value={demandSummary} onChange={(event) => setDemandSummary(event.target.value)} placeholder="Skills and qualities you value across positions. Add role-specific needs as separate postings." />
          </label>
        </section>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        {saved && <p role="status" className="text-sm text-green-700">Profile summaries saved.</p>}
        <button type="submit" className="self-start rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50" disabled={saving}>
          {saving ? 'Saving…' : 'Save profile'}
        </button>
      </form>

      <section className="flex flex-col gap-4">
        <header>
          <h2 className="border-b border-gray-200 pb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase">Extracted keywords</h2>
          <p className="mt-2 text-sm text-gray-600">Review how strongly each extracted keyword should affect matching.</p>
        </header>
        {attributeError && <p role="alert" className="text-sm text-red-700">{attributeError}</p>}
        {attributes.length === 0
          ? <p className="text-sm text-gray-500">Save a summary or position description to extract search keywords.</p>
          : <div className="flex flex-col gap-3">
            {attributes.map((attribute) => (
              <label key={attribute.id} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(180px,240px)_3rem] sm:items-center">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-gray-800">{attribute.name}</span>
                  <span className="block text-xs text-gray-500">{attribute.category.replace(/_/g, ' ')} · {sourceLabel(attribute)}</span>
                  {attribute.evidence && <span className="block truncate text-xs text-gray-500">{attribute.evidence}</span>}
                </span>
                <input type="range" min={0} max={100} value={priorityDrafts[attribute.id] ?? attribute.priority}
                  aria-label={`${attribute.name} priority`}
                  onChange={(event) => setPriorityDrafts((current) => ({ ...current, [attribute.id]: Number(event.target.value) }))} />
                <span className="text-sm tabular-nums text-gray-700">{priorityDrafts[attribute.id] ?? attribute.priority}</span>
              </label>
            ))}
            <button type="button" className="self-start rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50" onClick={() => void savePriorities()} disabled={prioritiesSaving || attributes.every((attribute) => priorityDrafts[attribute.id] === attribute.priority)}>
              {prioritiesSaving ? 'Saving priorities…' : 'Save priorities'}
            </button>
          </div>}
      </section>

      <section className="flex flex-col gap-4">
        <header>
          <h2 className="border-b border-gray-200 pb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase">Positions</h2>
          <p className="mt-2 text-sm text-gray-600">Post role-specific requirements separately from your general hiring needs.</p>
        </header>
        {!addingPosting && <button type="button" className="self-start rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50" onClick={() => setAddingPosting(true)}>Add position</button>}
        {addingPosting && <form className="flex flex-col gap-3 rounded-md border border-gray-200 p-4" onSubmit={submitPosting}>
          <label className="flex flex-col gap-1 text-sm" htmlFor="posting-title">
            <span className="font-medium text-gray-700">Position title</span>
            <input id="posting-title" className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-600 focus:outline-none" maxLength={120} required value={postingTitle} onChange={(event) => setPostingTitle(event.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-sm" htmlFor="posting-description">
            <span className="font-medium text-gray-700">Description</span>
            <textarea id="posting-description" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none" rows={4} maxLength={4000} required value={postingDescription} onChange={(event) => setPostingDescription(event.target.value)} />
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700" htmlFor="posting-status">
            <input id="posting-status" type="checkbox" checked={postingStatus === 'published'} onChange={(event) => setPostingStatus(event.target.checked ? 'published' : 'draft')} />
            Publish for student search
          </label>
          <button type="submit" className="self-start rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50" disabled={postingSaving}>
            {postingSaving ? 'Saving…' : 'Add position'}
          </button>
        </form>}
        {postingError && <p role="alert" className="text-sm text-red-700">{postingError}</p>}
        {postings === null
          ? <p className="text-sm text-gray-500">Loading positions…</p>
          : postings.length === 0
            ? <p className="text-sm text-gray-500">No positions yet.</p>
            : postings.map((posting) => editingPosting?.id === posting.id ? (
              <form key={posting.id} className="flex flex-col gap-3 rounded-md border border-gray-200 p-4" onSubmit={savePosting}>
                <label className="flex flex-col gap-1 text-sm" htmlFor={`edit-title-${posting.id}`}>
                  <span className="font-medium text-gray-700">Position title</span>
                  <input id={`edit-title-${posting.id}`} className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-600 focus:outline-none" maxLength={120} required value={editingPosting.title} onChange={(event) => setEditingPosting({ ...editingPosting, title: event.target.value })} />
                </label>
                <label className="flex flex-col gap-1 text-sm" htmlFor={`edit-description-${posting.id}`}>
                  <span className="font-medium text-gray-700">Description</span>
                  <textarea id={`edit-description-${posting.id}`} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none" rows={4} maxLength={4000} required value={editingPosting.description} onChange={(event) => setEditingPosting({ ...editingPosting, description: event.target.value })} />
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={editingPosting.status === 'published'} onChange={(event) => setEditingPosting({ ...editingPosting, status: event.target.checked ? 'published' : 'draft' })} />
                  Published for student search
                </label>
                <div className="flex gap-2">
                  <button type="submit" className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50" disabled={postingSaving}>{postingSaving ? 'Saving…' : 'Save changes'}</button>
                  <button type="button" className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50" onClick={() => setEditingPosting(null)}>Cancel</button>
                </div>
              </form>
            ) : (
              <article key={posting.id} className="flex flex-col gap-2 rounded-md border border-gray-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold text-gray-900">{posting.title}</h3>
                  <span className="text-xs font-medium uppercase text-gray-500">{posting.status}</span>
                </div>
                <p className="whitespace-pre-line text-sm text-gray-700">{posting.description}</p>
                <div className="flex gap-2">
                  <button type="button" className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50" onClick={() => setEditingPosting(posting)}>Edit</button>
                  <button type="button" className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50" onClick={() => void refreshPostingKeywords(posting.id)} disabled={indexingPostingId !== null}>{indexingPostingId === posting.id ? 'Refreshing…' : 'Refresh keywords'}</button>
                  <button type="button" className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50" onClick={() => void removePosting(posting.id)}>Delete</button>
                </div>
              </article>
            ))}
      </section>
    </div>
  )
}
