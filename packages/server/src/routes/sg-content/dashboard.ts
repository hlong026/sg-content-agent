import Router from '@koa/router'
import * as ctrl from '../../controllers/sg-content/dashboard'

export const dashboardRoutes = new Router()
dashboardRoutes.get('/api/dashboard/stats', ctrl.stats)
dashboardRoutes.get('/api/dashboard/recent-contents', ctrl.recentContents)
dashboardRoutes.get('/api/dashboard/pending-review', ctrl.pendingReview)
dashboardRoutes.get('/api/dashboard/top-topics', ctrl.topTopics)
dashboardRoutes.get('/api/dashboard/today-schedule', ctrl.todaySchedule)
