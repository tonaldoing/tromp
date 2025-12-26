<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useGastosStore } from '../stores/gastos'
import { storeToRefs } from 'pinia'
import { getIcono } from '../utils/icons'
import {
  ArrowLeft,
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  Calendar,
  CreditCard,
  Users,
  Tag,
  TrendingUp,
  TrendingDown,
} from 'lucide-vue-next'

const store = useGastosStore()
const { categoriasGasto, categoriasIngreso, usuarios, metodosPago } = storeToRefs(store)
const router = useRouter()

// Estado del formulario
const tipo = ref<'gasto' | 'ingreso'>('gasto')
const monto = ref('')
const descripcion = ref('')
const categoria = ref('')
const pagadoPor = ref('')
const metodoPago = ref('')
const cuotas = ref(1)
const guardando = ref(false)
const fechaPersonalizada = ref<Date | null>(null)

// Computed
const esIngreso = computed(() => tipo.value === 'ingreso')

const categoriasActivas = computed(() =>
  esIngreso.value ? categoriasIngreso.value : categoriasGasto.value,
)

const valorCuota = computed(() =>
  monto.value && cuotas.value > 1 ? (Number(monto.value) / cuotas.value).toFixed(2) : null,
)

// Textos dinámicos según tipo
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

// Colores dinámicos
const colores = computed(() => {
  if (esIngreso.value) {
    return {
      bg: 'bg-gradient-to-b from-green-50 to-gray-50',
      accent: 'bg-green-600',
      accentHover: 'hover:bg-green-700',
      accentLight: 'bg-green-100 text-green-700',
      shadow: 'shadow-green-200',
      ring: 'focus:ring-green-500',
      text: 'text-green-600',
      border: 'border-green-500',
      selectedCat: 'bg-green-600 text-white border-green-600',
    }
  }
  return {
    bg: 'bg-gradient-to-b from-gray-100 to-gray-50',
    accent: 'bg-black',
    accentHover: 'hover:bg-gray-800',
    accentLight: 'bg-gray-100 text-gray-700',
    shadow: 'shadow-gray-300',
    ring: 'focus:ring-black',
    text: 'text-gray-900',
    border: 'border-black',
    selectedCat: 'bg-black text-white border-black',
  }
})

// Reset categoría cuando cambia el tipo
watch(tipo, () => {
  categoria.value = ''
  // Reset cuotas si es ingreso
  if (esIngreso.value) {
    cuotas.value = 1
  }
})

// Cargar Borrador si existe
onMounted(() => {
  const borrador = store.consumirBorrador()
  if (borrador) {
    tipo.value = borrador.tipo || 'gasto'
    monto.value = borrador.monto || ''
    descripcion.value = borrador.descripcion || ''
    categoria.value = borrador.categoria || ''
    pagadoPor.value = borrador.pagadoPor || ''
    metodoPago.value = borrador.metodoPago || ''
    cuotas.value = borrador.cuotas || 1
  } else {
    // Defaults inteligentes
    if (usuarios.value.length > 0) pagadoPor.value = usuarios.value[0].id
    if (metodosPago.value.length > 0) metodoPago.value = metodosPago.value[0]
  }
})

// Ir a configurar (guarda estado)
const irAConfig = (ruta: string) => {
  store.guardarBorrador({
    tipo: tipo.value,
    monto: monto.value,
    descripcion: descripcion.value,
    categoria: categoria.value,
    pagadoPor: pagadoPor.value,
    metodoPago: metodoPago.value,
    cuotas: cuotas.value,
  })
  router.push(ruta)
}

