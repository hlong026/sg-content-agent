<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NButton, NCard, NTag, NModal, NInput, NSelect, NSpace, NSpin, useMessage } from 'naive-ui'
import { listTopics, createTopic, updateTopic, deleteTopic, type Topic } from '@/api/sg-content/topics'
import { generateContent, recommendTopics } from '@/api/sg-content/generation'
import { useRouter } from 'vue-router'

const router = useRouter()
const message = useMessage()
const topics = ref<Topic[]>([])
const loading = ref(false)
const showModal = ref(false)
const editingTopic = ref<Partial<Topic>>({})
const isEdit = ref(false)
const generating = ref(false)
const recommending = ref(false)

const categoryOptions = [
  { label: '🏫 院校相关', value: '院校相关' },
  { label: '📋 申请攻略', value: '申请攻略' },
  { label: '🇸🇬 生活指南', value: '生活指南' },
  { label: '💰 费用相关', value: '费用相关' },
  { label: '📑 政策解读', value: '政策解读' },
  { label: '🎓 就业发展', value: '就业发展' },
  { label: '🔥 热点时效', value: '热点时效' },
]

const statusFilter = ref('')
const statusOptions = [
  { label: '全部', value: '' },
  { label: '草稿', value: 'draft' },
  { label: '已审批', value: 'approved' },
  { label: '进行中', value: 'in_progress' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' },
]

onMounted(() => fetchTopics())

async function fetchTopics() {
  loading.value = true
  try { topics.value = await listTopics(statusFilter.value ? { status: statusFilter.value } : undefined) }
  finally { loading.value = false }
}

function openCreate() {
  editingTopic.value = { status: 'draft', source: 'manual', platform: 'xiaohongshu' }
  isEdit.value = false
  showModal.value = true
}

function openEdit(topic: Topic) {
  editingTopic.value = { ...topic }
  isEdit.value = true
  showModal.value = true
}

async function handleSave() {
  if (!editingTopic.value.title) { message.warning('请输入选题标题'); return }
  try {
    if (isEdit.value && editingTopic.value.id) {
      await updateTopic(editingTopic.value.id, editingTopic.value)
      message.success('选题已更新')
    } else {
      await createTopic(editingTopic.value)
      message.success('选题已创建')
    }
    showModal.value = false
    fetchTopics()
  } catch (e: any) { message.error(e.message) }
}

async function handleDelete(id: number) {
  try { await deleteTopic(id); message.success('已删除'); fetchTopics() }
  catch (e: any) { message.error(e.message) }
}

async function handleApprove(topic: Topic) {
  try { await updateTopic(topic.id, { status: 'approved' }); message.success('已审批'); fetchTopics() }
  catch (e: any) { message.error(e.message) }
}

async function handleGenerate(topic: Topic) {
  generating.value = true
  try {
    const content = await generateContent(topic.id)
    message.success('内容已生成！')
    router.push({ name: 'contentDetail', params: { id: content.id } })
  } catch (e: any) { message.error(e.message) }
  finally { generating.value = false }
}

async function handleRecommend() {
  recommending.value = true
  try {
    const recommended = await recommendTopics(5)
    if (recommended.length === 0) { message.info('暂无新推荐选题'); return }
    let created = 0
    for (const t of recommended) {
      try { await createTopic({ title: t.title, category: t.category, score: t.score, description: t.reason, source: 'ai_recommended', status: 'draft' }); created++ }
      catch { /* skip duplicates */ }
    }
    message.success(`已添加 ${created} 个AI推荐选题`)
    fetchTopics()
  } catch (e: any) { message.error(e.message) }
  finally { recommending.value = false }
}

function getStatusType(s: string): 'success'|'warning'|'info'|'error'|'default' {
  return ({ draft:'default', approved:'success', in_progress:'warning', completed:'info', cancelled:'error' } as any)[s] || 'default'
}
function getStatusLabel(s: string): string {
  return ({ draft:'草稿', approved:'已审批', in_progress:'生成中', completed:'已完成', cancelled:'已取消' } as any)[s] || s
}
</script>

<template>
  <div>
    <div class="page-header">
      <h2>📋 选题中心</h2>
      <NSpace>
        <NSelect v-model:value="statusFilter" :options="statusOptions" style="width:120px" @update:value="fetchTopics" />
        <NButton :loading="recommending" @click="handleRecommend">🤖 AI推荐选题</NButton>
        <NButton type="primary" @click="openCreate">+ 新建选题</NButton>
      </NSpace>
    </div>

    <NSpin :show="loading">
      <NCard v-for="topic in topics" :key="topic.id" size="small" style="margin-bottom:12px;cursor:pointer">
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0">
            <span style="font-size:14px;font-weight:700;flex-shrink:0" :class="{'score-high':(topic.score||0)>=80,'score-mid':(topic.score||0)>=60&&(topic.score||0)<80,'score-low':(topic.score||0)<60}">
              {{ topic.score ? Math.round(topic.score) : '-' }}分
            </span>
            <span style="font-size:15px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ topic.title }}</span>
            <NTag v-if="topic.category" size="small" type="info">{{ topic.category }}</NTag>
            <NTag :type="getStatusType(topic.status)" size="small">{{ getStatusLabel(topic.status) }}</NTag>
          </div>
          <NSpace>
            <NButton v-if="topic.status==='approved'" size="small" type="primary" :loading="generating" @click.stop="handleGenerate(topic)">生成内容</NButton>
            <NButton v-if="topic.status==='draft'" size="small" type="primary" @click.stop="handleApprove(topic)">审批</NButton>
            <NButton size="small" @click.stop="openEdit(topic)">编辑</NButton>
            <NButton size="small" type="error" quaternary @click.stop="handleDelete(topic.id)">删除</NButton>
          </NSpace>
        </div>
        <div v-if="topic.description" style="margin-top:8px;font-size:13px;color:#666">{{ topic.description }}</div>
        <div style="margin-top:8px;display:flex;gap:16px;font-size:12px;color:#999">
          <span>来源: {{ topic.source==='ai_recommended'?'AI推荐':topic.source==='manual'?'手动':'其他' }}</span>
          <span v-if="topic.scheduled_date">📅 {{ topic.scheduled_date }} {{ topic.scheduled_time }}</span>
        </div>
      </NCard>

      <div v-if="!loading && topics.length===0" style="text-align:center;padding:60px;color:#999">
        <div style="font-size:48px;margin-bottom:12px">📋</div>
        <p>暂无选题，点击「AI推荐选题」自动生成</p>
      </div>
    </NSpin>

    <NModal v-model:show="showModal" preset="dialog" :title="isEdit?'编辑选题':'新建选题'" style="width:520px">
      <NSpace vertical>
        <div><label style="display:block;font-size:13px;margin-bottom:4px;color:#666">标题 *</label><NInput v-model:value="editingTopic.title" placeholder="输入选题标题" /></div>
        <div><label style="display:block;font-size:13px;margin-bottom:4px;color:#666">分类</label><NSelect v-model:value="editingTopic.category" :options="categoryOptions" placeholder="选择分类" clearable /></div>
        <div><label style="display:block;font-size:13px;margin-bottom:4px;color:#666">描述</label><NInput v-model:value="editingTopic.description" type="textarea" :rows="3" placeholder="选题描述（可选）" /></div>
        <div style="display:flex;gap:12px">
          <div style="flex:1"><label style="display:block;font-size:13px;margin-bottom:4px;color:#666">计划日期</label><NInput v-model:value="editingTopic.scheduled_date" placeholder="2025-01-20" /></div>
          <div style="flex:1"><label style="display:block;font-size:13px;margin-bottom:4px;color:#666">计划时间</label><NInput v-model:value="editingTopic.scheduled_time" placeholder="12:00" /></div>
        </div>
      </NSpace>
      <template #action>
        <NSpace><NButton @click="showModal=false">取消</NButton><NButton type="primary" @click="handleSave">{{ isEdit?'保存':'创建' }}</NButton></NSpace>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.score-high { color: #22c55e; }
.score-mid { color: #f59e0b; }
.score-low { color: #ef4444; }
</style>
