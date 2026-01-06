<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useGastosStore } from '../stores/gastos'
import { useAuthStore } from '../stores/auth'
import { storeToRefs } from 'pinia'
import MonthSelector from '../components/MonthSelector.vue'
import BoardSelector from '../components/BoardSelector.vue'
import { getIcono } from '../utils/icons'

import {
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  Tags,
  CreditCard,
  Inbox,
  HelpCircle,
} from 'lucide-vue-next'

const store = useGastosStore()
const authStore = useAuthStore()
const router = useRouter()

const {
  movimientosDelMes,
  cargando,
  usuarios,
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

const formatearDinero = (monto: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(monto)
}

const getUsuario = (id: string) => {
  const encontrado = usuarios.value.find((u) => u.id === id)
  return (
    encontrado || { id: '', emoji: 'help', nombre: '?', email: '', foto: '' }
  )
}

const irAEditar = (id: string) => {
  router.push(`/edit/${id}`)
}

const irAPerfil = () => {
  router.push('/profile')
}
</script>

<template>
  <div class="px-5 pt-6 pb-28 bg-gray-50 min-h-screen">
    <!-- Header -->
    <header class="flex justify-between items-start mb-6 gap-4">
      <div class="flex-1 min-w-0">
        <h1 class="text-2xl font-extrabold text-gray-900 tracking-tight">
          Hola, {{ authStore.userProfile?.displayName?.split(' ')[0] || 'Usuario' }}
        </h1>
        <div v-if="store.boardActivo" class="mt-2">
          <BoardSelector />
        </div>
      </div>

      <button @click="irAPerfil" class="relative group active:scale-95 transition-transform shrink-0">
        <div
          class="absolute inset-0 bg-blue-500 rounded-full blur opacity-20 group-hover:opacity-40 transition-opacity"
        ></div>
        <img
          :src="authStore.userProfile?.photoURL || 'https://via.placeholder.com/150'"
          class="w-12 h-12 rounded-full border-2 border-white shadow-sm object-cover relative z-10"
        />
      </button>
    </header>

    <!-- Selector de Mes -->
    <MonthSelector />

    <!-- Balance Card -->
    <div class="bg-white rounded-3xl p-5 shadow-lg shadow-gray-200/50 mb-8 border border-gray-100">
      <div class="flex justify-between items-center mb-4">
        <span class="text-xs font-bold text-gray-400 uppercase tracking-wider"
          >Balance Mensual</span
        >
      </div>

      <div class="flex items-end gap-1 mb-6">
        <span class="text-4xl font-black text-gray-900 tracking-tighter"
          >${{ formatearDinero(balanceDelMes) }}</span
        >
        <span
          class="text-sm font-medium mb-1.5"
          :class="balanceDelMes >= 0 ? 'text-green-500' : 'text-red-500'"
        >
          {{ balanceDelMes >= 0 ? 'a favor' : 'en contra' }}
        </span>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <!-- Ingresos -->
        <RouterLink
          to="/ingresos"
          class="bg-green-50/50 rounded-2xl p-3 flex flex-col border border-green-100/50 hover:bg-green-100/50 hover:border-green-200 active:scale-95 transition-all cursor-pointer"
        >
          <div class="flex items-center gap-2 mb-1">
            <div
              class="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600"
            >
              <ArrowDownLeft :size="14" stroke-width="3" />
            </div>
            <span class="text-xs font-bold text-green-700 uppercase">Ingresos</span>
          </div>
          <span class="text-lg font-bold text-gray-800"
            >${{ formatearDinero(totalIngresosDelMes) }}</span
          >
        </RouterLink>

        <!-- Gastos -->
        <RouterLink
          to="/gastos"
          class="bg-red-50/50 rounded-2xl p-3 flex flex-col border border-red-100/50 hover:bg-red-100/50 hover:border-red-200 active:scale-95 transition-all cursor-pointer"
        >
          <div class="flex items-center gap-2 mb-1">
            <div
              class="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-red-600"
            >
              <ArrowUpRight :size="14" stroke-width="3" />
            </div>
            <span class="text-xs font-bold text-red-700 uppercase">Gastos</span>
          </div>
          <span class="text-lg font-bold text-gray-800"
            >${{ formatearDinero(totalGastosDelMes) }}</span
          >
        </RouterLink>
      </div>
    </div>

    <!-- Accesos rápidos -->
    <div class="flex gap-3 mb-8 overflow-x-auto pb-2 scrollbar-hide">
      <RouterLink
        to="/budget"
        class="flex items-center gap-2 bg-white border border-gray-200 pl-3 pr-4 py-2.5 rounded-2xl shadow-sm active:scale-95 transition-transform whitespace-nowrap group"
      >
        <div
          class="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 group-hover:bg-amber-100 transition-colors"
        >
          <Wallet :size="16" />
        </div>
        <span class="text-xs font-bold text-gray-700">Topes</span>
      </RouterLink>

      <RouterLink
        to="/categories"
        class="flex items-center gap-2 bg-white border border-gray-200 pl-3 pr-4 py-2.5 rounded-2xl shadow-sm active:scale-95 transition-transform whitespace-nowrap group"
      >
        <div
          class="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 group-hover:bg-purple-100 transition-colors"
        >
          <Tags :size="16" />
        </div>
        <span class="text-xs font-bold text-gray-700">Categorías</span>
      </RouterLink>

      <RouterLink
        to="/methods"
        class="flex items-center gap-2 bg-white border border-gray-200 pl-3 pr-4 py-2.5 rounded-2xl shadow-sm active:scale-95 transition-transform whitespace-nowrap group"
      >
        <div
          class="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-100 transition-colors"
        >
          <CreditCard :size="16" />
        </div>
        <span class="text-xs font-bold text-gray-700">Pagos</span>
      </RouterLink>
    </div>

    <!-- Progreso de Presupuesto por Categoría -->
    <div v-if="presupuestoConfigurado" class="mb-8">
      <div class="flex justify-between items-end mb-4">
        <h3 class="text-lg font-bold text-gray-800">Progreso del Mes</h3>
        <RouterLink
          to="/budget"
          class="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
        >
          Editar topes
        </RouterLink>
      </div>

      <div class="space-y-3">
        <div
          v-for="cat in categoriasGasto.filter(c => (estadoPresupuesto[c.nombre]?.total || 0) > 0)"
          :key="cat.id"
          class="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm"
        >
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <component :is="getIcono(cat.icono)" :size="16" class="text-gray-600" stroke-width="2.5" />
              <span class="text-sm font-bold text-gray-800">{{ cat.nombre }}</span>
            </div>
            <div class="text-right">
              <p class="text-xs font-bold text-gray-900">
                ${{ formatearDinero(estadoPresupuesto[cat.nombre]?.gastado || 0) }} / ${{ formatearDinero(estadoPresupuesto[cat.nombre]?.total || 0) }}
              </p>
            </div>
          </div>

          <!-- Barra de progreso -->
          <div class="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-500"
              :class="
                (estadoPresupuesto[cat.nombre]?.porcentaje || 0) >= 100
                  ? 'bg-red-500'
                  : (estadoPresupuesto[cat.nombre]?.porcentaje || 0) >= 80
                    ? 'bg-amber-500'
                    : 'bg-green-500'
              "
              :style="{ width: Math.min((estadoPresupuesto[cat.nombre]?.porcentaje || 0), 100) + '%' }"
            ></div>
          </div>

          <!-- Saldo disponible -->
          <div class="flex items-center justify-between mt-2">
            <p class="text-xs text-gray-500">
              {{ (estadoPresupuesto[cat.nombre]?.porcentaje || 0).toFixed(0) }}% usado
            </p>
            <p
              class="text-xs font-bold"
              :class="
                (estadoPresupuesto[cat.nombre]?.restante || 0) < 0
                  ? 'text-red-600'
                  : 'text-green-600'
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
      <h3 class="text-lg font-bold text-gray-800">Movimientos</h3>
      <span
        class="text-xs font-medium text-gray-400 bg-white px-2 py-1 rounded-lg border border-gray-100 shadow-sm"
        >{{ movimientosDelMes.length }} registros</span
      >
    </div>

    <!-- Loading state -->
    <div v-if="cargando" class="flex flex-col gap-3">
      <div
        v-for="i in 3"
        :key="i"
        class="bg-white p-4 rounded-2xl h-20 animate-pulse border border-gray-100"
      ></div>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="movimientosDelMes.length === 0"
      class="flex flex-col items-center justify-center py-16 text-center"
    >
      <div
        class="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4 border border-gray-100"
      >
        <Inbox :size="40" stroke-width="1.5" />
      </div>
      <p class="font-bold text-gray-600">Todo tranquilo</p>
      <p class="text-sm text-gray-400 mt-1">No hay movimientos registrados<br />en este mes.</p>
    </div>

    <!-- Lista de movimientos -->
    <div v-else class="space-y-3">
      <div
        v-for="mov in movimientosDelMes"
        :key="mov.id"
        @click="irAEditar(mov.id)"
        class="group bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.99] flex justify-between items-center relative overflow-hidden"
      >
        <!-- Indicador lateral de tipo -->
        <div
          class="absolute left-0 top-0 bottom-0 w-1"
          :class="mov.tipo === 'ingreso' ? 'bg-green-500' : 'bg-red-400'"
        ></div>

        <div class="flex items-center gap-4 pl-2">
          <!-- Avatar / Icono -->
          <div class="relative">
            <!-- Para ingresos mostramos icono de ingreso -->
            <div
              v-if="mov.tipo === 'ingreso'"
              class="w-12 h-12 rounded-full flex items-center justify-center bg-green-100 text-green-600 border border-green-200"
            >
              <ArrowDownLeft :size="20" stroke-width="2.5" />
            </div>

            <!-- Para gastos mostramos usuario -->
            <div
              v-else
              class="w-12 h-12 rounded-full flex items-center justify-center text-xl border border-gray-100 shadow-sm bg-gray-50 overflow-hidden"
            >
              <HelpCircle
                v-if="getUsuario(mov.pagadoPor).nombre === '?'"
                :size="20"
                class="opacity-50"
              />

              <img
                v-else-if="getUsuario(mov.pagadoPor).foto"
                :src="getUsuario(mov.pagadoPor).foto"
                class="w-full h-full object-cover"
              />

              <component
                v-else
                :is="getIcono(getUsuario(mov.pagadoPor).emoji)"
                :size="20"
                stroke-width="2.5"
                class="opacity-80"
              />
            </div>

            <!-- Badge método de pago (solo gastos) -->
            <div
              v-if="mov.metodoPago && mov.tipo === 'gasto'"
              class="absolute -bottom-1 -right-1 bg-white text-[9px] px-1.5 py-0.5 rounded-md border border-gray-100 shadow-sm text-gray-500 font-bold tracking-tighter"
            >
              {{ mov.metodoPago.slice(0, 3).toUpperCase() }}
            </div>
          </div>

          <div class="flex flex-col">
            <span class="font-bold text-gray-800 text-base leading-tight">{{
              mov.descripcion
            }}</span>
            <div class="flex items-center gap-2 mt-1">
              <span
                class="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide"
                :class="
                  mov.tipo === 'ingreso'
                    ? 'text-green-600 bg-green-100'
                    : 'text-gray-500 bg-gray-100'
                "
              >
                {{ mov.categoria }}
              </span>
              <span class="text-xs text-gray-400 font-medium">
                {{ formatearFecha(mov.fecha) }}
              </span>
            </div>
          </div>
        </div>

        <div class="text-right">
          <p
            class="font-extrabold text-lg tracking-tight"
            :class="mov.tipo === 'ingreso' ? 'text-green-600' : 'text-gray-900'"
          >
            {{ mov.tipo === 'ingreso' ? '+' : '-' }}${{ formatearDinero(mov.monto) }}
          </p>
          <p
            v-if="mov.totalCuotas && mov.totalCuotas > 1"
            class="text-[10px] font-bold text-blue-500 bg-blue-50 inline-block px-1.5 rounded-md mt-1"
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
