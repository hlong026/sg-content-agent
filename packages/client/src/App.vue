<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { NMessageProvider, NDialogProvider } from 'naive-ui'
import AppSidebar from './components/layout/AppSidebar.vue'

const route = useRoute()
const isLoginPage = computed(() => route.name === 'login')
</script>

<template>
  <NMessageProvider>
    <NDialogProvider>
      <div class="app-layout" v-if="!isLoginPage">
        <AppSidebar />
        <main class="app-main">
          <router-view />
        </main>
      </div>
      <router-view v-else />
    </NDialogProvider>
  </NMessageProvider>
</template>

<style lang="scss">
.app-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.app-main {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background: #f5f5f5;
}
</style>
