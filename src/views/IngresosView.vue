<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGastosStore } from '../stores/gastos'
import { storeToRefs } from 'pinia'
import { ArrowLeft, ArrowDownLeft, ArrowUpDown, Calendar, DollarSign } from 'lucide-vue-next'

const store = useGastosStore()
const router = useRouter()
const { movimientosDelMes } = storeToRefs(store)

type OrdenTipo = 'fecha-desc' | 'fecha-asc' | 'monto-desc' | 'monto-asc'
const ordenActual = ref<OrdenTipo>('fecha-desc')

const ingresos = computed(() => {
  const listaIngresos = movimientosDelMes.value.filter((m) => m.tipo === 'ingreso')

  // Ordenar según el criterio actual
  return [...listaIngresos].sort((a, b) => {
    switch (ordenActual.value) {
      case 'fecha-desc':
        return b.fecha.getTime() - a.fecha.getTime()
      case 'fecha-asc':
        return a.fecha.getTime() - b.fecha.getTime()
      case 'monto-desc':
        return b.monto - a.monto
      case 'monto-asc':
        return a.monto - b.monto
      default:
        return 0
    }
  })
})

const totalIngresos = computed(() => {
  return ingresos.value.reduce((sum, ing) => sum + ing.monto, 0)
})

const formatearFecha = (fecha: Date) => {
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(fecha)
}

const formatearDinero = (monto: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(monto)
}

const irAEditar = (id: string) => {
  router.push(`/edit/${id}`)
}

const cambiarOrden = (tipo: OrdenTipo) => {
  ordenActual.value = tipo
}
</script>

<template>
  <div class="px-5 pt-6 pb-28 bg-gray-50 min-h-screen">
    <!-- Header -->
    <header class="flex items-center gap-4 mb-6">
      <button
        @click="router.back()"
        class="w-10 h-10 flex items-center justify-center bg-white rounded-full border border-gray-200 shadow-sm text-gray-700 active:scale-95 transition-transform"
      >
        <ArrowLeft :size="20" />
      </button>
      <div class="flex-1">
        <h1 class="text-2xl font-extrabold text-gray-900 tracking-tight">Ingresos del Mes</h1>
        <p class="text-sm text-gray-500 font-medium">{{ ingresos.length }} registros</p>
      </div>
    </header>

    <!-- Total Card -->
    <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-3xl p-5 shadow-lg shadow-green-200 mb-6 text-white">
      <div class="flex items-center gap-2 mb-1 opacity-90">
        <ArrowDownLeft :size="16" stroke-width="3" />
        <span class="text-xs font-bold uppercase tracking-widest">Total Ingresado</span>
      </div>
      <p class="text-4xl font-black tracking-tighter">
        ${{ formatearDinero(totalIngresos) }}
      </p>
    </div>

    <!-- Controles de ordenamiento -->
    <div class="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
      <button
        @click="cambiarOrden('fecha-desc')"
        class="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap"
        :class="
          ordenActual === 'fecha-desc'
            ? 'bg-green-600 text-white shadow-md'
            : 'bg-white text-gray-600 border border-gray-200'
        "
      >
        <Calendar :size="14" />
        <span>Más reciente</span>
      </button>

      <button
        @click="cambiarOrden('fecha-asc')"
        class="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap"
        :class="
          ordenActual === 'fecha-asc'
            ? 'bg-green-600 text-white shadow-md'
            : 'bg-white text-gray-600 border border-gray-200'
        "
      >
        <Calendar :size="14" />
        <span>Más antiguo</span>
      </button>

      <button
        @click="cambiarOrden('monto-desc')"
        class="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap"
        :class="
          ordenActual === 'monto-desc'
            ? 'bg-green-600 text-white shadow-md'
            : 'bg-white text-gray-600 border border-gray-200'
        "
      >
        <DollarSign :size="14" />
        <span>Mayor monto</span>
      </button>

      <button
        @click="cambiarOrden('monto-asc')"
        class="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap"
        :class="
          ordenActual === 'monto-asc'
            ? 'bg-green-600 text-white shadow-md'
            : 'bg-white text-gray-600 border border-gray-200'
        "
      >
        <DollarSign :size="14" />
        <span>Menor monto</span>
      </button>
    </div>

    <!-- Lista de ingresos -->
    <div v-if="ingresos.length === 0" class="text-center py-16">
      <div class="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-300 mb-4 border border-green-100 mx-auto">
        <ArrowDownLeft :size="40" stroke-width="1.5" />
      </div>
      <p class="font-bold text-gray-600">Sin ingresos registrados</p>
      <p class="text-sm text-gray-400 mt-1">Aún no hay ingresos en este mes.</p>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="ing in ingresos"
        :key="ing.id"
        @click="irAEditar(ing.id)"
        class="group bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.99] relative overflow-hidden"
      >
        <!-- Indicador lateral -->
        <div class="absolute left-0 top-0 bottom-0 w-1 bg-green-500"></div>

        <div class="flex justify-between items-start pl-2">
          <div class="flex-1 min-w-0">
            <p class="font-bold text-gray-800 text-base leading-tight mb-1">
              {{ ing.descripcion }}
            </p>
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide text-green-600 bg-green-100">
                {{ ing.categoria }}
              </span>
              <span class="text-xs text-gray-400 font-medium">
                {{ formatearFecha(ing.fecha) }}
              </span>
            </div>
          </div>

          <div class="text-right ml-4">
            <p class="font-extrabold text-lg tracking-tight text-green-600">
              +${{ formatearDinero(ing.monto) }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
