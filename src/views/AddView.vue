<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useGastosStore } from '../stores/gastos'
import { storeToRefs } from 'pinia'
import { getIcono } from '../utils/icons'
import { formatearMontoInput, limpiarMontoInput } from '../utils/formato'
import {
  ArrowLeft,
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  Calendar,
  Tag,
  TrendingUp,
  TrendingDown,
  Edit3,
} from 'lucide-vue-next'

const store = useGastosStore()
const { categoriasGasto, categoriasIngreso } = storeToRefs(store)
const router = useRouter()

// Estado del formulario
const tipo = ref<'gasto' | 'ingreso'>('gasto')
const monto = ref('')
const descripcion = ref('')
const categoria = ref('')
const cuotas = ref(1)
const guardando = ref(false)
const fechaPersonalizada = ref<Date | null>(null)
const usarInputManual = ref(false)

// Computed
const esIngreso = computed(() => tipo.value === 'ingreso')

const categoriasActivas = computed(() =>
  esIngreso.value ? categoriasIngreso.value : categoriasGasto.value,
)

const valorCuota = computed(() =>
  monto.value && cuotas.value > 1 ? (Number(monto.value) / cuotas.value).toFixed(2) : null,
)

const textos = computed(() => {
  if (esIngreso.value) {
    return {
      titulo: 'Nuevo Ingreso',
      placeholder: '¿De dónde viene?',
      subtitulo: 'Monto recibido',
      boton: 'Registrar Ingreso',
      categoriaLabel: 'Fuente',
    }
  }
  return {
    titulo: 'Nuevo Gasto',
    placeholder: '¿En qué gastaste?',
    subtitulo: 'Monto del gasto',
    boton: 'Registrar Gasto',
    categoriaLabel: 'Categoría',
  }
})

const colores = computed(() => {
  if (esIngreso.value) {
    return {
      bg: 'bg-gradient-to-b from-green-50 to-gray-50',
      accent: 'bg-green-600',
      accentHover: 'hover:bg-green-700',
      shadow: 'shadow-green-200',
      text: 'text-green-600',
      selectedCat: 'bg-green-600 text-white border-green-600',
    }
  }
  return {
    bg: 'bg-gradient-to-b from-gray-100 to-gray-50',
    accent: 'bg-black',
    accentHover: 'hover:bg-gray-800',
    shadow: 'shadow-gray-300',
    text: 'text-gray-900',
    selectedCat: 'bg-black text-white border-black',
  }
})

const onInputMonto = (event: Event) => {
  const input = event.target as HTMLInputElement
  const cleaned = limpiarMontoInput(input.value)

  if (cleaned === null) {
    input.value = formatearMontoInput(monto.value)
    return
  }

  monto.value = cleaned
  input.value = formatearMontoInput(cleaned)
}

watch(tipo, () => {
  categoria.value = ''
  if (esIngreso.value) {
    cuotas.value = 1
  }
})

onMounted(() => {
  const borrador = store.consumirBorrador()
  if (borrador) {
    tipo.value = borrador.tipo || 'gasto'
    monto.value = borrador.monto || ''
    descripcion.value = borrador.descripcion || ''
    categoria.value = borrador.categoria || ''
    cuotas.value = borrador.cuotas || 1
  }
})

const irAConfig = (ruta: string) => {
  store.guardarBorrador({
    tipo: tipo.value,
    monto: monto.value,
    descripcion: descripcion.value,
    categoria: categoria.value,
    cuotas: cuotas.value,
  })
  router.push(ruta)
}

const formatearFecha = (fecha: Date) => {
  const year = fecha.getFullYear()
  const month = String(fecha.getMonth() + 1).padStart(2, '0')
  const day = String(fecha.getDate()).padStart(2, '0')
  return `${day}/${month}/${year}`
}

const fechaInput = computed({
  get: () => {
    if (!fechaPersonalizada.value) return ''
    return formatearFecha(fechaPersonalizada.value)
  },
  set: (val: string) => {
    if (val) {
      const parts = val.split('/').map(Number)
      if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
        fechaPersonalizada.value = new Date(parts[2], parts[1] - 1, parts[0], 12, 0, 0)
      }
    } else {
      fechaPersonalizada.value = null
    }
  },
})

const onInputFechaManual = (event: Event) => {
  const input = event.target as HTMLInputElement
  let value = input.value.replace(/\D/g, '')

  if (value.length >= 2) {
    value = value.slice(0, 2) + '/' + value.slice(2)
  }
  if (value.length >= 5) {
    value = value.slice(0, 5) + '/' + value.slice(5, 9)
  }

  input.value = value

  if (value.length === 10) {
    const [day, month, year] = value.split('/').map(Number)
    if (day && month && year && day <= 31 && month <= 12) {
      fechaPersonalizada.value = new Date(year, month - 1, day, 12, 0, 0)
    }
  }
}

