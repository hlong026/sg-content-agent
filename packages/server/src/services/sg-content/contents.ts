import { getDb } from '../../db/database'

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
  created_at: string
}

export function listContents(filters: {
  platform?: string
  source_type?: string
  category?: string
  limit?: number
  offset?: number
}): Content[] {
  const db = getDb()
  const conditions: string[] = []
  const params: any[] = []

  if (filters.platform) {
    conditions.push('platform = ?')
    params.push(filters.platform)
  }
  if (filters.source_type) {
    conditions.push('source_type = ?')
    params.push(filters.source_type)
  }
  if (filters.category) {
    conditions.push('category = ?')
    params.push(filters.category)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const limit = filters.limit || 50
  const offset = filters.offset || 0

  return db.prepare(
    `SELECT * FROM contents ${where} ORDER BY crawled_at DESC LIMIT ? OFFSET ?`
  ).all(...params, limit, offset) as Content[]
}

export function getContent(id: number): Content | undefined {
  const db = getDb()
  return db.prepare('SELECT * FROM contents WHERE id = ?').get(id) as Content | undefined
}

export function createContent(data: Partial<Content>): Content {
  const db = getDb()
  const stmt = db.prepare(`
    INSERT INTO contents (platform, source_type, source_id, source_name, title, body, tags, images, category, sub_category, likes, collects, comments, shares, views, published_at, content_hash)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const result = stmt.run(
    data.platform || 'xiaohongshu',
    data.source_type || 'self',
    data.source_id || null,
    data.source_name || null,
    data.title || null,
    data.body || null,
    data.tags || null,
    data.images || null,
    data.category || null,
    data.sub_category || null,
    data.likes || 0,
    data.collects || 0,
    data.comments || 0,
    data.shares || 0,
    data.views || 0,
    data.published_at || null,
    data.content_hash || null,
  )
  return getContent(result.lastInsertRowid as number)!
}

export function deleteContent(id: number): boolean {
  const db = getDb()
  const result = db.prepare('DELETE FROM contents WHERE id = ?').run(id)
  return result.changes > 0
}

export function getContentStats(): { total: number; by_platform: Record<string, number>; by_source_type: Record<string, number> } {
  const db = getDb()
  const total = (db.prepare('SELECT COUNT(*) as count FROM contents').get() as any).count
  const byPlatform = db.prepare('SELECT platform, COUNT(*) as count FROM contents GROUP BY platform').all() as any[]
  const bySourceType = db.prepare('SELECT source_type, COUNT(*) as count FROM contents GROUP BY source_type').all() as any[]

  return {
    total,
    by_platform: Object.fromEntries(byPlatform.map(r => [r.platform, r.count])),
    by_source_type: Object.fromEntries(bySourceType.map(r => [r.source_type, r.count])),
  }
}
