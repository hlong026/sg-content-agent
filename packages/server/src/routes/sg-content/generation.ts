import Router from '@koa/router'
import * as ctrl from '../../controllers/sg-content/generation'

export const generationRoutes = new Router()
generationRoutes.post('/api/generation/generate', ctrl.generate)
generationRoutes.post('/api/generation/recommend-topics', ctrl.recommend)
generationRoutes.post('/api/style/analyze', ctrl.analyzeStyleHandler)
generationRoutes.get('/api/style/profile', ctrl.getStyle)
