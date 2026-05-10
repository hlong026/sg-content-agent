import type { Context } from 'koa'
import * as svc from '../../services/sg-content/topics'

export async function list(ctx: Context) {
  const { status, category, scheduled_date, limit, offset } = ctx.query
  const topics = svc.listTopics({
    status: status as string,
    category: category as string,
    scheduled_date: scheduled_date as string,
    limit: limit ? parseInt(limit as string) : 50,
    offset: offset ? parseInt(offset as string) : 0,
  })
  ctx.body = { data: topics }
}

export async function get(ctx: Context) {
  const id = parseInt(ctx.params.id)
  const topic = svc.getTopic(id)
  if (!topic) {
    ctx.status = 404
    ctx.body = { error: 'Topic not found' }
    return
  }
  ctx.body = { data: topic }
}

export async function create(ctx: Context) {
  const topic = svc.createTopic(ctx.request.body)
  ctx.status = 201
  ctx.body = { data: topic }
}

export async function update(ctx: Context) {
  const id = parseInt(ctx.params.id)
  const topic = svc.updateTopic(id, ctx.request.body)
  if (!topic) {
    ctx.status = 404
    ctx.body = { error: 'Topic not found' }
    return
  }
  ctx.body = { data: topic }
}

export async function remove(ctx: Context) {
  const id = parseInt(ctx.params.id)
  const deleted = svc.deleteTopic(id)
  ctx.status = deleted ? 204 : 404
}

export async function calendar(ctx: Context) {
  const { start, end } = ctx.query
  const topics = svc.getTopicsCalendar(
    (start as string) || new Date().toISOString().split('T')[0],
    (end as string) || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  )
  ctx.body = { data: topics }
}
