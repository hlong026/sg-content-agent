/**
 * Content Generator — end-to-end content generation pipeline
 * Flow: retrieve knowledge → build prompt → call LLM → score quality → store
 */
import { getDb } from '../../db/database'
import { llmClient } from '../llm/client'
import { getTopic, updateTopic, type Topic } from './topics'
import { getKnowledge, searchKnowledge, type KnowledgeItem } from './knowledge'
import { createGeneratedContent, getGeneratedContent, type GeneratedContent } from './generated-contents'
import { logger } from '../logger'

/**
 * Extract search terms from a title string
 */
function extractSearchTerms(text: string): string[] {
  const terms: string[] = [text]
  const keywords = ['NUS', 'NTU', 'SMU', 'SUTD', 'CS', 'MBA', 'EP', 'PR', 'MOE',
    '雅思', '托福', '学费', '租房', '签证', '申请', '就业', '留学', '商科', '工程']
  for (const kw of keywords) {
    if (text.includes(kw)) terms.push(kw)
  }
  return [...new Set(terms)]
}

export async function generateContentForTopic(topicId: number): Promise<GeneratedContent> {
  const topic = getTopic(topicId)
  if (!topic) throw new Error(`Topic ${topicId} not found`)

  // Step 1: Retrieve relevant knowledge — try multiple search terms
  const searchTerms = extractSearchTerms(topic.title + ' ' + (topic.category || ''))
  let knowledgeItems: KnowledgeItem[] = []
  for (const term of searchTerms) {
    const found = searchKnowledge(term, 3)
    knowledgeItems = knowledgeItems.concat(found)
  }
  // Deduplicate by id
  const seen = new Set<number>()
  knowledgeItems = knowledgeItems.filter(k => {
    if (seen.has(k.id)) return false
    seen.add(k.id)
    return true
  }).slice(0, 5)

  // Fallback: if no knowledge found, get random items
  if (knowledgeItems.length === 0) {
    const db = getDb()
    knowledgeItems = (db.prepare('SELECT * FROM knowledge LIMIT 3').all() as KnowledgeItem[])
    logger.warn(`No knowledge found for "${topic.title}", using fallback items`)
  }

  const knowledgeContext = knowledgeItems.map(k => `【${k.title}】${k.content}`).join('\n\n')

  // Step 2: Get blogger style profile (if exists)
  const styleProfile = getActiveStyleProfile()
  const styleInstructions = styleProfile
    ? `\n\n## 博主风格要求\n${styleProfile.summary || '亲切自然，段落短小，善用emoji，多用第二人称'}`
    : `\n\n## 博主风格要求\n亲切自然，用"姐妹们"开头，段落短小精悍，善用emoji，结尾有互动引导。`

  // Step 3: Get reference content (blogger's past similar content)
  const refContents = getRelatedContents(topic.category, 3)
  const refContext = refContents.length > 0
    ? `\n\n## 参考内容（博主过去的爆款）\n${refContents.map(c => `标题: ${c.title}\n开头: ${(c.body || '').substring(0, 100)}...`).join('\n\n')}`
    : ''

  // Step 4: Build prompt and call LLM
  const prompt = `你是一位新加坡留学博主的AI内容助手。请根据以下信息生成一篇小红书图文内容。

## 选题
标题：${topic.title}
分类：${topic.category || '综合'}
描述：${topic.description || ''}
${styleInstructions}

## 知识素材（必须引用其中的真实数据）
${knowledgeContext || '暂无相关知识库数据，请基于常识生成'}
${refContext}

## 输出要求
请输出JSON格式：
{
  "titles": ["标题候选1", "标题候选2", "标题候选3"],
  "body": "正文内容（小红书风格，800-1200字，含emoji）",
  "tags": ["标签1", "标签2", ...]
}`

  logger.info(`Generating content for topic: ${topic.title}`)
  const rawResponse = await llmClient.chat([
    { role: 'system', content: '你是一个专业的小红书内容创作助手，擅长新加坡留学领域的内容创作。' },
    { role: 'user', content: prompt },
  ], 0.7, 3000)

  // Step 5: Parse response
  let parsed: any
  try {
    const jsonStr = rawResponse.match(/\{[\s\S]*\}/)?.[0] || rawResponse
    parsed = JSON.parse(jsonStr)
  } catch {
    logger.warn('Failed to parse LLM response as JSON, using raw text')
    parsed = { titles: [topic.title], body: rawResponse, tags: ['新加坡留学'] }
  }

  // Step 6: Quality score
  const quality = await scoreQuality(
    parsed.body || '',
    parsed.titles?.[0] || topic.title,
    styleProfile,
    knowledgeItems,
  )

  // Step 7: Store
  const content = createGeneratedContent({
    topic_id: topicId,
    title_candidates: parsed.titles,
    selected_title: parsed.titles?.[0] || topic.title,
    body: parsed.body,
    tags: parsed.tags,
    prompt_used: prompt,
    knowledge_refs: knowledgeItems.map(k => k.id),
    reference_contents: refContents.map(c => c.id),
    quality_score: quality.total,
    quality_detail: quality.detail,
    quality_feedback: quality.feedback,
    status: quality.total >= 80 ? 'approved' : quality.total >= 60 ? 'reviewing' : 'draft',
  })

  // Step 8: Update topic status
  updateTopic(topicId, { status: 'in_progress', content_id: content.id })

  logger.info(`Content generated: id=${content.id}, score=${quality.total}`)
  return content
}

