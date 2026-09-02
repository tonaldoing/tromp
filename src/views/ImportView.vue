<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGastosStore } from '../stores/gastos'
import { useUiStore } from '../stores/ui'
import { storeToRefs } from 'pinia'
import { getIcono } from '../utils/icons'
import { formatearDinero } from '../utils/formato'
import { parsearLineas } from '../utils/importar'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ClipboardPaste,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Tag,
  Calendar,
} from 'lucide-vue-next'

const store = useGastosStore()
const ui = useUiStore()
const { categoriasGasto } = storeToRefs(store)
const router = useRouter()

// Mes destino: por defecto el mes que viene
const hoy = new Date()
const mesDestino = ref(new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1, 12, 0, 0))

const cambiarMesDestino = (delta: number) => {
  const f = mesDestino.value
  mesDestino.value = new Date(f.getFullYear(), f.getMonth() + delta, 1, 12, 0, 0)
}

const nombreMesDestino = computed(() => {
  const nombre = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' }).format(
    mesDestino.value,
  )
  return nombre.charAt(0).toUpperCase() + nombre.slice(1)
})

// Categoría por defecto para líneas sin categoría
const categoriaDefecto = ref('')
const categoriaDefectoFinal = computed(
  () => categoriaDefecto.value || categoriasGasto.value[0]?.nombre || 'Varios',
)

const texto = ref('')
const importando = ref(false)
const importados = ref(0)

const lineas = computed(() => parsearLineas(texto.value, categoriasGasto.value))
const lineasValidas = computed(() => lineas.value.filter((l) => l.ok))
const lineasConError = computed(() => lineas.value.filter((l) => !l.ok))

const totalAImportar = computed(() =>
  lineasValidas.value.reduce((sum, l) => sum + (l.monto || 0), 0),
)

const iconoDe = (nombreCategoria: string) => {
  const cat = categoriasGasto.value.find((c) => c.nombre === nombreCategoria)
  return getIcono(cat?.icono || 'star')
}

const importar = async () => {
  if (lineasValidas.value.length === 0 || importando.value) return
  importando.value = true

  try {
    await Promise.all(
      lineasValidas.value.map((l) =>
        store.agregarMovimiento(
          l.monto!,
          l.descripcion!,
          l.categoria || categoriaDefectoFinal.value,
          'gasto',
          l.cuotas || 1,
          mesDestino.value,
        ),
      ),
    )
    importados.value = lineasValidas.value.length
    texto.value = ''
  } catch (error) {
    console.error('Error importando movimientos:', error)
    ui.toast(
      'No se pudieron importar todos los movimientos. Revisá el mes destino antes de reintentar.',
      'error',
    )
  } finally {
    importando.value = false
  }
}

const verMesDestino = () => {
  store.irAMes(mesDestino.value)
  router.push('/')
}

