import { createRouter, createWebHashHistory } from 'vue-router'
import { hasToken } from '@/api/client'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/sg-content/DashboardView.vue'),
    },
    {
      path: '/topics',
      name: 'topics',
      component: () => import('@/views/sg-content/TopicsView.vue'),
    },
    {
      path: '/content',
      name: 'content',
      component: () => import('@/views/sg-content/ContentView.vue'),
    },
    {
      path: '/content/:id',
      name: 'contentDetail',
      component: () => import('@/views/sg-content/ContentDetailView.vue'),
    },
    {
      path: '/knowledge',
      name: 'knowledge',
      component: () => import('@/views/sg-content/KnowledgeView.vue'),
    },
    {
      path: '/collection',
      name: 'collection',
      component: () => import('@/views/sg-content/CrawlerView.vue'),
    },
    {
      path: '/publishing',
      name: 'publishing',
      component: () => import('@/views/sg-content/PublishingView.vue'),
    },
    {
      path: '/style',
      name: 'style',
      component: () => import('@/views/sg-content/StyleView.vue'),
    },
  ],
})

router.beforeEach((to, _from, next) => {
  if (to.meta.public) {
    if (to.name === 'login' && hasToken()) {
      next({ name: 'dashboard' })
      return
    }
    next()
    return
  }

  if (!hasToken()) {
    next({ name: 'login' })
    return
  }
  next()
})

export default router