const fechaNativaInput = computed({
  get: () => {
    if (!fechaPersonalizada.value) return ''
    const y = fechaPersonalizada.value.getFullYear()
    const m = String(fechaPersonalizada.value.getMonth() + 1).padStart(2, '0')
    const d = String(fechaPersonalizada.value.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  },
  set: (val: string) => {
    if (val) {
      const parts = val.split('-').map(Number)
      if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
        fechaPersonalizada.value = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0)
      }
    } else {
      fechaPersonalizada.value = null
    }
  },
})

const guardar = async () => {
  if (!monto.value || !descripcion.value) return

  const primeraCategoria = categoriasActivas.value[0]
  const catFinal = categoria.value || (primeraCategoria ? primeraCategoria.nombre : 'Varios')

  guardando.value = true

  try {
    await store.agregarMovimiento(
      Number(monto.value),
      descripcion.value,
      catFinal,
      tipo.value,
      esIngreso.value ? 1 : cuotas.value,
      fechaPersonalizada.value || undefined,
    )
    router.push('/')
  } catch (error) {
    console.error('Error guardando movimiento:', error)
    alert('No se pudo guardar el movimiento. Revisá tu conexión e intentá de nuevo.')
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <div class="min-h-screen pb-24 transition-all duration-300" :class="colores.bg">
    <!-- Header -->
    <div class="px-5 pt-6 mb-6 flex justify-between items-center">
      <button
        @click="router.back()"
        class="w-10 h-10 flex items-center justify-center bg-white rounded-full border border-gray-200 shadow-sm text-gray-700 active:scale-95 transition-transform"
      >
        <ArrowLeft :size="20" />
      </button>

      <!-- Toggle Gasto/Ingreso -->
      <div class="bg-white p-1.5 rounded-full flex shadow-md border border-gray-100">
        <button
          @click="tipo = 'gasto'"
          class="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all"
          :class="
            !esIngreso
              ? 'bg-black text-white shadow-md'
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
          "
        >
          <TrendingDown :size="14" />
          Gasto
        </button>
        <button
          @click="tipo = 'ingreso'"
          class="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all"
          :class="
            esIngreso
              ? 'bg-green-600 text-white shadow-md'
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
          "
        >
          <TrendingUp :size="14" />
          Ingreso
        </button>
      </div>
    </div>

    <div class="px-5 space-y-6">
      <!-- Monto -->
      <div class="text-center py-4">
        <div class="relative inline-block">
          <span
            class="absolute -left-8 top-3 text-3xl font-bold transition-colors"
            :class="esIngreso ? 'text-green-400' : 'text-gray-300'"
            >$</span
          >
          <input
            :value="formatearMontoInput(monto)"
            @input="onInputMonto"
            type="text"
            inputmode="decimal"
            placeholder="0"
            autofocus
            class="w-full bg-transparent text-center text-6xl font-black placeholder-gray-200 outline-none caret-current transition-colors"
            :class="esIngreso ? 'text-green-600' : 'text-gray-900'"
          />
        </div>
        <p class="text-xs text-gray-400 font-bold uppercase tracking-widest mt-2">
          {{ textos.subtitulo }}
        </p>
      </div>

      <!-- Descripción -->
      <div
        class="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm focus-within:ring-2 transition-all"
        :class="esIngreso ? 'focus-within:ring-green-200' : 'focus-within:ring-black/5'"
      >
        <label class="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
          Descripción
        </label>
        <input
          v-model="descripcion"
          type="text"
          :placeholder="textos.placeholder"
          class="w-full text-lg font-bold text-gray-800 placeholder-gray-300 outline-none"
          @keyup.enter="guardar"
        />
      </div>

      <!-- Fecha -->
      <div class="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
        <div class="flex items-center justify-between mb-3">
          <label
            class="flex items-center gap-1 text-xs font-bold text-gray-400 uppercase tracking-wide"
          >
            <Calendar :size="14" /> Fecha
          </label>

          <button
            @click="usarInputManual = !usarInputManual"
            type="button"
            class="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-700 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-all active:scale-95"
          >
            <component :is="usarInputManual ? Calendar : Edit3" :size="14" />
            <span>{{ usarInputManual ? 'Calendario' : 'Escribir' }}</span>
          </button>
        </div>

        <!-- Input manual DD/MM/YYYY -->
        <div v-if="usarInputManual" class="relative">
          <input
            :value="fechaInput"
            @input="onInputFechaManual"
            type="text"
            inputmode="numeric"
            placeholder="DD/MM/YYYY"
            maxlength="10"
            class="w-full text-lg font-bold text-gray-800 outline-none pr-10"
            :class="fechaPersonalizada ? '' : 'text-gray-400'"
          />
          <Edit3
            v-if="!fechaPersonalizada"
            :size="16"
            class="absolute right-0 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none"
          />
        </div>

        <!-- Input nativo type="date" -->
        <div v-else class="relative">
          <input
            v-model="fechaNativaInput"
            type="date"
            class="w-full text-lg font-bold text-gray-800 outline-none"
            :class="fechaPersonalizada ? '' : 'text-gray-400'"
          />
        </div>

        <p class="text-xs text-gray-500 mt-2 flex items-center gap-1">
          <span v-if="fechaPersonalizada" class="inline-flex items-center gap-1">
            <Check :size="12" class="text-green-600" />
            {{ formatearFecha(fechaPersonalizada) }}
          </span>
          <span v-else class="text-gray-400"> Por defecto: fecha actual del mes visible </span>
        </p>
      </div>

      <!-- Categorías -->
      <div>
        <div class="flex justify-between items-end mb-3">
          <label
            class="text-xs font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1"
          >
            <Tag :size="14" /> {{ textos.categoriaLabel }}
          </label>
          <button
            @click="irAConfig('/categories')"
            class="text-xs font-bold px-2 py-1 rounded-md transition-colors"
            :class="esIngreso ? 'text-green-600 bg-green-50' : 'text-gray-500 bg-blue-50'"
          >
            Editar
          </button>
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            v-for="cat in categoriasActivas"
            :key="cat.id"
            @click="categoria = cat.nombre"
            class="flex items-center gap-2 px-4 py-3 rounded-2xl border-2 transition-all active:scale-95"
            :class="
              categoria === cat.nombre
                ? colores.selectedCat + ' shadow-lg'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            "
          >
            <component :is="getIcono(cat.icono)" :size="18" stroke-width="2.5" />
            <span class="text-sm font-bold">{{ cat.nombre }}</span>
          </button>

          <div
            v-if="categoriasActivas.length === 0"
            class="w-full text-center py-4 bg-gray-100 rounded-2xl border border-dashed border-gray-300 text-gray-400 text-sm"
          >
            No hay categorías de {{ esIngreso ? 'ingreso' : 'gasto' }} creadas.
          </div>
        </div>
      </div>

      <!-- Cuotas (solo gastos) -->
      <div v-if="!esIngreso" class="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
        <label
          class="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1"
        >
          <Calendar :size="14" /> Cuotas
        </label>
        <div class="flex items-center justify-between">
          <div class="flex gap-2">
            <button
              v-for="c in [1, 3, 6, 12]"
              :key="c"
              @click="cuotas = c"
              class="w-10 h-10 rounded-xl font-bold text-sm transition-all"
              :class="
                cuotas === c
                  ? 'bg-black text-white shadow-md'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              "
            >
              {{ c }}
            </button>
          </div>
          <div v-if="valorCuota" class="text-right">
            <p class="text-xs text-gray-400 font-bold uppercase">Valor cuota</p>
            <p class="font-bold text-blue-600">${{ valorCuota }}</p>
          </div>
        </div>
      </div>

      <!-- Info para INGRESOS -->
      <div
        v-if="esIngreso"
        class="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start gap-3"
      >
        <div
          class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0"
        >
          <ArrowDownLeft :size="16" class="text-green-600" />
        </div>
        <div>
          <p class="font-bold text-green-800 text-sm">Registrando un ingreso</p>
          <p class="text-green-600 text-xs mt-1">
            Los ingresos se suman a tu balance mensual. No requieren cuotas.
          </p>
        </div>
      </div>

      <!-- Botón Guardar -->
      <button
        @click="guardar"
        :disabled="guardando || !monto || !descripcion"
        class="w-full py-4 rounded-2xl text-xl font-bold shadow-xl active:scale-95 transition-all text-white flex items-center justify-center gap-3"
        :class="[
          colores.accent,
          colores.accentHover,
          colores.shadow,
          !monto || !descripcion || guardando ? 'opacity-50 cursor-not-allowed' : '',
        ]"
      >
        <component :is="esIngreso ? ArrowDownLeft : ArrowUpRight" :size="22" />
        <span>{{ guardando ? 'Guardando...' : textos.boton }}</span>
      </button>

      <p v-if="monto && !descripcion" class="text-center text-xs text-gray-400 font-medium -mt-2">
        Agregá una descripción para poder guardar
      </p>

      <RouterLink
        to="/import"
        class="block text-center text-xs font-bold text-gray-400 hover:text-blue-600 transition-colors pb-6"
      >
        ¿Muchos gastos? Importalos todos juntos →
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
input[type='number']::-webkit-inner-spin-button,
input[type='number']::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type='number'] {
  -moz-appearance: textfield;
}
</style>
