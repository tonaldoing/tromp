<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useGastosStore } from '../stores/gastos'
import { useUiStore } from '../stores/ui'
import { storeToRefs } from 'pinia'
import { getIcono } from '../utils/icons'
import MonthSelector from '../components/MonthSelector.vue'
import {
  ArrowLeft,
  Calculator,
  ChevronRight,
  Save,
  Loader2,
  Copy,
  AlertCircle,
  CheckCircle2,
} from 'lucide-vue-next'

const store = useGastosStore()
const ui = useUiStore()
const router = useRouter()
const { presupuestos, categoriasGasto, presupuestoConfigurado, fechaVisual } = storeToRefs(store)

const valoresLocales = ref<Record<string, number>>({})
const guardando = ref(false)
const exito = ref(false)
const copiando = ref(false)

// Sincronizar datos al cargar y cuando cambian los presupuestos
watch(
  [presupuestos, categoriasGasto],
  ([nuevosValores, nuevasCategorias]) => {
    if (!guardando.value) {
      nuevasCategorias.forEach((cat) => {
        valoresLocales.value[cat.nombre] = nuevosValores[cat.nombre] || 0
      })
    }
  },
  { immediate: true, deep: true },
)

const formatearValorVisual = (valor: number) => {
  if (!valor) return ''
  return new Intl.NumberFormat('es-AR').format(valor)
}

const onInputDinero = (event: Event, nombreCategoria: string) => {
  const input = event.target as HTMLInputElement
  const rawValue = input.value.replace(/\D/g, '')
  const numero = rawValue ? parseInt(rawValue, 10) : 0
  valoresLocales.value[nombreCategoria] = numero
  input.value = formatearValorVisual(numero)
}

const totalMensual = computed(() => {
  return Object.values(valoresLocales.value).reduce((a, b) => a + b, 0)
})

const hayDiferencias = computed(() => {
  return Object.keys(valoresLocales.value).some(
    (cat) => valoresLocales.value[cat] !== (presupuestos.value[cat] || 0),
  )
})

const mesActual = computed(() => {
  const meses = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ]
  return `${meses[fechaVisual.value.getMonth()]} ${fechaVisual.value.getFullYear()}`
})

const copiarMesAnterior = async () => {
  const ok = await ui.confirmar({
    titulo: 'Copiar presupuesto',
    mensaje: `Se van a copiar los topes del mes anterior a ${mesActual.value}.`,
    textoConfirmar: 'Copiar',
  })
  if (!ok) return

  copiando.value = true
  try {
    const copiado = await store.copiarPresupuestoMesAnterior()
    if (copiado) {
      exito.value = true
      setTimeout(() => {
        exito.value = false
      }, 2000)
    } else {
      ui.toast('No hay presupuestos del mes anterior para copiar', 'info')
    }
  } catch (error) {
    console.error('Error copiando presupuesto:', error)
    ui.toast('No se pudo copiar el presupuesto. Intentá de nuevo.', 'error')
  } finally {
    copiando.value = false
  }
}

