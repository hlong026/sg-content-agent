import Database from 'better-sqlite3'
import { resolve, dirname } from 'path'
import { mkdirSync } from 'fs'
import { config } from '../config'
import { logger } from '../services/logger'

let db: Database.Database

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = resolve(config.dataDir, 'sg-content.db')
    mkdirSync(dirname(dbPath), { recursive: true })
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    logger.info(`Database opened: ${dbPath}`)
  }
  return db
}

export function initDatabase(): void {
  const db = getDb()

  db.exec(`
    -- 采集内容表
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

    -- 选题表
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

    -- 知识库表
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

    -- 生成内容表
    CREATE TABLE IF NOT EXISTS generated_contents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic_id INTEGER REFERENCES topics(id),
      title_candidates TEXT,
      selected_title TEXT,
      body TEXT,
      tags TEXT,
      cover_image_urls TEXT,
      selected_cover_url TEXT,
      prompt_used TEXT,
      knowledge_refs TEXT,
      reference_contents TEXT,
      style_profile_id INTEGER,
      quality_score REAL,
      quality_detail TEXT,
      quality_feedback TEXT,
      status TEXT DEFAULT 'draft',
      review_note TEXT,
      platform TEXT DEFAULT 'xiaohongshu',
      published_url TEXT,
      published_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- 风格画像表
    CREATE TABLE IF NOT EXISTS style_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version INTEGER NOT NULL DEFAULT 1,
      profile_data TEXT NOT NULL,
      sample_count INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- 表现数据表
    CREATE TABLE IF NOT EXISTS metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content_id INTEGER REFERENCES generated_contents(id),
      platform TEXT DEFAULT 'xiaohongshu',
      likes INTEGER DEFAULT 0,
      collects INTEGER DEFAULT 0,
      comments INTEGER DEFAULT 0,
      shares INTEGER DEFAULT 0,
      views INTEGER DEFAULT 0,
      followers_gained INTEGER DEFAULT 0,
      hours_since_publish REAL DEFAULT 0,
      collected_at TEXT DEFAULT (datetime('now'))
    );

    -- 采集任务表
    CREATE TABLE IF NOT EXISTS crawl_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL DEFAULT 'self',
      platform TEXT DEFAULT 'xiaohongshu',
      target_id TEXT,
      target_name TEXT,
      status TEXT DEFAULT 'pending',
      result_count INTEGER DEFAULT 0,
      error_message TEXT,
      last_run_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- 竞品表
    CREATE TABLE IF NOT EXISTS competitors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platform TEXT DEFAULT 'xiaohongshu',
      account_id TEXT NOT NULL,
      account_name TEXT,
      account_url TEXT,
      category TEXT,
      notes TEXT,
      is_active INTEGER DEFAULT 1,
      last_crawled_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- 爬虫配置表（Cookie 等持久化配置）
    CREATE TABLE IF NOT EXISTS crawler_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- 发布队列表
    CREATE TABLE IF NOT EXISTS publishing_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content_id INTEGER REFERENCES generated_contents(id),
      platform TEXT DEFAULT 'xiaohongshu',
      scheduled_at TEXT,
      status TEXT DEFAULT 'pending',
      published_url TEXT,
      error_message TEXT,
      retry_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_contents_platform ON contents(platform);
    CREATE INDEX IF NOT EXISTS idx_contents_source_type ON contents(source_type);
    CREATE INDEX IF NOT EXISTS idx_contents_category ON contents(category);
    CREATE INDEX IF NOT EXISTS idx_topics_status ON topics(status);
    CREATE INDEX IF NOT EXISTS idx_topics_scheduled_date ON topics(scheduled_date);
    CREATE INDEX IF NOT EXISTS idx_knowledge_category ON knowledge(category);
    CREATE INDEX IF NOT EXISTS idx_generated_contents_status ON generated_contents(status);
    CREATE INDEX IF NOT EXISTS idx_metrics_content_id ON metrics(content_id);
    CREATE INDEX IF NOT EXISTS idx_publishing_queue_status ON publishing_queue(status);
  `)

  logger.info('Database tables initialized')

  // Seed initial data
  const { seedData } = require('./seed/seed')
  seedData()
}
