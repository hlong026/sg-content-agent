import { request } from '../client'

export async function listPublishQueue(status?: string) {
  const params = status ? `?status=${status}` : ''
  const res = await request<{ data: any[] }>(`/api/publishing/queue${params}`)
  return res.data
}

export async function schedulePublish(contentId: number, platform: string, scheduledAt: string) {
  const res = await request<{ data: any }>('/api/publishing/schedule', {
    method: 'POST',
    body: JSON.stringify({ content_id: contentId, platform, scheduled_at: scheduledAt }),
  })
  return res.data
}

export async function markPublished(id: number, publishedUrl?: string) {
  const res = await request<{ data: any }>(`/api/publishing/${id}/published`, {
    method: 'PUT',
    body: JSON.stringify({ published_url: publishedUrl }),
  })
  return res.data
}

export async function markPublishFailed(id: number, error: string) {
  const res = await request<{ data: any }>(`/api/publishing/${id}/failed`, {
    method: 'PUT',
    body: JSON.stringify({ error }),
  })
  return res.data
}

export async function recordMetrics(contentId: number, data: any) {
  const res = await request<{ data: any }>(`/api/metrics/${contentId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return res.data
}

export async function getMetrics(contentId: number) {
  const res = await request<{ data: any[] }>(`/api/metrics/${contentId}`)
  return res.data
}

export async function getPerformance() {
  const res = await request<{ data: any }>('/api/performance')
  return res.data
}
