import { ref } from 'vue'
import { defineStore } from 'pinia'

// Store de UI global: toasts y diálogos de confirmación propios,
// en reemplazo de alert() y confirm() nativos.

export interface Toast {
  id: number
  texto: string
  tipo: 'exito' | 'error' | 'info'
}

export interface OpcionesConfirmacion {
  titulo: string
  mensaje: string
  textoConfirmar?: string
  destructiva?: boolean
}

export const useUiStore = defineStore('ui', () => {
  // --- TOASTS ---
  const toasts = ref<Toast[]>([])
  let proximoToastId = 0

  const toast = (texto: string, tipo: Toast['tipo'] = 'info') => {
    const id = ++proximoToastId
    toasts.value.push({ id, texto, tipo })
    setTimeout(() => cerrarToast(id), 4500)
  }

  const cerrarToast = (id: number) => {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  // --- CONFIRMACIÓN ---
  const confirmacion = ref<Required<OpcionesConfirmacion> | null>(null)
  let resolverConfirmacion: ((ok: boolean) => void) | null = null

  // Devuelve una promesa que resuelve true/false según lo que elija el usuario
  const confirmar = (opciones: OpcionesConfirmacion): Promise<boolean> => {
    confirmacion.value = {
      titulo: opciones.titulo,
      mensaje: opciones.mensaje,
      textoConfirmar: opciones.textoConfirmar || 'Confirmar',
      destructiva: opciones.destructiva ?? false,
    }
    return new Promise((resolve) => {
      resolverConfirmacion = resolve
    })
  }

  const responderConfirmacion = (ok: boolean) => {
    resolverConfirmacion?.(ok)
    resolverConfirmacion = null
    confirmacion.value = null
  }

  return {
    toasts,
    toast,
    cerrarToast,
    confirmacion,
    confirmar,
    responderConfirmacion,
  }
})
