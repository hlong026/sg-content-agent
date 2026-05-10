import { getDb } from '../../db/database'

export interface DashboardStats {
  contents_total: number
  contents_self: number
  contents_competitor: number
  topics_total: number
  topics_approved: number
  topics_completed: number
  generated_total: number
  generated_approved: number
  generated_published: number
  knowledge_total: number
  avg_quality_score: number | null
  published_this_week: number
}

export function getDashboardStats(): DashboardStats {
  const db = getDb()

  const contentsTotal = (db.prepare('SELECT COUNT(*) as c FROM contents').get() as any).c
  const contentsSelf = (db.prepare("SELECT COUNT(*) as c FROM contents WHERE source_type = 'self'").get() as any).c
  const contentsCompetitor = (db.prepare("SELECT COUNT(*) as c FROM contents WHERE source_type = 'competitor'").get() as any).c
  const topicsTotal = (db.prepare('SELECT COUNT(*) as c FROM topics').get() as any).c
  const topicsApproved = (db.prepare("SELECT COUNT(*) as c FROM topics WHERE status = 'approved'").get() as any).c
  const topicsCompleted = (db.prepare("SELECT COUNT(*) as c FROM topics WHERE status = 'completed'").get() as any).c
  const generatedTotal = (db.prepare('SELECT COUNT(*) as c FROM generated_contents').get() as any).c
  const generatedApproved = (db.prepare("SELECT COUNT(*) as c FROM generated_contents WHERE status = 'approved'").get() as any).c
  const generatedPublished = (db.prepare("SELECT COUNT(*) as c FROM generated_contents WHERE status = 'published'").get() as any).c
  const knowledgeTotal = (db.prepare('SELECT COUNT(*) as c FROM knowledge').get() as any).c
  const avgScore = db.prepare('SELECT AVG(quality_score) as avg FROM generated_contents WHERE quality_score IS NOT NULL').get() as any
  const publishedThisWeek = (db.prepare(
    "SELECT COUNT(*) as c FROM generated_contents WHERE status = 'published' AND published_at >= datetime('now', '-7 days')"
  ).get() as any).c

  return {
    contents_total: contentsTotal,
    contents_self: contentsSelf,
    contents_competitor: contentsCompetitor,
    topics_total: topicsTotal,
    topics_approved: topicsApproved,
    topics_completed: topicsCompleted,
    generated_total: generatedTotal,
    generated_approved: generatedApproved,
    generated_published: generatedPublished,
    knowledge_total: knowledgeTotal,
    avg_quality_score: avgScore.avg ? Math.round(avgScore.avg * 10) / 10 : null,
    published_this_week: publishedThisWeek,
  }
}

export function getRecentContents(limit = 5): any[] {
  const db = getDb()
  return db.prepare('SELECT id, title, platform, source_type, likes, collects, comments, crawled_at FROM contents ORDER BY crawled_at DESC LIMIT ?').all(limit)
}

export function getPendingReview(): any[] {
  const db = getDb()
  return db.prepare(
    "SELECT id, selected_title, quality_score, status, created_at FROM generated_contents WHERE status IN ('draft', 'reviewing') ORDER BY created_at DESC LIMIT 10"
  ).all()
}

export function getTopTopics(limit = 5): any[] {
  const db = getDb()
  return db.prepare(
    "SELECT id, title, category, score, status, scheduled_date FROM topics WHERE status != 'cancelled' ORDER BY score DESC NULLS LAST LIMIT ?"
  ).all(limit)
}

export function getTodaySchedule(): any[] {
  const db = getDb()
  const today = new Date().toISOString().split('T')[0]
  return db.prepare(
    "SELECT t.id, t.title, t.scheduled_time, t.status, gc.selected_title FROM topics t LEFT JOIN generated_contents gc ON t.content_id = gc.id WHERE t.scheduled_date = ? ORDER BY t.scheduled_time"
  ).all(today)
}
