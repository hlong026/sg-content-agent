import type { Context } from 'koa'
import * as crawler from '../services/xhs-crawler/crawler'
import * as xhs from '../services/xhs-crawler/client'
import * as configSvc from '../services/sg-content/crawler-config'
import * as compSvc from '../services/sg-content/competitors'
import { logger } from '../services/logger'

export async function status(ctx: Context) {
  const result = await crawler.getCrawlerStatus()
  // 附加持久化的 cookie 状态
  const savedCookie = configSvc.getConfig('xhs_cookie')
  if (savedCookie) result.cookieConfigured = true
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
    // 1. 持久化到数据库
    configSvc.setConfig('xhs_cookie', cookies)
    // 2. 同步给 Spider_XHS 服务
    await xhs.updateXhsCookie(cookies)
    ctx.body = { data: { success: true } }
  } catch (err: any) {
    // 即使 Spider_XHS 不在线，也保存到本地数据库
    configSvc.setConfig('xhs_cookie', cookies)
    ctx.body = { data: { success: true, warning: err.message } }
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
  const { user_url, category, account_name, save_competitor } = ctx.request.body as any
  if (!user_url) {
    ctx.status = 400
    ctx.body = { error: 'user_url is required' }
    return
  }
  try {
    // 可选：自动保存为竞品
    if (save_competitor !== false) {
      try {
        compSvc.addCompetitor({ account_url: user_url, account_name, category })
      } catch { /* 可能已存在，忽略 */ }
    }
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

// ─── 竞品管理 ────────────────────────────────────────

export async function listCompetitors(ctx: Context) {
  ctx.body = { data: compSvc.listCompetitors() }
}

export async function addCompetitor(ctx: Context) {
  const body = ctx.request.body as any
  if (!body.account_url) {
    ctx.status = 400
    ctx.body = { error: 'account_url is required' }
    return
  }
  const comp = compSvc.addCompetitor(body)
  ctx.status = 201
  ctx.body = { data: comp }
}

export async function deleteCompetitor(ctx: Context) {
  const id = parseInt(ctx.params.id)
  const deleted = compSvc.deleteCompetitor(id)
  ctx.status = deleted ? 204 : 404
}

// ─── Cookie 读取 ─────────────────────────────────────

export async function getCookie(ctx: Context) {
  const cookie = configSvc.getConfig('xhs_cookie')
  ctx.body = { data: { configured: !!cookie, value: cookie ? `${cookie.substring(0, 20)}...` : null } }
}
