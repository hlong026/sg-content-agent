import { getDb } from '../../db/database'

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

export function listTopics(filters: {
  status?: string
  category?: string
  scheduled_date?: string
  limit?: number
  offset?: number
}): Topic[] {
  const db = getDb()
  const conditions: string[] = []
  const params: any[] = []

  if (filters.status) {
    conditions.push('status = ?')
    params.push(filters.status)
  }
  if (filters.category) {
    conditions.push('category = ?')
    params.push(filters.category)
  }
  if (filters.scheduled_date) {
    conditions.push('scheduled_date = ?')
    params.push(filters.scheduled_date)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const limit = filters.limit || 50
  const offset = filters.offset || 0

  return db.prepare(
    `SELECT * FROM topics ${where} ORDER BY score DESC NULLS LAST, created_at DESC LIMIT ? OFFSET ?`
  ).all(...params, limit, offset) as Topic[]
}

export function getTopic(id: number): Topic | undefined {
  const db = getDb()
  return db.prepare('SELECT * FROM topics WHERE id = ?').get(id) as Topic | undefined
}

export function createTopic(data: Partial<Topic>): Topic {
  const db = getDb()
  const stmt = db.prepare(`
    INSERT INTO topics (title, category, sub_category, description, score, score_detail, source, source_ref, status, scheduled_date, scheduled_time, platform)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const result = stmt.run(
    data.title,
    data.category || null,
    data.sub_category || null,
    data.description || null,
    data.score || null,
    data.score_detail ? JSON.stringify(data.score_detail) : null,
    data.source || 'manual',
    data.source_ref ? JSON.stringify(data.source_ref) : null,
    data.status || 'draft',
    data.scheduled_date || null,
    data.scheduled_time || null,
    data.platform || 'xiaohongshu',
  )
  return getTopic(result.lastInsertRowid as number)!
}

export function updateTopic(id: number, data: Partial<Topic>): Topic | undefined {
  const db = getDb()
  const fields: string[] = []
  const params: any[] = []

  const allowedFields = ['title', 'category', 'sub_category', 'description', 'score', 'score_detail', 'source', 'source_ref', 'status', 'scheduled_date', 'scheduled_time', 'platform', 'content_id']
  for (const field of allowedFields) {
    if ((data as any)[field] !== undefined) {
      fields.push(`${field} = ?`)
      params.push(field === 'score_detail' || field === 'source_ref'
        ? JSON.stringify((data as any)[field])
        : (data as any)[field])
    }
  }

  if (fields.length === 0) return getTopic(id)

  fields.push("updated_at = datetime('now')")
  params.push(id)

  db.prepare(`UPDATE topics SET ${fields.join(', ')} WHERE id = ?`).run(...params)
  return getTopic(id)
}

export function deleteTopic(id: number): boolean {
  const db = getDb()
  const result = db.prepare('DELETE FROM topics WHERE id = ?').run(id)
  return result.changes > 0
}

export function getTopicsCalendar(weekStart: string, weekEnd: string): Topic[] {
  const db = getDb()
  return db.prepare(
    `SELECT * FROM topics WHERE scheduled_date BETWEEN ? AND ? ORDER BY scheduled_date, scheduled_time`
  ).all(weekStart, weekEnd) as Topic[]
}
