import Router from '@koa/router'
import * as ctrl from '../controllers/xhs-crawler'

export const xhsCrawlerRoutes = new Router()
xhsCrawlerRoutes.get('/api/xhs/status', ctrl.status)
xhsCrawlerRoutes.post('/api/xhs/cookie', ctrl.updateCookie)
xhsCrawlerRoutes.post('/api/xhs/search', ctrl.searchAndCrawl)
xhsCrawlerRoutes.post('/api/xhs/detail', ctrl.crawlDetail)
xhsCrawlerRoutes.post('/api/xhs/batch-details', ctrl.batchDetails)
xhsCrawlerRoutes.post('/api/xhs/account', ctrl.crawlAccount)
xhsCrawlerRoutes.get('/api/xhs/trends', ctrl.categoryTrends)
xhsCrawlerRoutes.post('/api/xhs/keywords', ctrl.searchKeywords)
