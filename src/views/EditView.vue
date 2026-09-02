<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGastosStore, type Gasto } from '../stores/gastos'
import { useUiStore } from '../stores/ui'
import { storeToRefs } from 'pinia'
import { getIcono } from '../utils/icons'
import { formatearMontoInput, limpiarMontoInput } from '../utils/formato'
import {
  ArrowLeft,
  Trash2,
  Save,
  Tag,
  Calendar,
  TrendingUp,
  TrendingDown,
  Layers,
} from 'lucide-vue-next'

const store = useGastosStore()
const ui = useUiStore()
const { categoriasGasto, categoriasIngreso } = storeToRefs(store)
const router = useRouter()
const route = useRoute()

const monto = ref('')
const descripcion = ref('')
const categoria = ref('')
const tipo = ref<'gasto' | 'ingreso'>('gasto')
const guardando = ref(false)

const gastoId = route.params.id as string
const gastoOriginal = ref<Gasto | null>(null)

// Fecha editable (solo día, sin hora)
const fechaEditada = ref<Date | null>(null)

const esIngreso = computed(() => tipo.value === 'ingreso')
const esCuota = computed(
  () => !!gastoOriginal.value?.totalCuotas && gastoOriginal.value.totalCuotas > 1,
)

const categoriasActivas = computed(() =>
  esIngreso.value ? categoriasIngreso.value : categoriasGasto.value,
)

onMounted(() => {
  const gasto = store.getGasto(gastoId)
  if (gasto) {
    gastoOriginal.value = gasto
    monto.value = gasto.monto.toString()
    descripcion.value = gasto.descripcion
    categoria.value = gasto.categoria
    tipo.value = gasto.tipo || 'gasto'
    fechaEditada.value = new Date(gasto.fecha)
  } else {
    router.push('/')
  }
})

const cambiarTipo = (nuevoTipo: 'gasto' | 'ingreso') => {
  if (tipo.value === nuevoTipo) return
  tipo.value = nuevoTipo
  // La categoría anterior pertenece al otro tipo: hay que elegir de nuevo
  categoria.value = ''
}

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

const fechaNativaInput = computed({
  get: () => {
    if (!fechaEditada.value) return ''
    const y = fechaEditada.value.getFullYear()
    const m = String(fechaEditada.value.getMonth() + 1).padStart(2, '0')
    const d = String(fechaEditada.value.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  },
  set: (val: string) => {
    if (!val) return
    const parts = val.split('-').map(Number)
    if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
      fechaEditada.value = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0)
    }
  },
})

// Solo mandamos la fecha si cambió el día, para no pisar la hora original
const fechaCambio = computed(() => {
  if (!fechaEditada.value || !gastoOriginal.value) return false
  const original = gastoOriginal.value.fecha
  return (
    fechaEditada.value.getFullYear() !== original.getFullYear() ||
    fechaEditada.value.getMonth() !== original.getMonth() ||
    fechaEditada.value.getDate() !== original.getDate()
  )
})

const actualizar = async () => {
  if (!monto.value || !descripcion.value || !categoria.value) return
  guardando.value = true

  const cambios: Partial<Gasto> = {
    monto: Number(monto.value),
    descripcion: descripcion.value,
    categoria: categoria.value,
    tipo: tipo.value,
  }
  if (fechaCambio.value && fechaEditada.value) {
    cambios.fecha = fechaEditada.value
  }

  try {
    await store.editarGasto(gastoId, cambios)
    router.push('/')
  } catch (error) {
    console.error('Error actualizando movimiento:', error)
    ui.toast('No se pudo guardar el cambio. Revisá tu conexión e intentá de nuevo.', 'error')
  } finally {
    guardando.value = false
  }
}

