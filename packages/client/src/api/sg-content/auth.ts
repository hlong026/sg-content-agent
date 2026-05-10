import { request, setToken } from '../client'

export async function login(password: string): Promise<{ token: string }> {
  const res = await request<{ token: string }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ password }),
  })
  if (res.token) {
    setToken(res.token)
  }
  return res
}

export async function verifyToken(): Promise<{ valid: boolean }> {
  return request('/api/auth/verify')
}
