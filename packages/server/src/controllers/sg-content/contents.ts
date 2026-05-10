import type { Context } from 'koa'
import * as svc from '../../services/sg-content/contents'

export async function list(ctx: Context) {
  const { platform, source_type, category, limit, offset } = ctx.query
  const contents = svc.listContents({
    platform: platform as string,
    source_type: source_type as string,
    category: category as string,
    limit: limit ? parseInt(limit as string) : 50,
    offset: offset ? parseInt(offset as string) : 0,
  })
  ctx.body = { data: contents }
}

export async function get(ctx: Context) {
  const id = parseInt(ctx.params.id)
  const content = svc.getContent(id)
  if (!content) {
    ctx.status = 404
    ctx.body = { error: 'Content not found' }
    return
  }
  ctx.body = { data: content }
}

export async function create(ctx: Context) {
  const content = svc.createContent(ctx.request.body)
  ctx.status = 201
  ctx.body = { data: content }
}

export async function remove(ctx: Context) {
  const id = parseInt(ctx.params.id)
  const deleted = svc.deleteContent(id)
  ctx.status = deleted ? 204 : 404
}

export async function stats(ctx: Context) {
  ctx.body = { data: svc.getContentStats() }
}
