<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGastosStore } from '../stores/gastos'
import { storeToRefs } from 'pinia'
import {
  ArrowLeft,
  Wallet,
  CreditCard,
  Building2,
  Plus,
  Trash2,
  Lock,
  Check,
} from 'lucide-vue-next'

const store = useGastosStore()
const { metodosPago } = storeToRefs(store)
const router = useRouter()
const nuevoMetodo = ref('')
const agregando = ref(false)
const exito = ref(false)

// Helper para determinar si un método es fijo
const esFijo = (metodo: string) => {
  return metodo === 'Efectivo' || metodo === 'Crédito'
}

// Helper para obtener el ícono según el método
const getIconoMetodo = (metodo: string) => {
  const m = metodo.toLowerCase()
  if (m.includes('efectivo') || m.includes('cash')) return Wallet
  if (m.includes('crédito') || m.includes('credit')) return CreditCard
  if (m.includes('débito') || m.includes('debit')) return Building2
  return CreditCard
}

const agregar = async () => {
  if (!nuevoMetodo.value.trim()) return

  agregando.value = true
  try {
    await store.agregarMetodo(nuevoMetodo.value.trim())
    nuevoMetodo.value = ''
    exito.value = true
    setTimeout(() => {
      exito.value = false
    }, 2000)
  } catch (error: any) {
    alert(error.message || 'Error al agregar método')
  } finally {
    agregando.value = false
  }
}

const borrar = async (m: string) => {
  if (esFijo(m)) {
    alert('No se pueden eliminar los métodos Efectivo y Crédito')
    return
  }

  if (confirm(`¿Borrar el método "${m}"?`)) {
    try {
      await store.borrarMetodo(m)
    } catch (error: any) {
      alert(error.message || 'Error al borrar método')
    }
  }
}
</script>

<template>
  <div class="px-5 pt-6 pb-40 bg-gray-50 min-h-screen">
    <!-- Header -->
    <header class="mb-6">
      <div class="flex items-center gap-3 mb-2">
        <button
          @click="router.back()"
          class="w-10 h-10 flex items-center justify-center bg-white rounded-full border border-gray-200 shadow-sm text-gray-700 active:scale-95 transition-transform"
        >
          <ArrowLeft :size="20" />
        </button>
        <h1 class="text-2xl font-extrabold text-gray-900 tracking-tight">
          Métodos de Pago
        </h1>
      </div>
      <p class="text-sm text-gray-500 font-medium pl-14">
        Gestiona cómo registras tus gastos
      </p>
    </header>

    <!-- Formulario Agregar -->
    <div class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6">
      <label class="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
        Agregar Nuevo Método
      </label>
      <div class="flex gap-2">
        <input
          v-model="nuevoMetodo"
          placeholder="Ej: Visa, MercadoPago..."
          class="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl font-bold text-gray-800 placeholder-gray-300 outline-none focus:border-black transition-colors"
          @keyup.enter="agregar"
        />
        <button
          @click="agregar"
          :disabled="agregando || !nuevoMetodo.trim()"
          class="w-12 h-12 bg-black text-white rounded-xl font-bold text-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          :class="exito ? 'bg-green-500' : 'bg-black hover:bg-gray-800'"
        >
          <Check v-if="exito" :size="24" />
          <Plus v-else :size="24" />
        </button>
      </div>
    </div>

    <!-- Lista de Métodos -->
    <div class="space-y-3">
      <p class="text-xs font-bold text-gray-400 uppercase tracking-wide px-1 mb-3">
        Métodos Disponibles ({{ metodosPago.length }})
      </p>

      <div
        v-for="m in metodosPago"
        :key="m"
        class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 transition-all hover:shadow-md"
      >
        <!-- Icono -->
        <div
          class="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
          :class="
            esFijo(m)
              ? 'bg-linear-to-br from-blue-500 to-indigo-600 text-white'
              : 'bg-gray-100 text-gray-600'
          "
        >
          <component :is="getIconoMetodo(m)" :size="20" stroke-width="2.5" />
        </div>

        <!-- Nombre -->
        <div class="flex-1 min-w-0">
          <p class="font-bold text-gray-900 text-base">{{ m }}</p>
          <p v-if="esFijo(m)" class="text-xs text-blue-600 font-bold flex items-center gap-1 mt-0.5">
            <Lock :size="12" />
            Método protegido
          </p>
        </div>

        <!-- Acción Borrar -->
        <button
          v-if="!esFijo(m)"
          @click="borrar(m)"
          class="w-10 h-10 rounded-xl text-red-500 hover:bg-red-50 transition-colors flex items-center justify-center active:scale-95"
        >
          <Trash2 :size="20" />
        </button>

        <!-- Indicador de Fijo -->
        <div
          v-else
          class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"
        >
          <Lock :size="20" />
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-if="metodosPago.length === 0"
        class="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-gray-200"
      >
        <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <CreditCard :size="28" class="text-gray-400" />
        </div>
        <p class="text-gray-400 font-bold">No hay métodos de pago</p>
        <p class="text-xs text-gray-400 mt-1">Agrega tu primer método arriba</p>
      </div>
    </div>

    <!-- Info Footer -->
    <div class="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
      <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
        <Lock :size="16" class="text-blue-600" />
      </div>
      <div>
        <p class="font-bold text-blue-800 text-sm">Métodos protegidos</p>
        <p class="text-blue-600 text-xs mt-1">
          Los métodos <strong>Efectivo</strong> y <strong>Crédito</strong> son esenciales para el
          funcionamiento del sistema y no pueden eliminarse.
        </p>
      </div>
    </div>
  </div>
</template>