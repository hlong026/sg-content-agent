import type { Context } from 'koa'
import * as svc from '../../services/sg-content/knowledge'

export async function list(ctx: Context) {
  const { category, search, limit, offset } = ctx.query
  const items = svc.listKnowledge({
    category: category as string,
    search: search as string,
    limit: limit ? parseInt(limit as string) : 50,
    offset: offset ? parseInt(offset as string) : 0,
  })
  ctx.body = { data: items }
}

export async function get(ctx: Context) {
  const id = parseInt(ctx.params.id)
  const item = svc.getKnowledge(id)
  if (!item) {
    ctx.status = 404
    ctx.body = { error: 'Knowledge not found' }
    return
  }
  ctx.body = { data: item }
}

export async function create(ctx: Context) {
  const { category, title, content, tags, structured_data, source, verified } = ctx.request.body as any
  if (!category || !title || !content) {
    ctx.status = 400
    ctx.body = { error: 'category, title, content are required' }
    return
  }
  const item = svc.createKnowledge({ category, title, content, tags, structured_data, source, verified })
  ctx.status = 201
  ctx.body = { data: item }
}

export async function update(ctx: Context) {
  const id = parseInt(ctx.params.id)
  const item = svc.updateKnowledge(id, ctx.request.body)
  if (!item) {
    ctx.status = 404
    ctx.body = { error: 'Knowledge not found' }
    return
  }
  ctx.body = { data: item }
}

export async function remove(ctx: Context) {
  const id = parseInt(ctx.params.id)
  const deleted = svc.deleteKnowledge(id)
  ctx.status = deleted ? 204 : 404
}

export async function categories(ctx: Context) {
  ctx.body = { data: svc.getKnowledgeCategories() }
}

export async function search(ctx: Context) {
  // Support both GET query params and POST body
  const body = ctx.request.body as any
  const q = ctx.query.q as string || body?.q
  const limitStr = ctx.query.limit as string || body?.limit
  if (!q) {
    ctx.status = 400
    ctx.body = { error: 'query parameter q is required' }
    return
  }
  const items = svc.searchKnowledge(q, limitStr ? parseInt(limitStr) : 10)
  ctx.body = { data: items }
}
