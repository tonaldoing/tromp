<script setup lang="ts">
import { computed } from 'vue'
import { useGastosStore } from '../stores/gastos'
// 1. Importamos los iconos de flechas
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

const store = useGastosStore()

const nombreMes = computed(() => {
  // Usamos 'long' para que diga "Septiembre" en lugar de "sep"
  return new Intl.DateTimeFormat('es-AR', { month: 'long' }).format(store.fechaVisual)
})
const anio = computed(() => store.fechaVisual.getFullYear())
</script>

<template>
  <div
    class="flex items-center justify-between p-2 bg-white rounded-2xl shadow-sm border border-gray-100 mb-6"
  >
    <button
      @click="store.cambiarMes(-1)"
      class="p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-primario transition-all active:scale-90"
      aria-label="Mes anterior"
    >
      <ChevronLeft :size="24" stroke-width="2.5" />
    </button>

    <div class="flex flex-col items-center">
      <span class="text-lg font-extrabold text-gray-800 capitalize tracking-tight">
        {{ nombreMes }}
      </span>
      <span class="text-xs font-bold text-gray-500">
        {{ anio }}
      </span>
    </div>

    <button
      @click="store.cambiarMes(1)"
      class="p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-primario transition-all active:scale-90"
      aria-label="Mes siguiente"
    >
      <ChevronRight :size="24" stroke-width="2.5" />
    </button>
  </div>
</template>