const eliminar = async () => {
  const ok = await ui.confirmar({
    titulo: 'Borrar movimiento',
    mensaje: `Se va a eliminar "${descripcion.value}". Esta acción no se puede deshacer.`,
    textoConfirmar: 'Borrar',
    destructiva: true,
  })
  if (!ok) return

  guardando.value = true
  try {
    await store.borrarGasto(gastoId)
    ui.toast('Movimiento borrado', 'exito')
    router.push('/')
  } catch (error) {
    console.error('Error borrando movimiento:', error)
    ui.toast('No se pudo borrar el movimiento. Intentá de nuevo.', 'error')
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 pb-24">
    <div class="px-5 pt-6 mb-8 flex justify-between items-center">
      <div class="flex items-center gap-4">
        <button
          @click="router.back()"
          aria-label="Volver"
          class="w-11 h-11 flex items-center justify-center bg-white rounded-full border border-gray-200 shadow-sm text-gray-700 active:scale-95 transition-transform"
        >
          <ArrowLeft :size="20" />
        </button>
        <h1 class="text-2xl font-extrabold text-gray-900 tracking-tight">Editar</h1>
      </div>

      <button
        @click="eliminar"
        aria-label="Borrar movimiento"
        class="w-11 h-11 flex items-center justify-center bg-red-50 rounded-full text-red-500 hover:bg-red-100 transition-colors"
      >
        <Trash2 :size="20" />
      </button>
    </div>

    <div class="px-5 space-y-6">
      <!-- Aviso de cuota -->
      <div
        v-if="esCuota"
        class="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3"
      >
        <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
          <Layers :size="16" class="text-blue-600" />
        </div>
        <div>
          <p class="font-bold text-blue-800 text-sm">
            Cuota {{ gastoOriginal?.cuotaActual }} de {{ gastoOriginal?.totalCuotas }}
          </p>
          <p class="text-blue-600 text-xs mt-1">
            Los cambios afectan solo a esta cuota, no al resto del plan.
          </p>
        </div>
      </div>

      <!-- Toggle Gasto/Ingreso (las cuotas son siempre gastos) -->
      <div
        v-if="!esCuota"
        class="bg-white p-1.5 rounded-full flex shadow-sm border border-gray-100"
      >
        <button
          @click="cambiarTipo('gasto')"
          class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-bold transition-all"
          :class="
            !esIngreso ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:text-gray-600'
          "
        >
          <TrendingDown :size="16" />
          Gasto
        </button>
        <button
          @click="cambiarTipo('ingreso')"
          class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-bold transition-all"
          :class="
            esIngreso ? 'bg-green-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-600'
          "
        >
          <TrendingUp :size="16" />
          Ingreso
        </button>
      </div>

      <!-- Monto -->
      <div class="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
        <label class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1"
          >Monto</label
        >
        <div class="relative flex items-center">
          <span class="text-2xl font-bold text-gray-500 mr-1">$</span>
          <input
            :value="formatearMontoInput(monto)"
            @input="onInputMonto"
            type="text"
            inputmode="decimal"
            class="w-full text-3xl font-black text-gray-900 outline-none placeholder-gray-200"
          />
        </div>
      </div>

      <!-- Descripción -->
      <div class="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
        <label class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2"
          >Descripción</label
        >
        <input
          v-model="descripcion"
          type="text"
          class="w-full text-lg font-bold text-gray-800 outline-none"
        />
      </div>

      <!-- Fecha -->
      <div class="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
        <label
          class="flex items-center gap-1 text-xs font-bold text-gray-500 uppercase tracking-wide mb-2"
        >
          <Calendar :size="14" /> Fecha
        </label>
        <input
          v-model="fechaNativaInput"
          type="date"
          class="w-full text-lg font-bold text-gray-800 outline-none"
        />
      </div>

      <!-- Categoría -->
      <div>
        <label
          class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1"
        >
          <Tag :size="14" /> {{ esIngreso ? 'Fuente' : 'Categoría' }}
        </label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="cat in categoriasActivas"
            :key="cat.id"
            @click="categoria = cat.nombre"
            class="flex items-center gap-2 px-4 py-2.5 rounded-2xl border transition-all active:scale-95"
            :class="
              categoria === cat.nombre
                ? esIngreso
                  ? 'bg-green-600 text-white border-green-600 shadow-lg'
                  : 'bg-black text-white border-black shadow-lg'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            "
          >
            <component :is="getIcono(cat.icono)" :size="18" stroke-width="2.5" />
            <span class="text-sm font-bold">{{ cat.nombre }}</span>
          </button>

          <div
            v-if="categoriasActivas.length === 0"
            class="w-full text-center py-4 bg-gray-100 rounded-2xl border border-dashed border-gray-300 text-gray-500 text-sm"
          >
            No hay categorías de {{ esIngreso ? 'ingreso' : 'gasto' }} creadas.
          </div>
        </div>
        <p v-if="!categoria" class="text-xs text-gray-500 font-medium mt-2">
          Elegí una categoría para poder guardar
        </p>
      </div>

      <button
        @click="actualizar"
        :disabled="guardando || !monto || !descripcion || !categoria"
        class="w-full bg-blue-600 text-white py-4 rounded-2xl text-xl font-bold shadow-lg shadow-blue-200 active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Save :size="20" />
        <span>{{ guardando ? 'Guardando...' : 'Guardar Cambios' }}</span>
      </button>
    </div>
  </div>
</template>
