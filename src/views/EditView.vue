<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGastosStore } from '../stores/gastos'
import { storeToRefs } from 'pinia'
import { getIcono } from '../utils/icons'
import { ArrowLeft, Trash2, Save, Tag, Users } from 'lucide-vue-next'

const store = useGastosStore()
const { categorias, usuarios } = storeToRefs(store)
const router = useRouter()
const route = useRoute()

const monto = ref('')
const descripcion = ref('')
const categoria = ref('')
const pagadoPor = ref('')
const guardando = ref(false)

const gastoId = route.params.id as string

onMounted(() => {
  const gasto = store.getGasto(gastoId)
  if (gasto) {
    monto.value = gasto.monto.toString()
    descripcion.value = gasto.descripcion
    categoria.value = gasto.categoria
    pagadoPor.value = gasto.pagadoPor
  } else {
    router.push('/')
  }
})

const actualizar = async () => {
  if (!monto.value || !descripcion.value) return
  guardando.value = true
  await store.editarGasto(gastoId, {
    monto: Number(monto.value),
    descripcion: descripcion.value,
    categoria: categoria.value,
    pagadoPor: pagadoPor.value,
  })
  guardando.value = false
  router.push('/')
}

const eliminar = async () => {
  if (confirm('¿Seguro que quieres borrar este movimiento?')) {
    guardando.value = true
    await store.borrarGasto(gastoId)
    router.push('/')
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 pb-24">
    <div class="px-5 pt-6 mb-8 flex justify-between items-center">
      <div class="flex items-center gap-4">
        <button
          @click="router.back()"
          class="w-10 h-10 flex items-center justify-center bg-white rounded-full border border-gray-200 shadow-sm text-gray-700 active:scale-95 transition-transform"
        >
          <ArrowLeft :size="20" />
        </button>
        <h1 class="text-2xl font-extrabold text-gray-900 tracking-tight">Editar</h1>
      </div>

      <button
        @click="eliminar"
        class="w-10 h-10 flex items-center justify-center bg-red-50 rounded-full text-red-500 hover:bg-red-100 transition-colors"
      >
        <Trash2 :size="20" />
      </button>
    </div>

    <div class="px-5 space-y-6">
      <div class="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
        <label class="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1"
          >Monto</label
        >
        <div class="relative flex items-center">
          <span class="text-2xl font-bold text-gray-400 mr-1">$</span>
          <input
            v-model="monto"
            type="number"
            class="w-full text-3xl font-black text-gray-900 outline-none placeholder-gray-200"
          />
        </div>
      </div>

      <div class="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
        <label class="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2"
          >Descripción</label
        >
        <input
          v-model="descripcion"
          type="text"
          class="w-full text-lg font-bold text-gray-800 outline-none"
        />
      </div>

      <div>
        <label
          class="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1"
        >
          <Tag :size="14" /> Categoría
        </label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="cat in categorias"
            :key="cat.id"
            @click="categoria = cat.nombre"
            class="flex items-center gap-2 px-4 py-2.5 rounded-2xl border transition-all active:scale-95"
            :class="
              categoria === cat.nombre
                ? 'bg-black text-white border-black shadow-lg'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            "
          >
            <component :is="getIcono(cat.icono)" :size="18" stroke-width="2.5" />
            <span class="text-sm font-bold">{{ cat.nombre }}</span>
          </button>
        </div>
      </div>

      <div>
        <label
          class="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1"
        >
          <Users :size="14" /> Responsable
        </label>
        <div class="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          <button
            v-for="user in usuarios"
            :key="user.id"
            @click="pagadoPor = user.id"
            class="min-w-[70px] p-3 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all bg-white"
            :class="
              pagadoPor === user.id
                ? 'border-black opacity-100 shadow-md'
                : 'border-transparent opacity-50 grayscale hover:opacity-100'
            "
          >
            <div
              class="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-gray-100"
            >
              <img v-if="user.foto" :src="user.foto" class="w-full h-full object-cover" />
              <component v-else :is="getIcono(user.emoji)" :size="20" />
            </div>
            <span class="text-xs font-bold truncate max-w-full">{{ user.nombre }}</span>
          </button>
        </div>
      </div>

      <button
        @click="actualizar"
        :disabled="guardando"
        class="w-full bg-blue-600 text-white py-4 rounded-2xl text-xl font-bold shadow-lg shadow-blue-200 active:scale-95 transition-transform flex items-center justify-center gap-2"
      >
        <Save :size="20" />
        <span>{{ guardando ? 'Guardando...' : 'Guardar Cambios' }}</span>
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
