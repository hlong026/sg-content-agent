<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import {
  NButton, NCard, NTag, NSelect, NSpace, NStatistic, NModal, NInput,
  NGrid, NGridItem, NSpin, NPopconfirm, useMessage,
} from 'naive-ui'
import {
  getCrawlerStatus, updateXhsCookie, searchAndCrawl, crawlNoteDetail,
  batchCrawlDetails, crawlAccount, getCategoryTrends,
  type CrawlerStatus, type CrawlResult, type CategoryTrend,
} from '@/api/sg-content/xhs-crawler'
import {
  listContents, deleteContent, getContentStats, type Content,
} from '@/api/sg-content/contents'

const message = useMessage()

// ─── State ──────────────────────────────────────────────
const loading = ref(false)
const crawlerStatus = ref<CrawlerStatus | null>(null)
const contents = ref<Content[]>([])
const contentStats = ref<any>(null)
const trends = ref<CategoryTrend[]>([])

// 搜索采集
const searchQuery = ref('')
const searchNum = ref(20)
const searchSort = ref(2)
const searchCategory = ref<string | null>(null)
const searchSourceType = ref('competitor')
const searchCrawling = ref(false)
const searchResult = ref<CrawlResult | null>(null)

// Cookie 管理
const showCookieModal = ref(false)
const cookieValue = ref('')
const cookieSaving = ref(false)

// 竞品账号
const showAccountModal = ref(false)
const accountUrl = ref('')
const accountCategory = ref<string | null>(null)
const accountCrawling = ref(false)

// 详情补全
const batchCrawling = ref(false)

// 筛选
const filterSource = ref('')

const sortOptions = [
  { label: '最多点赞 👍', value: 2 },
  { label: '综合排序', value: 0 },
  { label: '最新发布', value: 1 },
  { label: '最多评论 💬', value: 3 },
  { label: '最多收藏 ⭐', value: 4 },
]
const numOptions = [
  { label: '10 条', value: 10 },
  { label: '20 条', value: 20 },
  { label: '50 条', value: 50 },
]
const categoryOptions = [
  { label: '不指定分类', value: null },
  { label: '🏫 院校相关', value: '院校相关' },
  { label: '📋 申请攻略', value: '申请攻略' },
  { label: '🇸🇬 生活指南', value: '生活指南' },
  { label: '💰 费用相关', value: '费用相关' },
  { label: '📑 政策解读', value: '政策解读' },
  { label: '🎓 就业发展', value: '就业发展' },
]
const sourceFilterOptions = [
  { label: '全部', value: '' },
  { label: '竞品', value: 'competitor' },
  { label: '自有', value: 'self' },
]

const statusColor = computed(() => {
  if (!crawlerStatus.value) return '#999'
  if (!crawlerStatus.value.online) return '#ef4444'
  if (!crawlerStatus.value.cookieConfigured) return '#f59e0b'
  return '#22c55e'
})
const statusText = computed(() => {
  if (!crawlerStatus.value) return '检测中...'
  if (!crawlerStatus.value.online) return 'Spider_XHS 未启动'
  if (!crawlerStatus.value.cookieConfigured) return 'Cookie 未配置'
  return '服务正常'
})

// ─── Actions ────────────────────────────────────────────

onMounted(() => fetchData())

async function fetchData() {
  loading.value = true
  try {
    const [status, c, stats, t] = await Promise.all([
      getCrawlerStatus().catch(() => null),
      listContents({ source_type: filterSource.value || undefined }),
      getContentStats().catch(() => null),
      getCategoryTrends().catch(() => []),
    ])
    crawlerStatus.value = status
    contents.value = c
    contentStats.value = stats
    trends.value = t
  } finally {
    loading.value = false
  }
}

async function handleSearch() {
  if (!searchQuery.value.trim()) {
    message.warning('请输入搜索关键词')
    return
  }
  searchCrawling.value = true
  searchResult.value = null
  try {
    const result = await searchAndCrawl({
      query: searchQuery.value.trim(),
      num: searchNum.value,
      sort: searchSort.value,
      source_type: searchSourceType.value,
      category: searchCategory.value || undefined,
    })
    searchResult.value = result
    message.success(`采集完成：新增 ${result.crawled} 条，跳过 ${result.skipped} 条`)
    fetchData()
  } catch (e: any) {
    message.error(e.message)
  } finally {
    searchCrawling.value = false
  }
}

