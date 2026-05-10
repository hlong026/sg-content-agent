<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NButton, NCard, NTag, NSpace, NSelect, NSpin, useMessage } from 'naive-ui'
import { useRouter } from 'vue-router'
import { listGeneratedContents, approveContent, rejectContent, type GeneratedContent } from '@/api/sg-content/generated-contents'
import { schedulePublish } from '@/api/sg-content/publishing'

const router = useRouter()
const message = useMessage()
const contents = ref<GeneratedContent[]>([])
const loading = ref(false)
const filterStatus = ref('')

const statusOptions = [
  { label: '全部', value: '' },
  { label: '草稿', value: 'draft' },
  { label: '审核中', value: 'reviewing' },
  { label: '已通过', value: 'approved' },
  { label: '已发布', value: 'published' },
  { label: '已打回', value: 'rejected' },
]

onMounted(() => fetchContents())

async function fetchContents() {
  loading.value = true
  try { contents.value = await listGeneratedContents(filterStatus.value ? { status: filterStatus.value } : undefined) }
  finally { loading.value = false }
}

function getStatusType(s: string): 'success'|'warning'|'info'|'error'|'default' {
  return ({ draft:'default', reviewing:'warning', approved:'success', published:'info', rejected:'error' } as any)[s] || 'default'
}
function getStatusLabel(s: string): string {
  return ({ draft:'草稿', reviewing:'审核中', approved:'已通过', published:'已发布', rejected:'已打回' } as any)[s] || s
}

async function handleApprove(item: GeneratedContent) {
  try { await approveContent(item.id); message.success('已通过审核'); fetchContents() }
  catch (e: any) { message.error(e.message) }
}

async function handleReject(item: GeneratedContent) {
  try { await rejectContent(item.id); message.success('已打回'); fetchContents() }
  catch (e: any) { message.error(e.message) }
}

async function handlePublish(item: GeneratedContent) {
  try {
    await schedulePublish(item.id, 'xiaohongshu', new Date().toISOString())
    message.success('已加入发布队列')
    fetchContents()
  } catch (e: any) { message.error(e.message) }
}
</script>

<template>
  <div>
    <div class="page-header">
      <h2>✍️ 内容工坊</h2>
      <NSelect v-model:value="filterStatus" :options="statusOptions" style="width:120px" @update:value="fetchContents" />
    </div>

    <NSpin :show="loading">
      <NCard v-for="item in contents" :key="item.id" size="small" style="margin-bottom:12px;cursor:pointer;transition:box-shadow .15s" @click="router.push({name:'contentDetail',params:{id:item.id}})">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:14px;font-weight:700;flex-shrink:0" :class="{'score-high':(item.quality_score||0)>=80,'score-mid':(item.quality_score||0)>=60&&(item.quality_score||0)<80,'score-low':(item.quality_score||0)<60}">
            {{ item.quality_score ? Math.round(item.quality_score) : '-' }}分
          </span>
          <span style="flex:1;font-size:15px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ item.selected_title || '(未选择标题)' }}</span>
          <NTag :type="getStatusType(item.status)" size="small">{{ getStatusLabel(item.status) }}</NTag>
        </div>
        <div v-if="item.body" style="margin-top:8px;font-size:13px;color:#666;line-height:1.5">{{ item.body?.substring(0, 150) }}...</div>
        <div style="margin-top:8px;display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#999">
          <span>📅 {{ item.created_at?.split(' ')[0] }} · 📝 {{ item.body?.length || 0 }}字</span>
          <NSpace v-if="item.status==='draft'||item.status==='reviewing'" @click.stop>
            <NButton size="tiny" type="primary" @click="handleApprove(item)">通过</NButton>
            <NButton size="tiny" @click="handlePublish(item)">加入发布</NButton>
            <NButton size="tiny" type="error" quaternary @click="handleReject(item)">打回</NButton>
          </NSpace>
          <NButton v-if="item.status==='approved'" size="tiny" type="primary" @click.stop="handlePublish(item)">发布</NButton>
        </div>
      </NCard>

      <div v-if="!loading&&contents.length===0" style="text-align:center;padding:60px;color:#999">
        <div style="font-size:48px;margin-bottom:12px">✍️</div>
        <p>暂无生成内容，前往选题中心点击「生成内容」</p>
      </div>
    </NSpin>
  </div>
</template>

<style scoped>
.score-high { color: #22c55e; }
.score-mid { color: #f59e0b; }
.score-low { color: #ef4444; }
</style>
