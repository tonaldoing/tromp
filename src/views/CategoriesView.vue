<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGastosStore, type Categoria } from '../stores/gastos'
import { useUiStore } from '../stores/ui'
import { storeToRefs } from 'pinia'
import { ICONOS_DISPONIBLES, getIcono } from '../utils/icons'

import {
  ChevronLeft,
  Trash2,
  Edit3,
  Plus,
  Loader2,
  CheckCircle2,
  X,
  TrendingDown,
  TrendingUp,
} from 'lucide-vue-next'

const store = useGastosStore()
const ui = useUiStore()
const { categoriasGasto, categoriasIngreso } = storeToRefs(store)
const router = useRouter()

// Tab activo: gasto o ingreso
const tabActivo = ref<'gasto' | 'ingreso'>('gasto')

// Estados del Formulario
const idEditando = ref<string | null>(null)
const nombre = ref('')
const iconoSeleccionado = ref('star')

// Estados de Feedback
const guardando = ref(false)
const exito = ref(false)

const listaIconos = Object.keys(ICONOS_DISPONIBLES)
const modoEdicion = computed(() => !!idEditando.value)

// Categorías según tab activo
const categoriasActivas = computed(() =>
  tabActivo.value === 'gasto' ? categoriasGasto.value : categoriasIngreso.value,
)

// Colores según tab
const colores = computed(() => {
  if (tabActivo.value === 'ingreso') {
    return {
      accent: 'bg-positivo',
      accentHover: 'hover:bg-positivo-hover',
      accentLight: 'bg-green-50 dark:bg-green-950/50',
      text: 'text-green-600 dark:text-green-400',
      border: 'border-green-500',
      ring: 'ring-green-500',
      selected: 'bg-positivo text-white',
    }
  }
  return {
    accent: 'bg-primario',
    accentHover: 'hover:bg-primario-hover',
    accentLight: 'bg-gray-100 dark:bg-slate-700',
    text: 'text-primario',
    border: 'border-primario',
    ring: 'ring-primario',
    selected: 'bg-primario text-white',
  }
})

// Cargar datos en el formulario
const cargarParaEditar = (cat: Categoria) => {
  idEditando.value = cat.id
  nombre.value = cat.nombre
  iconoSeleccionado.value = cat.icono || 'star'
  // Cambiar al tab correspondiente
  tabActivo.value = cat.tipo

  window.scrollTo({ top: 0, behavior: 'smooth' })
  exito.value = false
}

const limpiarForm = () => {
  idEditando.value = null
  nombre.value = ''
  iconoSeleccionado.value = 'star'
  exito.value = false
}

const guardar = async () => {
  if (!nombre.value || guardando.value) return

  guardando.value = true
  exito.value = false

  const nuevaCat: Categoria = {
    id:
      idEditando.value ||
      nombre.value.toLowerCase().replace(/\s/g, '_') + '_' + Date.now().toString().slice(-4),
    nombre: nombre.value,
    icono: iconoSeleccionado.value,
    tipo: tabActivo.value, // Usa el tab activo como tipo
  }

  try {
    if (modoEdicion.value) {
      await store.editarCategoria(nuevaCat)
    } else {
      await store.agregarCategoria(nuevaCat)
    }

    exito.value = true
    setTimeout(() => {
      if (!modoEdicion.value) limpiarForm()
      exito.value = false
      guardando.value = false
    }, 1500)
  } catch (e) {
    console.error(e)
    ui.toast(e instanceof Error ? e.message : 'Error al guardar', 'error')
    guardando.value = false
  }
}

const borrar = async (cat: Categoria) => {
  const ok = await ui.confirmar({
    titulo: 'Borrar categoría',
    mensaje: `Se va a eliminar "${cat.nombre}". Los movimientos ya registrados con esta categoría no se borran.`,
    textoConfirmar: 'Borrar',
    destructiva: true,
  })
  if (!ok) return

  try {
    await store.borrarCategoria(cat)
    if (idEditando.value === cat.id) limpiarForm()
    ui.toast(`Categoría "${cat.nombre}" borrada`, 'exito')
  } catch (e) {
    console.error(e)
    ui.toast('No se pudo borrar la categoría. Intentá de nuevo.', 'error')
  }
}

