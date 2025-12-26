<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useGastosStore } from '../stores/gastos'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import {
  ChevronLeft,
  Edit3,
  Copy,
  Trash2,
  LogOut,
  Plus,
  Users,
  Crown,
  Loader2,
} from 'lucide-vue-next'

const authStore = useAuthStore()
const gastosStore = useGastosStore()
const router = useRouter()

// Interfaz para los miembros
interface MemberInfo {
  uid: string
  displayName: string
  photoURL: string
  email: string
}

// Estado para los miembros de cada board
const membersData = ref<Record<string, MemberInfo[]>>({})

// Estados del perfil
const editando = ref(false)
const nombreTemp = ref(authStore.userProfile?.displayName || '')
const fotoTemp = ref(authStore.userProfile?.photoURL || '')

// Estados de tableros
const codigoUnirse = ref('')
const nombreNuevoBoard = ref('')
const error = ref('')
const cargandoAccion = ref<string | null>(null) // Para mostrar loading en acciones

// Computed
const esOwnerDelBoard = (boardId: string) => {
  return gastosStore.infoBoard?.owner === authStore.user?.uid && gastosStore.boardActivo === boardId
}

const cantidadBoards = computed(() => authStore.userProfile?.boards.length || 0)

// Acciones de perfil
const guardarPerfil = async () => {
  try {
    await authStore.actualizarPerfil(nombreTemp.value, fotoTemp.value)
    editando.value = false
  } catch (e: any) {
    error.value = e.message
  }
}

const cancelarEdicion = () => {
  nombreTemp.value = authStore.userProfile?.displayName || ''
  fotoTemp.value = authStore.userProfile?.photoURL || ''
  editando.value = false
}

// Acciones de tableros
const copiarCodigo = async (id: string) => {
  try {
    await navigator.clipboard.writeText(id)
    // Feedback visual temporal
    const btn = document.getElementById(`copy-${id}`)
    if (btn) {
      btn.classList.add('!bg-green-100', '!text-green-600')
      setTimeout(() => btn.classList.remove('!bg-green-100', '!text-green-600'), 1500)
    }
  } catch {
    // Fallback para navegadores sin clipboard API
    alert('Código: ' + id)
  }
}

const unirse = async () => {
  if (!codigoUnirse.value.trim()) return

  try {
    error.value = ''
    cargandoAccion.value = 'unirse'
    await gastosStore.unirseABoard(codigoUnirse.value.trim())
    codigoUnirse.value = ''
  } catch (e: any) {
    error.value = e.message
  } finally {
    cargandoAccion.value = null
  }
}

const crearBoard = async () => {
  if (!nombreNuevoBoard.value.trim()) return

  try {
    error.value = ''
    cargandoAccion.value = 'crear'
    await gastosStore.crearNuevoBoard(nombreNuevoBoard.value.trim())
    nombreNuevoBoard.value = ''
  } catch (e: any) {
    error.value = e.message
  } finally {
    cargandoAccion.value = null
  }
}

const salirDelBoard = async (boardId: string) => {
  const confirmacion = confirm(
    '¿Seguro que querés salir de este tablero?\n\nTus datos quedarán en el tablero pero ya no tendrás acceso.',
  )
  if (!confirmacion) return

  try {
    error.value = ''
    cargandoAccion.value = `salir-${boardId}`
    await gastosStore.salirDeBoard(boardId)
  } catch (e: any) {
    error.value = e.message
  } finally {
    cargandoAccion.value = null
  }
}

const eliminarBoard = async (boardId: string) => {
  const confirmacion = confirm(
    '⚠️ ATENCIÓN: Esto eliminará PERMANENTEMENTE el tablero y todos sus datos (gastos, categorías, presupuestos).\n\n¿Estás seguro?',
  )
  if (!confirmacion) return

  const segundaConfirmacion = confirm(
    'Esta acción NO se puede deshacer.\n\n¿Confirmar eliminación?',
  )
  if (!segundaConfirmacion) return

  try {
    error.value = ''
    cargandoAccion.value = `eliminar-${boardId}`
    await gastosStore.eliminarBoard(boardId)
  } catch (e: any) {
    error.value = e.message
  } finally {
    cargandoAccion.value = null
  }
}

