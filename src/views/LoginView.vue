<script setup lang="ts">
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import { watchEffect, ref } from 'vue'
import { Loader2, Wallet } from 'lucide-vue-next'
import { FirebaseError } from 'firebase/app'

const authStore = useAuthStore()
const router = useRouter()

const cargandoLogin = ref(false)
const errorLogin = ref('')

// Si Firebase nos dice que ya hay usuario, nos vamos al Home automáticamente
watchEffect(() => {
  if (authStore.user) {
    router.push('/')
  }
})

const handleLogin = async () => {
  cargandoLogin.value = true
  errorLogin.value = ''

  try {
    await authStore.login()
    // Si el login fue exitoso, watchEffect redirigirá automáticamente
  } catch (error) {
    console.error('Error en login:', error)

    // Mostrar mensaje de error amigable
    const code = error instanceof FirebaseError ? error.code : ''
    if (code === 'auth/popup-closed-by-user') {
      errorLogin.value = 'Cerraste la ventana de login. Intenta nuevamente.'
    } else if (code === 'auth/network-request-failed') {
      errorLogin.value = 'Error de conexión. Verifica tu internet.'
    } else if (code === 'auth/unauthorized-domain') {
      errorLogin.value = 'Dominio no autorizado. Contacta al administrador.'
    } else {
      errorLogin.value = 'Error al iniciar sesión. Intenta nuevamente.'
    }
  } finally {
    cargandoLogin.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-6 text-center">
    <!-- Logo -->
    <div
      class="mb-8 w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center shadow-2xl shadow-blue-900/50 border border-blue-400/30"
      aria-hidden="true"
    >
      <Wallet :size="48" class="text-white" stroke-width="1.8" />
    </div>

    <h1 class="text-4xl font-bold text-white mb-2 tracking-tight">Trompocostos</h1>
    <p class="text-gray-400 mb-12 text-lg">Tu economía, bajo control.</p>

    <button
      @click="handleLogin"
      :disabled="cargandoLogin"
      class="bg-white text-gray-900 px-8 py-4 rounded-2xl font-bold text-lg flex items-center gap-4 shadow-2xl hover:bg-gray-100 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
    >
      <Loader2 v-if="cargandoLogin" class="w-6 h-6 animate-spin" />
      <img v-else src="https://www.svgrepo.com/show/475656/google-color.svg" class="w-6 h-6" />
      <span>{{ cargandoLogin ? 'Iniciando sesión...' : 'Entrar con Google' }}</span>
    </button>

    <!-- Mensaje de error -->
    <div
      v-if="errorLogin"
      class="mt-6 bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl text-sm max-w-md"
    >
      {{ errorLogin }}
    </div>

    <!-- Info sobre popup -->
    <div
      v-if="!errorLogin && !cargandoLogin"
      class="mt-6 bg-blue-500/10 border border-blue-500/50 text-blue-300 px-4 py-3 rounded-xl text-xs max-w-md"
    >
      💡 <strong>Tip:</strong> Si se bloquea el popup, serás redirigido automáticamente a Google.
    </div>

    <p class="mt-8 text-xs text-gray-400">
      Solo usuarios autorizados. <br />
      Si no tienes cuenta, se creará una nueva.
    </p>
  </div>
</template>
