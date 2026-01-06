<script setup lang="ts">
import { ref, computed, watch as vueWatch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useGastosStore } from '../stores/gastos'
import { getIcono } from '../utils/icons'
import { ChevronDown, Users, Crown, Check } from 'lucide-vue-next'

const authStore = useAuthStore()
const gastosStore = useGastosStore()
const router = useRouter()

const mostrarMenu = ref(false)

const tableroActual = computed(() => {
  // Si no hay board activo, mostrar "Sin tablero"
  if (!gastosStore.boardActivo) {
    return {
      id: null,
      nombre: 'Sin tablero',
      icono: 'users',
      owner: null,
      members: 0,
    }
  }

  // Si hay board activo pero aún no cargó la info, mostrar loading
  if (!gastosStore.infoBoard) {
    return {
      id: gastosStore.boardActivo,
      nombre: 'Cargando...',
      icono: 'users',
      owner: null,
      members: 0,
    }
  }

  // Board válido con info completa
  return {
    id: gastosStore.boardActivo,
    nombre: gastosStore.infoBoard.nombre || 'Sin nombre',
    icono: gastosStore.infoBoard.icono || 'users',
    owner: gastosStore.infoBoard.owner,
    members: gastosStore.infoBoard.members?.length || 0,
  }
})

const esOwner = computed(() => {
  return gastosStore.infoBoard?.owner === authStore.user?.uid
})

// Estado para datos de otros tableros
const otrosBoardsData = ref<Record<string, any>>({})

const otrosTableros = computed(() => {
  return (authStore.userProfile?.boards || []).filter((id) => id !== gastosStore.boardActivo)
})

// Cargar datos de un board
const cargarDatosBoard = async (boardId: string) => {
  try {
    const { doc, getDoc } = await import('firebase/firestore')
    const { db } = await import('../firebase')
    const boardRef = doc(db, 'boards', boardId)
    const boardSnap = await getDoc(boardRef)
    if (boardSnap.exists()) {
      otrosBoardsData.value[boardId] = { id: boardId, ...boardSnap.data() }
    }
  } catch (error) {
    console.error('Error cargando board:', error)
  }
}

const toggleMenu = () => {
  mostrarMenu.value = !mostrarMenu.value
}

const seleccionar = async (boardId: string) => {
  await gastosStore.seleccionarBoard(boardId)
  mostrarMenu.value = false
}

const irAPerfil = () => {
  mostrarMenu.value = false
  router.push('/profile')
}

// Cerrar menú al hacer click fuera
const cerrarSiClickFuera = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (!target.closest('.board-selector-menu')) {
    mostrarMenu.value = false
  }
}

// Agregar/quitar listener cuando se muestra/oculta el menú
const handleClickOutside = (show: boolean) => {
  if (show) {
    setTimeout(() => {
      document.addEventListener('click', cerrarSiClickFuera)
    }, 0)
  } else {
    document.removeEventListener('click', cerrarSiClickFuera)
  }
}

// Watch para manejar el listener
const watch = () => {
  handleClickOutside(mostrarMenu.value)
}

// Cargar datos cuando cambian los boards del usuario
vueWatch(
  () => authStore.userProfile?.boards,
  (boards) => {
    if (boards) {
      boards.forEach(boardId => {
        cargarDatosBoard(boardId)
      })
    }
  },
  { immediate: true }
)

// Cargar datos al montar
onMounted(() => {
  if (authStore.userProfile?.boards) {
    authStore.userProfile.boards.forEach(boardId => {
      cargarDatosBoard(boardId)
    })
  }
})
</script>

<template>
  <div class="relative board-selector-menu">
    <button
      @click="toggleMenu"
      class="flex items-center gap-2 px-3 py-2 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-all active:scale-95 min-w-0"
      :class="mostrarMenu ? 'border-black' : ''"
    >
      <div class="w-8 h-8 rounded-lg bg-linear-to-br from-gray-800 to-black text-white flex items-center justify-center shrink-0">
        <component :is="getIcono(tableroActual.icono)" :size="16" />
      </div>
      <div class="flex-1 text-left min-w-0 hidden sm:block">
        <p class="text-xs font-bold text-gray-800 truncate leading-tight">
          {{ tableroActual.nombre }}
        </p>
        <p class="text-xs text-gray-400 leading-tight">
          {{ tableroActual.members }} miembro{{ tableroActual.members !== 1 ? 's' : '' }}
        </p>
      </div>
      <ChevronDown
        :size="16"
        class="text-gray-400 transition-transform shrink-0"
        :class="mostrarMenu ? 'rotate-180' : ''"
      />
    </button>

    <!-- Menú desplegable -->
    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div
        v-if="mostrarMenu"
        @click="watch"
        class="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-2xl shadow-xl overflow-hidden z-50 min-w-[280px]"
      >
        <!-- Tablero actual -->
        <div class="p-3 bg-gray-50 border-b border-gray-200">
          <p class="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
            Tablero activo
          </p>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-linear-to-br from-gray-800 to-black text-white flex items-center justify-center shrink-0">
              <component :is="getIcono(tableroActual.icono)" :size="18" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <p class="font-bold text-gray-800 truncate text-sm">
                  {{ tableroActual.nombre }}
                </p>
                <Crown v-if="esOwner" :size="12" class="text-yellow-500 shrink-0" />
              </div>
              <p class="text-xs text-gray-500">
                {{ tableroActual.members }} persona{{ tableroActual.members !== 1 ? 's' : '' }}
              </p>
            </div>
            <Check :size="18" class="text-green-600 shrink-0" />
          </div>
        </div>

        <!-- Otros tableros -->
        <div v-if="otrosTableros.length > 0" class="p-2">
          <p class="text-xs font-bold text-gray-400 uppercase tracking-wide px-3 py-2">
            Cambiar a
          </p>
          <button
            v-for="boardId in otrosTableros"
            :key="boardId"
            @click="seleccionar(boardId)"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left"
          >
            <div class="w-10 h-10 rounded-lg bg-linear-to-br from-gray-100 to-gray-200 text-gray-500 flex items-center justify-center shrink-0">
              <component :is="getIcono(otrosBoardsData[boardId]?.icono || 'users')" :size="18" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-bold text-gray-700 truncate text-sm">{{ otrosBoardsData[boardId]?.nombre || 'Cargando...' }}</p>
              <p class="text-xs text-gray-400">Click para activar</p>
            </div>
          </button>
        </div>

        <!-- Acciones -->
        <div class="border-t border-gray-200">
          <button
            @click="irAPerfil"
            class="w-full px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors text-left flex items-center gap-2"
          >
            <Users :size="16" />
            Gestionar tableros
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>