async function handleSaveCookie() {
  if (!cookieValue.value.trim()) {
    message.warning('请输入 Cookie')
    return
  }
  cookieSaving.value = true
  try {
    await updateXhsCookie(cookieValue.value.trim())
    message.success('Cookie 已保存')
    showCookieModal.value = false
    fetchData()
  } catch (e: any) {
    message.error(e.message)
  } finally {
    cookieSaving.value = false
  }
}

async function handleCrawlAccount() {
  if (!accountUrl.value.trim()) {
    message.warning('请输入账号主页链接')
    return
  }
  accountCrawling.value = true
  try {
    const result = await crawlAccount(accountUrl.value.trim(), accountCategory.value || undefined)
    message.success(`采集完成：新增 ${result.crawled} 条，跳过 ${result.skipped} 条`)
    showAccountModal.value = false
    accountUrl.value = ''
    fetchData()
  } catch (e: any) {
    message.error(e.message)
  } finally {
    accountCrawling.value = false
  }
}

async function handleBatchDetails() {
  batchCrawling.value = true
  try {
    const result = await batchCrawlDetails(20)
    message.success(`补全完成：${result.updated} 篇已获取详情，${result.errors} 篇失败`)
    fetchData()
  } catch (e: any) {
    message.error(e.message)
  } finally {
    batchCrawling.value = false
  }
}

async function handleGetDetail(id: number) {
  try {
    await crawlNoteDetail(id)
    message.success('详情已获取')
    fetchData()
  } catch (e: any) {
    message.error(e.message)
  }
}

async function handleDelete(id: number) {
  try {
    await deleteContent(id)
    message.success('已删除')
    fetchData()
  } catch (e: any) {
    message.error(e.message)
  }
}

function formatNum(n: number | string): string {
  const num = typeof n === 'string' ? parseInt(n) : n
  if (isNaN(num)) return '0'
  if (num >= 10000) return (num / 10000).toFixed(1) + 'w'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
  return String(num)
}
</script>

