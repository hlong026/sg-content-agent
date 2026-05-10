import { request } from '../client'

export interface CrawlerStatus {
  online: boolean
  cookieConfigured: boolean
  stats: {
    totalContents: number
    competitorContents: number
    selfContents: number
    missingDetails: number
  }
}

export interface CrawlResult {
  crawled: number
  skipped: number
  errors: number
}

export interface CategoryTrend {
  category: string
  count: number
  avgLikes: number
  avgCollects: number
  totalComments: number
}

export interface Competitor {
  id: number
  platform: string
  account_id: string
  account_name: string | null
  account_url: string | null
  category: string | null
  notes: string | null
  is_active: number
  last_crawled_at: string | null
  created_at: string
}

export async function getCrawlerStatus(): Promise<CrawlerStatus> {
  const res = await request<{ data: CrawlerStatus }>('/api/xhs/status')
  return res.data
}

export async function getXhsCookie(): Promise<{ configured: boolean; value: string | null }> {
  const res = await request<{ data: { configured: boolean; value: string | null } }>('/api/xhs/cookie')
  return res.data
}

export async function updateXhsCookie(cookies: string): Promise<any> {
  return request('/api/xhs/cookie', {
    method: 'POST',
    body: JSON.stringify({ cookies }),
  })
}

export async function searchAndCrawl(params: {
  query: string
  num?: number
  sort?: number
  source_type?: string
  category?: string
}): Promise<CrawlResult> {
  const res = await request<{ data: CrawlResult }>('/api/xhs/search', {
    method: 'POST',
    body: JSON.stringify(params),
  })
  return res.data
}

export async function crawlNoteDetail(contentId: number): Promise<any> {
  const res = await request<{ data: any }>('/api/xhs/detail', {
    method: 'POST',
    body: JSON.stringify({ content_id: contentId }),
  })
  return res.data
}

export async function batchCrawlDetails(limit?: number): Promise<{ updated: number; errors: number }> {
  const res = await request<{ data: { updated: number; errors: number } }>('/api/xhs/batch-details', {
    method: 'POST',
    body: JSON.stringify({ limit: limit || 20 }),
  })
  return res.data
}

export async function crawlAccount(params: {
  user_url: string
  category?: string
  account_name?: string
}): Promise<CrawlResult> {
  const res = await request<{ data: CrawlResult }>('/api/xhs/account', {
    method: 'POST',
    body: JSON.stringify(params),
  })
  return res.data
}

export async function getCategoryTrends(): Promise<CategoryTrend[]> {
  const res = await request<{ data: CategoryTrend[] }>('/api/xhs/trends')
  return res.data
}

export async function getSearchKeywords(word: string): Promise<string[]> {
  const res = await request<{ data: string[] }>('/api/xhs/keywords', {
    method: 'POST',
    body: JSON.stringify({ word }),
  })
  return res.data
}

// ─── 竞品管理 ──────────────────────────────────────────

export async function listCompetitors(): Promise<Competitor[]> {
  const res = await request<{ data: Competitor[] }>('/api/xhs/competitors')
  return res.data
}

export async function addCompetitor(params: {
  account_url: string
  account_name?: string
  category?: string
  notes?: string
}): Promise<Competitor> {
  const res = await request<{ data: Competitor }>('/api/xhs/competitors', {
    method: 'POST',
    body: JSON.stringify(params),
  })
  return res.data
}

export async function deleteCompetitor(id: number): Promise<void> {
  await request(`/api/xhs/competitors/${id}`, { method: 'DELETE' })
}
