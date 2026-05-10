import { getDb } from '../../db/database'

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

export function listCompetitors(): Competitor[] {
  const db = getDb()
  return db.prepare('SELECT * FROM competitors ORDER BY created_at DESC').all() as Competitor[]
}

export function addCompetitor(data: {
  account_url: string
  account_name?: string
  account_id?: string
  category?: string
  notes?: string
}): Competitor {
  const db = getDb()
  // 从 URL 提取 account_id
  let accountId = data.account_id || ''
  if (!accountId && data.account_url) {
    const m = data.account_url.match(/profile\/([^/?]+)/)
    accountId = m ? m[1] : data.account_url
  }
  const result = db.prepare(`
    INSERT INTO competitors (platform, account_id, account_name, account_url, category, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('xiaohongshu', accountId, data.account_name || null, data.account_url, data.category || null, data.notes || null)
  return db.prepare('SELECT * FROM competitors WHERE id = ?').get(result.lastInsertRowid) as Competitor
}

export function updateCompetitor(id: number, data: Partial<Competitor>): Competitor | undefined {
  const db = getDb()
  const fields: string[] = []
  const params: any[] = []
  const allowed = ['account_name', 'category', 'notes', 'is_active', 'last_crawled_at']
  for (const f of allowed) {
    if ((data as any)[f] !== undefined) {
      fields.push(`${f} = ?`)
      params.push((data as any)[f])
    }
  }
  if (fields.length === 0) return db.prepare('SELECT * FROM competitors WHERE id = ?').get(id) as Competitor
  params.push(id)
  db.prepare(`UPDATE competitors SET ${fields.join(', ')} WHERE id = ?`).run(...params)
  return db.prepare('SELECT * FROM competitors WHERE id = ?').get(id) as Competitor
}

export function deleteCompetitor(id: number): boolean {
  const db = getDb()
  return db.prepare('DELETE FROM competitors WHERE id = ?').run(id).changes > 0
}
