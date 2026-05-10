import type { Context } from 'koa'
import * as svc from '../../services/sg-content/generated-contents'

export async function list(ctx: Context) {
  const { status, topic_id, limit, offset } = ctx.query
  const items = svc.listGeneratedContents({
    status: status as string,
    topic_id: topic_id ? parseInt(topic_id as string) : undefined,
    limit: limit ? parseInt(limit as string) : 50,
    offset: offset ? parseInt(offset as string) : 0,
  })
  ctx.body = { data: items }
}

export async function get(ctx: Context) {
  const id = parseInt(ctx.params.id)
  const item = svc.getGeneratedContent(id)
  if (!item) {
    ctx.status = 404
    ctx.body = { error: 'Generated content not found' }
    return
  }
  ctx.body = { data: item }
}

export async function create(ctx: Context) {
  const item = svc.createGeneratedContent(ctx.request.body)
  ctx.status = 201
  ctx.body = { data: item }
}

export async function update(ctx: Context) {
  const id = parseInt(ctx.params.id)
  const item = svc.updateGeneratedContent(id, ctx.request.body)
  if (!item) {
    ctx.status = 404
    ctx.body = { error: 'Generated content not found' }
    return
  }
  ctx.body = { data: item }
}

export async function approve(ctx: Context) {
  const id = parseInt(ctx.params.id)
  const item = svc.updateGeneratedContent(id, { status: 'approved' })
  ctx.body = { data: item }
}

export async function reject(ctx: Context) {
  const id = parseInt(ctx.params.id)
  const { note } = (ctx.request.body as any) || {}
  const item = svc.updateGeneratedContent(id, { status: 'rejected', review_note: note || null })
  ctx.body = { data: item }
}

export async function remove(ctx: Context) {
  const id = parseInt(ctx.params.id)
  const deleted = svc.deleteGeneratedContent(id)
  ctx.status = deleted ? 204 : 404
}
