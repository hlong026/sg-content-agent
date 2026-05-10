import { getDb } from '../../db/database'

export interface GeneratedContent {
  id: number
  topic_id: number | null
  title_candidates: any
  selected_title: string | null
  body: string | null
  tags: any
  cover_image_urls: any
  selected_cover_url: string | null
  prompt_used: string | null
  knowledge_refs: any
  reference_contents: any
  style_profile_id: number | null
  quality_score: number | null
  quality_detail: any
  quality_feedback: string | null
  status: string
  review_note: string | null
  platform: string
  published_url: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}

export function listGeneratedContents(filters: {
  status?: string
  topic_id?: number
  limit?: number
  offset?: number
}): GeneratedContent[] {
  const db = getDb()
  const conditions: string[] = []
  const params: any[] = []

  if (filters.status) {
    conditions.push('status = ?')
    params.push(filters.status)
  }
  if (filters.topic_id) {
    conditions.push('topic_id = ?')
    params.push(filters.topic_id)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const limit = filters.limit || 50
  const offset = filters.offset || 0

  return db.prepare(
    `SELECT * FROM generated_contents ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
  ).all(...params, limit, offset) as GeneratedContent[]
}

export function getGeneratedContent(id: number): GeneratedContent | undefined {
  const db = getDb()
  return db.prepare('SELECT * FROM generated_contents WHERE id = ?').get(id) as GeneratedContent | undefined
}

function safeJsonify(val: any): string | null {
  if (val === null || val === undefined) return null
  if (typeof val === 'string') return val
  return JSON.stringify(val)
}

export function createGeneratedContent(data: Partial<GeneratedContent>): GeneratedContent {
  const db = getDb()
  const stmt = db.prepare(`
    INSERT INTO generated_contents (topic_id, title_candidates, selected_title, body, tags, cover_image_urls, prompt_used, knowledge_refs, reference_contents, style_profile_id, quality_score, quality_detail, quality_feedback, status, platform)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const result = stmt.run(
    data.topic_id || null,
    safeJsonify(data.title_candidates),
    data.selected_title || null,
    data.body || null,
    safeJsonify(data.tags),
    safeJsonify(data.cover_image_urls),
    data.prompt_used || null,
    safeJsonify(data.knowledge_refs),
    safeJsonify(data.reference_contents),
    data.style_profile_id || null,
    data.quality_score || null,
    safeJsonify(data.quality_detail),
    data.quality_feedback || null,
    data.status || 'draft',
    data.platform || 'xiaohongshu',
  )
  return getGeneratedContent(result.lastInsertRowid as number)!
}

export function updateGeneratedContent(id: number, data: Partial<GeneratedContent>): GeneratedContent | undefined {
  const db = getDb()
  const fields: string[] = []
  const params: any[] = []

  const allowedFields = ['selected_title', 'body', 'tags', 'selected_cover_url', 'quality_score', 'quality_detail', 'quality_feedback', 'status', 'review_note', 'published_url', 'published_at']
  for (const field of allowedFields) {
    if ((data as any)[field] !== undefined) {
      fields.push(`${field} = ?`)
      const val = (data as any)[field]
      params.push(typeof val === 'object' ? JSON.stringify(val) : val)
    }
  }

  if (fields.length === 0) return getGeneratedContent(id)

  fields.push("updated_at = datetime('now')")
  params.push(id)

  db.prepare(`UPDATE generated_contents SET ${fields.join(', ')} WHERE id = ?`).run(...params)
  return getGeneratedContent(id)
}

export function deleteGeneratedContent(id: number): boolean {
  const db = getDb()
  const result = db.prepare('DELETE FROM generated_contents WHERE id = ?').run(id)
  return result.changes > 0
}
