import Router from '@koa/router'
import * as ctrl from '../../controllers/sg-content/publishing'

export const publishingRoutes = new Router()
publishingRoutes.get('/api/publishing/queue', ctrl.listQueue)
publishingRoutes.post('/api/publishing/schedule', ctrl.schedule)
publishingRoutes.put('/api/publishing/:id/published', ctrl.markPublished)
publishingRoutes.put('/api/publishing/:id/failed', ctrl.markFailed)
publishingRoutes.post('/api/metrics/:contentId', ctrl.recordMetrics)
publishingRoutes.get('/api/metrics/:contentId', ctrl.getMetrics)
publishingRoutes.get('/api/performance', ctrl.getPerformance)
