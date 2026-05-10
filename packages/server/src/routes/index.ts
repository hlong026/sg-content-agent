import type { Context, Next } from 'koa'
import { healthRoutes } from './health'
import { authRoutes } from './auth'
import { contentRoutes } from './sg-content/contents'
import { topicRoutes } from './sg-content/topics'
import { knowledgeRoutes } from './sg-content/knowledge'
import { generatedContentRoutes } from './sg-content/generated-contents'
import { dashboardRoutes } from './sg-content/dashboard'
import { generationRoutes } from './sg-content/generation'
import { publishingRoutes } from './sg-content/publishing'
import { requireAuth } from '../services/auth'

export function registerRoutes(app: any) {
  // Public routes
  app.use(healthRoutes.routes())
  app.use(authRoutes.routes())

  // Auth middleware
  app.use(async (ctx: Context, next: Next) => {
    if (ctx.path === '/health' || ctx.path.startsWith('/api/auth/')) {
      return next()
    }
    return requireAuth(ctx, next)
  })

  // Protected routes
  app.use(dashboardRoutes.routes())
  app.use(contentRoutes.routes())
  app.use(topicRoutes.routes())
  app.use(knowledgeRoutes.routes())
  app.use(generatedContentRoutes.routes())
  app.use(generationRoutes.routes())
  app.use(publishingRoutes.routes())
}
