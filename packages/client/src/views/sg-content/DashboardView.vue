<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NStatistic, NGrid, NGridItem, NCard, NSpin, NTag, NButton } from 'naive-ui'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/sg-content/app'
import { getRecentContents, getPendingReview, getTopTopics, getTodaySchedule } from '@/api/sg-content/dashboard'

const router = useRouter()
const appStore = useAppStore()
const recentContents = ref<any[]>([])
const pendingReview = ref<any[]>([])
const topTopics = ref<any[]>([])
const todaySchedule = ref<any[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    await appStore.fetchStats()
    const [recent, pending, topics, schedule] = await Promise.all([
      getRecentContents(),
      getPendingReview(),
      getTopTopics(),
      getTodaySchedule(),
    ])
    recentContents.value = recent
    pendingReview.value = pending
    topTopics.value = topics
    todaySchedule.value = schedule
  } finally {
    loading.value = false
  }
})

function getScoreClass(score: number | null) {
  if (!score) return ''
  if (score >= 80) return 'score-high'
  if (score >= 60) return 'score-mid'
  return 'score-low'
}

function getStatusTag(status: string) {
  const map: Record<string, { type: 'success' | 'warning' | 'info' | 'error' | 'default', label: string }> = {
    draft: { type: 'default', label: '草稿' },
    approved: { type: 'success', label: '已通过' },
    reviewing: { type: 'warning', label: '审核中' },
    published: { type: 'info', label: '已发布' },
    rejected: { type: 'error', label: '已打回' },
    completed: { type: 'success', label: '已完成' },
    in_progress: { type: 'warning', label: '进行中' },
  }
  return map[status] || { type: 'default', label: status }
}
</script>

<template>
  <div>
    <NSpin :show="loading">
      <!-- Stats Cards -->
      <NGrid :cols="4" :x-gap="16" :y-gap="16" class="stats-grid">
        <NGridItem>
          <NCard size="small">
            <NStatistic label="采集内容" :value="appStore.stats?.contents_total || 0">
              <template #suffix>
                <span style="font-size: 12px; color: #999;">
                  (自有 {{ appStore.stats?.contents_self || 0 }} / 竞品 {{ appStore.stats?.contents_competitor || 0 }})
                </span>
              </template>
            </NStatistic>
          </NCard>
        </NGridItem>
        <NGridItem>
          <NCard size="small">
            <NStatistic label="本周发布" :value="appStore.stats?.published_this_week || 0" />
          </NCard>
        </NGridItem>
        <NGridItem>
          <NCard size="small">
            <NStatistic label="平均质量分" :value="appStore.stats?.avg_quality_score || '-'" />
          </NCard>
        </NGridItem>
        <NGridItem>
          <NCard size="small">
            <NStatistic label="知识库条目" :value="appStore.stats?.knowledge_total || 0" />
          </NCard>
        </NGridItem>
      </NGrid>

      <!-- Two Column Layout -->
      <NGrid :cols="2" :x-gap="16" :y-gap="16" style="margin-top: 16px;">
        <!-- Today Schedule -->
        <NGridItem>
          <NCard title="📋 今日排期" size="small">
            <div v-if="todaySchedule.length === 0" class="empty-state">
              <p>今日暂无排期</p>
            </div>
            <div v-for="item in todaySchedule" :key="item.id" class="schedule-item">
              <span class="schedule-time">{{ item.scheduled_time || '未定' }}</span>
              <span class="schedule-title">{{ item.title }}</span>
              <NTag v-bind="getStatusTag(item.status)" size="small">{{ getStatusTag(item.status).label }}</NTag>
            </div>
          </NCard>
        </NGridItem>

        <!-- Top Topics -->
        <NGridItem>
          <NCard title="🔥 热门选题 TOP 5" size="small">
            <div v-if="topTopics.length === 0" class="empty-state">
              <p>暂无选题数据</p>
            </div>
            <div v-for="(item, idx) in topTopics" :key="item.id" class="topic-item">
              <span class="topic-rank">{{ idx + 1 }}</span>
              <span class="topic-title">{{ item.title }}</span>
              <span :class="getScoreClass(item.score)" class="topic-score">{{ item.score || '-' }}分</span>
            </div>
          </NCard>
        </NGridItem>
      </NGrid>

      <NGrid :cols="2" :x-gap="16" :y-gap="16" style="margin-top: 16px;">
        <!-- Pending Review -->
        <NGridItem>
          <NCard title="📝 待审核内容" size="small">
            <template #header-extra>
              <NButton text type="primary" @click="router.push({ name: 'content' })">查看全部</NButton>
            </template>
            <div v-if="pendingReview.length === 0" class="empty-state">
              <p>暂无待审核内容</p>
            </div>
            <div v-for="item in pendingReview" :key="item.id" class="review-item">
              <span class="review-title">{{ item.selected_title || '(无标题)' }}</span>
              <span :class="getScoreClass(item.quality_score)" class="topic-score">{{ item.quality_score || '-' }}分</span>
              <NTag v-bind="getStatusTag(item.status)" size="small">{{ getStatusTag(item.status).label }}</NTag>
            </div>
          </NCard>
        </NGridItem>

        <!-- Recent Contents -->
        <NGridItem>
          <NCard title="📦 最近采集" size="small">
            <template #header-extra>
              <NButton text type="primary" @click="router.push({ name: 'collection' })">查看全部</NButton>
            </template>
            <div v-if="recentContents.length === 0" class="empty-state">
              <p>暂无采集内容，前往数据采集页面开始</p>
            </div>
            <div v-for="item in recentContents" :key="item.id" class="content-item">
              <span class="content-title">{{ item.title || '(无标题)' }}</span>
              <span class="content-meta">
                ❤️ {{ item.likes }} · ⭐ {{ item.collects }} · 💬 {{ item.comments }}
              </span>
            </div>
          </NCard>
        </NGridItem>
      </NGrid>
    </NSpin>
  </div>
</template>

<style scoped lang="scss">
.stats-grid { margin-bottom: 0; }

.schedule-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #f5f5f5;

  &:last-child { border-bottom: none; }
}

.schedule-time {
  font-size: 13px;
  color: #888;
  min-width: 50px;
}

.schedule-title {
  flex: 1;
  font-size: 14px;
}

.topic-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid #f5f5f5;

  &:last-child { border-bottom: none; }
}

.topic-rank {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: #666;
  flex-shrink: 0;
}

.topic-title {
  flex: 1;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.topic-score {
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
}

.review-item, .content-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid #f5f5f5;

  &:last-child { border-bottom: none; }
}

.review-title, .content-title {
  flex: 1;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.content-meta {
  font-size: 12px;
  color: #888;
  flex-shrink: 0;
}

.empty-state {
  text-align: center;
  padding: 30px;
  color: #999;
  font-size: 14px;
}
</style>