async function scoreQuality(
  body: string,
  title: string,
  styleProfile: any | null,
  knowledgeItems: KnowledgeItem[],
): Promise<{ total: number; detail: Record<string, number>; feedback: string }> {
  // Try LLM scoring
  const scoringPrompt = `请对以下小红书内容进行质量评分。

标题：${title}
正文：${body.substring(0, 500)}${body.length > 500 ? '...' : ''}

博主风格：${styleProfile?.summary || '亲切自然，善用emoji，段落短小'}
知识库参考：${knowledgeItems.length}条相关知识

请从三个维度评分（0-100）：
1. style（风格匹配度）
2. accuracy（事实准确性）
3. readability（可读性）

输出JSON：
{
  "total": 综合分(0-100),
  "detail": {"style": 分数, "accuracy": 分数, "readability": 分数},
  "feedback": "改进建议"
}`

  const scoreResponse = await llmClient.chat([
    { role: 'system', content: '你是一个内容质量评审专家。' },
    { role: 'user', content: scoringPrompt },
  ], 0.3, 500)

  try {
    const jsonStr = scoreResponse.match(/\{[\s\S]*\}/)?.[0] || scoreResponse
    return JSON.parse(jsonStr)
  } catch {
    // Fallback: simple heuristic scoring
    const style = Math.min(100, 60 + (body.match(/[！？~👇✅❌💡📍💰]/g)?.length || 0) * 3)
    const accuracy = knowledgeItems.length > 0 ? 80 : 65
    const readability = Math.min(100, 60 + (body.split('\n\n').length) * 5)
    const total = Math.round(style * 0.4 + accuracy * 0.3 + readability * 0.3)
    return {
      total,
      detail: { style, accuracy, readability },
      feedback: '自动评分：内容已生成，建议人工审核后发布。',
    }
  }
}

function getActiveStyleProfile(): any | null {

  const db = getDb()
  const row = db.prepare('SELECT * FROM style_profiles WHERE is_active = 1 ORDER BY version DESC LIMIT 1').get() as any
  if (!row) return null
  try {
    return JSON.parse(row.profile_data)
  } catch {
    return null
  }
}

function getRelatedContents(category: string | null, limit: number): any[] {
  if (!category) return []
  const db = getDb()
  return db.prepare(
    `SELECT id, title, body FROM contents WHERE source_type = 'self' AND category = ? ORDER BY likes DESC LIMIT ?`
  ).all(category, limit) as any[]
}

