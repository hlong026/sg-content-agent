<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NButton, NCard, NInput, NTag, NSpace, NSpin, useMessage } from 'naive-ui'
import { getGeneratedContent, updateGeneratedContent, approveContent, rejectContent, type GeneratedContent } from '@/api/sg-content/generated-contents'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const content = ref<GeneratedContent | null>(null)
const loading = ref(true)
const editing = ref(false)
const editBody = ref('')
const editTitle = ref('')

onMounted(async () => {
  try {
    content.value = await getGeneratedContent(Number(route.params.id))
    editTitle.value = content.value?.selected_title || ''
    editBody.value = content.value?.body || ''
  } catch (e: any) {
    message.error(e.message)
  } finally {
    loading.value = false
  }
})

async function handleSave() {
  if (!content.value) return
  try {
    content.value = await updateGeneratedContent(content.value.id, {
      selected_title: editTitle.value,
      body: editBody.value,
    })
    editing.value = false
    message.success('已保存')
  } catch (e: any) { message.error(e.message) }
}

async function handleApprove() {
  if (!content.value) return
  try {
    content.value = await approveContent(content.value.id)
    message.success('已通过审核')
  } catch (e: any) { message.error(e.message) }
}

async function handleReject() {
  if (!content.value) return
  try {
    content.value = await rejectContent(content.value.id)
    message.success('已打回')
  } catch (e: any) { message.error(e.message) }
}

function getStatusType(status: string): 'success' | 'warning' | 'info' | 'error' | 'default' {
  const map: Record<string, any> = { draft: 'default', reviewing: 'warning', approved: 'success', published: 'info', rejected: 'error' }
  return map[status] || 'default'
}
</script>

<template>
  <div>
    <NSpin :show="loading">
      <div v-if="content" class="content-detail">
        <div class="page-header">
          <div style="display: flex; align-items: center; gap: 12px;">
            <NButton quaternary @click="router.push({ name: 'content' })">← 返回</NButton>
            <h2>内容详情</h2>
            <NTag :type="getStatusType(content.status)">{{ content.status }}</NTag>
            <span v-if="content.quality_score" :class="{ 'score-high': content.quality_score >= 80, 'score-mid': content.quality_score >= 60 && content.quality_score < 80, 'score-low': content.quality_score < 60 }" style="font-weight: 700;">
              {{ Math.round(content.quality_score) }}分
            </span>
          </div>
          <NSpace>
            <NButton v-if="!editing" @click="editing = true">编辑</NButton>
            <template v-else>
              <NButton @click="editing = false">取消</NButton>
              <NButton type="primary" @click="handleSave">保存</NButton>
            </template>
            <NButton v-if="content.status === 'draft' || content.status === 'reviewing'" type="primary" @click="handleApprove">通过审核</NButton>
            <NButton v-if="content.status === 'draft' || content.status === 'reviewing'" type="error" quaternary @click="handleReject">打回</NButton>
          </NSpace>
        </div>

        <!-- Title -->
        <NCard size="small" style="margin-bottom: 16px;">
          <template #header>标题</template>
          <NInput v-if="editing" v-model:value="editTitle" />
          <div v-else class="content-title-display">{{ content.selected_title || '(未选择标题)' }}</div>
          <div v-if="content.title_candidates" style="margin-top: 8px;">
            <div style="font-size: 12px; color: #888; margin-bottom: 4px;">候选标题：</div>
            <NTag v-for="(t, i) in (JSON.parse(content.title_candidates) as string[])" :key="i" size="small" style="margin: 2px;">{{ t }}</NTag>
          </div>
        </NCard>

        <!-- Body -->
        <NCard size="small" style="margin-bottom: 16px;">
          <template #header>正文</template>
          <NInput v-if="editing" v-model:value="editBody" type="textarea" :rows="20" />
          <div v-else class="content-body" style="white-space: pre-wrap; line-height: 1.8;">{{ content.body }}</div>
        </NCard>

        <!-- Quality -->
        <NCard v-if="content.quality_detail" size="small" style="margin-bottom: 16px;">
          <template #header>质量评分</template>
          <div v-for="(item, key) in (JSON.parse(content.quality_detail || '{}'))" :key="key" style="display: flex; align-items: center; gap: 8px; padding: 4px 0;">
            <span style="min-width: 80px;">{{ key }}</span>
            <div style="flex: 1; background: #f0f0f0; border-radius: 4px; height: 8px;">
              <div :style="{ width: item + '%', background: item >= 80 ? '#22c55e' : item >= 60 ? '#f59e0b' : '#ef4444', borderRadius: '4px', height: '8px' }" />
            </div>
            <span>{{ item }}</span>
          </div>
          <div v-if="content.quality_feedback" style="margin-top: 12px; padding: 12px; background: #f9fafb; border-radius: 8px; font-size: 13px;">
            {{ content.quality_feedback }}
          </div>
        </NCard>

        <!-- Tags -->
        <NCard v-if="content.tags" size="small">
          <template #header>标签</template>
          <NTag v-for="(t, i) in (JSON.parse(content.tags) as string[])" :key="i" size="small" style="margin: 2px;">#{{ t }}</NTag>
        </NCard>
      </div>
    </NSpin>
  </div>
</template>

<style scoped lang="scss">
.content-title-display {
  font-size: 18px;
  font-weight: 600;
}
</style>
