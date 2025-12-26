<script setup lang="ts">
import { computed } from 'vue'
import { useGastosStore } from '../stores/gastos'
import { storeToRefs } from 'pinia'
import MonthSelector from '../components/MonthSelector.vue'
import { getIcono } from '../utils/icons' // Importamos tu helper de iconos

// Iconos Lucide
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  PiggyBank,
  TrendingUp,
  AlertCircle,
} from 'lucide-vue-next'

const store = useGastosStore()
const { gastosDelMes, ingresosDelMes } = storeToRefs(store)

// --- FORMATO DINERO (Igual que en Home) ---
const formatearDinero = (monto: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(monto)
}

// --- CALCULOS GENERALES ---
const totalGastos = computed(() => gastosDelMes.value.reduce((a, b) => a + b.monto, 0))
const totalIngresos = computed(() => ingresosDelMes.value.reduce((a, b) => a + b.monto, 0))
const balance = computed(() => totalIngresos.value - totalGastos.value)

// Porcentaje de ahorro (Cuánto me queda del ingreso)
const porcentajeAhorro = computed(() => {
  if (totalIngresos.value === 0) return 0
  const p = (balance.value / totalIngresos.value) * 100
  return p < 0 ? 0 : p.toFixed(0) // No mostramos negativos
})

// Porcentaje de gasto (Barra de progreso)
const porcentajeGasto = computed(() => {
  if (totalIngresos.value === 0) return 100
  const p = (totalGastos.value / totalIngresos.value) * 100
  return p > 100 ? 100 : p
})

// --- RANKING POR CATEGORÍA (Top Gastos) ---
const gastosPorCategoria = computed(() => {
  const agrupado: Record<string, number> = {}

  // 1. Agrupar
  gastosDelMes.value.forEach((g) => {
    if (g.tipo === 'gasto') {
      agrupado[g.categoria] = (agrupado[g.categoria] || 0) + g.monto
    }
  })

  // 2. Convertir a array y ordenar
  return Object.entries(agrupado)
    .map(([cat, monto]) => ({
      nombre: cat,
      monto: monto,
      porcentaje: totalGastos.value > 0 ? (monto / totalGastos.value) * 100 : 0,
    }))
    .sort((a, b) => b.monto - a.monto) // Ordenar de mayor a menor
})
</script>

<template>
  <div class="px-5 pt-6 pb-28 bg-gray-50 min-h-screen">
    <h1 class="text-2xl font-extrabold text-gray-900 mb-6 tracking-tight">Estadísticas</h1>

    <MonthSelector class="shadow-sm border border-gray-100" />

    <div
      class="relative overflow-hidden rounded-3xl p-6 mb-6 shadow-xl transition-all duration-500"
      :class="balance >= 0 ? 'bg-gray-900 text-white' : 'bg-red-600 text-white'"
    >
      <div
        class="absolute -right-10 -top-10 w-40 h-40 bg-white opacity-5 rounded-full blur-2xl"
      ></div>

      <div class="relative z-10 flex justify-between items-start mb-2">
        <div>
          <p class="text-xs font-bold uppercase tracking-widest opacity-70 mb-1">Ahorro Neto</p>
          <p class="text-4xl font-black tracking-tighter">$ {{ formatearDinero(balance) }}</p>
        </div>
        <div class="p-3 rounded-xl bg-white/10 backdrop-blur-md">
          <Wallet :size="24" />
        </div>
      </div>

      <div class="mt-6">
        <div class="flex justify-between text-xs font-medium opacity-80 mb-2">
          <span>Gastado: {{ Math.round(porcentajeGasto) }}%</span>
          <span>Meta: 100%</span>
        </div>
        <div class="w-full h-2 bg-black/20 rounded-full overflow-hidden">
          <div
            class="h-full rounded-full transition-all duration-1000 ease-out"
            :class="balance >= 0 ? 'bg-emerald-400' : 'bg-white'"
            :style="{ width: `${porcentajeGasto}%` }"
          ></div>
        </div>
        <p
          v-if="balance > 0"
          class="text-xs mt-2 text-emerald-300 font-bold flex items-center gap-1"
        >
          <PiggyBank :size="12" /> Estás ahorrando un {{ porcentajeAhorro }}% de tus ingresos
        </p>
        <p v-else class="text-xs mt-2 text-white/80 font-bold flex items-center gap-1">
          <AlertCircle :size="12" /> Gastaste más de lo que ingresó
        </p>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-4 mb-8">
      <div
        class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-28"
      >
        <div class="flex items-center gap-2">
          <div
            class="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600"
          >
            <ArrowDownLeft :size="16" stroke-width="3" />
          </div>
          <span class="text-xs font-bold text-gray-400 uppercase">Ingresos</span>
        </div>
        <p class="text-xl font-extrabold text-gray-800 tracking-tight">
          $ {{ formatearDinero(totalIngresos) }}
        </p>
      </div>

      <div
        class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-28"
      >
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-600">
            <ArrowUpRight :size="16" stroke-width="3" />
          </div>
          <span class="text-xs font-bold text-gray-400 uppercase">Gastos</span>
        </div>
        <p class="text-xl font-extrabold text-gray-800 tracking-tight">
          $ {{ formatearDinero(totalGastos) }}
        </p>
      </div>
    </div>

    <div v-if="totalGastos > 0">
      <div class="flex items-center gap-2 mb-4">
        <TrendingUp :size="20" class="text-gray-800" />
        <h3 class="text-lg font-bold text-gray-800">Top Gastos</h3>
      </div>

      <div class="space-y-4">
        <div
          v-for="cat in gastosPorCategoria"
          :key="cat.nombre"
          class="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm"
        >
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 text-gray-600"
              >
                <component :is="getIcono(cat.nombre)" :size="20" stroke-width="2" />
              </div>
              <div>
                <p class="font-bold text-gray-800 text-sm">{{ cat.nombre }}</p>
                <p class="text-xs text-gray-400 font-medium">
                  {{ cat.porcentaje.toFixed(1) }}% del total
                </p>
              </div>
            </div>
            <p class="font-bold text-gray-900">$ {{ formatearDinero(cat.monto) }}</p>
          </div>

          <div class="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              class="h-full bg-black rounded-full"
              :style="{ width: `${cat.porcentaje}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-12 opacity-50">
      <p class="text-sm font-medium">Aún no hay gastos para analizar este mes.</p>
    </div>
  </div>
</template>
