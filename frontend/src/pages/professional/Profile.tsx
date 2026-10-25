import { useEffect, useState, type FormEvent } from 'react'
import { getProfile, saveProfile, type Profile as ProfessionalProfile } from '../../api/auth'
import { createPosting, deletePosting, getPostings, updatePosting, type ProfessionalPosting, type PostingStatus } from '../../api/postings'
import { getProfessionalAttributes, indexProfessionalSource, updateProfessionalPriority, type ProfessionalAttribute } from '../../api/professionalSearch'
import {
  Briefcase, Building2, ClipboardList, FilePen, Globe, Pencil, Plus, RefreshCw, Save, SlidersHorizontal, Tags, Trash2, UserRound, X,
} from 'lucide-react'
import EmptyState from '../../components/ui/EmptyState'
import PageHeading from '../../components/ui/PageHeading'
import SectionTitle from '../../components/ui/SectionTitle'
import StatusText from '../../components/ui/StatusText'

const buttonClass = 'inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50'
const primaryClass = 'inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50'

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

  if (error && !profile) return <StatusText tone="error">{error}</StatusText>
  if (!profile) return <StatusText tone="loading">Loading…</StatusText>

  return (
    <div className="flex flex-col gap-8">
      <form className="flex flex-col gap-6" onSubmit={submit}>
        <PageHeading icon={UserRound} title="My profile">
          <p className="mt-1 text-sm text-gray-600">Keep mentoring expertise and hiring needs separate so each search has the right signal.</p>
        </PageHeading>
        <section className="flex flex-col gap-3">
          <SectionTitle icon={Building2}>Company Information</SectionTitle>
          <label className="flex flex-col gap-1 text-sm" htmlFor="offer-summary">
            <span className="font-medium text-gray-700">What you can offer</span>
            <textarea id="offer-summary" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none" rows={5} maxLength={3000} value={offerSummary} onChange={(event) => setOfferSummary(event.target.value)} placeholder="Topics you can mentor on, experience you can share, and the kind of support you offer." />
          </label>
        </section>
        <section className="flex flex-col gap-3">
          <SectionTitle icon={Briefcase}>Hiring</SectionTitle>
          <label className="flex flex-col gap-1 text-sm" htmlFor="demand-summary">
            <span className="font-medium text-gray-700">What you look for across roles</span>
            <textarea id="demand-summary" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none" rows={5} maxLength={3000} value={demandSummary} onChange={(event) => setDemandSummary(event.target.value)} placeholder="Skills and qualities you value across positions. Add role-specific needs as separate postings." />
          </label>
        </section>
        {error && <StatusText tone="error">{error}</StatusText>}
        {saved && <StatusText tone="success">Profile summaries saved.</StatusText>}
        <button type="submit" className={`${primaryClass} self-start`} disabled={saving}>
          <Save aria-hidden="true" className="size-4" />
          {saving ? 'Saving…' : 'Save profile'}
        </button>
      </form>

      <section className="flex flex-col gap-4">
        <header>
          <SectionTitle icon={Tags}>Extracted keywords</SectionTitle>
          <p className="mt-2 text-sm text-gray-600">Review how strongly each extracted keyword should affect matching.</p>
        </header>
        {attributeError && <StatusText tone="error">{attributeError}</StatusText>}
        {attributes.length === 0
          ? <EmptyState icon={Tags} compact>Save a summary or position description to extract search keywords.</EmptyState>
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
            <button type="button" className={`${buttonClass} self-start`} onClick={() => void savePriorities()} disabled={prioritiesSaving || attributes.every((attribute) => priorityDrafts[attribute.id] === attribute.priority)}>
              <SlidersHorizontal aria-hidden="true" className="size-4" />
              {prioritiesSaving ? 'Saving priorities…' : 'Save priorities'}
            </button>
          </div>}
      </section>

      <section className="flex flex-col gap-4">
        <header>
          <SectionTitle icon={ClipboardList}>Positions</SectionTitle>
          <p className="mt-2 text-sm text-gray-600">Post role-specific requirements separately from your general hiring needs.</p>
        </header>
        {!addingPosting && (
          <button type="button" className={`${buttonClass} self-start`} onClick={() => setAddingPosting(true)}>
            <Plus aria-hidden="true" className="size-4" />
            Add position
          </button>
        )}
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
          <button type="submit" className={`${primaryClass} self-start`} disabled={postingSaving}>
            <Plus aria-hidden="true" className="size-4" />
            {postingSaving ? 'Saving…' : 'Add position'}
          </button>
        </form>}
        {postingError && <StatusText tone="error">{postingError}</StatusText>}
        {postings === null
          ? <StatusText tone="loading">Loading positions…</StatusText>
          : postings.length === 0
            ? <EmptyState icon={ClipboardList} title="No positions yet">Add a position so students can find it and you can search against it.</EmptyState>
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
                  <button type="submit" className={primaryClass} disabled={postingSaving}>
                    <Save aria-hidden="true" className="size-4" />
                    {postingSaving ? 'Saving…' : 'Save changes'}
                  </button>
                  <button type="button" className={buttonClass} onClick={() => setEditingPosting(null)}>
                    <X aria-hidden="true" className="size-4" />
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <article key={posting.id} className="flex flex-col gap-2 rounded-md border border-gray-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold text-gray-900">{posting.title}</h3>
                  {posting.status === 'published'
                    ? <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-medium text-green-800"><Globe aria-hidden="true" className="size-3" />Published</span>
                    : <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600"><FilePen aria-hidden="true" className="size-3" />Draft</span>}
                </div>
                <p className="whitespace-pre-line text-sm text-gray-700">{posting.description}</p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={buttonClass} onClick={() => setEditingPosting(posting)}>
                    <Pencil aria-hidden="true" className="size-4" />
                    Edit
                  </button>
                  <button type="button" className={buttonClass} onClick={() => void refreshPostingKeywords(posting.id)} disabled={indexingPostingId !== null}>
                    <RefreshCw aria-hidden="true" className={`size-4 ${indexingPostingId === posting.id ? 'animate-spin' : ''}`} />
                    {indexingPostingId === posting.id ? 'Refreshing…' : 'Refresh keywords'}
                  </button>
                  <button type="button" className={`${buttonClass} hover:border-red-200 hover:bg-red-50 hover:text-red-700`} onClick={() => void removePosting(posting.id)}>
                    <Trash2 aria-hidden="true" className="size-4" />
                    Delete
                  </button>
                </div>
              </article>
            ))}
      </section>
    </div>
  )
}
