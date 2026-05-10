import { describe, it, expect, beforeEach } from 'vitest'
import Database from 'better-sqlite3'
import { resolve, dirname } from 'path'
import { mkdirSync } from 'fs'
import { tmpdir } from 'os'

// Inline the service functions for testing (to avoid module resolution issues)
let testDbCounter = 0
function getTestDb(): Database.Database {
  const dbPath = resolve(tmpdir(), `sg-test-${Date.now()}-${++testDbCounter}.db`)
  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS knowledge (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      tags TEXT,
      structured_data TEXT,
      source TEXT,
      verified INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS topics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT,
      sub_category TEXT,
      description TEXT,
      score REAL,
      score_detail TEXT,
      source TEXT DEFAULT 'ai_recommended',
      source_ref TEXT,
      status TEXT DEFAULT 'draft',
      scheduled_date TEXT,
      scheduled_time TEXT,
      platform TEXT DEFAULT 'xiaohongshu',
      content_id INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS contents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platform TEXT NOT NULL DEFAULT 'xiaohongshu',
      source_type TEXT NOT NULL DEFAULT 'self',
      source_id TEXT,
      source_name TEXT,
      title TEXT,
      body TEXT,
      tags TEXT,
      images TEXT,
      category TEXT,
      sub_category TEXT,
      likes INTEGER DEFAULT 0,
      collects INTEGER DEFAULT 0,
      comments INTEGER DEFAULT 0,
      shares INTEGER DEFAULT 0,
      views INTEGER DEFAULT 0,
      published_at TEXT,
      crawled_at TEXT DEFAULT (datetime('now')),
      content_hash TEXT UNIQUE,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS generated_contents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic_id INTEGER REFERENCES topics(id),
      selected_title TEXT,
      body TEXT,
      tags TEXT,
      quality_score REAL,
      quality_detail TEXT,
      quality_feedback TEXT,
      status TEXT DEFAULT 'draft',
      platform TEXT DEFAULT 'xiaohongshu',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `)

  return db
}

describe('Knowledge Service', () => {
  let db: Database.Database

  beforeEach(() => {
    db = getTestDb()
  })

  it('should create a knowledge item', () => {
    const stmt = db.prepare(
      'INSERT INTO knowledge (category, title, content, tags, source, verified) VALUES (?, ?, ?, ?, ?, ?)'
    )
    const result = stmt.run('institution', 'NUS Test', 'Test content about NUS', '["NUS"]', 'manual', 1)
    expect(result.lastInsertRowid).toBe(1)

    const row = db.prepare('SELECT * FROM knowledge WHERE id = 1').get() as any
    expect(row.title).toBe('NUS Test')
    expect(row.category).toBe('institution')
    expect(row.verified).toBe(1)
  })

  it('should list knowledge by category', () => {
    db.prepare('INSERT INTO knowledge (category, title, content) VALUES (?, ?, ?)').run('institution', 'NUS', 'About NUS')
    db.prepare('INSERT INTO knowledge (category, title, content) VALUES (?, ?, ?)').run('costs', 'Tuition', 'About costs')
    db.prepare('INSERT INTO knowledge (category, title, content) VALUES (?, ?, ?)').run('institution', 'NTU', 'About NTU')

    const institutions = db.prepare("SELECT * FROM knowledge WHERE category = 'institution'").all() as any[]
    expect(institutions.length).toBe(2)

    const costs = db.prepare("SELECT * FROM knowledge WHERE category = 'costs'").all() as any[]
    expect(costs.length).toBe(1)
  })

  it('should search knowledge by text', () => {
    db.prepare('INSERT INTO knowledge (category, title, content) VALUES (?, ?, ?)').run('institution', 'NUS', 'National University of Singapore')
    db.prepare('INSERT INTO knowledge (category, title, content) VALUES (?, ?, ?)').run('institution', 'NTU', 'Nanyang Technological University')

    const results = db.prepare("SELECT * FROM knowledge WHERE title LIKE '%NUS%' OR content LIKE '%NUS%'").all() as any[]
    expect(results.length).toBe(1)
    expect(results[0].title).toBe('NUS')
  })

  it('should update knowledge', () => {
    db.prepare('INSERT INTO knowledge (category, title, content) VALUES (?, ?, ?)').run('institution', 'NUS', 'Old content')

    db.prepare("UPDATE knowledge SET content = ?, updated_at = datetime('now') WHERE id = 1").run('New content')

    const row = db.prepare('SELECT * FROM knowledge WHERE id = 1').get() as any
    expect(row.content).toBe('New content')
  })

  it('should delete knowledge', () => {
    db.prepare('INSERT INTO knowledge (category, title, content) VALUES (?, ?, ?)').run('institution', 'NUS', 'Test')

    db.prepare('DELETE FROM knowledge WHERE id = 1').run()

    const count = (db.prepare('SELECT COUNT(*) as c FROM knowledge').get() as any).c
    expect(count).toBe(0)
  })

  it('should count knowledge by category', () => {
    db.prepare('INSERT INTO knowledge (category, title, content) VALUES (?, ?, ?)').run('institution', 'NUS', 'Test1')
    db.prepare('INSERT INTO knowledge (category, title, content) VALUES (?, ?, ?)').run('institution', 'NTU', 'Test2')
    db.prepare('INSERT INTO knowledge (category, title, content) VALUES (?, ?, ?)').run('costs', 'Tuition', 'Test3')

    const cats = db.prepare('SELECT category, COUNT(*) as count FROM knowledge GROUP BY category').all() as any[]
    expect(cats.length).toBe(2)
    const inst = cats.find(c => c.category === 'institution')
    expect(inst.count).toBe(2)
  })
})

describe('Topics Service', () => {
  let db: Database.Database

  beforeEach(() => {
    db = getTestDb()
  })

  it('should create and retrieve a topic', () => {
    db.prepare('INSERT INTO topics (title, category, score, status) VALUES (?, ?, ?, ?)').run('Test Topic', '院校相关', 85, 'draft')

    const topic = db.prepare('SELECT * FROM topics WHERE id = 1').get() as any
    expect(topic.title).toBe('Test Topic')
    expect(topic.score).toBe(85)
    expect(topic.status).toBe('draft')
  })

  it('should update topic status', () => {
    db.prepare('INSERT INTO topics (title, status) VALUES (?, ?)').run('Test', 'draft')

    db.prepare("UPDATE topics SET status = ?, updated_at = datetime('now') WHERE id = ?").run('approved', 1)

    const topic = db.prepare('SELECT * FROM topics WHERE id = 1').get() as any
    expect(topic.status).toBe('approved')
  })

  it('should filter topics by status', () => {
    db.prepare('INSERT INTO topics (title, status) VALUES (?, ?)').run('Topic 1', 'draft')
    db.prepare('INSERT INTO topics (title, status) VALUES (?, ?)').run('Topic 2', 'approved')
    db.prepare('INSERT INTO topics (title, status) VALUES (?, ?)').run('Topic 3', 'draft')

    const drafts = db.prepare("SELECT * FROM topics WHERE status = 'draft'").all() as any[]
    expect(drafts.length).toBe(2)
  })

  it('should order topics by score descending', () => {
    db.prepare('INSERT INTO topics (title, score) VALUES (?, ?)').run('Low', 60)
    db.prepare('INSERT INTO topics (title, score) VALUES (?, ?)').run('High', 95)
    db.prepare('INSERT INTO topics (title, score) VALUES (?, ?)').run('Mid', 80)

    const topics = db.prepare('SELECT * FROM topics ORDER BY score DESC').all() as any[]
    expect(topics[0].title).toBe('High')
    expect(topics[1].title).toBe('Mid')
    expect(topics[2].title).toBe('Low')
  })
})

describe('Content Generation Flow', () => {
  let db: Database.Database

  beforeEach(() => {
    db = getTestDb()
  })

  it('should link generated content to topic', () => {
    db.prepare('INSERT INTO topics (title, status) VALUES (?, ?)').run('Test Topic', 'approved')

    db.prepare('INSERT INTO generated_contents (topic_id, selected_title, body, quality_score, status) VALUES (?, ?, ?, ?, ?)')
      .run(1, 'Generated Title', 'Generated body content', 85, 'approved')

    db.prepare("UPDATE topics SET status = 'in_progress', content_id = 1 WHERE id = 1").run()

    const topic = db.prepare('SELECT * FROM topics WHERE id = 1').get() as any
    expect(topic.content_id).toBe(1)
    expect(topic.status).toBe('in_progress')

    const content = db.prepare('SELECT * FROM generated_contents WHERE id = 1').get() as any
    expect(content.topic_id).toBe(1)
    expect(content.quality_score).toBe(85)
  })

  it('should complete full topic lifecycle', () => {
    // Create → Approve → Generate → Publish → Complete
    db.prepare('INSERT INTO topics (title, status) VALUES (?, ?)').run('Lifecycle Test', 'draft')

    // Approve
    db.prepare("UPDATE topics SET status = 'approved' WHERE id = 1").run()
    let topic = db.prepare('SELECT status FROM topics WHERE id = 1').get() as any
    expect(topic.status).toBe('approved')

    // Generate
    db.prepare('INSERT INTO generated_contents (topic_id, selected_title, body, status) VALUES (?, ?, ?, ?)').run(1, 'Title', 'Body', 'approved')
    db.prepare("UPDATE topics SET status = 'in_progress', content_id = 1 WHERE id = 1").run()
    topic = db.prepare('SELECT status FROM topics WHERE id = 1').get() as any
    expect(topic.status).toBe('in_progress')

    // Publish → Complete
    db.prepare("UPDATE generated_contents SET status = 'published' WHERE id = 1").run()
    db.prepare("UPDATE topics SET status = 'completed' WHERE id = 1").run()
    topic = db.prepare('SELECT status FROM topics WHERE id = 1').get() as any
    expect(topic.status).toBe('completed')
  })
})

describe('Dashboard Stats', () => {
  let db: Database.Database

  beforeEach(() => {
    db = getTestDb()
  })

  it('should compute correct dashboard stats', () => {
    db.prepare('INSERT INTO contents (platform, source_type, title) VALUES (?, ?, ?)').run('xiaohongshu', 'self', 'Post 1')
    db.prepare('INSERT INTO contents (platform, source_type, title) VALUES (?, ?, ?)').run('xiaohongshu', 'competitor', 'Post 2')

    db.prepare('INSERT INTO topics (title, status) VALUES (?, ?)').run('Topic 1', 'approved')
    db.prepare('INSERT INTO topics (title, status) VALUES (?, ?)').run('Topic 2', 'draft')

    db.prepare('INSERT INTO generated_contents (selected_title, quality_score, status) VALUES (?, ?, ?)').run('Content 1', 85, 'published')
    db.prepare('INSERT INTO generated_contents (selected_title, quality_score, status) VALUES (?, ?, ?)').run('Content 2', 70, 'draft')

    db.prepare('INSERT INTO knowledge (category, title, content) VALUES (?, ?, ?)').run('institution', 'NUS', 'Test')

    const contentsTotal = (db.prepare('SELECT COUNT(*) as c FROM contents').get() as any).c
    const topicsApproved = (db.prepare("SELECT COUNT(*) as c FROM topics WHERE status = 'approved'").get() as any).c
    const generatedPublished = (db.prepare("SELECT COUNT(*) as c FROM generated_contents WHERE status = 'published'").get() as any).c
    const knowledgeTotal = (db.prepare('SELECT COUNT(*) as c FROM knowledge').get() as any).c
    const avgScore = db.prepare('SELECT AVG(quality_score) as avg FROM generated_contents WHERE quality_score IS NOT NULL').get() as any

    expect(contentsTotal).toBe(2)
    expect(topicsApproved).toBe(1)
    expect(generatedPublished).toBe(1)
    expect(knowledgeTotal).toBe(1)
    expect(Math.round(avgScore.avg)).toBe(78)
  })
})

describe('LLM Mock Response Routing', () => {
  // Test that the mock response function correctly routes different prompt types
  // Regression test for: generation prompt was falsely matching topic recommendation condition
  // because "## 选题" appeared in generation prompt before "推荐" was checked

  function mockResponse(lastMsg: string): string {
    const topicMatch = lastMsg.match(/标题[：:]\s*(.+?)[\n\r]/)
    const topic = topicMatch ? topicMatch[1].trim() : '新加坡留学'
    const catMatch = lastMsg.match(/分类[：:]\s*(.+?)[\n\r]/)
    const category = catMatch ? catMatch[1].trim() : '综合'

    // Must match the same conditions as the real mock in packages/server/src/services/llm/client.ts
    if (lastMsg.includes('生成一篇小红书') || lastMsg.includes('小红书图文内容') || lastMsg.includes('输出JSON格式')) {
      return JSON.stringify({ type: 'generation', titles: ['test'], body: 'test body', tags: [] })
    }
    if (lastMsg.includes('推荐') && (lastMsg.includes('爆款选题') || lastMsg.includes('内容策划'))) {
      return JSON.stringify([{ type: 'recommendation', title: 'test' }])
    }
    if (lastMsg.includes('质量评分') || lastMsg.includes('维度评分') || (lastMsg.includes('style') && lastMsg.includes('accuracy') && lastMsg.includes('readability'))) {
      return JSON.stringify({ type: 'scoring', total: 82, detail: {}, feedback: '' })
    }
    if (lastMsg.includes('风格分析') || lastMsg.includes('内容风格') || (lastMsg.includes('风格') && lastMsg.includes('维度'))) {
      return JSON.stringify({ type: 'style', summary: 'test' })
    }
    return '[]'
  }

  it('should route generation prompt to generation response', () => {
    // This prompt contains "## 选题" which used to falsely match the recommendation condition
    const prompt = `你是一位新加坡留学博主的AI内容助手。请根据以下信息生成一篇小红书图文内容。

## 选题
标题：NUS CS 专业深度解析
分类：院校相关

请输出JSON格式：
{"titles": [], "body": "", "tags": []}`

    const result = JSON.parse(mockResponse(prompt))
    expect(result.type).toBe('generation')
  })

  it('should route topic recommendation prompt correctly', () => {
    const prompt = `你是一个新加坡留学赛道的内容策划专家。请推荐 10 个爆款选题。

当前赛道数据：
- 院校相关: 5篇已采集

输出JSON数组`

    const result = JSON.parse(mockResponse(prompt))
    expect(Array.isArray(result)).toBe(true)
    expect(result[0].type).toBe('recommendation')
  })

  it('should route quality scoring prompt correctly', () => {
    // This prompt contains "博主风格" which used to falsely match the style condition
    const prompt = `请对以下小红书内容进行质量评分。

标题：test
正文：test body
博主风格：亲切自然

请从三个维度评分（0-100）：
1. style（风格匹配度）
2. accuracy（事实准确性）
3. readability（可读性）

输出JSON`

    const result = JSON.parse(mockResponse(prompt))
    expect(result.type).toBe('scoring')
  })

  it('should route style analysis prompt correctly', () => {
    const prompt = `请分析以下新加坡留学博主的内容风格。

内容样本：
标题: test

请从以下维度分析，输出JSON`

    const result = JSON.parse(mockResponse(prompt))
    expect(result.type).toBe('style')
  })
})
