import type { Context, Next } from 'koa'
import { createHmac, randomBytes, timingSafeEqual } from 'crypto'

const JWT_SECRET = process.env.JWT_SECRET || 'sg-content-agent-secret-change-me'

// Simple token-based auth for MVP
export function generateToken(): string {
  const payload = JSON.stringify({ role: 'admin', iat: Date.now(), rnd: randomBytes(8).toString('hex') })
  const signature = createHmac('sha256', JWT_SECRET).update(payload).digest('hex')
  return Buffer.from(`${payload}.${signature}`).toString('base64url')
}

export function verifyToken(token: string): any {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf-8')
    const [payload, signature] = decoded.split('.')
    const expected = createHmac('sha256', JWT_SECRET).update(payload).digest('hex')
    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      throw new Error('Invalid signature')
    }
    return JSON.parse(payload)
  } catch {
    throw new Error('Invalid token')
  }
}

export function requireAuth(ctx: Context, next: Next): Promise<void> {
  const authHeader = ctx.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    ctx.status = 401
    ctx.body = { error: 'Unauthorized' }
    return Promise.resolve()
  }

  try {
    const token = authHeader.slice(7)
    const decoded = verifyToken(token)
    ctx.state.user = decoded
    return next()
  } catch {
    ctx.status = 401
    ctx.body = { error: 'Invalid token' }
    return Promise.resolve()
  }
}
