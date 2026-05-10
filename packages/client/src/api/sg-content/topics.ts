import { request } from '../client'

export interface Topic {
  id: number
  title: string
  category: string | null
  sub_category: string | null
  description: string | null
  score: number | null
  score_detail: string | null
  source: string
  source_ref: string | null
  status: string
  scheduled_date: string | null
  scheduled_time: string | null
  platform: string
  content_id: number | null
  created_at: string
  updated_at: string
}

export async function listTopics(filters?: {
  status?: string
  category?: string
  scheduled_date?: string
  limit?: number
  offset?: number
}): Promise<Topic[]> {
  const params = new URLSearchParams()
  if (filters) {
    Object.entries(filters).forEach(([k, v]) => { if (v !== undefined) params.set(k, String(v)) })
  }
  const query = params.toString()
  const res = await request<{ data: Topic[] }>(`/api/topics${query ? `?${query}` : ''}`)
  return res.data
}

export async function getTopic(id: number): Promise<Topic> {
  const res = await request<{ data: Topic }>(`/api/topics/${id}`)
  return res.data
}

export async function createTopic(data: Partial<Topic>): Promise<Topic> {
  const res = await request<{ data: Topic }>('/api/topics', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return res.data
}

export async function updateTopic(id: number, data: Partial<Topic>): Promise<Topic> {
  const res = await request<{ data: Topic }>(`/api/topics/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  return res.data
}

export async function deleteTopic(id: number): Promise<void> {
  await request(`/api/topics/${id}`, { method: 'DELETE' })
}

export async function getTopicsCalendar(start: string, end: string): Promise<Topic[]> {
  const res = await request<{ data: Topic[] }>(`/api/topics/calendar?start=${start}&end=${end}`)
  return res.data
}
