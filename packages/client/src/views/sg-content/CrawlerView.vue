<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import {
  NButton, NCard, NTag, NSelect, NSpace, NStatistic, NModal, NInput,
  NGrid, NGridItem, NSpin, NPopconfirm, useMessage,
} from 'naive-ui'
import {
  getCrawlerStatus, getXhsCookie, updateXhsCookie, searchAndCrawl, crawlNoteDetail,
  batchCrawlDetails, crawlAccount, getCategoryTrends,
  listCompetitors, addCompetitor, deleteCompetitor,
  type CrawlerStatus, type CrawlResult, type CategoryTrend, type Competitor,
} from '@/api/sg-content/xhs-crawler'
import {
  listContents, getContent, deleteContent, type Content,
} from '@/api/sg-content/contents'

const message = useMessage()

// ─── State ──────────────────────────────────────────────
const loading = ref(false)
const crawlerStatus = ref<CrawlerStatus | null>(null)
const contents = ref<Content[]>([])
const totalContents = ref(0)
const trends = ref<CategoryTrend[]>([])
const competitors = ref<Competitor[]>([])

// 分页
const currentPage = ref(1)
const pageSize = ref(20)

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
const accountName = ref('')
const accountCategory = ref<string | null>(null)
const accountCrawling = ref(false)

// 详情补全
const batchCrawling = ref(false)

// 筛选
const filterSource = ref('')

