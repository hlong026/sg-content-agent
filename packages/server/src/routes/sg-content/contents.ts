import Router from '@koa/router'
import * as ctrl from '../../controllers/sg-content/contents'

export const contentRoutes = new Router()
contentRoutes.get('/api/contents', ctrl.list)
contentRoutes.get('/api/contents/stats', ctrl.stats)
contentRoutes.get('/api/contents/:id', ctrl.get)
contentRoutes.post('/api/contents', ctrl.create)
contentRoutes.delete('/api/contents/:id', ctrl.remove)