const cerrarSesion = async () => {
  if (confirm('¿Cerrar sesión?')) {
    await authStore.logout()
    router.push('/login')
  }
}

const handleImageError = (e: Event) => {
  const target = e.target as HTMLImageElement
  target.src = 'https://ui-avatars.com/api/?name=U'
}

// Cargar datos de los miembros de un tablero
const cargarMiembrosBoard = async (boardId: string) => {
  try {
    const boardRef = doc(db, 'boards', boardId)
    const boardSnap = await getDoc(boardRef)

    if (!boardSnap.exists()) return

    const boardData = boardSnap.data()
    const memberIds = boardData.members || []

    // Cargar datos de cada miembro
    const membersPromises = memberIds.map(async (uid: string) => {
      const userRef = doc(db, 'users', uid)
      const userSnap = await getDoc(userRef)

      if (userSnap.exists()) {
        const userData = userSnap.data()
        return {
          uid: userData.uid,
          displayName: userData.displayName || 'Usuario',
          photoURL: userData.photoURL || `https://ui-avatars.com/api/?name=${userData.displayName || 'U'}`,
          email: userData.email || '',
        }
      }
      return null
    })

    const members = (await Promise.all(membersPromises)).filter(m => m !== null) as MemberInfo[]
    membersData.value[boardId] = members
  } catch (error) {
    console.error('Error cargando miembros:', error)
  }
}

// Cargar miembros cuando se monta el componente
onMounted(() => {
  if (authStore.userProfile?.boards) {
    authStore.userProfile.boards.forEach(boardId => {
      cargarMiembrosBoard(boardId)
    })
  }
})

// Observar cambios en los boards del usuario
watch(
  () => authStore.userProfile?.boards,
  (newBoards) => {
    if (newBoards) {
      newBoards.forEach(boardId => {
        if (!membersData.value[boardId]) {
          cargarMiembrosBoard(boardId)
        }
      })
    }
  },
  { deep: true }
)
</script>