const guardarTodo = async () => {
  guardando.value = true
  exito.value = false

  try {
    // Una sola escritura con todos los topes del mes
    await store.guardarPresupuestos({ ...valoresLocales.value })
    exito.value = true
    setTimeout(() => (exito.value = false), 2000)
  } catch (error) {
    console.error('Error guardando presupuesto:', error)
    ui.toast('No se pudo guardar el presupuesto. Revisá tu conexión e intentá de nuevo.', 'error')
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <div class="px-5 pt-6 pb-40 bg-gray-50 min-h-screen">
    <!-- Header -->
    <header class="flex items-center gap-4 mb-6">
      <button
        @click="router.back()"
        aria-label="Volver"
        class="w-11 h-11 flex items-center justify-center bg-white rounded-full border border-gray-200 shadow-sm text-gray-700 active:scale-95 transition-transform"
      >
        <ArrowLeft :size="20" />
      </button>
      <div class="flex-1">
        <h1 class="text-2xl font-extrabold text-gray-900 tracking-tight">Presupuesto Mensual</h1>
        <p class="text-sm text-gray-500 font-medium">
          Define cuánto quieres gastar por categoría cada mes
        </p>
      </div>
    </header>

    <!-- Selector de Mes -->
    <MonthSelector />

    <!-- Estado del Presupuesto -->
    <div
      v-if="presupuestoConfigurado"
      class="bg-green-50 border-2 border-green-200 rounded-2xl p-4 mb-6 flex items-center gap-3"
    >
      <CheckCircle2 :size="20" class="text-green-600 shrink-0" />
      <div class="flex-1 min-w-0">
        <p class="text-sm font-bold text-green-800">Presupuesto configurado</p>
        <p class="text-xs text-green-600">Has establecido tus topes para {{ mesActual }}</p>
      </div>
    </div>

    <div
      v-else
      class="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 mb-6 flex items-center gap-3"
    >
      <AlertCircle :size="20" class="text-amber-600 shrink-0" />
      <div class="flex-1 min-w-0">
        <p class="text-sm font-bold text-amber-800">Sin presupuesto</p>
        <p class="text-xs text-amber-600">Aún no has configurado topes para {{ mesActual }}</p>
      </div>
    </div>

    <!-- Botón Copiar Mes Anterior -->
    <button
      v-if="!presupuestoConfigurado"
      @click="copiarMesAnterior"
      :disabled="copiando"
      class="w-full mb-6 py-3 px-4 bg-white border-2 border-gray-200 rounded-2xl font-bold text-gray-700 hover:border-blue-400 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
    >
      <Loader2 v-if="copiando" :size="18" class="animate-spin" />
      <Copy v-else :size="18" />
      <span>{{ copiando ? 'Copiando...' : 'Copiar presupuesto del mes anterior' }}</span>
    </button>

    <!-- Total Card -->
    <div
      class="bg-linear-to-br from-blue-600 to-indigo-600 rounded-3xl p-5 shadow-lg shadow-blue-200 mb-8 text-white relative overflow-hidden"
    >
      <div
        class="absolute -right-5 -top-5 bg-white opacity-10 w-32 h-32 rounded-full blur-2xl"
      ></div>
      <div class="relative z-10">
        <div class="flex items-center gap-2 opacity-90 mb-1">
          <Calculator :size="16" />
          <span class="text-xs font-bold uppercase tracking-widest">Total Mensual</span>
        </div>
        <p class="text-3xl font-black tracking-tighter">
          $ {{ new Intl.NumberFormat('es-AR').format(totalMensual) }}
        </p>
        <p class="text-xs opacity-75 mt-2">Suma de todos los topes que configuraste</p>
      </div>
    </div>

    <!-- Categorías -->
    <div class="space-y-4">
      <div
        v-for="cat in categoriasGasto"
        :key="cat.id"
        class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 transition-all focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent"
      >
        <div
          class="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-600 border border-gray-100 shrink-0"
        >
          <component :is="getIcono(cat.icono)" :size="20" stroke-width="2" />
        </div>

        <div class="flex-1 min-w-0">
          <label class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
            {{ cat.nombre }}
          </label>

          <div class="relative flex items-center">
            <span class="text-gray-500 font-bold text-lg mr-1">$</span>
            <input
              type="text"
              inputmode="numeric"
              :value="formatearValorVisual(valoresLocales[cat.nombre] ?? 0)"
              @input="(e) => onInputDinero(e, cat.nombre)"
              placeholder="0"
              class="w-full bg-transparent border-none p-0 text-xl font-bold text-gray-900 placeholder-gray-200 focus:ring-0 outline-none"
            />
          </div>
        </div>
      </div>

      <RouterLink
        to="/categories"
        class="flex items-center justify-center gap-2 p-4 mt-4 text-gray-500 hover:text-blue-600 transition-colors border-2 border-dashed border-gray-200 rounded-2xl hover:border-blue-200"
      >
        <span class="text-sm font-bold">Gestionar Categorías</span>
        <ChevronRight :size="16" />
      </RouterLink>
    </div>

    <!-- Botón Guardar -->
    <div class="fixed bottom-24 left-0 w-full px-5 z-40">
      <button
        @click="guardarTodo"
        :disabled="guardando || (!hayDiferencias && presupuestoConfigurado)"
        class="w-full py-4 rounded-2xl text-lg font-bold shadow-xl shadow-blue-900/10 transform transition-all active:scale-95 flex justify-center items-center gap-3 border border-gray-100"
        :class="
          exito
            ? 'bg-green-500 text-white'
            : guardando
              ? 'bg-gray-300 text-gray-500'
              : !hayDiferencias && presupuestoConfigurado
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-black text-white hover:bg-gray-800'
        "
      >
        <Loader2 v-if="guardando" class="animate-spin" :size="24" />
        <Save v-else-if="!exito" :size="20" />
        <CheckCircle2 v-else :size="20" />

        <span>{{
          exito
            ? '¡Guardado con éxito!'
            : guardando
              ? 'Guardando...'
              : !hayDiferencias && presupuestoConfigurado
                ? 'Sin cambios'
                : 'Guardar Presupuesto'
        }}</span>
      </button>
    </div>
  </div>
</template>
