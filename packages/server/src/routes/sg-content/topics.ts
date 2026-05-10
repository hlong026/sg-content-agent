import Router from '@koa/router'
import * as ctrl from '../../controllers/sg-content/topics'

export const topicRoutes = new Router()
topicRoutes.get('/api/topics', ctrl.list)
topicRoutes.get('/api/topics/calendar', ctrl.calendar)
topicRoutes.get('/api/topics/:id', ctrl.get)
topicRoutes.post('/api/topics', ctrl.create)
topicRoutes.put('/api/topics/:id', ctrl.update)
topicRoutes.delete('/api/topics/:id', ctrl.remove)
