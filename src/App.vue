<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { RouterView, useRoute, RouterLink } from 'vue-router'
import { useGastosStore } from './stores/gastos'
import { useAuthStore } from './stores/auth'
import { Home, PieChart, Plus, Wallet, Users } from 'lucide-vue-next'

const gastosStore = useGastosStore()
const authStore = useAuthStore()
const route = useRoute()

onMounted(async () => {
  await authStore.inicializarAuth()
})

watch(
  () => authStore.userProfile,
  async (perfil) => {
    if (perfil) {
      await gastosStore.inicializar()
    }
  },
  { immediate: true },
)
</script>

<template>
  <div class="min-h-screen bg-gray-50 font-sans text-gray-900">
    <div
      v-if="authStore.cargandoAuth"
      class="h-screen flex flex-col items-center justify-center bg-gray-900 text-white"
    >
      <div class="animate-spin text-blue-500 mb-4">
        <svg class="w-10 h-10" fill="none" viewBox="0 0 24 24">
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      </div>
      <p class="font-medium text-sm text-gray-400">Iniciando sesión...</p>
    </div>

    <template v-else>
      <div class="pb-28">
        <RouterView />
      </div>

      <nav
        v-if="route.name !== 'login'"
        class="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 shadow-[0_-5px_20px_rgba(0,0,0,0.03)] z-50 pb-safe"
      >
        <div class="flex justify-between items-center px-6 h-[70px]">
          <RouterLink
            to="/"
            class="group flex flex-col items-center justify-center gap-1 w-12 text-gray-400 transition-colors hover:text-gray-600"
            active-class="!text-black"
          >
            <div
              class="transform transition-transform duration-200 group-[.router-link-active]:scale-110"
            >
              <Home :size="24" stroke-width="2.5" />
            </div>
            <span class="text-[10px] font-bold tracking-wide">Inicio</span>
          </RouterLink>

          <RouterLink
            to="/stats"
            class="group flex flex-col items-center justify-center gap-1 w-12 text-gray-400 transition-colors hover:text-gray-600"
            active-class="!text-black"
          >
            <div
              class="transform transition-transform duration-200 group-[.router-link-active]:scale-110"
            >
              <PieChart :size="24" stroke-width="2.5" />
            </div>
            <span class="text-[10px] font-bold tracking-wide">Balance</span>
          </RouterLink>

          <div class="relative -top-6">
            <RouterLink
              to="/add"
              class="flex items-center justify-center w-14 h-14 bg-black text-white rounded-full shadow-xl shadow-blue-900/20 transform transition-transform active:scale-90 hover:scale-105 border-[4px] border-gray-50"
            >
              <Plus :size="28" stroke-width="3" />
            </RouterLink>
          </div>

          <RouterLink
            to="/budget"
            class="group flex flex-col items-center justify-center gap-1 w-12 text-gray-400 transition-colors hover:text-gray-600"
            active-class="!text-black"
          >
            <div
              class="transform transition-transform duration-200 group-[.router-link-active]:scale-110"
            >
              <Wallet :size="24" stroke-width="2.5" />
            </div>
            <span class="text-[10px] font-bold tracking-wide">Topes</span>
          </RouterLink>

          <RouterLink
            to="/profile"
            class="group flex flex-col items-center justify-center gap-1 w-12 text-gray-400 transition-colors hover:text-gray-600"
            active-class="!text-black"
          >
            <div
              class="transform transition-transform duration-200 group-[.router-link-active]:scale-110"
            >
              <Users :size="24" stroke-width="2.5" />
            </div>
            <span class="text-[10px] font-bold tracking-wide">Tableros</span>
          </RouterLink>
        </div>
      </nav>
    </template>
  </div>
</template>

<style scoped>
/* Solo mantenemos esto porque Tailwind necesita un plugin para 'env()' */
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom);
}
</style>