// ─── Topic Recommendation ──────────────────────────────────────────

export async function recommendTopics(count = 10): Promise<any[]> {
  // Get existing topics for dedup
  const db = getDb()
  const existingTitles = db.prepare('SELECT title FROM topics').all() as any[]
  const existingSet = new Set(existingTitles.map(t => t.title))

  // Get collected content stats
  const categoryStats = db.prepare(
    `SELECT category, COUNT(*) as cnt, AVG(likes) as avg_likes FROM contents WHERE category IS NOT NULL GROUP BY category ORDER BY avg_likes DESC`
  ).all() as any[]

  const prompt = `你是一个新加坡留学赛道的内容策划专家。请推荐 ${count} 个爆款选题。

当前赛道数据：
${categoryStats.map(c => `- ${c.category}: ${c.cnt}篇已采集, 平均互动${Math.round(c.avg_likes || 0)}`).join('\n')}

已有选题（避免重复）：
${[...existingSet].slice(0, 20).join('、')}

请从这些分类中选择：院校相关、申请攻略、生活指南、费用相关、政策解读、就业发展、热点时效

输出JSON数组：
[{"title":"选题标题","category":"分类","score":85,"reason":"推荐理由"}]`

  const response = await llmClient.chat([
    { role: 'system', content: '你是新加坡留学领域的内容策划专家。' },
    { role: 'user', content: prompt },
  ], 0.8, 2000)

  try {
    const jsonStr = response.match(/\[[\s\S]*\]/)?.[0] || response
    return JSON.parse(jsonStr).filter((t: any) => !existingSet.has(t.title))
  } catch {
    return []
  }
}

// ─── Style Analysis ────────────────────────────────────────────────

export async function analyzeStyle(): Promise<any> {
  const db = getDb()
  const contents = db.prepare(
    `SELECT title, body FROM contents WHERE source_type = 'self' AND body IS NOT NULL ORDER BY likes DESC LIMIT 50`
  ).all() as any[]

  if (contents.length === 0) {
    throw new Error('No self-published content available for style analysis. Please add content first.')
  }

  const samples = contents.map(c => `标题: ${c.title}\n正文: ${(c.body || '').substring(0, 200)}`).join('\n\n')

  const prompt = `请分析以下新加坡留学博主的内容风格。

内容样本：
${samples}

请从以下维度分析，输出JSON：
{
  "title_patterns": {"模式1": "占比%", ...},
  "opening_patterns": ["常用开头1", ...],
  "avg_paragraph_length": "描述",
  "high_freq_words": ["高频词1", ...],
  "emoji_frequency": "high/medium/low",
  "cta_patterns": ["互动引导1", ...],
  "tone": "语气描述",
  "summary": "完整的风格画像描述（100字以内）"
}`

  const response = await llmClient.chat([
    { role: 'system', content: '你是一个内容风格分析专家。' },
    { role: 'user', content: prompt },
  ], 0.3, 1500)

  try {
    const jsonStr = response.match(/\{[\s\S]*\}/)?.[0] || response
    const profile = JSON.parse(jsonStr)

    // Save to DB
    db.prepare(`
      UPDATE style_profiles SET is_active = 0 WHERE is_active = 1
    `).run()

    const currentVersion = db.prepare('SELECT MAX(version) as v FROM style_profiles').get() as any
    const version = (currentVersion?.v || 0) + 1

    db.prepare(`
      INSERT INTO style_profiles (version, profile_data, sample_count, is_active)
      VALUES (?, ?, ?, 1)
    `).run(version, JSON.stringify(profile), contents.length)

    return profile
  } catch {
    throw new Error('Failed to parse style analysis result')
  }
}

export function getStyleProfile(): any | null {
  const db = getDb()
  const row = db.prepare('SELECT * FROM style_profiles WHERE is_active = 1 ORDER BY version DESC LIMIT 1').get() as any
  if (!row) return null
  return { ...row, profile_data: JSON.parse(row.profile_data) }
}
