import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getDashboardStats, type DashboardStats } from '@/api/sg-content/dashboard'

export const useAppStore = defineStore('sgApp', () => {
  const sidebarCollapsed = ref(false)
  const stats = ref<DashboardStats | null>(null)
  const loading = ref(false)

  async function fetchStats() {
    loading.value = true
    try {
      stats.value = await getDashboardStats()
    } finally {
      loading.value = false
    }
  }

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  return { sidebarCollapsed, stats, loading, fetchStats, toggleSidebar }
})
