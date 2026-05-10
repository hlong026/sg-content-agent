<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/sg-content/app'
import { clearToken } from '@/api/client'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const selectedKey = computed(() => route.name as string)

const navItems = [
  {
    group: '内容运营',
    items: [
      { key: 'dashboard', label: '仪表盘', icon: '📊', path: '/dashboard' },
      { key: 'topics', label: '选题中心', icon: '📋', path: '/topics' },
      { key: 'content', label: '内容工坊', icon: '✍️', path: '/content' },
      { key: 'collection', label: '采集中心', icon: '🕷️', path: '/collection' },
    ],
  },
  {
    group: '知识管理',
    items: [
      { key: 'knowledge', label: '知识库', icon: '📚', path: '/knowledge' },
      { key: 'style', label: '风格画像', icon: '🎨', path: '/style' },
    ],
  },
  {
    group: '发布运营',
    items: [
      { key: 'publishing', label: '发布管理', icon: '🚀', path: '/publishing' },
    ],
  },
]

function handleNav(path: string) {
  router.push(path)
}

function handleLogout() {
  clearToken()
  router.replace({ name: 'login' })
}
</script>

<template>
  <aside class="sidebar" :class="{ collapsed: appStore.sidebarCollapsed }">
    <div class="sidebar-logo" @click="router.push('/dashboard')">
      <span class="logo-icon">🇸🇬</span>
      <span class="logo-text" v-if="!appStore.sidebarCollapsed">SG Content Agent</span>
    </div>

    <button class="collapse-btn" @click="appStore.toggleSidebar()">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline v-if="appStore.sidebarCollapsed" points="9 18 15 12 9 6" />
        <polyline v-else points="15 18 9 12 15 6" />
      </svg>
    </button>

    <nav class="sidebar-nav">
      <div v-for="group in navItems" :key="group.group" class="nav-group">
        <div class="nav-group-label" v-if="!appStore.sidebarCollapsed">{{ group.group }}</div>
        <button
          v-for="item in group.items"
          :key="item.key"
          class="nav-item"
          :class="{ active: selectedKey === item.key }"
          @click="handleNav(item.path)"
          :title="item.label"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-label" v-if="!appStore.sidebarCollapsed">{{ item.label }}</span>
        </button>
      </div>
    </nav>

    <div class="sidebar-footer">
      <button class="nav-item logout-item" @click="handleLogout">
        <span class="nav-icon">🚪</span>
        <span class="nav-label" v-if="!appStore.sidebarCollapsed">退出登录</span>
      </button>
    </div>
  </aside>
</template>

<style scoped lang="scss">
.sidebar {
  width: 220px;
  height: 100vh;
  background: #fff;
  border-right: 1px solid #e5e5e5;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  transition: width 0.2s;

  &.collapsed {
    width: 56px;

    .nav-group-label,
    .nav-label,
    .logo-text {
      display: none;
    }

    .nav-item {
      justify-content: center;
    }

    .sidebar-logo {
      justify-content: center;
    }
  }
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 16px;
  cursor: pointer;
  border-bottom: 1px solid #e5e5e5;
}

.logo-icon {
  font-size: 24px;
}

.logo-text {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a1a;
}

.collapse-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: none;
  color: #999;
  cursor: pointer;
  margin: 8px auto;
  border-radius: 4px;

  &:hover {
    background: #f0f0f0;
    color: #333;
  }
}

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.nav-group {
  margin-bottom: 8px;
}

.nav-group-label {
  font-size: 11px;
  font-weight: 600;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 8px 12px 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: none;
  background: none;
  color: #666;
  font-size: 14px;
  border-radius: 6px;
  cursor: pointer;
  width: 100%;
  text-align: left;
  transition: all 0.15s;

  &:hover {
    background: #f5f5f5;
    color: #1a1a1a;
  }

  &.active {
    background: #e8f4e8;
    color: #2d8a4e;
    font-weight: 500;
  }
}

.nav-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.sidebar-footer {
  padding: 8px;
  border-top: 1px solid #e5e5e5;
}

.logout-item {
  &:hover {
    background: #fef2f2;
    color: #dc2626;
  }
}
</style>
