export type AccountType = 'student' | 'professional'

export interface Account {
  id: string
  email: string
  accountType: AccountType
  createdAt: string
}

export interface AuthSession {
  token: string
  expiresAt: string
  account: Account
}

export interface Profile {
  fullName: string
  interests: string[]
  onboardingCompleted: boolean
  institution?: string
  fieldOfStudy?: string
  graduationYear?: number
  jobTitle?: string
  organization?: string
  professionalFocus?: string
  yearsExperience?: number
}

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(`/api/auth${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (!response.ok) {
    const result = await response.json().catch(() => null) as { error?: string } | null
    throw new Error(result?.error ?? 'Something went wrong. Please try again.')
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export function register(email: string, password: string, accountType: AccountType) {
  return request<AuthSession>('/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, accountType }),
  })
}

export function login(email: string, password: string) {
  return request<AuthSession>('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function getCurrentAccount(token: string) {
  return request<{ account: Account }>('/me', {}, token)
}

export function logout(token: string) {
  return request<void>('/logout', { method: 'POST' }, token)
}