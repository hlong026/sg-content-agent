import Koa from 'koa'
import cors from '@koa/cors'
import bodyParser from '@koa/bodyparser'
import serve from 'koa-static'
import send from 'koa-send'
import { resolve } from 'path'
import { mkdir } from 'fs/promises'
import { config } from './config'
import { registerRoutes } from './routes'
import { initDatabase } from './db/database'
import { logger } from './services/logger'

async function bootstrap() {
  console.log('sg-content-agent starting...')
  logger.info('sg-content-agent starting...')

  // Ensure directories
  await mkdir(config.dataDir, { recursive: true })
  await mkdir(config.uploadDir, { recursive: true })

  // Initialize database
  initDatabase()
  console.log('Database initialized')

  // Create Koa app
  const app = new Koa()

  // Middleware
  app.use(cors({ origin: config.corsOrigins }))
  app.use(bodyParser())

  // Register routes
  registerRoutes(app)
  console.log('Routes registered')

  // SPA fallback
  const distDir = resolve(__dirname, '..', 'client')
  app.use(serve(distDir))
  app.use(async (ctx) => {
    if (!ctx.path.startsWith('/api') && ctx.path !== '/health') {
      await send(ctx, 'index.html', { root: distDir })
    }
  })

  // Start server
  app.listen(config.port, config.host, () => {
    console.log(`Server running at http://localhost:${config.port}`)
    logger.info(`Server running at http://localhost:${config.port}`)
  })
}

bootstrap().catch((err) => {
  console.error('Failed to start:', err)
  logger.fatal(err, 'Failed to start')
  process.exit(1)
})
