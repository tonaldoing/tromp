<script setup lang="ts">
import { watch, ref, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useUiStore } from '../stores/ui'
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from 'lucide-vue-next'

const ui = useUiStore()
const { toasts, confirmacion } = storeToRefs(ui)

const botonCancelar = ref<HTMLButtonElement | null>(null)

// Al abrir el diálogo, llevar el foco al botón seguro (Cancelar)
watch(confirmacion, async (abierto) => {
  if (abierto) {
    await nextTick()
    botonCancelar.value?.focus()
  }
})

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') ui.responderConfirmacion(false)
}

const iconoToast = (tipo: string) => {
  if (tipo === 'exito') return CheckCircle2
  if (tipo === 'error') return AlertCircle
  return Info
}
</script>

<template>
  <!-- Toasts -->
  <div
    class="fixed top-4 left-1/2 -translate-x-1/2 z-[70] w-[calc(100%-2.5rem)] max-w-sm space-y-2 pointer-events-none"
    aria-live="polite"
  >
    <div
      v-for="t in toasts"
      :key="t.id"
      role="status"
      class="pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-xl border text-sm font-bold"
      :class="
        t.tipo === 'exito'
          ? 'bg-green-600 border-green-700 text-white'
          : t.tipo === 'error'
            ? 'bg-red-600 border-red-700 text-white'
            : 'bg-gray-900 border-gray-800 text-white'
      "
    >
      <component :is="iconoToast(t.tipo)" :size="20" class="shrink-0 mt-0.5" />
      <p class="flex-1 leading-snug">{{ t.texto }}</p>
      <button
        @click="ui.cerrarToast(t.id)"
        class="shrink-0 -m-1 p-1 rounded-lg opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Cerrar aviso"
      >
        <X :size="16" />
      </button>
    </div>
  </div>

  <!-- Diálogo de confirmación -->
  <div
    v-if="confirmacion"
    class="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-5"
    @keydown="onKeydown"
  >
    <!-- Backdrop -->
    <div
      class="absolute inset-0 bg-black/40 backdrop-blur-sm"
      @click="ui.responderConfirmacion(false)"
    ></div>

    <div
      role="alertdialog"
      aria-modal="true"
      :aria-label="confirmacion.titulo"
      class="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 mb-safe"
    >
      <div class="flex items-start gap-4 mb-5">
        <div
          class="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
          :class="confirmacion.destructiva ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-600'"
        >
          <AlertTriangle :size="22" />
        </div>
        <div class="min-w-0">
          <h2 class="font-extrabold text-gray-900 text-lg leading-tight">
            {{ confirmacion.titulo }}
          </h2>
          <p class="text-sm text-gray-500 mt-1 leading-snug">{{ confirmacion.mensaje }}</p>
        </div>
      </div>

      <div class="flex gap-3">
        <button
          ref="botonCancelar"
          @click="ui.responderConfirmacion(false)"
          class="flex-1 py-3.5 rounded-2xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all"
        >
          Cancelar
        </button>
        <button
          @click="ui.responderConfirmacion(true)"
          class="flex-1 py-3.5 rounded-2xl font-bold text-white active:scale-95 transition-all shadow-lg"
          :class="
            confirmacion.destructiva
              ? 'bg-red-600 hover:bg-red-700 shadow-red-200'
              : 'bg-black hover:bg-gray-800 shadow-gray-300'
          "
        >
          {{ confirmacion.textoConfirmar }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mb-safe {
  margin-bottom: env(safe-area-inset-bottom);
}
</style>
