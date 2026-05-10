import { getDb } from '../../db/database'

/** 读取持久化配置 */
export function getConfig(key: string): string | null {
  const db = getDb()
  const row = db.prepare('SELECT value FROM crawler_config WHERE key = ?').get(key) as { value: string } | undefined
  return row?.value || null
}

/** 写入持久化配置 */
export function setConfig(key: string, value: string): void {
  const db = getDb()
  db.prepare(`
    INSERT INTO crawler_config (key, value, updated_at) VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
  `).run(key, value)
}
