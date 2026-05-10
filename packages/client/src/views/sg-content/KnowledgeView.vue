<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NButton, NCard, NInput, NSelect, NTag, NModal, NSpace, useMessage } from 'naive-ui'
import { listKnowledge, createKnowledge, updateKnowledge, deleteKnowledge, getKnowledgeCategories, type KnowledgeItem } from '@/api/sg-content/knowledge'

const message = useMessage()
const items = ref<KnowledgeItem[]>([])
const categories = ref<{ category: string; count: number }[]>([])
const loading = ref(false)
const showModal = ref(false)
const editing = ref<Partial<KnowledgeItem>>({})
const isEdit = ref(false)
const searchQuery = ref('')
const filterCategory = ref('')

const categoryOptions = [
  { label: '全部', value: '' },
  { label: '🏫 院校', value: 'institution' },
  { label: '📋 申请', value: 'application' },
  { label: '💰 费用', value: 'costs' },
  { label: '🇸🇬 生活', value: 'living' },
  { label: '📑 政策', value: 'policies' },
  { label: '🎓 就业', value: 'career' },
  { label: '📊 数据', value: 'statistics' },
]

onMounted(async () => {
  await Promise.all([fetchItems(), fetchCategories()])
})

async function fetchItems() {
  loading.value = true
  try {
    items.value = await listKnowledge({
      category: filterCategory.value || undefined,
      search: searchQuery.value || undefined,
    })
  } finally {
    loading.value = false
  }
}

async function fetchCategories() {
  categories.value = await getKnowledgeCategories()
}

function openCreate() {
  editing.value = { category: 'institution', verified: 0 }
  isEdit.value = false
  showModal.value = true
}

function openEdit(item: KnowledgeItem) {
  editing.value = { ...item }
  isEdit.value = true
  showModal.value = true
}

async function handleSave() {
  const { category, title, content } = editing.value
  if (!category || !title || !content) {
    message.warning('分类、标题、内容为必填')
    return
  }
  try {
    if (isEdit.value && editing.value.id) {
      await updateKnowledge(editing.value.id, editing.value)
      message.success('已更新')
    } else {
      await createKnowledge(editing.value)
      message.success('已创建')
    }
    showModal.value = false
    fetchItems()
    fetchCategories()
  } catch (e: any) { message.error(e.message) }
}

async function handleDelete(id: number) {
  try {
    await deleteKnowledge(id)
    message.success('已删除')
    fetchItems()
    fetchCategories()
  } catch (e: any) { message.error(e.message) }
}
</script>

<template>
  <div>
    <div class="page-header">
      <h2>📚 知识库</h2>
      <NSpace>
        <NInput v-model:value="searchQuery" placeholder="搜索..." style="width: 200px;" @keyup.enter="fetchItems" />
        <NSelect v-model:value="filterCategory" :options="categoryOptions" style="width: 120px;" @update:value="fetchItems" />
        <NButton type="primary" @click="openCreate">+ 添加知识</NButton>
      </NSpace>
    </div>

    <!-- Category Stats -->
    <div class="category-stats" v-if="categories.length">
      <div v-for="cat in categories" :key="cat.category" class="category-chip">
        {{ cat.category }} ({{ cat.count }})
      </div>
    </div>

    <!-- Knowledge List -->
    <NCard v-for="item in items" :key="item.id" size="small" style="margin-bottom: 12px;">
      <div style="display: flex; justify-content: space-between; align-items: start;">
        <div style="flex: 1;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <NTag size="small" type="info">{{ item.category }}</NTag>
            <span style="font-weight: 600;">{{ item.title }}</span>
            <NTag v-if="item.verified" size="small" type="success">已验证</NTag>
          </div>
          <div style="font-size: 13px; color: #666; line-height: 1.6;">{{ item.content.substring(0, 200) }}{{ item.content.length > 200 ? '...' : '' }}</div>
          <div v-if="item.tags" style="margin-top: 8px;">
            <NTag v-for="(t, i) in (JSON.parse(item.tags) as string[])" :key="i" size="tiny" style="margin: 2px;">{{ t }}</NTag>
          </div>
        </div>
        <NSpace>
          <NButton size="small" @click="openEdit(item)">编辑</NButton>
          <NButton size="small" type="error" quaternary @click="handleDelete(item.id)">删除</NButton>
        </NSpace>
      </div>
    </NCard>

    <div v-if="!loading && items.length === 0" class="empty-state">
      <div class="empty-icon">📚</div>
      <p>暂无知识条目，点击右上角添加</p>
    </div>

    <!-- Create/Edit Modal -->
    <NModal v-model:show="showModal" preset="dialog" :title="isEdit ? '编辑知识' : '添加知识'" style="width: 600px;">
      <NSpace vertical>
        <div>
          <label>分类 *</label>
          <NSelect v-model:value="editing.category" :options="categoryOptions.filter(o => o.value)" />
        </div>
        <div>
          <label>标题 *</label>
          <NInput v-model:value="editing.title" placeholder="知识标题" />
        </div>
        <div>
          <label>内容 *</label>
          <NInput v-model:value="editing.content" type="textarea" :rows="8" placeholder="知识内容" />
        </div>
        <div>
          <label>标签（逗号分隔）</label>
          <NInput v-model:value="(editing as any).tagsInput" placeholder="标签1, 标签2" />
        </div>
        <div>
          <label>来源</label>
          <NInput v-model:value="editing.source" placeholder="数据来源" />
        </div>
      </NSpace>
      <template #action>
        <NSpace>
          <NButton @click="showModal = false">取消</NButton>
          <NButton type="primary" @click="handleSave">{{ isEdit ? '保存' : '添加' }}</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<style scoped lang="scss">
.category-stats {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.category-chip {
  padding: 4px 12px;
  background: #f3f4f6;
  border-radius: 16px;
  font-size: 12px;
  color: #666;
}

label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 4px;
  color: #666;
}

.empty-state {
  text-align: center;
  padding: 60px;
  color: #999;
  .empty-icon { font-size: 48px; margin-bottom: 12px; }
}
</style>
