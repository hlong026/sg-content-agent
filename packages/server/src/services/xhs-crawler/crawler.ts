/**
 * 爬虫管理服务
 * 调用 Spider_XHS 采集数据 → 解析 → 写入 sg-content-agent 数据库
 */
import { getDb } from '../../db/database'
import { logger } from '../logger'
import * as xhs from './client'
import { createContent, type Content } from '../sg-content/contents'

// ─── 搜索关键词采集 ──────────────────────────────────────

export async function crawlByKeyword(params: {
  query: string
  num?: number
  sort?: 0 | 1 | 2 | 3 | 4
  sourceType?: 'competitor' | 'self'
  category?: string
}): Promise<{ crawled: number; skipped: number; errors: number }> {
  const { query, num = 20, sort = 2, sourceType = 'competitor', category } = params
  logger.info(`开始爬取关键词: "${query}", 数量=${num}, 排序=${sort}`)

  const notes = await xhs.searchNotes(query, num, sort)
  let crawled = 0
  let skipped = 0
  let errors = 0

  const db = getDb()

  for (const note of notes) {
    try {
      // 检查是否已采集（通过 source_id 去重）
      const existing = db.prepare('SELECT id FROM contents WHERE source_id = ?').get(note.note_id)
      if (existing) {
        skipped++
        continue
      }

      // 解析互动数据（Spider_XHS 返回的是字符串）
      const likes = parseInt(String(note.likes)) || 0
      const collects = parseInt(String(note.collects)) || 0
      const comments = parseInt(String(note.comments)) || 0

      // 提取标签
      const tags = note.tag_list?.map((t: any) => t.name).filter(Boolean) || []

      createContent({
        platform: 'xiaohongshu',
        source_type: sourceType,
        source_id: note.note_id,
        source_name: note.user_name,
        title: note.title,
        body: null, // 搜索结果没有正文，需要单独获取详情
        tags: JSON.stringify(tags),
        images: note.cover_url ? JSON.stringify([note.cover_url]) : null,
        category: category || null,
        likes,
        collects,
        comments,
        views: 0,
      } as any)

      crawled++
      logger.info(`已采集: [${note.user_name}] ${note.title} (👍${likes})`)
    } catch (err: any) {
      errors++
      logger.warn(`采集失败: ${note.note_id} - ${err.message}`)
    }
  }

  logger.info(`爬取完成: 成功=${crawled}, 跳过=${skipped}, 失败=${errors}`)
  return { crawled, skipped, errors }
}

// ─── 采集笔记详情 ────────────────────────────────────────

export async function crawlNoteDetail(contentId: number): Promise<Content | null> {
  const db = getDb()
  const content = db.prepare('SELECT * FROM contents WHERE id = ?').get(contentId) as Content | undefined
  if (!content || !content.source_id) {
    throw new Error(`内容 ${contentId} 不存在或没有 source_id`)
  }

  const noteUrl = `https://www.xiaohongshu.com/explore/${content.source_id}`
  logger.info(`获取笔记详情: ${noteUrl}`)

  const detail = await xhs.getNoteDetail(noteUrl)

  // 更新数据库
  db.prepare(`
    UPDATE contents SET
      body = ?,
      tags = ?,
      images = ?,
      likes = ?,
      collects = ?,
      comments = ?,
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    detail.desc,
    JSON.stringify(detail.tags),
    JSON.stringify(detail.images),
    parseInt(String(detail.likes)) || 0,
    parseInt(String(detail.collects)) || 0,
    parseInt(String(detail.comments_count)) || 0,
    contentId,
  )

  logger.info(`笔记详情已更新: id=${contentId}, 正文长度=${detail.desc?.length || 0}`)
  return db.prepare('SELECT * FROM contents WHERE id = ?').get(contentId) as Content
}

// ─── 批量采集详情（补充已采集但无正文的内容）──────────────

export async function crawlMissingDetails(limit = 20): Promise<{ updated: number; errors: number }> {
  const db = getDb()
  const contents = db.prepare(
    `SELECT id, source_id FROM contents WHERE body IS NULL AND source_id IS NOT NULL LIMIT ?`
  ).all(limit) as { id: number; source_id: string }[]

  let updated = 0
  let errors = 0

  for (const c of contents) {
    try {
      await crawlNoteDetail(c.id)
      updated++
      // 间隔 2-5 秒，避免频率过高
      await new Promise(r => setTimeout(r, 2000 + Math.random() * 3000))
    } catch (err: any) {
      errors++
      logger.warn(`获取详情失败: id=${c.id} - ${err.message}`)
    }
  }

  return { updated, errors }
}

// ─── 竞品账号监控 ────────────────────────────────────────

export async function crawlCompetitorAccount(
  userUrl: string,
  category?: string,
): Promise<{ crawled: number; skipped: number }> {
  logger.info(`开始爬取竞品账号: ${userUrl}`)

  const notes = await xhs.getUserNotes(userUrl)
  const db = getDb()
  let crawled = 0
  let skipped = 0

  for (const note of notes) {
    const existing = db.prepare('SELECT id FROM contents WHERE source_id = ?').get(note.note_id)
    if (existing) {
      skipped++
      continue
    }

    const likes = parseInt(String(note.likes)) || 0
    const collects = parseInt(String(note.collects)) || 0
    const comments = parseInt(String(note.comments)) || 0

    createContent({
      platform: 'xiaohongshu',
      source_type: 'competitor',
      source_id: note.note_id,
      title: note.title,
      tags: null,
      images: note.cover_url ? JSON.stringify([note.cover_url]) : null,
      category: category || null,
      likes,
      collects,
      comments,
      views: 0,
    } as any)

    crawled++
  }

  logger.info(`竞品账号爬取完成: 新增=${crawled}, 跳过=${skipped}`)
  return { crawled, skipped }
}

// ─── 从采集数据中提取赛道趋势 ──────────────────────────────

export function getCategoryTrends(): {
  category: string
  count: number
  avgLikes: number
  avgCollects: number
  totalComments: number
  topTitles: string[]
}[] {
  const db = getDb()
  return db.prepare(`
    SELECT
      category,
      COUNT(*) as count,
      ROUND(AVG(likes)) as avgLikes,
      ROUND(AVG(collects)) as avgCollects,
      SUM(comments) as totalComments,
      '' as topTitles
    FROM contents
    WHERE category IS NOT NULL
    GROUP BY category
    ORDER BY avgLikes DESC
  `).all() as any[]
}

// ─── Spider_XHS 服务状态 ─────────────────────────────────

export async function getCrawlerStatus(): Promise<{
  online: boolean
  cookieConfigured: boolean
  stats: {
    totalContents: number
    competitorContents: number
    selfContents: number
    missingDetails: number
  }
}> {
  const health = await xhs.checkXhsHealth()
  const db = getDb()

  const total = (db.prepare('SELECT COUNT(*) as c FROM contents').get() as any).c
  const competitor = (db.prepare("SELECT COUNT(*) as c FROM contents WHERE source_type = 'competitor'").get() as any).c
  const self = (db.prepare("SELECT COUNT(*) as c FROM contents WHERE source_type = 'self'").get() as any).c
  const missing = (db.prepare('SELECT COUNT(*) as c FROM contents WHERE body IS NULL AND source_id IS NOT NULL').get() as any).c

  return {
    online: health.ok,
    cookieConfigured: health.cookieConfigured,
    stats: {
      totalContents: total,
      competitorContents: competitor,
      selfContents: self,
      missingDetails: missing,
    },
  }
}
