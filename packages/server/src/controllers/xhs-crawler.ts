import type { Context } from 'koa'
import * as crawler from '../services/xhs-crawler/crawler'
import * as xhs from '../services/xhs-crawler/client'
import { logger } from '../services/logger'

export async function status(ctx: Context) {
  const result = await crawler.getCrawlerStatus()
  ctx.body = { data: result }
}

export async function updateCookie(ctx: Context) {
  const { cookies } = ctx.request.body as any
  if (!cookies) {
    ctx.status = 400
    ctx.body = { error: 'cookies is required' }
    return
  }
  try {
    await xhs.updateXhsCookie(cookies)
    ctx.body = { data: { success: true } }
  } catch (err: any) {
    ctx.status = 500
    ctx.body = { error: err.message }
  }
}

export async function searchAndCrawl(ctx: Context) {
  const { query, num, sort, source_type, category } = ctx.request.body as any
  if (!query) {
    ctx.status = 400
    ctx.body = { error: 'query is required' }
    return
  }
  try {
    const result = await crawler.crawlByKeyword({
      query,
      num: num || 20,
      sort: sort || 2,
      sourceType: source_type || 'competitor',
      category: category || undefined,
    })
    ctx.body = { data: result }
  } catch (err: any) {
    logger.error({ err }, 'Search and crawl failed')
    ctx.status = 500
    ctx.body = { error: err.message }
  }
}

export async function crawlDetail(ctx: Context) {
  const { content_id } = ctx.request.body as any
  if (!content_id) {
    ctx.status = 400
    ctx.body = { error: 'content_id is required' }
    return
  }
  try {
    const content = await crawler.crawlNoteDetail(Number(content_id))
    if (!content) {
      ctx.status = 404
      ctx.body = { error: 'Content not found' }
      return
    }
    ctx.body = { data: content }
  } catch (err: any) {
    logger.error({ err }, 'Crawl detail failed')
    ctx.status = 500
    ctx.body = { error: err.message }
  }
}

export async function batchDetails(ctx: Context) {
  const { limit } = ctx.request.body as any
  try {
    const result = await crawler.crawlMissingDetails(limit || 20)
    ctx.body = { data: result }
  } catch (err: any) {
    logger.error({ err }, 'Batch crawl details failed')
    ctx.status = 500
    ctx.body = { error: err.message }
  }
}

export async function crawlAccount(ctx: Context) {
  const { user_url, category } = ctx.request.body as any
  if (!user_url) {
    ctx.status = 400
    ctx.body = { error: 'user_url is required' }
    return
  }
  try {
    const result = await crawler.crawlCompetitorAccount(user_url, category)
    ctx.body = { data: result }
  } catch (err: any) {
    logger.error({ err }, 'Crawl account failed')
    ctx.status = 500
    ctx.body = { error: err.message }
  }
}

export async function categoryTrends(ctx: Context) {
  const trends = crawler.getCategoryTrends()
  ctx.body = { data: trends }
}

export async function searchKeywords(ctx: Context) {
  const { word } = ctx.request.body as any
  if (!word) {
    ctx.status = 400
    ctx.body = { error: 'word is required' }
    return
  }
  try {
    const keywords = await xhs.getSearchKeywords(word)
    ctx.body = { data: keywords }
  } catch (err: any) {
    ctx.status = 500
    ctx.body = { error: err.message }
  }
}