const formatearFecha = (fecha: Date) => {
  const year = fecha.getFullYear()
  const month = String(fecha.getMonth() + 1).padStart(2, '0')
  const day = String(fecha.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const fechaInput = computed({
  get: () => {
    if (!fechaPersonalizada.value) return ''
    return formatearFecha(fechaPersonalizada.value)
  },
  set: (val: string) => {
    if (val) {
      // Parsear correctamente la fecha en formato YYYY-MM-DD
      const parts = val.split('-').map(Number)
      if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
        const year = parts[0]
        const month = parts[1]
        const day = parts[2]
        const fecha = new Date(year, month - 1, day, 12, 0, 0)
        fechaPersonalizada.value = fecha
      }
    } else {
      fechaPersonalizada.value = null
    }
  }
})

const guardar = async () => {
  if (!monto.value || !descripcion.value) return

  // Validaciones y defaults
  const catFinal =
    categoria.value ||
    (categoriasActivas.value.length > 0 ? categoriasActivas.value[0].nombre : 'Varios')
  const userFinal =
    pagadoPor.value || (usuarios.value.length > 0 ? usuarios.value[0].id : 'anonimo')
  const metodoFinal = metodoPago.value || 'Efectivo'

  guardando.value = true

  await store.agregarMovimiento(
    Number(monto.value),
    descripcion.value,
    userFinal,
    catFinal,
    tipo.value,
    metodoFinal,
    esIngreso.value ? 1 : cuotas.value,
    fechaPersonalizada.value || undefined,
  )

  guardando.value = false
  router.push('/')
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
            v-model="monto"
            type="number"
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
        <label
          class="flex items-center gap-1 text-xs font-bold text-gray-400 uppercase tracking-wide mb-2"
        >
          <Calendar :size="14" /> Fecha
        </label>
        <input
          v-model="fechaInput"
          type="date"
          class="w-full text-lg font-bold text-gray-800 outline-none"
          :class="fechaPersonalizada ? '' : 'text-gray-400'"
        />
        <p class="text-xs text-gray-500 mt-2">
          {{ fechaPersonalizada ? 'Fecha personalizada seleccionada' : 'Por defecto: fecha actual del mes visible' }}
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
            :class="esIngreso ? 'text-green-600 bg-green-50' : 'text-blue-600 bg-blue-50'"
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

      <!-- Solo para GASTOS: Quién pagó y Método de pago -->
      <template v-if="!esIngreso">
        <div class="grid grid-cols-2 gap-4">
          <!-- Quién pagó -->
          <div class="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
            <label
              class="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1"
            >
              <Users :size="14" /> Quién pagó
            </label>
            <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button
                v-for="user in usuarios"
                :key="user.id"
                @click="pagadoPor = user.id"
                class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all relative"
                :class="
                  pagadoPor === user.id
                    ? 'border-black opacity-100 scale-110'
                    : 'border-transparent opacity-40 grayscale hover:opacity-100'
                "
              >
                <img
                  v-if="user.foto"
                  :src="user.foto"
                  class="w-full h-full rounded-full object-cover"
                />
                <component v-else :is="getIcono(user.emoji)" :size="20" />
                <div
                  v-if="pagadoPor === user.id"
                  class="absolute -bottom-1 -right-1 bg-black text-white rounded-full p-0.5"
                >
                  <Check :size="8" stroke-width="4" />
                </div>
              </button>
            </div>
          </div>

          <!-- Método de pago -->
          <div class="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm relative">
            <label
              class="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1"
            >
              <CreditCard :size="14" /> Método
            </label>
            <select
              v-model="metodoPago"
              class="w-full bg-transparent font-bold text-gray-800 outline-none appearance-none relative z-10 py-1"
            >
              <option v-for="m in metodosPago" :key="m" :value="m">{{ m }}</option>
            </select>
            <div class="absolute right-4 bottom-5 text-gray-400 pointer-events-none">▼</div>
          </div>
        </div>

        <!-- Cuotas (solo gastos + solo cuando es Crédito) -->
        <div v-if="metodoPago === 'Crédito'" class="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
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
      </template>

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
            Los ingresos se suman a tu balance mensual. No requieren método de pago ni cuotas.
          </p>
        </div>
      </div>

      <!-- Botón Guardar -->
      <button
        @click="guardar"
        :disabled="guardando || !monto"
        class="w-full py-4 rounded-2xl text-xl font-bold shadow-xl active:scale-95 transition-all text-white flex items-center justify-center gap-3 mb-6"
        :class="[
          colores.accent,
          colores.accentHover,
          colores.shadow,
          !monto || guardando ? 'opacity-50 cursor-not-allowed' : '',
        ]"
      >
        <component :is="esIngreso ? ArrowDownLeft : ArrowUpRight" :size="22" />
        <span>{{ guardando ? 'Guardando...' : textos.boton }}</span>
      </button>
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