// Cambiar tab limpia el formulario
const cambiarTab = (tab: 'gasto' | 'ingreso') => {
  tabActivo.value = tab
  limpiarForm()
}
</script>

<template>
  <div class="px-5 pt-6 pb-32 bg-gray-50 dark:bg-slate-900 min-h-screen">
    <!-- Header -->
    <header class="flex items-center gap-4 mb-6">
      <button
        @click="router.back()"
        aria-label="Volver"
        class="w-11 h-11 flex items-center justify-center bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full shadow-sm active:scale-95 transition-transform text-gray-700 dark:text-slate-300"
      >
        <ChevronLeft :size="22" stroke-width="2.5" />
      </button>
      <h1 class="text-2xl font-extrabold text-gray-900 dark:text-slate-100 tracking-tight">
        Categorías
      </h1>
    </header>

    <!-- Tabs Gasto/Ingreso -->
    <div
      class="bg-white dark:bg-slate-800 p-1.5 rounded-full flex shadow-sm border border-gray-100 dark:border-slate-700 mb-6"
    >
      <button
        @click="cambiarTab('gasto')"
        class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-bold transition-all"
        :class="
          tabActivo === 'gasto'
            ? 'bg-primario text-white shadow-md'
            : 'text-gray-500 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-300'
        "
      >
        <TrendingDown :size="16" />
        Gastos
        <span
          class="text-xs px-1.5 py-0.5 rounded-full"
          :class="tabActivo === 'gasto' ? 'bg-white/20' : 'bg-gray-100 dark:bg-slate-700'"
        >
          {{ categoriasGasto.length }}
        </span>
      </button>
      <button
        @click="cambiarTab('ingreso')"
        class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-bold transition-all"
        :class="
          tabActivo === 'ingreso'
            ? 'bg-positivo text-white shadow-md'
            : 'text-gray-500 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-300'
        "
      >
        <TrendingUp :size="16" />
        Ingresos
        <span
          class="text-xs px-1.5 py-0.5 rounded-full"
          :class="tabActivo === 'ingreso' ? 'bg-white/20' : 'bg-gray-100 dark:bg-slate-700'"
        >
          {{ categoriasIngreso.length }}
        </span>
      </button>
    </div>

    <!-- Formulario -->
    <div
      class="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none mb-8 border border-gray-100 dark:border-slate-700 transition-all relative"
      :class="modoEdicion ? `ring-2 ${colores.ring} border-transparent` : ''"
    >
      <div class="flex justify-between items-center mb-6">
        <h2 class="font-bold text-xl text-gray-800 dark:text-slate-200 flex items-center gap-2">
          <component
            :is="modoEdicion ? Edit3 : Plus"
            :size="20"
            :class="modoEdicion ? colores.text : 'text-primario'"
          />
          {{
            modoEdicion
              ? 'Editar Categoría'
              : `Nueva Categoría de ${tabActivo === 'ingreso' ? 'Ingreso' : 'Gasto'}`
          }}
        </h2>
        <button
          v-if="modoEdicion"
          @click="limpiarForm"
          aria-label="Cancelar edición"
          class="w-11 h-11 flex items-center justify-center bg-gray-100 dark:bg-slate-700 rounded-full text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
        >
          <X :size="16" />
        </button>
      </div>

      <div class="mb-6">
        <label
          class="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2"
          >Nombre</label
        >
        <div class="relative">
          <input
            v-model="nombre"
            :placeholder="tabActivo === 'ingreso' ? 'Ej: Sueldo' : 'Ej: Supermercado'"
            class="w-full p-4 pl-12 bg-gray-50 dark:bg-slate-900 border-2 border-gray-100 dark:border-slate-700 rounded-2xl focus:border-primario focus:bg-white dark:focus:bg-slate-900 outline-none font-bold text-gray-800 dark:text-slate-200 text-lg transition-all"
            @keyup.enter="guardar"
          />
          <div class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-slate-400">
            <component :is="getIcono(iconoSeleccionado)" :size="20" stroke-width="2.5" />
          </div>
        </div>
      </div>

      <div class="mb-8">
        <label
          class="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-3"
          >Elige un icono</label
        >
        <div
          class="grid grid-cols-6 gap-3 p-3 bg-gray-50 dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 max-h-48 overflow-y-auto scrollbar-hide"
        >
          <button
            v-for="icono in listaIconos"
            :key="icono"
            @click="iconoSeleccionado = icono"
            class="aspect-square flex items-center justify-center rounded-xl transition-all"
            :class="
              iconoSeleccionado === icono
                ? colores.selected + ' shadow-lg scale-105'
                : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-700 hover:border-gray-400 hover:text-gray-600 dark:hover:text-slate-300'
            "
          >
            <component :is="getIcono(icono)" :size="20" stroke-width="2" />
          </button>
        </div>
      </div>

      <button
        @click="guardar"
        :disabled="!nombre || guardando"
        class="w-full py-4 rounded-2xl font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-3 text-white"
        :class="[
          exito ? 'bg-green-500 shadow-green-200 dark:shadow-none scale-105' : '',
          guardando ? 'opacity-80 cursor-not-allowed' : '',
          !exito && !guardando ? `${colores.accent} ${colores.accentHover} active:scale-95` : '',
          !nombre ? 'opacity-50 cursor-not-allowed' : '',
        ]"
      >
        <Loader2 v-if="guardando" class="animate-spin" :size="24" />
        <CheckCircle2 v-else-if="exito" :size="24" />
        <span v-else>{{ modoEdicion ? 'Actualizar' : 'Crear Categoría' }}</span>
      </button>
    </div>

    <!-- Lista de Categorías -->
    <div v-if="categoriasActivas.length > 0" class="space-y-3">
      <h3
        class="text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-4 ml-2"
      >
        Categorías de {{ tabActivo === 'ingreso' ? 'Ingreso' : 'Gasto' }} ({{
          categoriasActivas.length
        }})
      </h3>

      <div
        v-for="cat in categoriasActivas"
        :key="cat.id"
        @click="cargarParaEditar(cat)"
        class="group bg-white dark:bg-slate-800 p-3 pr-4 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm flex items-center justify-between cursor-pointer active:scale-[0.99] transition-all hover:border-gray-300 dark:hover:border-slate-500 hover:shadow-md"
        :class="idEditando === cat.id ? `ring-2 ${colores.ring} border-transparent` : ''"
      >
        <div class="flex items-center gap-4">
          <div
            class="w-12 h-12 rounded-xl flex items-center justify-center border transition-colors"
            :class="
              tabActivo === 'ingreso'
                ? 'bg-green-50 dark:bg-green-950/50 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800 group-hover:bg-green-100'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700 group-hover:bg-white group-hover:border-gray-300'
            "
          >
            <component :is="getIcono(cat.icono || 'star')" :size="20" stroke-width="2.5" />
          </div>

          <span class="font-bold text-gray-800 dark:text-slate-200 text-lg">{{ cat.nombre }}</span>
        </div>

        <button
          @click.stop="borrar(cat)"
          :aria-label="`Borrar categoría ${cat.nombre}`"
          class="w-11 h-11 flex items-center justify-center rounded-full text-gray-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 transition-all opacity-60 group-hover:opacity-100"
        >
          <Trash2 :size="20" stroke-width="2" />
        </button>
      </div>
    </div>

    <!-- Estado vacío -->
    <div v-else class="text-center py-16 opacity-50">
      <div
        class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 grayscale"
        :class="
          tabActivo === 'ingreso'
            ? 'bg-green-100 dark:bg-green-900/60'
            : 'bg-gray-200 dark:bg-slate-700'
        "
      >
        <component
          :is="tabActivo === 'ingreso' ? TrendingUp : TrendingDown"
          :size="32"
          class="text-gray-500 dark:text-slate-400"
        />
      </div>
      <p class="font-medium">
        No hay categorías de {{ tabActivo === 'ingreso' ? 'ingreso' : 'gasto' }}.
      </p>
      <p class="text-sm text-gray-500 dark:text-slate-400 mt-1">
        Creá una usando el formulario de arriba.
      </p>
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
