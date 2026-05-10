import { getDb } from '../../db/database'

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

export function listKnowledge(filters: {
  category?: string
  search?: string
  limit?: number
  offset?: number
}): KnowledgeItem[] {
  const db = getDb()
  const conditions: string[] = []
  const params: any[] = []

  if (filters.category) {
    conditions.push('category = ?')
    params.push(filters.category)
  }
  if (filters.search) {
    conditions.push('(title LIKE ? OR content LIKE ?)')
    params.push(`%${filters.search}%`, `%${filters.search}%`)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const limit = filters.limit || 50
  const offset = filters.offset || 0

  return db.prepare(
    `SELECT * FROM knowledge ${where} ORDER BY updated_at DESC LIMIT ? OFFSET ?`
  ).all(...params, limit, offset) as KnowledgeItem[]
}

export function getKnowledge(id: number): KnowledgeItem | undefined {
  const db = getDb()
  return db.prepare('SELECT * FROM knowledge WHERE id = ?').get(id) as KnowledgeItem | undefined
}

export function createKnowledge(data: Partial<KnowledgeItem>): KnowledgeItem {
  const db = getDb()
  const stmt = db.prepare(`
    INSERT INTO knowledge (category, title, content, tags, structured_data, source, verified)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  const result = stmt.run(
    data.category!,
    data.title!,
    data.content!,
    data.tags ? JSON.stringify(data.tags) : null,
    data.structured_data ? JSON.stringify(data.structured_data) : null,
    data.source || 'manual',
    data.verified ? 1 : 0,
  )
  return getKnowledge(result.lastInsertRowid as number)!
}

export function updateKnowledge(id: number, data: Partial<KnowledgeItem>): KnowledgeItem | undefined {
  const db = getDb()
  const fields: string[] = []
  const params: any[] = []

  const allowedFields = ['category', 'title', 'content', 'tags', 'structured_data', 'source', 'verified']
  for (const field of allowedFields) {
    if ((data as any)[field] !== undefined) {
      fields.push(`${field} = ?`)
      const val = (data as any)[field]
      params.push(typeof val === 'object' ? JSON.stringify(val) : val)
    }
  }

  if (fields.length === 0) return getKnowledge(id)

  fields.push("updated_at = datetime('now')")
  params.push(id)

  db.prepare(`UPDATE knowledge SET ${fields.join(', ')} WHERE id = ?`).run(...params)
  return getKnowledge(id)
}

export function deleteKnowledge(id: number): boolean {
  const db = getDb()
  const result = db.prepare('DELETE FROM knowledge WHERE id = ?').run(id)
  return result.changes > 0
}

export function getKnowledgeCategories(): { category: string; count: number }[] {
  const db = getDb()
  return db.prepare('SELECT category, COUNT(*) as count FROM knowledge GROUP BY category ORDER BY count DESC').all() as any[]
}

export function searchKnowledge(query: string, limit = 10): KnowledgeItem[] {
  const db = getDb()
  return db.prepare(
    `SELECT * FROM knowledge WHERE title LIKE ? OR content LIKE ? OR tags LIKE ? ORDER BY updated_at DESC LIMIT ?`
  ).all(`%${query}%`, `%${query}%`, `%${query}%`, limit) as KnowledgeItem[]
}

export function countKnowledge(): number {
  const db = getDb()
  return (db.prepare('SELECT COUNT(*) as count FROM knowledge').get() as any).count
}
