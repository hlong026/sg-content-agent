import { request } from '../client'

export async function generateContent(topicId: number) {
  const res = await request<{ data: any }>('/api/generation/generate', {
    method: 'POST',
    body: JSON.stringify({ topic_id: topicId }),
  })
  return res.data
}

export async function recommendTopics(count = 10) {
  const res = await request<{ data: any[] }>('/api/generation/recommend-topics', {
    method: 'POST',
    body: JSON.stringify({ count }),
  })
  return res.data
}

export async function analyzeStyle() {
  const res = await request<{ data: any }>('/api/style/analyze', {
    method: 'POST',
  })
  return res.data
}

export async function getStyleProfile() {
  const res = await request<{ data: any }>('/api/style/profile')
  return res.data
}
