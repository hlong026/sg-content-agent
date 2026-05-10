import { request } from '../client'

export interface DashboardStats {
  contents_total: number
  contents_self: number
  contents_competitor: number
  topics_total: number
  topics_approved: number
  topics_completed: number
  generated_total: number
  generated_approved: number
  generated_published: number
  knowledge_total: number
  avg_quality_score: number | null
  published_this_week: number
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await request<{ data: DashboardStats }>('/api/dashboard/stats')
  return res.data
}

export async function getRecentContents() {
  const res = await request<{ data: any[] }>('/api/dashboard/recent-contents')
  return res.data
}

export async function getPendingReview() {
  const res = await request<{ data: any[] }>('/api/dashboard/pending-review')
  return res.data
}

export async function getTopTopics() {
  const res = await request<{ data: any[] }>('/api/dashboard/top-topics')
  return res.data
}

export async function getTodaySchedule() {
  const res = await request<{ data: any[] }>('/api/dashboard/today-schedule')
  return res.data
}
