import type { Context } from 'koa'
import * as genService from '../../services/sg-content/content-generator'
import { logger } from '../../services/logger'

export async function generate(ctx: Context) {
  const { topic_id } = ctx.request.body as any
  if (!topic_id) {
    ctx.status = 400
    ctx.body = { error: 'topic_id is required' }
    return
  }
  try {
    const content = await genService.generateContentForTopic(Number(topic_id))
    ctx.status = 201
    ctx.body = { data: content }
  } catch (err: any) {
    logger.error({ err }, 'Content generation failed')
    ctx.status = 500
    ctx.body = { error: err.message }
  }
}

export async function recommend(ctx: Context) {
  const { count } = ctx.request.body as any
  try {
    const topics = await genService.recommendTopics(Number(count) || 10)
    ctx.body = { data: topics }
  } catch (err: any) {
    logger.error({ err }, 'Topic recommendation failed')
    ctx.status = 500
    ctx.body = { error: err.message }
  }
}

export async function analyzeStyleHandler(ctx: Context) {
  try {
    const profile = await genService.analyzeStyle()
    ctx.body = { data: profile }
  } catch (err: any) {
    logger.error({ err }, 'Style analysis failed')
    ctx.status = 500
    ctx.body = { error: err.message }
  }
}

export async function getStyle(ctx: Context) {
  const profile = genService.getStyleProfile()
  ctx.body = { data: profile }
}
