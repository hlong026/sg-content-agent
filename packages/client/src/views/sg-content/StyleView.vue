<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NCard, NButton, NTag, NSpin, NSpace, useMessage } from 'naive-ui'
import { getStyleProfile, analyzeStyle } from '@/api/sg-content/generation'

const message = useMessage()
const profile = ref<any>(null)
const loading = ref(false)
const analyzing = ref(false)

onMounted(() => fetchProfile())

async function fetchProfile() {
  loading.value = true
  try { profile.value = await getStyleProfile() }
  finally { loading.value = false }
}

async function handleAnalyze() {
  analyzing.value = true
  try {
    profile.value = await analyzeStyle()
    message.success('风格分析完成！')
  } catch (e: any) { message.error(e.message) }
  finally { analyzing.value = false }
}

const dimensionLabels: Record<string, string> = {
  title_patterns: '标题模式',
  opening_patterns: '开头模式',
  avg_paragraph_length: '段落长度',
  high_freq_words: '高频词汇',
  emoji_frequency: 'Emoji使用频率',
  cta_patterns: '互动引导',
  tone: '语气风格',
  summary: '风格总结',
}
</script>

<template>
  <div>
    <div class="page-header">
      <h2>🎨 风格画像</h2>
      <NButton type="primary" :loading="analyzing" @click="handleAnalyze">🔍 重新分析风格</NButton>
    </div>

    <NSpin :show="loading">
      <div v-if="profile">
        <!-- Meta -->
        <NCard size="small" style="margin-bottom:16px">
          <div style="display:flex;gap:24px;font-size:13px;color:#666">
            <span>版本: v{{ profile.version }}</span>
            <span>分析样本: {{ profile.sample_count }} 条</span>
            <NTag v-if="profile.is_active" type="success" size="small">当前使用</NTag>
          </div>
        </NCard>

        <!-- Profile Data -->
        <template v-if="profile.profile_data">
          <!-- Summary -->
          <NCard title="📝 风格总结" size="small" style="margin-bottom:16px">
            <div style="font-size:14px;line-height:1.8">{{ profile.profile_data.summary }}</div>
          </NCard>

          <!-- Dimensions -->
          <NGrid :cols="2" :x-gap="16" :y-gap="16">
            <NCard title="🏷️ 标题模式" size="small">
              <NTag v-for="(v, k) in profile.profile_data.title_patterns" :key="k" size="small" style="margin:2px">{{ k }}: {{ v }}</NTag>
            </NCard>

            <NCard title="👋 常用开头" size="small">
              <div v-for="p in (profile.profile_data.opening_patterns || [])" :key="p" style="padding:4px 0;font-size:13px">• {{ p }}</div>
            </NCard>

            <NCard title="🔤 高频词汇" size="small">
              <NTag v-for="w in (profile.profile_data.high_freq_words || [])" :key="w" size="small" type="info" style="margin:2px">{{ w }}</NTag>
            </NCard>

            <NCard title="📢 互动引导" size="small">
              <div v-for="c in (profile.profile_data.cta_patterns || [])" :key="c" style="padding:4px 0;font-size:13px">• {{ c }}</div>
            </NCard>

            <NCard title="📊 其他特征" size="small">
              <div style="font-size:13px;line-height:2">
                <div>段落长度: {{ profile.profile_data.avg_paragraph_length }}</div>
                <div>Emoji频率: {{ profile.profile_data.emoji_frequency }}</div>
                <div>语气风格: {{ profile.profile_data.tone }}</div>
              </div>
            </NCard>
          </NGrid>
        </template>
      </div>

      <div v-else-if="!loading" style="text-align:center;padding:60px;color:#999">
        <div style="font-size:48px;margin-bottom:12px">🎨</div>
        <p style="margin-bottom:16px">尚未分析风格画像</p>
        <NButton type="primary" :loading="analyzing" @click="handleAnalyze">开始分析</NButton>
        <div style="margin-top:12px;font-size:12px;color:#bbb">需要至少添加一些自有内容才能分析风格</div>
      </div>
    </NSpin>
  </div>
</template>

<script lang="ts">
import { NGrid } from 'naive-ui'
</script>
