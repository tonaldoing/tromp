<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useGastosStore } from '../stores/gastos'
import { useAuthStore } from '../stores/auth'
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
  Edit3,
} from 'lucide-vue-next'

const store = useGastosStore()
const { categoriasGasto, categoriasIngreso, usuarios, metodosPago } = storeToRefs(store)
const router = useRouter()
const authStore = useAuthStore()

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
const usarInputManual = ref(false) // false = selector nativo, true = input manual

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

// Formatear número con separadores de miles y decimales (formato argentino)
const formatearMontoInput = (valor: string): string => {
  if (!valor) return ''

  // Separar parte entera y decimal
  const partes = valor.split('.')
  const parteEntera = partes[0]?.replace(/\D/g, '') || ''
  const parteDecimal = partes[1] ? partes[1].replace(/\D/g, '').slice(0, 2) : ''

  if (!parteEntera) return ''

  // Formatear parte entera con separadores de miles
  const numeroFormateado = new Intl.NumberFormat('es-AR').format(Number(parteEntera))

  // Agregar decimales si existen
  if (parteDecimal) {
    return `${numeroFormateado},${parteDecimal}`
  }

  // Si termina con punto, agregarlo para mostrar que el usuario está escribiendo decimales
  if (valor.endsWith('.') || valor.endsWith(',')) {
    return `${numeroFormateado},`
  }

  return numeroFormateado
}

// Manejador de input para monto
const onInputMonto = (event: Event) => {
  const input = event.target as HTMLInputElement
  let value = input.value

  // Remover todos los separadores de miles (puntos) y reemplazar coma decimal por punto
  value = value.replace(/\./g, '').replace(',', '.')

  // Permitir solo números y punto decimal
  const cleaned = value.replace(/[^\d.]/g, '')

  // Validar formato: números, opcionalmente un punto, y hasta 2 decimales
  const regex = /^\d*\.?\d{0,2}$/
  if (!regex.test(cleaned)) {
    // Si no es válido, mantener el valor anterior
    input.value = formatearMontoInput(monto.value)
    return
  }

  // Guardar valor interno sin formato (con punto decimal)
  monto.value = cleaned

  // Mostrar valor formateado
  input.value = formatearMontoInput(cleaned)
}

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
    const primerUsuario = usuarios.value[0]
    if (primerUsuario) pagadoPor.value = primerUsuario.id
    const primerMetodo = metodosPago.value[0]
    if (primerMetodo) metodoPago.value = primerMetodo
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
  return `${day}/${month}/${year}` // Formato argentino DD/MM/YYYY
}

const fechaInput = computed({
  get: () => {
    if (!fechaPersonalizada.value) return ''
    return formatearFecha(fechaPersonalizada.value)
  },
  set: (val: string) => {
    if (val) {
      // Parsear formato DD/MM/YYYY
      const parts = val.split('/').map(Number)
      if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
        const day = parts[0]
        const month = parts[1]
        const year = parts[2]
        const fecha = new Date(year, month - 1, day, 12, 0, 0)
        fechaPersonalizada.value = fecha
      }
    } else {
      fechaPersonalizada.value = null
    }
  },
})

// Manejador de input manual de fecha
const onInputFechaManual = (event: Event) => {
  const input = event.target as HTMLInputElement
  let value = input.value.replace(/\D/g, '') // Solo dígitos

  // Formatear automáticamente DD/MM/YYYY mientras escribe
  if (value.length >= 2) {
    value = value.slice(0, 2) + '/' + value.slice(2)
  }
  if (value.length >= 5) {
    value = value.slice(0, 5) + '/' + value.slice(5, 9)
  }

  input.value = value

  // Parsear y actualizar fechaPersonalizada si la fecha es válida
  if (value.length === 10) {
    const [day, month, year] = value.split('/').map(Number)
    if (day && month && year && day <= 31 && month <= 12) {
      fechaPersonalizada.value = new Date(year, month - 1, day, 12, 0, 0)
    }
  }
}

