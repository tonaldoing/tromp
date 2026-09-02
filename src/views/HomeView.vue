<script setup lang="ts">
import { useRouter, RouterLink } from 'vue-router'
import { useGastosStore } from '../stores/gastos'
import { useAuthStore } from '../stores/auth'
import { storeToRefs } from 'pinia'
import MonthSelector from '../components/MonthSelector.vue'
import { getIcono } from '../utils/icons'
import { formatearDinero } from '../utils/formato'

import { ArrowUpRight, ArrowDownLeft, Inbox, LogOut, ClipboardPaste } from 'lucide-vue-next'

const store = useGastosStore()
const authStore = useAuthStore()
const router = useRouter()

const {
  movimientosDelMes,
  cargando,
  totalGastosDelMes,
  totalIngresosDelMes,
  balanceDelMes,
  estadoPresupuesto,
  presupuestoConfigurado,
  categoriasGasto,
} = storeToRefs(store)

const formatearFecha = (fecha: Date) => {
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(fecha)
}

const irAEditar = (id: string) => {
  router.push(`/edit/${id}`)
}
</script>

<template>
  <div class="px-5 pt-6 pb-28 bg-gray-50 dark:bg-slate-900 min-h-screen">
    <!-- Header -->
    <header class="flex justify-between items-start mb-6 gap-4">
      <div class="flex-1 min-w-0">
        <h1 class="text-2xl font-extrabold text-gray-900 dark:text-slate-100 tracking-tight">
          Hola, {{ authStore.userProfile?.displayName?.split(' ')[0] || 'Usuario' }}
        </h1>
      </div>

      <RouterLink
        to="/import"
        aria-label="Importar gastos"
        class="w-11 h-11 flex items-center justify-center bg-white dark:bg-slate-800 rounded-full border border-gray-200 dark:border-slate-700 shadow-sm text-gray-500 dark:text-slate-400 hover:text-primario hover:border-blue-200 dark:hover:border-blue-800 active:scale-95 transition-all shrink-0"
        title="Importar gastos"
      >
        <ClipboardPaste :size="18" />
      </RouterLink>

      <button
        @click="authStore.logout()"
        aria-label="Cerrar sesión"
        class="w-11 h-11 flex items-center justify-center bg-white dark:bg-slate-800 rounded-full border border-gray-200 dark:border-slate-700 shadow-sm text-gray-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 active:scale-95 transition-all shrink-0"
        title="Cerrar sesión"
      >
        <LogOut :size="18" />
      </button>
    </header>

    <!-- Selector de Mes -->
    <MonthSelector />

    <!-- Balance Card -->
    <div
      class="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-lg shadow-gray-200/50 dark:shadow-none mb-8 border border-gray-100 dark:border-slate-700"
    >
      <div class="flex justify-between items-center mb-4">
        <span class="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider"
          >Balance Mensual</span
        >
      </div>

      <div class="flex items-end gap-1 mb-6">
        <span class="text-4xl font-black text-gray-900 dark:text-slate-100 tracking-tighter"
          >${{ formatearDinero(balanceDelMes) }}</span
        >
        <span
          class="text-sm font-medium mb-1.5"
          :class="balanceDelMes >= 0 ? 'text-green-500' : 'text-red-500 dark:text-red-400'"
        >
          {{ balanceDelMes >= 0 ? 'a favor' : 'en contra' }}
        </span>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <!-- Ingresos -->
        <div
          class="bg-green-50/50 dark:bg-green-950/40 rounded-2xl p-3 flex flex-col border border-green-100/50 dark:border-green-900/40"
        >
          <div class="flex items-center gap-2 mb-1">
            <div
              class="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/60 flex items-center justify-center text-green-600 dark:text-green-400"
            >
              <ArrowDownLeft :size="14" stroke-width="3" />
            </div>
            <span class="text-xs font-bold text-green-700 dark:text-green-300 uppercase"
              >Ingresos</span
            >
          </div>
          <span class="text-lg font-bold text-gray-800 dark:text-slate-200"
            >${{ formatearDinero(totalIngresosDelMes) }}</span
          >
        </div>

        <!-- Gastos -->
        <div
          class="bg-red-50/50 dark:bg-red-950/40 rounded-2xl p-3 flex flex-col border border-red-100/50 dark:border-red-900/40"
        >
          <div class="flex items-center gap-2 mb-1">
            <div
              class="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/60 flex items-center justify-center text-red-600 dark:text-red-400"
            >
              <ArrowUpRight :size="14" stroke-width="3" />
            </div>
            <span class="text-xs font-bold text-red-700 dark:text-red-300 uppercase">Gastos</span>
          </div>
          <span class="text-lg font-bold text-gray-800 dark:text-slate-200"
            >${{ formatearDinero(totalGastosDelMes) }}</span
          >
        </div>
      </div>
    </div>

    <!-- Progreso de Presupuesto por Categoría -->
    <div v-if="presupuestoConfigurado" class="mb-8">
      <div class="flex justify-between items-end mb-4">
        <h3 class="text-lg font-bold text-gray-800 dark:text-slate-200">Progreso del Mes</h3>
        <RouterLink
          to="/budget"
          class="text-xs font-bold text-primario hover:text-primario-hover transition-colors"
        >
          Editar topes
        </RouterLink>
      </div>

      <div class="space-y-3">
        <div
          v-for="cat in categoriasGasto.filter(
            (c) => (estadoPresupuesto[c.nombre]?.total || 0) > 0,
          )"
          :key="cat.id"
          class="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm"
        >
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <component
                :is="getIcono(cat.icono)"
                :size="16"
                class="text-gray-600 dark:text-slate-300"
                stroke-width="2.5"
              />
              <span class="text-sm font-bold text-gray-800 dark:text-slate-200">{{
                cat.nombre
              }}</span>
            </div>
            <div class="text-right">
              <p class="text-xs font-bold text-gray-900 dark:text-slate-100">
                ${{ formatearDinero(estadoPresupuesto[cat.nombre]?.gastado || 0) }} / ${{
                  formatearDinero(estadoPresupuesto[cat.nombre]?.total || 0)
                }}
              </p>
            </div>
          </div>

          <div class="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-500"
              :class="
                (estadoPresupuesto[cat.nombre]?.porcentaje || 0) >= 100
                  ? 'bg-red-500'
                  : (estadoPresupuesto[cat.nombre]?.porcentaje || 0) >= 80
                    ? 'bg-amber-500'
                    : 'bg-green-500'
              "
              :style="{
                width: Math.min(estadoPresupuesto[cat.nombre]?.porcentaje || 0, 100) + '%',
              }"
            ></div>
          </div>

          <div class="flex items-center justify-between mt-2">
            <p class="text-xs text-gray-500 dark:text-slate-400">
              {{ (estadoPresupuesto[cat.nombre]?.porcentaje || 0).toFixed(0) }}% usado
            </p>
            <p
              class="text-xs font-bold"
              :class="
                (estadoPresupuesto[cat.nombre]?.restante || 0) < 0
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-green-600 dark:text-green-400'
              "
            >
              {{ (estadoPresupuesto[cat.nombre]?.restante || 0) < 0 ? 'Excedido' : 'Disponible' }}:
              ${{ formatearDinero(Math.abs(estadoPresupuesto[cat.nombre]?.restante || 0)) }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Título movimientos -->
    <div class="flex justify-between items-end mb-4">
      <h3 class="text-lg font-bold text-gray-800 dark:text-slate-200">Movimientos</h3>
      <span
        class="text-xs font-medium text-gray-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-gray-100 dark:border-slate-700 shadow-sm"
        >{{ movimientosDelMes.length }} registros</span
      >
    </div>

    <!-- Loading state -->
    <div v-if="cargando" class="flex flex-col gap-3">
      <div
        v-for="i in 3"
        :key="i"
        class="bg-white dark:bg-slate-800 p-4 rounded-2xl h-20 animate-pulse border border-gray-100 dark:border-slate-700"
      ></div>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="movimientosDelMes.length === 0"
      class="flex flex-col items-center justify-center py-16 text-center"
    >
      <div
        class="w-20 h-20 bg-gray-50 dark:bg-slate-900 rounded-full flex items-center justify-center text-gray-300 dark:text-slate-600 mb-4 border border-gray-100 dark:border-slate-700"
      >
        <Inbox :size="40" stroke-width="1.5" />
      </div>
      <p class="font-bold text-gray-600 dark:text-slate-300">Todo tranquilo</p>
      <p class="text-sm text-gray-500 dark:text-slate-400 mt-1">
        No hay movimientos registrados<br />en este mes.
      </p>
    </div>

    <!-- Lista de movimientos -->
    <div v-else class="space-y-3">
      <div
        v-for="mov in movimientosDelMes"
        :key="mov.id"
        @click="irAEditar(mov.id)"
        class="group bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.99] flex justify-between items-center relative overflow-hidden"
      >
        <!-- Indicador lateral de tipo -->
        <div
          class="absolute left-0 top-0 bottom-0 w-1"
          :class="mov.tipo === 'ingreso' ? 'bg-green-500' : 'bg-red-400'"
        ></div>

        <div class="flex items-center gap-4 pl-2">
          <!-- Icono -->
          <div
            class="w-12 h-12 rounded-full flex items-center justify-center border shadow-sm"
            :class="
              mov.tipo === 'ingreso'
                ? 'bg-green-100 dark:bg-green-900/60 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800'
                : 'bg-gray-50 dark:bg-slate-900 text-gray-600 dark:text-slate-300 border-gray-100 dark:border-slate-700'
            "
          >
            <component
              v-if="mov.tipo === 'ingreso'"
              :is="ArrowDownLeft"
              :size="20"
              stroke-width="2.5"
            />
            <component
              v-else
              :is="
                getIcono(store.categorias.find((c) => c.nombre === mov.categoria)?.icono || 'star')
              "
              :size="20"
              stroke-width="2.5"
            />
          </div>

          <div class="flex flex-col">
            <span class="font-bold text-gray-800 dark:text-slate-200 text-base leading-tight">{{
              mov.descripcion
            }}</span>
            <div class="flex items-center gap-2 mt-1">
              <span
                class="text-xs font-bold px-2 py-0.5 rounded-md uppercase tracking-wide"
                :class="
                  mov.tipo === 'ingreso'
                    ? 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/60'
                    : 'text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-700'
                "
              >
                {{ mov.categoria }}
              </span>
              <span class="text-xs text-gray-500 dark:text-slate-400 font-medium">
                {{ formatearFecha(mov.fecha) }}
              </span>
            </div>
          </div>
        </div>

        <div class="text-right">
          <p
            class="font-extrabold text-lg tracking-tight"
            :class="
              mov.tipo === 'ingreso'
                ? 'text-green-600 dark:text-green-400'
                : 'text-gray-900 dark:text-slate-100'
            "
          >
            {{ mov.tipo === 'ingreso' ? '+' : '-' }}${{ formatearDinero(mov.monto) }}
          </p>
          <p
            v-if="mov.totalCuotas && mov.totalCuotas > 1"
            class="text-xs font-bold text-blue-500 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 inline-block px-1.5 rounded-md mt-1"
          >
            {{ mov.cuotaActual }}/{{ mov.totalCuotas }}
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