<template>
  <div class="px-5 pt-6 pb-32 bg-gray-50 min-h-screen">
    <!-- Header -->
    <header class="flex items-center gap-4 mb-8">
      <button
        @click="router.back()"
        class="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 rounded-full shadow-sm active:scale-95 transition-transform text-gray-700"
      >
        <ChevronLeft :size="22" stroke-width="2.5" />
      </button>
      <h1 class="text-2xl font-extrabold text-gray-900 tracking-tight">Mi Perfil</h1>
    </header>

    <!-- Tarjeta de Perfil -->
    <div class="bg-white p-6 rounded-3xl shadow-xl shadow-gray-200/50 mb-8 border border-gray-100">
      <div class="flex flex-col items-center text-center">
        <!-- Avatar -->
        <div class="relative mb-4">
          <img
            :src="
              editando
                ? fotoTemp || 'https://ui-avatars.com/api/?name=' + nombreTemp
                : authStore.userProfile?.photoURL ||
                  'https://ui-avatars.com/api/?name=' + authStore.userProfile?.displayName
            "
            class="w-24 h-24 rounded-full border-4 border-gray-100 shadow-lg object-cover"
            @error="handleImageError"
          />
          <button
            v-if="!editando"
            @click="editando = true"
            class="absolute -bottom-1 -right-1 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-800 transition-colors"
          >
            <Edit3 :size="14" />
          </button>
        </div>

        <!-- Info / Edición -->
        <div v-if="!editando" class="space-y-1">
          <h2 class="text-xl font-bold text-gray-900">
            {{ authStore.userProfile?.displayName || 'Usuario' }}
          </h2>
          <p class="text-gray-400 text-sm">{{ authStore.userProfile?.email }}</p>
        </div>

        <div v-else class="w-full space-y-4 mt-2">
          <div>
            <label class="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2"
              >Nombre</label
            >
            <input
              v-model="nombreTemp"
              placeholder="Tu nombre"
              class="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-black outline-none font-medium"
            />
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2"
              >URL Foto (opcional)</label
            >
            <input
              v-model="fotoTemp"
              placeholder="https://..."
              class="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-black outline-none font-medium text-sm"
            />
          </div>
          <div class="flex gap-3 pt-2">
            <button
              @click="cancelarEdicion"
              class="flex-1 py-3 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              @click="guardarPerfil"
              class="flex-1 py-3 rounded-xl font-bold text-white bg-black hover:bg-gray-800 transition-colors"
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Sección de Tableros -->
    <div class="mb-8">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="text-lg font-bold text-gray-800">Mis Tableros</h3>
          <p class="text-xs text-gray-500 mt-0.5">
            Los tableros te permiten organizar gastos por grupos o proyectos
          </p>
        </div>
        <span
          class="text-sm font-bold px-3 py-1.5 rounded-full"
          :class="
            cantidadBoards >= 2
              ? 'bg-red-100 text-red-600'
              : 'bg-gray-100 text-gray-600'
          "
        >
          {{ cantidadBoards }}/2
        </span>
      </div>

      <!-- Sin tableros - Onboarding -->
      <div
        v-if="cantidadBoards === 0"
        class="bg-linear-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 text-center border-2 border-blue-100 mb-6"
      >
        <div class="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users :size="32" class="text-white" />
        </div>
        <h4 class="text-xl font-bold text-gray-800 mb-2">¡Bienvenido!</h4>
        <p class="text-gray-600 mb-6 max-w-sm mx-auto">
          Creá tu primer tablero para comenzar a registrar gastos, o unite a uno existente si
          alguien te compartió un código
        </p>
        <div class="flex gap-3 justify-center">
          <div class="text-left">
            <div class="text-2xl mb-1">📝</div>
            <p class="text-xs font-bold text-gray-700">Creá uno</p>
          </div>
          <div class="text-gray-300 text-2xl">o</div>
          <div class="text-left">
            <div class="text-2xl mb-1">🔗</div>
            <p class="text-xs font-bold text-gray-700">Unite a uno</p>
          </div>
        </div>
      </div>

      <!-- Lista de Tableros -->
      <div v-else class="space-y-3 mb-6">
        <div
          v-for="boardId in authStore.userProfile?.boards"
          :key="boardId"
          class="bg-white rounded-2xl border-2 overflow-hidden transition-all hover:shadow-md"
          :class="
            gastosStore.boardActivo === boardId
              ? 'border-black shadow-lg ring-2 ring-black ring-opacity-5'
              : 'border-gray-200 hover:border-gray-300'
          "
        >
          <!-- Header del Board -->
          <div
            @click="gastosStore.seleccionarBoard(boardId)"
            class="p-4 cursor-pointer active:scale-[0.98] transition-transform"
          >
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center gap-3 flex-1">
                <div
                  class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                  :class="
                    gastosStore.boardActivo === boardId
                      ? 'bg-linear-to-br from-gray-800 to-black text-white'
                      : 'bg-linear-to-br from-gray-100 to-gray-200 text-gray-500'
                  "
                >
                  <Users :size="20" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <p class="font-bold text-gray-800 truncate">
                      {{ gastosStore.infoBoard?.nombre || 'Mi Tablero' }}
                    </p>
                    <Crown
                      v-if="esOwnerDelBoard(boardId)"
                      :size="14"
                      class="text-yellow-500 shrink-0"
                      title="Sos el creador"
                    />
                  </div>
                  <div class="flex items-center gap-2">
                    <span
                      class="text-xs font-bold px-2 py-0.5 rounded-md"
                      :class="
                        gastosStore.boardActivo === boardId
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      "
                    >
                      {{ gastosStore.boardActivo === boardId ? '● Activo' : 'Inactivo' }}
                    </span>
                    <span class="text-xs text-gray-400">
                      {{ esOwnerDelBoard(boardId) ? 'Propietario' : 'Miembro' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Información adicional -->
            <div class="bg-gray-50 rounded-xl p-3 space-y-2">
              <div class="flex items-center justify-between text-xs">
                <span class="text-gray-500 font-medium">Código de invitación</span>
                <button
                  :id="'copy-' + boardId"
                  @click.stop="copiarCodigo(boardId)"
                  class="px-2.5 py-1 rounded-lg font-bold bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <Copy :size="12" />
                  <span class="font-mono">{{ boardId.slice(-8) }}...</span>
                </button>
              </div>

              <!-- Miembros con avatares -->
              <div class="pt-2">
                <p class="text-xs text-gray-500 font-medium mb-2">
                  Miembros ({{ membersData[boardId]?.length || 0 }})
                </p>
                <div class="flex flex-wrap gap-2">
                  <div
                    v-for="member in membersData[boardId]"
                    :key="member.uid"
                    class="flex items-center gap-2 bg-white px-2 py-1.5 rounded-lg border border-gray-200"
                  >
                    <img
                      :src="member.photoURL"
                      :alt="member.displayName"
                      class="w-6 h-6 rounded-full object-cover"
                      @error="handleImageError"
                    />
                    <span class="text-xs font-bold text-gray-700 truncate max-w-[100px]">
                      {{ member.displayName }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Acciones del Board -->
          <div class="px-4 pb-4 flex gap-2">
            <!-- Si es owner: puede eliminar -->
            <button
              v-if="esOwnerDelBoard(boardId)"
              @click.stop="eliminarBoard(boardId)"
              :disabled="cargandoAccion === `eliminar-${boardId}`"
              class="flex-1 py-2.5 rounded-xl text-sm font-bold bg-red-50 text-red-600 hover:bg-red-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
            >
              <Loader2
                v-if="cargandoAccion === `eliminar-${boardId}`"
                :size="14"
                class="animate-spin"
              />
              <template v-else>
                <Trash2 :size="14" />
                Eliminar tablero
              </template>
            </button>

            <!-- Si NO es owner: puede salir -->
            <button
              v-else
              @click.stop="salirDelBoard(boardId)"
              :disabled="cargandoAccion === `salir-${boardId}`"
              class="flex-1 py-2.5 rounded-xl text-sm font-bold bg-orange-50 text-orange-600 hover:bg-orange-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
            >
              <Loader2
                v-if="cargandoAccion === `salir-${boardId}`"
                :size="14"
                class="animate-spin"
              />
              <template v-else>
                <LogOut :size="14" />
                Salir del tablero
              </template>
            </button>
          </div>
        </div>
      </div>

      <!-- Acciones de Tableros -->
      <div class="space-y-4">
        <!-- Unirse -->
        <div class="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <h4 class="font-bold text-gray-700 mb-3 flex items-center gap-2">
            <Users :size="16" />
            Unirse a un tablero
          </h4>
          <div class="flex gap-2">
            <input
              v-model="codigoUnirse"
              placeholder="Pegá el código aquí..."
              class="flex-1 p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-black outline-none text-sm font-medium"
              @keyup.enter="unirse"
            />
            <button
              @click="unirse"
              :disabled="!codigoUnirse.trim() || cargandoAccion === 'unirse'"
              class="px-5 rounded-xl font-bold bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Loader2 v-if="cargandoAccion === 'unirse'" :size="16" class="animate-spin" />
              <span v-else>Entrar</span>
            </button>
          </div>
        </div>

        <!-- Crear nuevo -->
        <div
          v-if="cantidadBoards < 2"
          class="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm"
        >
          <h4 class="font-bold text-gray-700 mb-3 flex items-center gap-2">
            <Plus :size="16" />
            Crear nuevo tablero
          </h4>
          <div class="flex gap-2">
            <input
              v-model="nombreNuevoBoard"
              placeholder="Nombre del tablero..."
              class="flex-1 p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-black outline-none text-sm font-medium"
              @keyup.enter="crearBoard"
            />
            <button
              @click="crearBoard"
              :disabled="!nombreNuevoBoard.trim() || cargandoAccion === 'crear'"
              class="px-5 rounded-xl font-bold bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Loader2 v-if="cargandoAccion === 'crear'" :size="16" class="animate-spin" />
              <Plus v-else :size="18" />
            </button>
          </div>
        </div>

        <!-- Límite alcanzado -->
        <p v-else class="text-center text-sm text-gray-400 py-2">
          Alcanzaste el límite de 2 tableros
        </p>
      </div>
    </div>

    <!-- Error -->
    <div
      v-if="error"
      class="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm font-medium text-center"
    >
      {{ error }}
      <button @click="error = ''" class="ml-2 underline">Cerrar</button>
    </div>

    <!-- Cerrar Sesión -->
    <button
      @click="cerrarSesion"
      class="w-full py-4 rounded-2xl font-bold border-2 border-red-200 text-red-500 hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
    >
      <LogOut :size="18" />
      Cerrar Sesión
    </button>
  </div>
</template>
