<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NButton, NCard, NTag, NSelect, NSpace, NStatistic, NModal, NInput, useMessage } from 'naive-ui'
import { listContents, createContent, deleteContent, getContentStats, type Content } from '@/api/sg-content/contents'

const message = useMessage()
const contents = ref<Content[]>([])
const stats = ref<any>(null)
const loading = ref(false)
const showAddModal = ref(false)
const newContent = ref<Partial<Content>>({})

const sourceTypeOptions = [
  { label: '全部', value: '' },
  { label: '自有', value: 'self' },
  { label: '竞品', value: 'competitor' },
]
const filterSourceType = ref('')

onMounted(() => fetchData())

async function fetchData() {
  loading.value = true
  try {
    const [c, s] = await Promise.all([
      listContents({ source_type: filterSourceType.value || undefined }),
      getContentStats(),
    ])
    contents.value = c
    stats.value = s
  } finally {
    loading.value = false
  }
}

async function handleAdd() {
  try {
    await createContent(newContent.value)
    message.success('已添加')
    showAddModal.value = false
    newContent.value = {}
    fetchData()
  } catch (e: any) { message.error(e.message) }
}

async function handleDelete(id: number) {
  try {
    await deleteContent(id)
    message.success('已删除')
    fetchData()
  } catch (e: any) { message.error(e.message) }
}
</script>

<template>
  <div>
    <div class="page-header">
      <h2>🔍 数据采集</h2>
      <NSpace>
        <NSelect v-model:value="filterSourceType" :options="sourceTypeOptions" style="width: 120px;" @update:value="fetchData" />
        <NButton type="primary" @click="showAddModal = true">+ 手动添加</NButton>
      </NSpace>
    </div>

    <!-- Stats -->
    <div v-if="stats" class="grid-3" style="margin-bottom: 16px;">
      <NCard size="small"><NStatistic label="总内容数" :value="stats.total" /></NCard>
      <NCard size="small"><NStatistic label="自有内容" :value="stats.by_source_type?.self || 0" /></NCard>
      <NCard size="small"><NStatistic label="竞品内容" :value="stats.by_source_type?.competitor || 0" /></NCard>
    </div>

    <!-- Content List -->
    <NCard v-for="item in contents" :key="item.id" size="small" style="margin-bottom: 12px;">
      <div style="display: flex; justify-content: space-between; align-items: start;">
        <div style="flex: 1;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            <NTag size="small" :type="item.source_type === 'self' ? 'success' : 'warning'">{{ item.source_type === 'self' ? '自有' : '竞品' }}</NTag>
            <span style="font-weight: 500;">{{ item.title || '(无标题)' }}</span>
            <NTag v-if="item.category" size="tiny">{{ item.category }}</NTag>
          </div>
          <div v-if="item.body" style="font-size: 13px; color: #666; margin-bottom: 6px;">{{ item.body?.substring(0, 120) }}...</div>
          <div style="font-size: 12px; color: #999;">
            ❤️ {{ item.likes }} · ⭐ {{ item.collects }} · 💬 {{ item.comments }}
            <span v-if="item.source_name"> · 来源: {{ item.source_name }}</span>
            · 📅 {{ item.crawled_at?.split(' ')[0] }}
          </div>
        </div>
        <NButton size="small" type="error" quaternary @click="handleDelete(item.id)">删除</NButton>
      </div>
    </NCard>

    <div v-if="!loading && contents.length === 0" class="empty-state">
      <div class="empty-icon">🔍</div>
      <p>暂无采集内容，点击右上角手动添加</p>
    </div>

    <!-- Add Modal -->
    <NModal v-model:show="showAddModal" preset="dialog" title="手动添加内容" style="width: 600px;">
      <NSpace vertical>
        <NInput v-model:value="newContent.title" placeholder="标题" />
        <NInput v-model:value="newContent.body" type="textarea" :rows="6" placeholder="正文内容" />
        <div style="display: flex; gap: 12px;">
          <NSelect v-model:value="newContent.source_type" :options="[{ label: '自有', value: 'self' }, { label: '竞品', value: 'competitor' }]" placeholder="来源类型" style="flex: 1;" />
          <NInput v-model:value="newContent.source_name" placeholder="来源名称" style="flex: 1;" />
        </div>
        <NInput v-model:value="newContent.category" placeholder="分类（如：院校相关）" />
      </NSpace>
      <template #action>
        <NSpace>
          <NButton @click="showAddModal = false">取消</NButton>
          <NButton type="primary" @click="handleAdd">添加</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<style scoped lang="scss">
.empty-state {
  text-align: center;
  padding: 60px;
  color: #999;
  .empty-icon { font-size: 48px; margin-bottom: 12px; }
}
</style>
