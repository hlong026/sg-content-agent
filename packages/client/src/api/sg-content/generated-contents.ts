import { request } from '../client'

export interface GeneratedContent {
  id: number
  topic_id: number | null
  title_candidates: string | null
  selected_title: string | null
  body: string | null
  tags: string | null
  cover_image_urls: string | null
  selected_cover_url: string | null
  prompt_used: string | null
  knowledge_refs: string | null
  reference_contents: string | null
  style_profile_id: number | null
  quality_score: number | null
  quality_detail: string | null
  quality_feedback: string | null
  status: string
  review_note: string | null
  platform: string
  published_url: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}

export async function listGeneratedContents(filters?: {
  status?: string
  topic_id?: number
  limit?: number
  offset?: number
}): Promise<GeneratedContent[]> {
  const params = new URLSearchParams()
  if (filters) {
    Object.entries(filters).forEach(([k, v]) => { if (v !== undefined) params.set(k, String(v)) })
  }
  const query = params.toString()
  const res = await request<{ data: GeneratedContent[] }>(`/api/generated-contents${query ? `?${query}` : ''}`)
  return res.data
}

export async function getGeneratedContent(id: number): Promise<GeneratedContent> {
  const res = await request<{ data: GeneratedContent }>(`/api/generated-contents/${id}`)
  return res.data
}

export async function createGeneratedContent(data: Partial<GeneratedContent>): Promise<GeneratedContent> {
  const res = await request<{ data: GeneratedContent }>('/api/generated-contents', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return res.data
}

export async function updateGeneratedContent(id: number, data: Partial<GeneratedContent>): Promise<GeneratedContent> {
  const res = await request<{ data: GeneratedContent }>(`/api/generated-contents/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  return res.data
}

export async function approveContent(id: number): Promise<GeneratedContent> {
  const res = await request<{ data: GeneratedContent }>(`/api/generated-contents/${id}/approve`, {
    method: 'PUT',
  })
  return res.data
}

export async function rejectContent(id: number, note?: string): Promise<GeneratedContent> {
  const res = await request<{ data: GeneratedContent }>(`/api/generated-contents/${id}/reject`, {
    method: 'PUT',
    body: JSON.stringify({ note }),
  })
  return res.data
}

export async function deleteGeneratedContent(id: number): Promise<void> {
  await request(`/api/generated-contents/${id}`, { method: 'DELETE' })
}
