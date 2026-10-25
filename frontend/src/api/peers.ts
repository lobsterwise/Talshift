export interface PeerSummary {
  id: string
  name: string
  headline: string
  institution: string
  // Skill-attribute overlap with you (0–1); null when either of you has no skill rankings yet.
  similarity: number | null
}

// 0 no evidence · 1 minimal · 2 developing · 3 strong · 4 exceptional
export type EvidenceLevel = 0 | 1 | 2 | 3 | 4

export interface Assessment {
  level: EvidenceLevel
  // The specific job, project or course that shows this level.
  evidence: string
}

export type Leader = 'you' | 'peer' | 'tie'

export interface PeerConnection {
  id: string
  status: 'pending' | 'accepted' | 'declined'
  direction: 'incoming' | 'outgoing'
}

export interface PeerComparison {
  you: { id: string; name: string; headline: string }
  peer: { id: string; name: string; headline: string; institution: string }
  connection: PeerConnection | null
}

export interface PeerAnalysis {
  targetRole: string
  dimensions: { key: string; label: string; you: Assessment; peer: Assessment; leader: Leader }[]
  peerEdges: { area: string; detail: string }[]
  yourEdges: { area: string; detail: string }[]
  growth: { skill: string; why: string; concepts: string[]; apply: string }[]
  teamUp: { title: string; description: string; youBring: string; peerBrings: string }
}

export interface TeamUpRequest {
  id: string
  direction: 'incoming' | 'outgoing'
  status: 'pending' | 'accepted'
  message: string
  // email is present only once both students have accepted.
  peer: { id: string; name: string; headline: string; email?: string }
  updatedAt: string
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('rungs.session')
  if (!token) throw new Error('Your session has expired. Please sign in again.')
  const response = await fetch(`/api/student/peers${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    const result = await response.json().catch(() => null) as { error?: string } | null
    throw new Error(result?.error ?? 'Something went wrong. Please try again.')
  }
  return response.json() as Promise<T>
}

export async function getPeers(query = '') {
  const params = new URLSearchParams(query.trim() ? { query: query.trim() } : {})
  return request<{ items: PeerSummary[]; message?: string }>(`/?${params}`)
}

export async function comparePeer(peerId: string) {
  return request<PeerComparison>(`/compare/${encodeURIComponent(peerId)}`)
}

export async function getPeerAnalysis(peerId: string) {
  return (await request<{ analysis: PeerAnalysis }>(`/compare/${encodeURIComponent(peerId)}/analysis`, { method: 'POST' })).analysis
}

export async function getTeamUpRequests() {
  return (await request<{ items: TeamUpRequest[] }>('/connections')).items
}

export async function requestTeamUp(peerId: string, message: string) {
  return (await request<{ connection: PeerConnection }>('/connections', {
    method: 'POST',
    body: JSON.stringify({ peerId, message }),
  })).connection
}

export async function respondToTeamUp(connectionId: string, action: 'accept' | 'decline') {
  return request<{ id: string; status: 'accepted' | 'declined' }>(`/connections/${encodeURIComponent(connectionId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ action }),
  })
}
