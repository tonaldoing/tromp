<script setup lang="ts">
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import { watchEffect } from 'vue'

const authStore = useAuthStore()
const router = useRouter()

// Si Firebase nos dice que ya hay usuario, nos vamos al Home automáticamente
watchEffect(() => {
  if (authStore.user) {
    router.push('/')
  }
})
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-6 text-center">
    <div class="mb-8 text-7xl animate-bounce">💸</div>

    <h1 class="text-4xl font-bold text-white mb-2 tracking-tight">Trompocostos</h1>
    <p class="text-gray-400 mb-12 text-lg">Tu economía, bajo control.</p>

    <button
      @click="authStore.login"
      class="bg-white text-gray-900 px-8 py-4 rounded-2xl font-bold text-lg flex items-center gap-4 shadow-2xl hover:bg-gray-100 active:scale-95 transition-all"
    >
      <img src="https://www.svgrepo.com/show/475656/google-color.svg" class="w-6 h-6" />
      <span>Entrar con Google</span>
    </button>

    <p class="mt-8 text-xs text-gray-600">
      Solo usuarios autorizados. <br />
      Si no tienes cuenta, se creará una nueva.
    </p>
  </div>
</template>