<template>
  <div>
    <div class="page-header">
      <h2>🕷️ 采集中心</h2>
      <NSpace>
        <NButton @click="showCookieModal = true">🍪 Cookie 设置</NButton>
        <NButton @click="showAccountModal = true">👤 监控账号</NButton>
        <NButton type="primary" :loading="batchCrawling" @click="handleBatchDetails">
          📥 批量补全详情
        </NButton>
      </NSpace>
    </div>

    <NSpin :show="loading">
      <!-- 服务状态 + 数据概览 -->
      <NGrid :cols="4" :x-gap="16" :y-gap="16" style="margin-bottom: 20px;">
        <NGridItem>
          <NCard size="small" class="status-card">
            <div class="status-indicator">
              <span class="status-dot" :style="{ background: statusColor }"></span>
              <span class="status-label">{{ statusText }}</span>
            </div>
            <div class="status-sub" v-if="crawlerStatus?.online">
              Spider_XHS :5557
            </div>
          </NCard>
        </NGridItem>
        <NGridItem>
          <NCard size="small">
            <NStatistic label="采集总量" :value="contentStats?.total || 0">
              <template #suffix>
                <span class="stat-suffix">篇</span>
              </template>
            </NStatistic>
          </NCard>
        </NGridItem>
        <NGridItem>
          <NCard size="small">
            <NStatistic label="竞品内容" :value="crawlerStatus?.stats?.competitorContents || contentStats?.by_source_type?.competitor || 0">
              <template #suffix>
                <span class="stat-suffix">篇</span>
              </template>
            </NStatistic>
          </NCard>
        </NGridItem>
        <NGridItem>
          <NCard size="small">
            <NStatistic label="待补详情" :value="crawlerStatus?.stats?.missingDetails || 0">
              <template #suffix>
                <span class="stat-suffix">篇</span>
              </template>
            </NStatistic>
          </NCard>
        </NGridItem>
      </NGrid>

      <!-- 搜索采集面板 -->
      <NCard title="🔍 关键词搜索采集" size="small" style="margin-bottom: 20px;">
        <div class="search-panel">
          <div class="search-row">
            <NInput
              v-model:value="searchQuery"
              placeholder="输入关键词搜索小红书内容，如：新加坡留学、NUS申请、新加坡租房"
              size="large"
              @keyup.enter="handleSearch"
              style="flex: 1;"
            />
            <NButton type="primary" size="large" :loading="searchCrawling" @click="handleSearch">
              🔍 搜索采集
            </NButton>
          </div>
          <div class="search-options">
            <NSelect v-model:value="searchSort" :options="sortOptions" style="width: 160px;" />
            <NSelect v-model:value="searchNum" :options="numOptions" style="width: 110px;" />
            <NSelect v-model:value="searchCategory" :options="categoryOptions" style="width: 160px;" />
            <NSelect v-model:value="searchSourceType" :options="[{ label: '标记为竞品', value: 'competitor' }, { label: '标记为自有', value: 'self' }]" style="width: 140px;" />
          </div>
          <div v-if="searchResult" class="search-result">
            ✅ 采集完成：新增 <b>{{ searchResult.crawled }}</b> 条
            <span v-if="searchResult.skipped">，跳过重复 {{ searchResult.skipped }} 条</span>
            <span v-if="searchResult.errors">，失败 {{ searchResult.errors }} 条</span>
          </div>
        </div>
      </NCard>

      <!-- 赛道趋势 -->
      <NCard v-if="trends.length > 0" title="📊 赛道分类趋势" size="small" style="margin-bottom: 20px;">
        <div class="trends-grid">
          <div v-for="t in trends" :key="t.category" class="trend-item">
            <div class="trend-cat">{{ t.category }}</div>
            <div class="trend-stats">
              <span>📦 {{ t.count }}篇</span>
              <span>❤️ {{ Math.round(t.avgLikes) }}</span>
              <span>⭐ {{ Math.round(t.avgCollects) }}</span>
            </div>
          </div>
        </div>
      </NCard>

      <!-- 内容列表 -->
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
        <h3 style="font-size: 16px;">采集内容列表</h3>
        <NSelect v-model:value="filterSource" :options="sourceFilterOptions" style="width: 120px;" @update:value="fetchData" />
      </div>

      <NCard v-for="item in contents" :key="item.id" size="small" class="content-card">
        <div class="content-row">
          <div class="content-main">
            <div class="content-header">
              <NTag size="small" :type="item.source_type === 'self' ? 'success' : 'warning'">
                {{ item.source_type === 'self' ? '自有' : '竞品' }}
              </NTag>
              <span class="content-title">{{ item.title || '(无标题)' }}</span>
              <NTag v-if="item.category" size="tiny" type="info">{{ item.category }}</NTag>
              <NTag v-if="!item.body" size="tiny" type="warning">无详情</NTag>
            </div>
            <div v-if="item.body" class="content-body">{{ item.body.substring(0, 150) }}{{ item.body.length > 150 ? '...' : '' }}</div>
            <div class="content-meta">
              <span v-if="item.source_name">✍️ {{ item.source_name }}</span>
              <span>❤️ {{ formatNum(item.likes) }}</span>
              <span>⭐ {{ formatNum(item.collects) }}</span>
              <span>💬 {{ formatNum(item.comments) }}</span>
              <span>📅 {{ item.crawled_at?.split(' ')[0] }}</span>
            </div>
          </div>
          <div class="content-actions">
            <NButton v-if="!item.body" size="tiny" type="info" @click="handleGetDetail(item.id)">获取详情</NButton>
            <NPopconfirm @positive-click="handleDelete(item.id)">
              <template #trigger>
                <NButton size="tiny" type="error" quaternary>删除</NButton>
              </template>
              确认删除此条内容？
            </NPopconfirm>
          </div>
        </div>
      </NCard>

      <div v-if="!loading && contents.length === 0" class="empty-state">
        <div class="empty-icon">🔍</div>
        <p>暂无采集内容，使用上方搜索框开始采集小红书内容</p>
      </div>
    </NSpin>

    <!-- Cookie 设置弹窗 -->
    <NModal v-model:show="showCookieModal" preset="dialog" title="🍪 小红书 Cookie 设置" style="width: 640px;">
      <NSpace vertical>
        <div class="cookie-guide">
          <p><b>如何获取 Cookie：</b></p>
          <ol>
            <li>在浏览器中打开 <a href="https://www.xiaohongshu.com" target="_blank">xiaohongshu.com</a> 并登录</li>
            <li>按 <kbd>F12</kbd> 打开开发者工具</li>
            <li>切换到 <b>Network（网络）</b> 标签页</li>
            <li>在页面中随便点击一个请求</li>
            <li>在请求头中找到 <b>Cookie</b> 字段，复制完整内容</li>
          </ol>
        </div>
        <NInput
          v-model:value="cookieValue"
          type="textarea"
          :rows="4"
          placeholder="粘贴完整 Cookie 内容..."
        />
      </NSpace>
      <template #action>
        <NSpace>
          <NButton @click="showCookieModal = false">取消</NButton>
          <NButton type="primary" :loading="cookieSaving" @click="handleSaveCookie">保存</NButton>
        </NSpace>
      </template>
    </NModal>

    <!-- 监控账号弹窗 -->
    <NModal v-model:show="showAccountModal" preset="dialog" title="👤 监控竞品账号" style="width: 520px;">
      <NSpace vertical>
        <div class="cookie-guide">
          <p>输入竞品的小红书主页链接，自动采集其所有笔记。</p>
          <p style="color: #999; font-size: 13px;">格式：https://www.xiaohongshu.com/user/profile/xxxxx</p>
        </div>
        <NInput
          v-model:value="accountUrl"
          placeholder="https://www.xiaohongshu.com/user/profile/xxxxx"
        />
        <NSelect v-model:value="accountCategory" :options="categoryOptions" placeholder="内容分类（可选）" />
      </NSpace>
      <template #action>
        <NSpace>
          <NButton @click="showAccountModal = false">取消</NButton>
          <NButton type="primary" :loading="accountCrawling" @click="handleCrawlAccount">开始采集</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<style scoped lang="scss">
