import Router from '@koa/router'
import * as ctrl from '../../controllers/sg-content/contents-generated'

export const generatedContentRoutes = new Router()
generatedContentRoutes.get('/api/generated-contents', ctrl.list)
generatedContentRoutes.get('/api/generated-contents/:id', ctrl.get)
generatedContentRoutes.post('/api/generated-contents', ctrl.create)
generatedContentRoutes.put('/api/generated-contents/:id', ctrl.update)
generatedContentRoutes.put('/api/generated-contents/:id/approve', ctrl.approve)
generatedContentRoutes.put('/api/generated-contents/:id/reject', ctrl.reject)
generatedContentRoutes.delete('/api/generated-contents/:id', ctrl.remove)
