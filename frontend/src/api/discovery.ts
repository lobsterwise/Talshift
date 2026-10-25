async function request<T>(options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('talshift.session')
  if (!token) throw new Error('Your session has expired. Please sign in again.')
  const response = await fetch('/api/discovery/settings', {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })
  if (!response.ok) {
    const result = await response.json().catch(() => null) as { error?: string } | null
    throw new Error(result?.error ?? 'Unable to update search visibility.')
  }
  return response.json() as Promise<T>
}

export async function getDiscoverability() {
  return (await request<{ discoverable: boolean }>()).discoverable
}

export async function setDiscoverability(discoverable: boolean) {
  return (await request<{ discoverable: boolean }>({
    method: 'PUT',
    body: JSON.stringify({ discoverable }),
  })).discoverable
}