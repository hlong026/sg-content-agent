import { request } from '../client'

export interface KnowledgeItem {
  id: number
  category: string
  title: string
  content: string
  tags: string | null
  structured_data: string | null
  source: string | null
  verified: number
  created_at: string
  updated_at: string
}

export async function listKnowledge(filters?: {
  category?: string
  search?: string
  limit?: number
  offset?: number
}): Promise<KnowledgeItem[]> {
  const params = new URLSearchParams()
  if (filters) {
    Object.entries(filters).forEach(([k, v]) => { if (v !== undefined) params.set(k, String(v)) })
  }
  const query = params.toString()
  const res = await request<{ data: KnowledgeItem[] }>(`/api/knowledge${query ? `?${query}` : ''}`)
  return res.data
}

export async function getKnowledge(id: number): Promise<KnowledgeItem> {
  const res = await request<{ data: KnowledgeItem }>(`/api/knowledge/${id}`)
  return res.data
}

export async function createKnowledge(data: Partial<KnowledgeItem>): Promise<KnowledgeItem> {
  const res = await request<{ data: KnowledgeItem }>('/api/knowledge', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return res.data
}

export async function updateKnowledge(id: number, data: Partial<KnowledgeItem>): Promise<KnowledgeItem> {
  const res = await request<{ data: KnowledgeItem }>(`/api/knowledge/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  return res.data
}

export async function deleteKnowledge(id: number): Promise<void> {
  await request(`/api/knowledge/${id}`, { method: 'DELETE' })
}

export async function getKnowledgeCategories(): Promise<{ category: string; count: number }[]> {
  const res = await request<{ data: any[] }>('/api/knowledge/categories')
  return res.data
}

export async function searchKnowledge(query: string): Promise<KnowledgeItem[]> {
  const res = await request<{ data: KnowledgeItem[] }>('/api/knowledge/search', {
    method: 'POST',
    body: JSON.stringify({ q: query }),
  })
  return res.data
}
