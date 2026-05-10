import { request } from '../client'

export interface Content {
  id: number
  platform: string
  source_type: string
  source_id: string | null
  source_name: string | null
  title: string | null
  body: string | null
  tags: string | null
  images: string | null
  category: string | null
  sub_category: string | null
  likes: number
  collects: number
  comments: number
  shares: number
  views: number
  published_at: string | null
  crawled_at: string
  content_hash: string | null
}

export interface ContentListResult {
  data: Content[]
  total: number
}

export async function listContents(filters?: {
  platform?: string
  source_type?: string
  category?: string
  limit?: number
  offset?: number
}): Promise<ContentListResult> {
  const params = new URLSearchParams()
  if (filters) {
    Object.entries(filters).forEach(([k, v]) => { if (v !== undefined) params.set(k, String(v)) })
  }
  const query = params.toString()
  const res = await request<{ data: Content[]; total: number }>(`/api/contents${query ? `?${query}` : ''}`)
  return { data: res.data, total: res.total }
}

export async function getContent(id: number): Promise<Content> {
  const res = await request<{ data: Content }>(`/api/contents/${id}`)
  return res.data
}

export async function createContent(data: Partial<Content>): Promise<Content> {
  const res = await request<{ data: Content }>('/api/contents', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return res.data
}

export async function deleteContent(id: number): Promise<void> {
  await request(`/api/contents/${id}`, { method: 'DELETE' })
}

export async function getContentStats() {
  const res = await request<{ data: any }>('/api/contents/stats')
  return res.data
}
