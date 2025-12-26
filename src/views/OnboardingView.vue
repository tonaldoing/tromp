<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGastosStore } from '../stores/gastos'
import { Users, Plus, Link2, Loader2, ArrowRight } from 'lucide-vue-next'

const gastosStore = useGastosStore()
const router = useRouter()

const modo = ref<'elegir' | 'crear' | 'unirse'>('elegir')
const nombreTablero = ref('')
const codigoTablero = ref('')
const cargando = ref(false)

const crearTablero = async () => {
  if (!nombreTablero.value.trim()) {
    alert('Ingresa un nombre para tu tablero')
    return
  }

  cargando.value = true
  try {
    await gastosStore.crearNuevoBoard(nombreTablero.value.trim())
    // Después de crear, redirigir al home
    router.push('/')
  } catch (error: any) {
    alert(error.message || 'Error al crear tablero')
    cargando.value = false
  }
}

const unirseTablero = async () => {
  if (!codigoTablero.value.trim()) {
    alert('Ingresa el código del tablero')
    return
  }

  cargando.value = true
  try {
    await gastosStore.unirseABoard(codigoTablero.value.trim())
    // Después de unirse, redirigir al home
    router.push('/')
  } catch (error: any) {
    alert(error.message || 'Error al unirse al tablero')
    cargando.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-5">
    <div class="w-full max-w-md">
      <!-- Elegir Acción -->
      <div v-if="modo === 'elegir'" class="space-y-6">
        <!-- Header -->
        <div class="text-center mb-8">
          <div class="w-20 h-20 bg-linear-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl">
            <Users :size="40" class="text-white" />
          </div>
          <h1 class="text-3xl font-black text-gray-900 mb-2">¡Bienvenido! 👋</h1>
          <p class="text-gray-600 font-medium">
            Para comenzar, necesitas un tablero donde registrar tus gastos
          </p>
        </div>

        <!-- Opciones -->
        <div class="space-y-3">
          <!-- Crear Nuevo -->
          <button
            @click="modo = 'crear'"
            class="w-full bg-white p-6 rounded-2xl border-2 border-gray-200 hover:border-black transition-all text-left group active:scale-[0.98]"
          >
            <div class="flex items-start gap-4">
              <div class="w-12 h-12 bg-black rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Plus :size="24" class="text-white" />
              </div>
              <div class="flex-1">
                <h3 class="font-bold text-gray-900 text-lg mb-1">Crear un tablero nuevo</h3>
                <p class="text-sm text-gray-500">
                  Ideal si querés empezar desde cero y después invitar a otras personas
                </p>
              </div>
              <ArrowRight :size="20" class="text-gray-400 group-hover:text-black transition-colors shrink-0 mt-1" />
            </div>
          </button>

          <!-- Unirse a Existente -->
          <button
            @click="modo = 'unirse'"
            class="w-full bg-white p-6 rounded-2xl border-2 border-gray-200 hover:border-indigo-500 transition-all text-left group active:scale-[0.98]"
          >
            <div class="flex items-start gap-4">
              <div class="w-12 h-12 bg-linear-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Link2 :size="24" class="text-white" />
              </div>
              <div class="flex-1">
                <h3 class="font-bold text-gray-900 text-lg mb-1">Unirme a un tablero</h3>
                <p class="text-sm text-gray-500">
                  Alguien te compartió un código para que te unas a su tablero
                </p>
              </div>
              <ArrowRight :size="20" class="text-gray-400 group-hover:text-indigo-500 transition-colors shrink-0 mt-1" />
            </div>
          </button>
        </div>
      </div>

      <!-- Crear Tablero -->
      <div v-else-if="modo === 'crear'" class="space-y-6">
        <!-- Header -->
        <div class="text-center mb-6">
          <div class="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <Plus :size="32" class="text-white" />
          </div>
          <h2 class="text-2xl font-black text-gray-900 mb-1">Crear Tablero</h2>
          <p class="text-gray-600 text-sm">Dale un nombre para identificarlo</p>
        </div>

        <!-- Formulario -->
        <div class="bg-white p-6 rounded-2xl border-2 border-gray-200 shadow-lg">
          <label class="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
            Nombre del tablero
          </label>
          <input
            v-model="nombreTablero"
            type="text"
            placeholder="Ej: Gastos Familiares, Proyecto X..."
            autofocus
            class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl font-bold text-gray-800 placeholder-gray-300 outline-none focus:border-black transition-colors mb-4"
            @keyup.enter="crearTablero"
          />

          <button
            @click="crearTablero"
            :disabled="cargando || !nombreTablero.trim()"
            class="w-full py-4 bg-black text-white rounded-xl font-bold text-lg hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Loader2 v-if="cargando" :size="20" class="animate-spin" />
            <Plus v-else :size="20" />
            <span>{{ cargando ? 'Creando...' : 'Crear Tablero' }}</span>
          </button>
        </div>

        <!-- Volver -->
        <button
          @click="modo = 'elegir'"
          :disabled="cargando"
          class="w-full py-3 text-gray-600 font-bold hover:text-gray-900 transition-colors disabled:opacity-50"
        >
          ← Volver
        </button>
      </div>

      <!-- Unirse a Tablero -->
      <div v-else-if="modo === 'unirse'" class="space-y-6">
        <!-- Header -->
        <div class="text-center mb-6">
          <div class="w-16 h-16 bg-linear-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <Link2 :size="32" class="text-white" />
          </div>
          <h2 class="text-2xl font-black text-gray-900 mb-1">Unirse a Tablero</h2>
          <p class="text-gray-600 text-sm">Ingresa el código que te compartieron</p>
        </div>

        <!-- Formulario -->
        <div class="bg-white p-6 rounded-2xl border-2 border-gray-200 shadow-lg">
          <label class="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
            Código del tablero
          </label>
          <input
            v-model="codigoTablero"
            type="text"
            placeholder="board_1234567890"
            autofocus
            class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl font-mono font-bold text-gray-800 placeholder-gray-300 outline-none focus:border-indigo-500 transition-colors mb-4"
            @keyup.enter="unirseTablero"
          />

          <button
            @click="unirseTablero"
            :disabled="cargando || !codigoTablero.trim()"
            class="w-full py-4 bg-linear-to-br from-indigo-500 to-purple-600 text-white rounded-xl font-bold text-lg hover:from-indigo-600 hover:to-purple-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Loader2 v-if="cargando" :size="20" class="animate-spin" />
            <Link2 v-else :size="20" />
            <span>{{ cargando ? 'Uniéndome...' : 'Unirme' }}</span>
          </button>
        </div>

        <!-- Volver -->
        <button
          @click="modo = 'elegir'"
          :disabled="cargando"
          class="w-full py-3 text-gray-600 font-bold hover:text-gray-900 transition-colors disabled:opacity-50"
        >
          ← Volver
        </button>
      </div>
    </div>
  </div>
</template>