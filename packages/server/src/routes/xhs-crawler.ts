import Router from '@koa/router'
import * as ctrl from '../controllers/xhs-crawler'

export const xhsCrawlerRoutes = new Router()

// 服务状态与配置
xhsCrawlerRoutes.get('/api/xhs/status', ctrl.status)
xhsCrawlerRoutes.get('/api/xhs/cookie', ctrl.getCookie)
xhsCrawlerRoutes.post('/api/xhs/cookie', ctrl.updateCookie)

// 采集操作
xhsCrawlerRoutes.post('/api/xhs/search', ctrl.searchAndCrawl)
xhsCrawlerRoutes.post('/api/xhs/detail', ctrl.crawlDetail)
xhsCrawlerRoutes.post('/api/xhs/batch-details', ctrl.batchDetails)
xhsCrawlerRoutes.post('/api/xhs/account', ctrl.crawlAccount)
xhsCrawlerRoutes.get('/api/xhs/trends', ctrl.categoryTrends)
xhsCrawlerRoutes.post('/api/xhs/keywords', ctrl.searchKeywords)

// 竞品管理
xhsCrawlerRoutes.get('/api/xhs/competitors', ctrl.listCompetitors)
xhsCrawlerRoutes.post('/api/xhs/competitors', ctrl.addCompetitor)
xhsCrawlerRoutes.delete('/api/xhs/competitors/:id', ctrl.deleteCompetitor)
