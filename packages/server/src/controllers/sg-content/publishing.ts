import type { Context } from 'koa'
import * as svc from '../../services/sg-content/publishing'

export async function listQueue(ctx: Context) {
  const { status } = ctx.query
  const items = svc.listPublishQueue({ status: status as string })
  ctx.body = { data: items }
}

export async function schedule(ctx: Context) {
  const { content_id, platform, scheduled_at } = ctx.request.body as any
  if (!content_id) {
    ctx.status = 400
    ctx.body = { error: 'content_id is required' }
    return
  }
  const item = svc.schedulePublish(
    Number(content_id),
    platform || 'xiaohongshu',
    scheduled_at || new Date().toISOString(),
  )
  ctx.status = 201
  ctx.body = { data: item }
}

export async function markPublished(ctx: Context) {
  const id = parseInt(ctx.params.id)
  const { published_url } = ctx.request.body as any || {}
  const item = svc.markPublished(id, published_url)
  ctx.body = { data: item }
}

export async function markFailed(ctx: Context) {
  const id = parseInt(ctx.params.id)
  const { error } = ctx.request.body as any || {}
  const item = svc.markPublishFailed(id, error || 'Unknown error')
  ctx.body = { data: item }
}

export async function recordMetrics(ctx: Context) {
  const contentId = parseInt(ctx.params.contentId)
  const data = ctx.request.body as any
  const metric = svc.recordMetrics(contentId, data)
  ctx.status = 201
  ctx.body = { data: metric }
}

export async function getMetrics(ctx: Context) {
  const contentId = parseInt(ctx.params.contentId)
  const metrics = svc.getMetrics(contentId)
  ctx.body = { data: metrics }
}

export async function getPerformance(ctx: Context) {
  ctx.body = { data: svc.getPerformanceSummary() }
}
