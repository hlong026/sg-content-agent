import Router from '@koa/router'
import * as ctrl from '../controllers/auth'

export const authRoutes = new Router()
authRoutes.post('/api/auth/login', ctrl.login)
authRoutes.get('/api/auth/verify', ctrl.verify)