// Función para formatear fecha para input type="date" (YYYY-MM-DD)
const formatearFechaNativa = (fecha: Date) => {
  const year = fecha.getFullYear()
  const month = String(fecha.getMonth() + 1).padStart(2, '0')
  const day = String(fecha.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Computed para input nativo type="date"
const fechaNativaInput = computed({
  get: () => {
    if (!fechaPersonalizada.value) return ''
    return formatearFechaNativa(fechaPersonalizada.value)
  },
  set: (val: string) => {
    if (val) {
      const parts = val.split('-').map(Number)
      if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
        const year = parts[0]
        const month = parts[1]
        const day = parts[2]
        fechaPersonalizada.value = new Date(year, month - 1, day, 12, 0, 0)
      }
    } else {
      fechaPersonalizada.value = null
    }
  },
})

const guardar = async () => {
  if (!monto.value || !descripcion.value) return

  // Validaciones y defaults
  const primeraCategoria = categoriasActivas.value[0]
  const catFinal = categoria.value || (primeraCategoria ? primeraCategoria.nombre : 'Varios')
  const primerUsuarioGuardar = usuarios.value[0]
  const userFinal = pagadoPor.value || (primerUsuarioGuardar ? primerUsuarioGuardar.id : 'anonimo')
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

          <!-- Toggle para cambiar tipo de input -->
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

      <!-- Solo para GASTOS: Quién pagó y Método de pago -->
      <template v-if="!esIngreso">
        <!-- Quién pagó -->
        <div>
          <div class="flex justify-between items-end mb-3">
            <label
              class="text-xs font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1"
            >
              <Users :size="14" /> Quién pagó
            </label>
          </div>

          <div class="flex flex-wrap gap-2">
            <button
              v-for="user in usuarios"
              :key="user.id"
              @click="pagadoPor = user.id"
              class="flex items-center gap-2 px-4 py-3 rounded-2xl border-2 transition-all active:scale-95"
              :class="
                pagadoPor === user.id
                  ? 'bg-black text-white border-black shadow-lg'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              "
            >
              <div
                class="w-5 h-5 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0"
              >
                <img
                  v-if="
                    user.foto ||
                    (user.id === authStore.userProfile?.uid && authStore.userProfile?.photoURL)
                  "
                  :src="
                    user.id === authStore.userProfile?.uid && authStore.userProfile?.photoURL
                      ? authStore.userProfile.photoURL
                      : user.foto
                  "
                  class="w-full h-full object-cover"
                  :alt="user.nombre"
                />
                <component
                  v-else
                  :is="getIcono(user.emoji)"
                  :size="12"
                  stroke-width="2.5"
                  :class="pagadoPor === user.id ? 'text-white' : 'text-gray-500'"
                />
              </div>
              <span class="text-sm font-bold">{{ user.nombre }}</span>
            </button>

            <div
              v-if="usuarios.length === 0"
              class="w-full text-center py-4 bg-gray-100 rounded-2xl border border-dashed border-gray-300 text-gray-400 text-sm"
            >
              No hay usuarios en el tablero.
            </div>
          </div>
        </div>

        <!-- Método de pago -->
        <div>
          <div class="flex justify-between items-end mb-3">
            <label
              class="text-xs font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1"
            >
              <CreditCard :size="14" /> Método de pago
            </label>
            <button
              @click="irAConfig('/methods')"
              class="text-xs font-bold px-2 py-1 rounded-md transition-colors text-gray-500 bg-gray-50 hover:bg-gray-100"
            >
              Editar
            </button>
          </div>

          <div class="flex flex-wrap gap-2">
            <button
              v-for="metodo in metodosPago"
              :key="metodo"
              @click="metodoPago = metodo"
              class="flex items-center gap-2 px-4 py-3 rounded-2xl border-2 transition-all active:scale-95"
              :class="
                metodoPago === metodo
                  ? 'bg-black text-white border-black shadow-lg'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              "
            >
              <CreditCard :size="18" stroke-width="2.5" />
              <span class="text-sm font-bold">{{ metodo }}</span>
            </button>

            <div
              v-if="metodosPago.length === 0"
              class="w-full text-center py-4 bg-gray-100 rounded-2xl border border-dashed border-gray-300 text-gray-400 text-sm"
            >
              No hay métodos de pago configurados.
            </div>
          </div>
        </div>

        <!-- Cuotas (solo gastos + solo cuando es Crédito) -->
        <div
          v-if="metodoPago === 'Crédito'"
          class="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm"
        >
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

/* Ocultar flechas de input number en todos los navegadores */
input[type='number']::-webkit-inner-spin-button,
input[type='number']::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type='number'] {
  -moz-appearance: textfield;
}
</style>
