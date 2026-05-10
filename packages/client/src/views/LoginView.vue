<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { NInput, NButton, NCard, useMessage } from 'naive-ui'
import { login } from '@/api/sg-content/auth'

const router = useRouter()
const message = useMessage()
const password = ref('')
const loading = ref(false)

async function handleLogin() {
  if (!password.value) {
    message.warning('请输入密码')
    return
  }
  loading.value = true
  try {
    await login(password.value)
    message.success('登录成功')
    router.push({ name: 'dashboard' })
  } catch (e: any) {
    message.error(e.message || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <NCard class="login-card">
      <div class="login-header">
        <span class="login-icon">🇸🇬</span>
        <h1>SG Content Agent</h1>
        <p>新加坡留学内容创作平台</p>
      </div>
      <form @submit.prevent="handleLogin">
        <NInput
          v-model:value="password"
          type="password"
          placeholder="请输入密码"
          size="large"
          :disabled="loading"
          @keyup.enter="handleLogin"
          style="margin-bottom: 16px;"
        />
        <NButton
          type="primary"
          block
          size="large"
          :loading="loading"
          @click="handleLogin"
        >
          登 录
        </NButton>
      </form>
    </NCard>
  </div>
</template>

<style scoped lang="scss">
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 400px;
  border-radius: 16px;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;

  .login-icon {
    font-size: 48px;
    display: block;
    margin-bottom: 12px;
  }

  h1 {
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 8px;
  }

  p {
    color: #888;
    font-size: 14px;
  }
}
</style>
