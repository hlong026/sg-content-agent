/**
 * Publishing service — manage publishing queue and status
 * Metrics — track content performance
 */
import { getDb } from '../../db/database'
import { updateGeneratedContent } from './generated-contents'
import { updateTopic } from './topics'

// ─── Publishing ────────────────────────────────────────────────────

export function schedulePublish(contentId: number, platform: string, scheduledAt: string): any {
  const db = getDb()
  const stmt = db.prepare(`
    INSERT INTO publishing_queue (content_id, platform, scheduled_at, status)
    VALUES (?, ?, ?, 'pending')
  `)
  const result = stmt.run(contentId, platform, scheduledAt)
  return db.prepare('SELECT * FROM publishing_queue WHERE id = ?').get(result.lastInsertRowid)
}

export function listPublishQueue(filters: { status?: string } = {}): any[] {
  const db = getDb()
  if (filters.status) {
    return db.prepare(
      `SELECT pq.*, gc.selected_title, gc.body, gc.tags
       FROM publishing_queue pq
       LEFT JOIN generated_contents gc ON pq.content_id = gc.id
       WHERE pq.status = ?
       ORDER BY pq.scheduled_at ASC`
    ).all(filters.status)
  }
  return db.prepare(
    `SELECT pq.*, gc.selected_title, gc.body, gc.tags
     FROM publishing_queue pq
     LEFT JOIN generated_contents gc ON pq.content_id = gc.id
     ORDER BY pq.scheduled_at ASC`
  ).all()
}

export function markPublished(queueId: number, publishedUrl?: string): any {
  const db = getDb()
  db.prepare(`
    UPDATE publishing_queue SET status = 'published', published_url = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(publishedUrl || null, queueId)

  const item = db.prepare('SELECT * FROM publishing_queue WHERE id = ?').get(queueId) as any
  if (item?.content_id) {
    updateGeneratedContent(item.content_id, { status: 'published', published_url: publishedUrl })
    // Find topic and mark completed
    const gc = db.prepare('SELECT topic_id FROM generated_contents WHERE id = ?').get(item.content_id) as any
    if (gc?.topic_id) {
      updateTopic(gc.topic_id, { status: 'completed' })
    }
  }
  return item
}

export function markPublishFailed(queueId: number, error: string): any {
  const db = getDb()
  db.prepare(`
    UPDATE publishing_queue SET status = 'failed', error_message = ?, retry_count = retry_count + 1, updated_at = datetime('now')
    WHERE id = ?
  `).run(error, queueId)
  return db.prepare('SELECT * FROM publishing_queue WHERE id = ?').get(queueId)
}

// ─── Metrics ───────────────────────────────────────────────────────

export function recordMetrics(contentId: number, data: {
  likes: number; collects: number; comments: number; shares: number
  views: number; followers_gained: number; hours_since_publish: number
}): any {
  const db = getDb()
  const stmt = db.prepare(`
    INSERT INTO metrics (content_id, platform, likes, collects, comments, shares, views, followers_gained, hours_since_publish)
    VALUES (?, 'xiaohongshu', ?, ?, ?, ?, ?, ?, ?)
  `)
  const result = stmt.run(
    contentId, data.likes, data.collects, data.comments, data.shares,
    data.views, data.followers_gained, data.hours_since_publish,
  )
  return db.prepare('SELECT * FROM metrics WHERE id = ?').get(result.lastInsertRowid)
}

export function getMetrics(contentId: number): any[] {
  const db = getDb()
  return db.prepare(
    `SELECT * FROM metrics WHERE content_id = ? ORDER BY collected_at DESC`
  ).all(contentId)
}

export function getLatestMetrics(contentId: number): any {
  const db = getDb()
  return db.prepare(
    `SELECT * FROM metrics WHERE content_id = ? ORDER BY collected_at DESC LIMIT 1`
  ).get(contentId)
}

export function getContentPerformance(): any[] {
  const db = getDb()
  return db.prepare(`
    SELECT gc.id, gc.selected_title, gc.quality_score, gc.published_at,
           m.likes, m.collects, m.comments, m.views, m.followers_gained,
           m.hours_since_publish
    FROM generated_contents gc
    LEFT JOIN metrics m ON gc.id = m.content_id
    WHERE gc.status = 'published'
    ORDER BY gc.published_at DESC
  `).all()
}

export function getPerformanceSummary(): any {
  const db = getDb()
  const totalPublished = (db.prepare("SELECT COUNT(*) as c FROM generated_contents WHERE status = 'published'").get() as any).c
  const avgLikes = db.prepare('SELECT AVG(likes) as avg FROM metrics').get() as any
  const avgViews = db.prepare('SELECT AVG(views) as avg FROM metrics').get() as any
  const totalFollowers = db.prepare('SELECT SUM(followers_gained) as total FROM metrics').get() as any

  // Best performing content
  const bestContent = db.prepare(`
    SELECT gc.selected_title, MAX(m.likes) as likes, MAX(m.views) as views
    FROM generated_contents gc
    JOIN metrics m ON gc.id = m.content_id
    GROUP BY gc.id
    ORDER BY likes DESC LIMIT 1
  `).get() as any

  // By category performance
  const byCategory = db.prepare(`
    SELECT t.category, AVG(m.likes) as avg_likes, AVG(m.views) as avg_views, COUNT(*) as count
    FROM generated_contents gc
    JOIN topics t ON gc.topic_id = t.id
    JOIN metrics m ON gc.id = m.content_id
    GROUP BY t.category
  `).all()

  return {
    total_published: totalPublished,
    avg_likes: Math.round(avgLikes.avg || 0),
    avg_views: Math.round(avgViews.avg || 0),
    total_followers_gained: totalFollowers.total || 0,
    best_content: bestContent,
    by_category: byCategory,
  }
}
