<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGastosStore } from '../stores/gastos'
import { useAuthStore } from '../stores/auth'
import { storeToRefs } from 'pinia'
import { getIcono } from '../utils/icons'
import { ArrowLeft, ArrowUpRight, Calendar, DollarSign, HelpCircle } from 'lucide-vue-next'

const store = useGastosStore()
const authStore = useAuthStore()
const router = useRouter()
const { movimientosDelMes, usuarios } = storeToRefs(store)

type OrdenTipo = 'fecha-desc' | 'fecha-asc' | 'monto-desc' | 'monto-asc'
const ordenActual = ref<OrdenTipo>('fecha-desc')

const gastos = computed(() => {
  const listaGastos = movimientosDelMes.value.filter((m) => m.tipo === 'gasto')

  // Ordenar según el criterio actual
  return [...listaGastos].sort((a, b) => {
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

const totalGastos = computed(() => {
  return gastos.value.reduce((sum, gasto) => sum + gasto.monto, 0)
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

const getUsuario = (id: string) => {
  const encontrado = usuarios.value.find((u) => u.id === id)
  return encontrado || { id: '', emoji: 'help', nombre: '?', email: '', foto: '' }
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
        <h1 class="text-2xl font-extrabold text-gray-900 tracking-tight">Gastos del Mes</h1>
        <p class="text-sm text-gray-500 font-medium">{{ gastos.length }} registros</p>
      </div>
    </header>

    <!-- Total Card -->
    <div class="bg-gradient-to-br from-red-400 to-red-500 rounded-3xl p-5 shadow-lg shadow-red-200 mb-6 text-white">
      <div class="flex items-center gap-2 mb-1 opacity-90">
        <ArrowUpRight :size="16" stroke-width="3" />
        <span class="text-xs font-bold uppercase tracking-widest">Total Gastado</span>
      </div>
      <p class="text-4xl font-black tracking-tighter">
        ${{ formatearDinero(totalGastos) }}
      </p>
    </div>

    <!-- Controles de ordenamiento -->
    <div class="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
      <button
        @click="cambiarOrden('fecha-desc')"
        class="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap"
        :class="
          ordenActual === 'fecha-desc'
            ? 'bg-black text-white shadow-md'
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
            ? 'bg-black text-white shadow-md'
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
            ? 'bg-black text-white shadow-md'
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
            ? 'bg-black text-white shadow-md'
            : 'bg-white text-gray-600 border border-gray-200'
        "
      >
        <DollarSign :size="14" />
        <span>Menor monto</span>
      </button>
    </div>

    <!-- Lista de gastos -->
    <div v-if="gastos.length === 0" class="text-center py-16">
      <div class="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4 border border-gray-100 mx-auto">
        <ArrowUpRight :size="40" stroke-width="1.5" />
      </div>
      <p class="font-bold text-gray-600">Sin gastos registrados</p>
      <p class="text-sm text-gray-400 mt-1">Aún no hay gastos en este mes.</p>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="gasto in gastos"
        :key="gasto.id"
        @click="irAEditar(gasto.id)"
        class="group bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.99] flex justify-between items-center relative overflow-hidden"
      >
        <!-- Indicador lateral -->
        <div class="absolute left-0 top-0 bottom-0 w-1 bg-red-400"></div>

        <div class="flex items-center gap-4 pl-2">
          <!-- Avatar usuario -->
          <div class="relative">
            <div class="w-12 h-12 rounded-full flex items-center justify-center text-xl border border-gray-100 shadow-sm bg-gray-50 overflow-hidden">
              <HelpCircle
                v-if="getUsuario(gasto.pagadoPor).nombre === '?'"
                :size="20"
                class="opacity-50"
              />

              <img
                v-else-if="getUsuario(gasto.pagadoPor).foto"
                :src="getUsuario(gasto.pagadoPor).foto"
                class="w-full h-full object-cover"
              />

              <component
                v-else
                :is="getIcono(getUsuario(gasto.pagadoPor).emoji)"
                :size="20"
                stroke-width="2.5"
                class="opacity-80"
              />
            </div>

            <!-- Badge método de pago -->
            <div
              v-if="gasto.metodoPago"
              class="absolute -bottom-1 -right-1 bg-white text-[9px] px-1.5 py-0.5 rounded-md border border-gray-100 shadow-sm text-gray-500 font-bold tracking-tighter"
            >
              {{ gasto.metodoPago.slice(0, 3).toUpperCase() }}
            </div>
          </div>

          <div class="flex flex-col">
            <span class="font-bold text-gray-800 text-base leading-tight">{{
              gasto.descripcion
            }}</span>
            <div class="flex items-center gap-2 mt-1">
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide text-gray-500 bg-gray-100">
                {{ gasto.categoria }}
              </span>
              <span class="text-xs text-gray-400 font-medium">
                {{ formatearFecha(gasto.fecha) }}
              </span>
            </div>
          </div>
        </div>

        <div class="text-right">
          <p class="font-extrabold text-lg tracking-tight text-gray-900">
            -${{ formatearDinero(gasto.monto) }}
          </p>
          <p
            v-if="gasto.totalCuotas && gasto.totalCuotas > 1"
            class="text-[10px] font-bold text-blue-500 bg-blue-50 inline-block px-1.5 rounded-md mt-1"
          >
            {{ gasto.cuotaActual }}/{{ gasto.totalCuotas }}
          </p>
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
