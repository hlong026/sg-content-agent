import router from '@/router'

export function getToken(): string {
  return localStorage.getItem('sg_token') || ''
}

export function setToken(token: string) {
  localStorage.setItem('sg_token', token)
}

export function clearToken() {
  localStorage.removeItem('sg_token')
}

export function hasToken(): boolean {
  return !!getToken()
}

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${path}`
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  }

  const token = getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(url, { ...options, headers })

  if (res.status === 204) return undefined as T

  if (res.status === 401) {
    clearToken()
    if (router.currentRoute.value.name !== 'login') {
      router.replace({ name: 'login' })
    }
    throw new Error('Unauthorized')
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`API Error ${res.status}: ${text || res.statusText}`)
  }

  return res.json()
}