const importarMas = () => {
  importados.value = 0
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
        <h1 class="text-2xl font-extrabold text-gray-900 tracking-tight">Importar Gastos</h1>
        <p class="text-sm text-gray-500 font-medium">
          Pegá tu previsión y cargala completa de una vez
        </p>
      </div>
    </header>

    <!-- Estado de éxito -->
    <div v-if="importados > 0" class="flex flex-col items-center justify-center py-16 text-center">
      <div
        class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4"
      >
        <CheckCircle2 :size="40" stroke-width="1.5" />
      </div>
      <p class="font-bold text-gray-800 text-xl">¡{{ importados }} gastos importados!</p>
      <p class="text-sm text-gray-500 mt-1 mb-8">Quedaron cargados en {{ nombreMesDestino }}.</p>

      <div class="flex flex-col gap-3 w-full max-w-xs">
        <button
          @click="verMesDestino"
          class="w-full py-4 bg-primario text-white rounded-2xl font-bold shadow-lg active:scale-95 transition-transform"
        >
          Ver {{ nombreMesDestino }}
        </button>
        <button
          @click="importarMas"
          class="w-full py-4 bg-white text-gray-700 border border-gray-200 rounded-2xl font-bold shadow-sm active:scale-95 transition-transform"
        >
          Importar más
        </button>
      </div>
    </div>

    <template v-else>
      <!-- Mes destino -->
      <div
        class="flex items-center justify-between p-2 bg-white rounded-2xl shadow-sm border border-gray-100 mb-4"
      >
        <button
          @click="cambiarMesDestino(-1)"
          class="p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-primario transition-all active:scale-90"
          aria-label="Mes anterior"
        >
          <ChevronLeft :size="24" stroke-width="2.5" />
        </button>

        <div class="flex flex-col items-center">
          <span
            class="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1"
          >
            <Calendar :size="12" /> Mes destino
          </span>
          <span class="text-lg font-extrabold text-gray-800 tracking-tight">
            {{ nombreMesDestino }}
          </span>
        </div>

        <button
          @click="cambiarMesDestino(1)"
          class="p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-primario transition-all active:scale-90"
          aria-label="Mes siguiente"
        >
          <ChevronRight :size="24" stroke-width="2.5" />
        </button>
      </div>

      <!-- Textarea -->
      <div
        class="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm mb-4 focus-within:ring-2 focus-within:ring-primario/5"
      >
        <label
          class="flex items-center gap-1 text-xs font-bold text-gray-500 uppercase tracking-wide mb-2"
        >
          <ClipboardPaste :size="14" /> Un gasto por línea
        </label>
        <textarea
          v-model="texto"
          rows="7"
          placeholder="Netflix 15000 Servicios
Zapatillas 120.000 Varios 3x
Súper del mes 85.500,50 Supermercado
Nafta 40000"
          class="w-full text-base font-medium text-gray-800 placeholder-gray-300 outline-none resize-y leading-relaxed"
        ></textarea>
      </div>

      <p class="text-xs text-gray-500 font-medium mb-6 px-1">
        Formato: <span class="font-bold text-gray-500">descripción monto [categoría] [3x]</span> —
        la categoría es opcional (se usa la de abajo si falta) y "3x" divide el monto en cuotas
        mensuales.
      </p>

      <!-- Categoría por defecto -->
      <div class="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm mb-6">
        <label
          class="flex items-center gap-1 text-xs font-bold text-gray-500 uppercase tracking-wide mb-3"
        >
          <Tag :size="14" /> Categoría para líneas sin categoría
        </label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="cat in categoriasGasto"
            :key="cat.id"
            @click="categoriaDefecto = cat.nombre"
            class="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-bold transition-all active:scale-95"
            :class="
              categoriaDefectoFinal === cat.nombre
                ? 'bg-primario text-white border-primario shadow-md'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            "
          >
            <component :is="getIcono(cat.icono)" :size="16" stroke-width="2.5" />
            {{ cat.nombre }}
          </button>
        </div>
      </div>

      <!-- Vista previa -->
      <div v-if="lineas.length > 0" class="mb-6">
        <div class="flex justify-between items-end mb-3">
          <h3 class="text-lg font-bold text-gray-800">Vista previa</h3>
          <span
            class="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded-lg border border-gray-100 shadow-sm"
          >
            {{ lineasValidas.length }} de {{ lineas.length }} ok
          </span>
        </div>

        <div class="space-y-2">
          <!-- Válidas -->
          <div
            v-for="(l, i) in lineasValidas"
            :key="'ok-' + i"
            class="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between gap-3"
          >
            <div class="flex items-center gap-3 min-w-0">
              <div
                class="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-600 border border-gray-100 shrink-0"
              >
                <component
                  :is="iconoDe(l.categoria || categoriaDefectoFinal)"
                  :size="18"
                  stroke-width="2.5"
                />
              </div>
              <div class="min-w-0">
                <p class="font-bold text-gray-800 text-sm truncate">{{ l.descripcion }}</p>
                <div class="flex items-center gap-1.5 mt-0.5">
                  <span
                    class="text-xs font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide"
                    :class="
                      l.categoria ? 'text-gray-500 bg-gray-100' : 'text-amber-600 bg-amber-50'
                    "
                  >
                    {{ l.categoria || categoriaDefectoFinal }}
                  </span>
                  <span
                    v-if="l.cuotas"
                    class="text-xs font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-md"
                  >
                    {{ l.cuotas }} cuotas
                  </span>
                </div>
              </div>
            </div>
            <p class="font-extrabold text-gray-900 shrink-0">${{ formatearDinero(l.monto!) }}</p>
          </div>

          <!-- Con error -->
          <div
            v-for="(l, i) in lineasConError"
            :key="'err-' + i"
            class="bg-red-50 p-3 rounded-2xl border border-red-100 flex items-center gap-3"
          >
            <AlertCircle :size="18" class="text-red-400 shrink-0" />
            <div class="min-w-0">
              <p class="font-bold text-red-800 text-sm truncate">{{ l.linea }}</p>
              <p class="text-xs text-red-500">{{ l.error }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Botón importar -->
      <div class="fixed bottom-24 left-0 w-full px-5 z-40">
        <button
          @click="importar"
          :disabled="importando || lineasValidas.length === 0"
          class="w-full py-4 rounded-2xl text-lg font-bold shadow-xl transform transition-all active:scale-95 flex justify-center items-center gap-3 border border-gray-100"
          :class="
            importando || lineasValidas.length === 0
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-primario text-white hover:bg-primario-hover'
          "
        >
          <Loader2 v-if="importando" class="animate-spin" :size="22" />
          <Upload v-else :size="20" />
          <span>
            {{
              importando
                ? 'Importando...'
                : lineasValidas.length === 0
                  ? 'Pegá tus gastos arriba'
                  : `Importar ${lineasValidas.length} gastos ($${formatearDinero(totalAImportar)})`
            }}
          </span>
        </button>
      </div>
    </template>
  </div>
</template>
