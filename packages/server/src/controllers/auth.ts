import type { Context } from 'koa'
import { generateToken, verifyToken } from '../services/auth'

export async function login(ctx: Context) {
  const { password } = ctx.request.body as any
  // MVP: simple password check
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
  if (password !== adminPassword) {
    ctx.status = 401
    ctx.body = { error: 'Invalid password' }
    return
  }
  const token = generateToken()
  ctx.body = { token }
}

export async function verify(ctx: Context) {
  const authHeader = ctx.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    ctx.status = 401
    ctx.body = { error: 'No token' }
    return
  }
  try {
    const decoded = verifyToken(authHeader.slice(7))
    ctx.body = { valid: true, user: decoded }
  } catch {
    ctx.status = 401
    ctx.body = { error: 'Invalid token' }
  }
}