// 状态卡片
.status-card {
  display: flex;
  align-items: center;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-label {
  font-size: 14px;
  font-weight: 500;
}

.status-sub {
  font-size: 12px;
  color: #999;
  margin-top: 6px;
}

.stat-suffix {
  font-size: 13px;
  color: #999;
  margin-left: 4px;
}

// 搜索面板
.search-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.search-row {
  display: flex;
  gap: 12px;
}

.search-options {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.search-result {
  padding: 8px 12px;
  background: #f0fdf4;
  border-radius: 6px;
  font-size: 13px;
  color: #166534;
}

// 趋势
.trends-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.trend-item {
  padding: 12px;
  border-radius: 8px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
}

.trend-cat {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 6px;
}

.trend-stats {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #666;
}

// 内容卡片
.content-card {
  margin-bottom: 10px;
}

.content-row {
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 12px;
}

.content-main {
  flex: 1;
  min-width: 0;
}

.content-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.content-title {
  font-weight: 500;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.content-body {
  font-size: 13px;
  color: #666;
  margin-bottom: 6px;
  line-height: 1.5;
  max-height: 60px;
  overflow: hidden;
}

.content-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #999;
}

.content-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

// 空状态
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;

  .empty-icon { font-size: 48px; margin-bottom: 16px; }
  p { font-size: 14px; }
}

// Cookie 引导
.cookie-guide {
  padding: 12px 16px;
  background: #f0f9ff;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.8;

  ol {
    padding-left: 20px;
    margin-top: 6px;
  }

  kbd {
    background: #e5e7eb;
    padding: 1px 6px;
    border-radius: 3px;
    font-size: 12px;
    font-family: monospace;
  }

  a {
    color: #2563eb;
    text-decoration: underline;
  }
}
</style>
