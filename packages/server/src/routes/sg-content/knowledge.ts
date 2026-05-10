import Router from '@koa/router'
import * as ctrl from '../../controllers/sg-content/knowledge'

export const knowledgeRoutes = new Router()
knowledgeRoutes.get('/api/knowledge', ctrl.list)
knowledgeRoutes.get('/api/knowledge/categories', ctrl.categories)
knowledgeRoutes.get('/api/knowledge/search', ctrl.search)
knowledgeRoutes.post('/api/knowledge/search', ctrl.search)
knowledgeRoutes.get('/api/knowledge/:id', ctrl.get)
knowledgeRoutes.post('/api/knowledge', ctrl.create)
knowledgeRoutes.put('/api/knowledge/:id', ctrl.update)
knowledgeRoutes.delete('/api/knowledge/:id', ctrl.remove)
