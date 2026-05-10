import type { Context } from 'koa'

export async function health(ctx: Context) {
  ctx.body = { status: 'ok', timestamp: new Date().toISOString() }
}