// 笔记详情弹窗
const showDetailModal = ref(false)
const detailContent = ref<Content | null>(null)
const detailLoading = ref(false)

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
const totalPages = computed(() => Math.max(1, Math.ceil(totalContents.value / pageSize.value)))
const pageNumbers = computed(() => {
  const pages: number[] = []
  const start = Math.max(1, currentPage.value - 2)
  const end = Math.min(totalPages.value, currentPage.value + 2)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

// ─── Actions ────────────────────────────────────────────

onMounted(() => fetchData())

async function fetchData() {
  loading.value = true
  try {
    const [status, c, t, comps] = await Promise.all([
      getCrawlerStatus().catch(() => null),
      listContents({ source_type: filterSource.value || undefined, limit: pageSize.value, offset: (currentPage.value - 1) * pageSize.value }),
      getCategoryTrends().catch(() => []),
      listCompetitors().catch(() => []),
    ])
    crawlerStatus.value = status
    contents.value = c.data
    totalContents.value = c.total
    trends.value = t
    competitors.value = comps
  } finally {
    loading.value = false
  }
}

function changePage(page: number) {
  currentPage.value = page
  fetchData()
}

async function handleSearch() {
  if (!searchQuery.value.trim()) { message.warning('请输入搜索关键词'); return }
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
    currentPage.value = 1
    fetchData()
  } catch (e: any) { message.error(e.message) }
  finally { searchCrawling.value = false }
}

async function openCookieModal() {
  try {
    const saved = await getXhsCookie()
    cookieValue.value = saved.value || ''
  } catch { cookieValue.value = '' }
  showCookieModal.value = true
}

async function handleSaveCookie() {
  if (!cookieValue.value.trim()) { message.warning('请输入 Cookie'); return }
  cookieSaving.value = true
  try {
    await updateXhsCookie(cookieValue.value.trim())
    message.success('Cookie 已保存（持久化存储）')
    showCookieModal.value = false
    fetchData()
  } catch (e: any) { message.error(e.message) }
  finally { cookieSaving.value = false }
}

async function handleCrawlAccount() {
  if (!accountUrl.value.trim()) { message.warning('请输入账号主页链接'); return }
  accountCrawling.value = true
  try {
    const result = await crawlAccount({
      user_url: accountUrl.value.trim(),
      category: accountCategory.value || undefined,
      account_name: accountName.value || undefined,
    })
    message.success(`采集完成：新增 ${result.crawled} 条，账号已保存`)
    showAccountModal.value = false
    accountUrl.value = ''
    accountName.value = ''
    fetchData()
  } catch (e: any) { message.error(e.message) }
  finally { accountCrawling.value = false }
}

async function handleCrawlCompetitor(comp: Competitor) {
  try {
    const result = await crawlAccount({ user_url: comp.account_url!, category: comp.category || undefined })
    message.success(`${comp.account_name || comp.account_id}：新增 ${result.crawled} 条`)
    fetchData()
  } catch (e: any) { message.error(e.message) }
}

async function handleDeleteCompetitor(id: number) {
  try {
    await deleteCompetitor(id)
    message.success('已删除')
    fetchData()
  } catch (e: any) { message.error(e.message) }
}

async function handleBatchDetails() {
  batchCrawling.value = true
  try {
    const result = await batchCrawlDetails(20)
    message.success(`补全完成：${result.updated} 篇成功`)
    fetchData()
  } catch (e: any) { message.error(e.message) }
  finally { batchCrawling.value = false }
}

async function handleGetDetail(id: number) {
  detailLoading.value = true
  try {
    const content = await crawlNoteDetail(id)
    detailContent.value = content
    // 更新列表中对应条目
    const idx = contents.value.findIndex(c => c.id === id)
    if (idx >= 0 && content) contents.value[idx] = content
    showDetailModal.value = true
  } catch (e: any) { message.error(e.message) }
  finally { detailLoading.value = false }
}

async function openDetail(id: number) {
  detailLoading.value = true
  showDetailModal.value = true
  try {
    const content = await getContent(id)
    detailContent.value = content
    // 如果没有正文，尝试自动获取
    if (!content.body && content.source_id) {
      const fetched = await crawlNoteDetail(id)
      detailContent.value = fetched
      const idx = contents.value.findIndex(c => c.id === id)
      if (idx >= 0 && fetched) contents.value[idx] = fetched
    }
  } catch (e: any) { message.error(e.message) }
  finally { detailLoading.value = false }
}

async function handleDelete(id: number) {
  try { await deleteContent(id); message.success('已删除'); fetchData() }
  catch (e: any) { message.error(e.message) }
}

function parseTags(raw: any): string[] {
  if (!raw) return []
  try { return typeof raw === 'string' ? JSON.parse(raw) : raw }
  catch { return [] }
}

function parseImages(raw: any): string[] {
  if (!raw) return []
  try { return typeof raw === 'string' ? JSON.parse(raw) : raw }
  catch { return [] }
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
        <NButton @click="openCookieModal">🍪 Cookie</NButton>
        <NButton @click="showAccountModal = true">👤 监控账号</NButton>
        <NButton type="primary" :loading="batchCrawling" @click="handleBatchDetails">📥 批量补全详情</NButton>
      </NSpace>
    </div>

    <NSpin :show="loading">
      <!-- 服务状态 + 数据概览 -->
      <NGrid :cols="4" :x-gap="16" :y-gap="16" style="margin-bottom: 20px;">
        <NGridItem>
          <NCard size="small">
            <div class="status-indicator">
              <span class="status-dot" :style="{ background: statusColor }"></span>
              <span class="status-label">{{ statusText }}</span>
            </div>
            <div class="status-sub" v-if="crawlerStatus?.online">Spider_XHS :5557</div>
          </NCard>
        </NGridItem>
        <NGridItem>
          <NCard size="small">
            <NStatistic label="采集总量" :value="totalContents">
              <template #suffix><span class="stat-suffix">篇</span></template>
            </NStatistic>
          </NCard>
        </NGridItem>
        <NGridItem>
          <NCard size="small">
            <NStatistic label="竞品内容" :value="crawlerStatus?.stats?.competitorContents || 0">
              <template #suffix><span class="stat-suffix">篇</span></template>
            </NStatistic>
          </NCard>
        </NGridItem>
        <NGridItem>
          <NCard size="small">
            <NStatistic label="待补详情" :value="crawlerStatus?.stats?.missingDetails || 0">
              <template #suffix><span class="stat-suffix">篇</span></template>
            </NStatistic>
          </NCard>
        </NGridItem>
      </NGrid>

      <!-- 搜索采集面板 -->
      <NCard title="🔍 关键词搜索采集" size="small" style="margin-bottom: 20px;">
        <div class="search-panel">
          <div class="search-row">
            <NInput v-model:value="searchQuery" placeholder="输入关键词搜索小红书，如：新加坡留学、NUS申请、新加坡租房" size="large" @keyup.enter="handleSearch" style="flex:1;" />
            <NButton type="primary" size="large" :loading="searchCrawling" @click="handleSearch">🔍 搜索采集</NButton>
          </div>
          <div class="search-options">
            <NSelect v-model:value="searchSort" :options="sortOptions" style="width:160px;" />
            <NSelect v-model:value="searchNum" :options="numOptions" style="width:110px;" />
            <NSelect v-model:value="searchCategory" :options="categoryOptions" style="width:160px;" />
            <NSelect v-model:value="searchSourceType" :options="[{ label:'标记为竞品', value:'competitor' }, { label:'标记为自有', value:'self' }]" style="width:140px;" />
          </div>
          <div v-if="searchResult" class="search-result">
            ✅ 采集完成：新增 <b>{{ searchResult.crawled }}</b> 条
            <span v-if="searchResult.skipped">，跳过重复 {{ searchResult.skipped }} 条</span>
            <span v-if="searchResult.errors">，失败 {{ searchResult.errors }} 条</span>
          </div>
        </div>
      </NCard>

      <!-- 赛道趋势 + 竞品监控 -->
      <NGrid :cols="2" :x-gap="16" :y-gap="16" style="margin-bottom: 20px;">
        <NGridItem>
          <NCard title="📊 赛道分类趋势" size="small">
            <div v-if="trends.length === 0" class="empty-hint">采集内容后自动生成趋势数据</div>
            <div class="trends-grid" v-else>
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
        </NGridItem>
        <NGridItem>
          <NCard title="👤 监控中的竞品" size="small">
            <template #header-extra>
              <NButton text type="primary" size="small" @click="showAccountModal = true">+ 添加</NButton>
            </template>
            <div v-if="competitors.length === 0" class="empty-hint">点击右上角添加竞品账号</div>
            <div v-for="comp in competitors" :key="comp.id" class="comp-item">
              <div class="comp-info">
                <span class="comp-name">{{ comp.account_name || comp.account_id }}</span>
                <NTag v-if="comp.category" size="tiny">{{ comp.category }}</NTag>
                <span class="comp-date" v-if="comp.last_crawled_at">最近采集: {{ comp.last_crawled_at?.split(' ')[0] }}</span>
              </div>
              <NSpace>
                <NButton size="tiny" type="info" @click="handleCrawlCompetitor(comp)">🔄 采集</NButton>
                <NPopconfirm @positive-click="handleDeleteCompetitor(comp.id)">
                  <template #trigger><NButton size="tiny" type="error" quaternary>删除</NButton></template>
                  确认移除此竞品？
                </NPopconfirm>
              </NSpace>
            </div>
          </NCard>
        </NGridItem>
      </NGrid>

      <!-- 内容列表 -->
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
        <h3 style="font-size:16px;">采集内容 <span style="color:#999; font-weight:400; font-size:13px;">共 {{ totalContents }} 条</span></h3>
        <NSelect v-model:value="filterSource" :options="sourceFilterOptions" style="width:120px;" @update:value="() => { currentPage = 1; fetchData() }" />
      </div>

      <NCard v-for="item in contents" :key="item.id" size="small" class="content-card">
        <div class="content-row">
          <div class="content-main">
            <div class="content-header">
              <NTag size="small" :type="item.source_type === 'self' ? 'success' : 'warning'">{{ item.source_type === 'self' ? '自有' : '竞品' }}</NTag>
              <span class="content-title clickable" @click="openDetail(item.id)">{{ item.title || '(无标题)' }}</span>
              <NTag v-if="item.category" size="tiny" type="info">{{ item.category }}</NTag>
              <NTag v-if="!item.body" size="tiny" type="warning">无详情</NTag>
            </div>
            <div v-if="item.body" class="content-body">{{ item.body.substring(0, 120) }}{{ item.body.length > 120 ? '...' : '' }}</div>
            <div class="content-meta">
              <span v-if="item.source_name">✍️ {{ item.source_name }}</span>
              <span>❤️ {{ formatNum(item.likes) }}</span>
              <span>⭐ {{ formatNum(item.collects) }}</span>
              <span>💬 {{ formatNum(item.comments) }}</span>
              <span>📅 {{ item.crawled_at?.split(' ')[0] }}</span>
              <span v-if="parseTags(item.tags).length">🏷️ {{ parseTags(item.tags).slice(0, 3).join(' · ') }}</span>
            </div>
          </div>
          <div class="content-actions">
            <NButton v-if="!item.body" size="tiny" type="info" :loading="detailLoading" @click="handleGetDetail(item.id)">获取详情</NButton>
            <NButton size="tiny" @click="openDetail(item.id)">查看</NButton>
            <NPopconfirm @positive-click="handleDelete(item.id)">
              <template #trigger><NButton size="tiny" type="error" quaternary>删除</NButton></template>
              确认删除？
            </NPopconfirm>
          </div>
        </div>
      </NCard>

      <!-- 分页 -->
      <div v-if="totalPages > 1" class="pagination">
        <NButton size="small" :disabled="currentPage <= 1" @click="changePage(currentPage - 1)">上一页</NButton>
        <NButton v-for="p in pageNumbers" :key="p" size="small" :type="p === currentPage ? 'primary' : 'default'" @click="changePage(p)">{{ p }}</NButton>
        <NButton size="small" :disabled="currentPage >= totalPages" @click="changePage(currentPage + 1)">下一页</NButton>
        <span class="page-info">第 {{ currentPage }}/{{ totalPages }} 页</span>
      </div>

      <div v-if="!loading && contents.length === 0" class="empty-state">
        <div class="empty-icon">🔍</div>
        <p>暂无采集内容，使用上方搜索框开始采集小红书内容</p>
      </div>
    </NSpin>

    <!-- Cookie 设置弹窗 -->
    <NModal v-model:show="showCookieModal" preset="dialog" title="🍪 小红书 Cookie 设置" style="width:640px;">
      <NSpace vertical>
        <div class="guide-box">
          <p><b>如何获取 Cookie：</b></p>
          <ol>
            <li>在浏览器打开 <a href="https://www.xiaohongshu.com" target="_blank">xiaohongshu.com</a> 并登录</li>
            <li>按 <kbd>F12</kbd> 打开开发者工具 → <b>Network</b> 标签</li>
            <li>点击任意请求 → 找到请求头中的 <b>Cookie</b> 字段 → 复制完整内容</li>
          </ol>
        </div>
        <NInput v-model:value="cookieValue" type="textarea" :rows="4" placeholder="粘贴完整 Cookie 内容..." />
        <div class="guide-box" style="background:#fff7ed;">
          💡 Cookie 会持久化保存到数据库，服务重启后自动恢复。
        </div>
      </NSpace>
      <template #action>
        <NSpace>
          <NButton @click="showCookieModal = false">取消</NButton>
          <NButton type="primary" :loading="cookieSaving" @click="handleSaveCookie">💾 保存</NButton>
        </NSpace>
      </template>
    </NModal>

    <!-- 监控账号弹窗 -->
    <NModal v-model:show="showAccountModal" preset="dialog" title="👤 添加监控账号" style="width:520px;">
      <NSpace vertical>
        <div class="guide-box">
          输入竞品的小红书主页链接，自动采集其所有笔记并保存为长期监控账号。
          <div style="color:#999; font-size:12px; margin-top:4px;">格式：https://www.xiaohongshu.com/user/profile/xxxxx</div>
        </div>
        <NInput v-model:value="accountUrl" placeholder="https://www.xiaohongshu.com/user/profile/xxxxx" />
        <NInput v-model:value="accountName" placeholder="账号名称（可选，方便识别）" />
        <NSelect v-model:value="accountCategory" :options="categoryOptions" placeholder="默认分类（可选）" />
      </NSpace>
      <template #action>
        <NSpace>
          <NButton @click="showAccountModal = false">取消</NButton>
          <NButton type="primary" :loading="accountCrawling" @click="handleCrawlAccount">采集并保存</NButton>
        </NSpace>
      </template>
    </NModal>

    <!-- 笔记详情弹窗 -->
    <NModal v-model:show="showDetailModal" preset="dialog" :title="detailContent?.title || '笔记详情'" style="width:720px;">
      <NSpin :show="detailLoading">
        <div v-if="detailContent" class="detail-content">
          <!-- 元信息 -->
          <div class="detail-meta-bar">
            <NTag :type="detailContent.source_type === 'self' ? 'success' : 'warning'" size="small">{{ detailContent.source_type === 'self' ? '自有' : '竞品' }}</NTag>
            <NTag v-if="detailContent.category" size="small" type="info">{{ detailContent.category }}</NTag>
            <span v-if="detailContent.source_name">✍️ {{ detailContent.source_name }}</span>
            <span>❤️ {{ formatNum(detailContent.likes) }}</span>
            <span>⭐ {{ formatNum(detailContent.collects) }}</span>
            <span>💬 {{ formatNum(detailContent.comments) }}</span>
          </div>

          <!-- 标签 -->
          <div v-if="parseTags(detailContent.tags).length" class="detail-tags">
            <NTag v-for="tag in parseTags(detailContent.tags)" :key="tag" size="small" type="info" style="margin-right:6px;">{{ tag }}</NTag>
          </div>

          <!-- 封面图 -->
          <div v-if="parseImages(detailContent.images).length" class="detail-images">
            <img v-for="(img, idx) in parseImages(detailContent.images).slice(0, 6)" :key="idx" :src="img" class="detail-img" @error="($event.target as any).style.display='none'" />
          </div>

          <!-- 正文 -->
          <div v-if="detailContent.body" class="detail-body">{{ detailContent.body }}</div>
          <div v-else class="detail-empty">
            <p>⚠️ 暂无正文内容</p>
            <NButton type="primary" size="small" @click="handleGetDetail(detailContent!.id)">获取完整内容</NButton>
          </div>
        </div>
      </NSpin>
      <template #action>
        <NButton @click="showDetailModal = false">关闭</NButton>
      </template>
    </NModal>
  </div>
</template>

<style scoped lang="scss">
.status-indicator { display: flex; align-items: center; gap: 8px; }
.status-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.status-label { font-size: 14px; font-weight: 500; }
.status-sub { font-size: 12px; color: #999; margin-top: 6px; }
.stat-suffix { font-size: 13px; color: #999; margin-left: 4px; }

.search-panel { display: flex; flex-direction: column; gap: 12px; }
.search-row { display: flex; gap: 12px; }
.search-options { display: flex; gap: 12px; flex-wrap: wrap; }
.search-result { padding: 8px 12px; background: #f0fdf4; border-radius: 6px; font-size: 13px; color: #166534; }

.trends-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
.trend-item { padding: 10px; border-radius: 6px; background: #f9fafb; border: 1px solid #e5e7eb; }
.trend-cat { font-weight: 600; font-size: 13px; margin-bottom: 4px; }
.trend-stats { display: flex; gap: 10px; font-size: 12px; color: #666; }

.comp-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #f0f0f0;
  &:last-child { border-bottom: none; }
}
.comp-info { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
.comp-name { font-weight: 500; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.comp-date { font-size: 11px; color: #999; flex-shrink: 0; }

.content-card { margin-bottom: 10px; }
.content-row { display: flex; justify-content: space-between; align-items: start; gap: 12px; }
.content-main { flex: 1; min-width: 0; }
.content-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.content-title { font-weight: 500; font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.content-title.clickable { cursor: pointer; }
.content-title.clickable:hover { color: #18a058; }
.content-body { font-size: 13px; color: #666; margin-bottom: 6px; line-height: 1.5; max-height: 60px; overflow: hidden; }
.content-meta { display: flex; gap: 10px; font-size: 12px; color: #999; flex-wrap: wrap; }
.content-actions { display: flex; gap: 6px; flex-shrink: 0; }

.pagination { display: flex; align-items: center; gap: 6px; margin-top: 16px; justify-content: center; }
.page-info { font-size: 12px; color: #999; margin-left: 8px; }

.empty-state, .empty-hint { text-align: center; padding: 40px 20px; color: #999; font-size: 14px; }
.empty-state .empty-icon { font-size: 48px; margin-bottom: 16px; }

.guide-box { padding: 12px 16px; background: #f0f9ff; border-radius: 8px; font-size: 13px; line-height: 1.8;
  ol { padding-left: 20px; margin-top: 6px; }
  kbd { background: #e5e7eb; padding: 1px 6px; border-radius: 3px; font-size: 12px; font-family: monospace; }
  a { color: #2563eb; text-decoration: underline; }
}

// 详情弹窗
.detail-content { max-height: 70vh; overflow-y: auto; }
.detail-meta-bar { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; font-size: 13px; color: #666; flex-wrap: wrap; }
.detail-tags { margin-bottom: 12px; }
.detail-images { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 12px; }
.detail-img { width: 100%; border-radius: 6px; aspect-ratio: 4/5; object-fit: cover; background: #f5f5f5; }
.detail-body { font-size: 14px; line-height: 1.8; white-space: pre-wrap; word-break: break-word; color: #333;
  background: #fafafa; padding: 16px; border-radius: 8px; border: 1px solid #eee;
}
.detail-empty { text-align: center; padding: 40px; color: #999; }
</style>
