<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGastosStore, type Usuario } from '../stores/gastos'
import { storeToRefs } from 'pinia'

const store = useGastosStore()
const { usuarios } = storeToRefs(store)
const router = useRouter()

// Variables del Formulario
const idEditando = ref<string | null>(null) // Si es null, estamos creando. Si tiene ID, editamos.
const nombre = ref('')
const email = ref('') // <--- NUEVO CAMPO
const emojiSeleccionado = ref('😀')
const colorSeleccionado = ref('bg-gray-100 text-gray-700 border-gray-500')

const emojis = ['👨‍🦲', '👩‍🦲', '👱‍♂️', '👩', '🧔', '👵', '🤖', '👽', '🦊', '🐶', '🐱', '🦁']
const colores = [
  { class: 'bg-blue-100 text-blue-700 border-blue-500', nombre: 'Azul' },
  { class: 'bg-pink-100 text-pink-700 border-pink-500', nombre: 'Rosa' },
  { class: 'bg-green-100 text-green-700 border-green-500', nombre: 'Verde' },
  { class: 'bg-yellow-100 text-yellow-700 border-yellow-500', nombre: 'Amarillo' },
  { class: 'bg-purple-100 text-purple-700 border-purple-500', nombre: 'Violeta' },
  { class: 'bg-orange-100 text-orange-700 border-orange-500', nombre: 'Naranja' },
]

// Cargar datos en el formulario al tocar un usuario
const cargarParaEditar = (u: Usuario) => {
  idEditando.value = u.id
  nombre.value = u.nombre
  email.value = u.email || '' // Cargar email si tiene
  emojiSeleccionado.value = u.emoji
  colorSeleccionado.value = u.color
  // Scroll suave hacia arriba
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const limpiarForm = () => {
  idEditando.value = null
  nombre.value = ''
  email.value = ''
  emojiSeleccionado.value = '😀'
  colorSeleccionado.value = colores[0].class
}

const guardar = async () => {
  if (!nombre.value) return

  const datosUsuario: Usuario = {
    id:
      idEditando.value ||
      nombre.value.toLowerCase().replace(/\s/g, '_') + '_' + Date.now().toString().slice(-4),
    nombre: nombre.value,
    emoji: emojiSeleccionado.value,
    color: colorSeleccionado.value,
    email: email.value.trim().toLowerCase(), // Guardamos el email
  }

  if (idEditando.value) {
    // MODO EDICIÓN
    // Preservamos la foto si ya la tenía (aunque aquí no se edita la foto, se actualiza sola al loguearse)
    const userViejo = usuarios.value.find((u) => u.id === idEditando.value)
    if (userViejo?.foto) datosUsuario.foto = userViejo.foto

    await store.editarUsuario(datosUsuario)
  } else {
    // MODO CREACIÓN
    await store.agregarUsuario(datosUsuario)
  }

  limpiarForm()
}

const borrar = async (usuario: Usuario) => {
  if (confirm(`¿Borrar a ${usuario.nombre}?`)) {
    await store.borrarUsuario(usuario)
    if (idEditando.value === usuario.id) limpiarForm()
  }
}
</script>

<template>
  <div class="p-6 pb-24 min-h-screen bg-gray-50">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-800">Personas 👥</h1>
      <button
        @click="router.back()"
        class="text-gray-500 font-bold px-3 py-1 bg-white rounded-lg border"
      >
        Volver
      </button>
    </div>

    <div
      class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-8 transition-all"
      :class="idEditando ? 'ring-2 ring-blue-500' : ''"
    >
      <div class="flex justify-between items-center mb-4">
        <h2 class="font-bold text-gray-700">
          {{ idEditando ? '✏️ Editando a ' + nombre : '✨ Agregar Integrante' }}
        </h2>
        <button v-if="idEditando" @click="limpiarForm" class="text-xs text-gray-400 underline">
          Cancelar edición
        </button>
      </div>

      <div class="mb-4">
        <label class="block text-xs font-bold text-gray-400 mb-1 uppercase">Nombre (Alias)</label>
        <input
          v-model="nombre"
          placeholder="Ej: Tomi"
          class="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      <div class="mb-4">
        <label class="block text-xs font-bold text-gray-400 mb-1 uppercase"
          >Email de Google (Opcional)</label
        >
        <div class="relative">
          <span class="absolute left-3 top-3 text-gray-400">📧</span>
          <input
            type="email"
            v-model="email"
            placeholder="usuario@gmail.com"
            class="w-full pl-9 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <p class="text-[10px] text-gray-400 mt-1">
          Si agregas el email, cuando esa persona se loguee verá su foto real.
        </p>
      </div>

      <div class="mb-4">
        <label class="block text-xs font-bold text-gray-400 mb-1 uppercase">Avatar</label>
        <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            v-for="e in emojis"
            :key="e"
            @click="emojiSeleccionado = e"
            class="text-2xl p-2 rounded-lg transition-all"
            :class="emojiSeleccionado === e ? 'bg-gray-100 scale-110 shadow-inner' : ''"
          >
            {{ e }}
          </button>
        </div>
      </div>

      <div class="mb-6">
        <label class="block text-xs font-bold text-gray-400 mb-1 uppercase">Color</label>
        <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            v-for="c in colores"
            :key="c.nombre"
            @click="colorSeleccionado = c.class"
            class="w-8 h-8 rounded-full border-2 transition-all flex-shrink-0"
            :class="[
              c.class,
              colorSeleccionado === c.class ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : '',
            ]"
          ></button>
        </div>
      </div>

      <button
        @click="guardar"
        class="w-full text-white py-3 rounded-xl font-bold active:scale-95 transition-transform"
        :class="idEditando ? 'bg-blue-600' : 'bg-black'"
      >
        {{ idEditando ? 'Guardar Cambios' : '+ Agregar Persona' }}
      </button>
    </div>

    <div class="space-y-3">
      <div
        v-for="user in usuarios"
        :key="user.id"
        @click="cargarParaEditar(user)"
        class="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center cursor-pointer active:scale-[0.99] transition-transform"
      >
        <div class="flex items-center gap-3">
          <div
            class="w-12 h-12 rounded-full flex items-center justify-center text-xl border-2 overflow-hidden"
            :class="user.color"
          >
            <img v-if="user.foto" :src="user.foto" class="w-full h-full object-cover" />
            <span v-else>{{ user.emoji }}</span>
          </div>

          <div>
            <span class="font-bold text-gray-700 block">{{ user.nombre }}</span>
            <span
              v-if="user.email"
              class="text-xs text-blue-500 font-medium flex items-center gap-1"
            >
              ✓ Vinculado
            </span>
            <span v-else class="text-xs text-gray-400">Sin vincular</span>
          </div>
        </div>

        <button @click.stop="borrar(user)" class="text-gray-300 hover:text-red-500 p-2 text-xl">
          🗑️
        </button>
      </div>
    </div>
  </div>
</template>
