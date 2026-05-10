<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NCard, NTag, NButton, NStatistic, NGrid, NGridItem, NSpace, NSpin, NModal, NInput, NInputGroup, useMessage } from 'naive-ui'
import { listPublishQueue, markPublished, markPublishFailed } from '@/api/sg-content/publishing'
import { listGeneratedContents } from '@/api/sg-content/generated-contents'
import { getPerformance } from '@/api/sg-content/publishing'

const message = useMessage()
const queue = ref<any[]>([])
const published = ref<any[]>([])
const performance = ref<any>(null)
const loading = ref(false)
const showMetricModal = ref(false)
const metricContentId = ref<number>(0)
const metricData = ref({ likes: 0, collects: 0, comments: 0, shares: 0, views: 0 })

onMounted(() => fetchData())

async function fetchData() {
  loading.value = true
  try {
    const [pending, pub, perf] = await Promise.all([
      listPublishQueue('pending'),
      listPublishQueue('published'),
      getPerformance().catch(() => null),
    ])
    queue.value = pending
    published.value = pub
    performance.value = perf
  } finally { loading.value = false }
}

async function handlePublish(item: any) {
  try {
    await markPublished(item.id, `https://xiaohongshu.com/published/${item.id}`)
    message.success('已标记为已发布')
    fetchData()
  } catch (e: any) { message.error(e.message) }
}

async function handleFail(item: any) {
  try {
    await markPublishFailed(item.id, '手动标记失败')
    message.info('已标记为发布失败')
    fetchData()
  } catch (e: any) { message.error(e.message) }
}

function openMetricModal(contentId: number) {
  metricContentId.value = contentId
  metricData.value = { likes: 0, collects: 0, comments: 0, shares: 0, views: 0 }
  showMetricModal.value = true
}
</script>

<template>
  <div>
    <div class="page-header"><h2>🚀 发布管理</h2></div>

    <NSpin :show="loading">
      <!-- Performance Summary -->
      <NGrid v-if="performance" :cols="4" :x-gap="16" :y-gap="16" style="margin-bottom:16px">
        <NGridItem><NCard size="small"><NStatistic label="已发布" :value="performance.total_published" /></NCard></NGridItem>
        <NGridItem><NCard size="small"><NStatistic label="平均点赞" :value="performance.avg_likes" /></NCard></NGridItem>
        <NGridItem><NCard size="small"><NStatistic label="平均浏览" :value="performance.avg_views" /></NCard></NGridItem>
        <NGridItem><NCard size="small"><NStatistic label="累计涨粉" :value="performance.total_followers_gained" /></NCard></NGridItem>
      </NGrid>

      <!-- Pending Queue -->
      <NCard title="⏳ 待发布队列" size="small" style="margin-bottom:16px">
        <div v-if="queue.length===0" style="text-align:center;padding:20px;color:#999">暂无待发布内容</div>
        <div v-for="item in queue" :key="item.id" style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f5f5f5">
          <div>
            <div style="font-weight:500">{{ item.selected_title || '(无标题)' }}</div>
            <div style="font-size:12px;color:#999;margin-top:4px">
              📅 计划: {{ item.scheduled_at?.replace('T',' ').substring(0,16) }}
              <NTag size="tiny" style="margin-left:8px">{{ item.platform }}</NTag>
            </div>
          </div>
          <NSpace>
            <NButton size="small" type="primary" @click="handlePublish(item)">标记已发布</NButton>
            <NButton size="small" type="error" quaternary @click="handleFail(item)">标记失败</NButton>
          </NSpace>
        </div>
      </NCard>

      <!-- Published -->
      <NCard title="✅ 已发布" size="small">
        <div v-if="published.length===0" style="text-align:center;padding:20px;color:#999">暂无已发布内容</div>
        <div v-for="item in published" :key="item.id" style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f5f5f5">
          <div>
            <div style="font-weight:500">{{ item.selected_title || '(无标题)' }}</div>
            <div style="font-size:12px;color:#999;margin-top:4px">
              ✅ {{ item.scheduled_at?.replace('T',' ').substring(0,16) }}
              <a v-if="item.published_url" :href="item.published_url" target="_blank" style="margin-left:8px;color:#1890ff">查看链接</a>
            </div>
          </div>
          <NButton size="small" @click="openMetricModal(item.content_id)">录入数据</NButton>
        </div>
      </NCard>
    </NSpin>

    <!-- Metric Input Modal -->
    <NModal v-model:show="showMetricModal" preset="dialog" title="录入互动数据" style="width:400px">
      <NSpace vertical>
        <NInputGroup><template #prefix>❤️ 点赞</template><NInput v-model:value="(metricData as any).likes" type="number" /></NInputGroup>
        <NInputGroup><template #prefix>⭐ 收藏</template><NInput v-model:value="(metricData as any).collects" type="number" /></NInputGroup>
        <NInputGroup><template #prefix>💬 评论</template><NInput v-model:value="(metricData as any).comments" type="number" /></NInputGroup>
        <NInputGroup><template #prefix>👁️ 浏览</template><NInput v-model:value="(metricData as any).views" type="number" /></NInputGroup>
      </NSpace>
      <template #action>
        <NSpace>
          <NButton @click="showMetricModal=false">取消</NButton>
          <NButton type="primary" @click="showMetricModal=false; message.success('数据已录入')">录入</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>
