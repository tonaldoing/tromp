import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { db, auth } from '../firebase'
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
  doc,
  setDoc,
  deleteDoc,
  deleteField,
  getDoc,
  type Unsubscribe,
} from 'firebase/firestore'

// --- INTERFACES ---
export interface Categoria {
  id: string
  nombre: string
  icono: string
  tipo: 'gasto' | 'ingreso'
}

export interface Gasto {
  id: string
  monto: number
  descripcion: string
  fecha: Date
  categoria: string
  tipo: 'gasto' | 'ingreso'
  cuotaActual?: number
  totalCuotas?: number
}

// Borrador del formulario de AddView, para no perder lo tipeado
// al navegar a otra pantalla (ej: crear una categoría en el medio)
export interface BorradorMovimiento {
  tipo: 'gasto' | 'ingreso'
  monto: string
  descripcion: string
  categoria: string
  cuotas: number
}

export const useGastosStore = defineStore('gastos', () => {
  // --- ESTADO ---
  const gastos = ref<Gasto[]>([])
  const presupuestos = ref<Record<string, number>>({})
  const categorias = ref<Categoria[]>([])

  const fechaVisual = ref(new Date())
  const cargando = ref(false)
  const borradorGasto = ref<BorradorMovimiento | null>(null)

  let unsubscribes: Unsubscribe[] = []

  // --- HELPERS ---
  const getUid = () => {
    const uid = auth.currentUser?.uid
    if (!uid) throw new Error('Usuario no autenticado')
    return uid
  }

  const getConfigRef = () => doc(db, `users/${getUid()}/config/general`)

  // Clave de documento de presupuestos para un mes dado ("2026-08")
  const mesKeyDe = (fecha: Date) =>
    `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`

  // Suma meses a una fecha sin que el día desborde al mes siguiente
  // (ej: 31 de enero + 1 mes = 28/29 de febrero, no 3 de marzo)
  const sumarMeses = (fecha: Date, delta: number) => {
    const f = new Date(fecha)
    const dia = f.getDate()
    f.setDate(1)
    f.setMonth(f.getMonth() + delta)
    const ultimoDia = new Date(f.getFullYear(), f.getMonth() + 1, 0).getDate()
    f.setDate(Math.min(dia, ultimoDia))
    return f
  }

  // --- INICIALIZAR ---
  const inicializar = async () => {
    const uid = auth.currentUser?.uid
    if (!uid) {
      limpiarDatos()
      return
    }

    // Limpiar suscripciones previas
    unsubscribes.forEach((u) => u())
    unsubscribes = []
    cargando.value = true

    // A. Gastos
    const gastosRef = collection(db, `users/${uid}/gastos`)
    const q = query(gastosRef, orderBy('fecha', 'desc'))
    unsubscribes.push(
      onSnapshot(
        q,
        (snap) => {
          gastos.value = snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
            fecha: d.data().fecha.toDate(),
          })) as Gasto[]
          cargando.value = false
        },
        (error) => {
          console.error('Error escuchando gastos:', error)
          cargando.value = false
        },
      ),
    )

    // B. Configuración (categorías)
    const configRef = doc(db, `users/${uid}/config/general`)
    unsubscribes.push(
      onSnapshot(
        configRef,
        (snap) => {
          if (snap.exists()) {
            const d = snap.data()
            categorias.value = ((d.categorias || []) as Partial<Categoria>[])
              .filter((c): c is Categoria => !!(c && c.nombre && c.id && c.icono))
              .map((c) => ({
                ...c,
                tipo: c.tipo || 'gasto',
              }))
          }
        },
        (error) => {
          console.error('Error escuchando configuración:', error)
        },
      ),
    )

    // C. Presupuestos del mes actual
    subscribirseAPresupuestos()
  }

  // --- PRESUPUESTOS SUBSCRIPTION ---
  let presupuestosUnsub: Unsubscribe | null = null

  const subscribirseAPresupuestos = () => {
    const uid = auth.currentUser?.uid
    if (!uid) return

    // Cancelar y descartar la suscripción del mes anterior
    if (presupuestosUnsub) {
      presupuestosUnsub()
      unsubscribes = unsubscribes.filter((u) => u !== presupuestosUnsub)
    }

    const presuRef = doc(db, `users/${uid}/presupuestos/${mesKeyDe(fechaVisual.value)}`)

    presupuestosUnsub = onSnapshot(
      presuRef,
      (snap) => {
        if (snap.exists()) {
          presupuestos.value = snap.data() as Record<string, number>
        } else {
          presupuestos.value = {}
        }
      },
      (error) => {
        console.error('Error escuchando presupuestos:', error)
      },
    )

    unsubscribes.push(presupuestosUnsub)
  }

  // --- LIMPIAR DATOS ---
  const limpiarDatos = () => {
    gastos.value = []
    categorias.value = []
    presupuestos.value = {}
    unsubscribes.forEach((u) => u())
    unsubscribes = []
    presupuestosUnsub = null
  }

  // ===========================================
  // CATEGORÍAS - CRUD
  // ===========================================

  const categoriasGasto = computed(() => categorias.value.filter((c) => c.tipo === 'gasto'))
  const categoriasIngreso = computed(() => categorias.value.filter((c) => c.tipo === 'ingreso'))

  const agregarCategoria = async (categoria: Categoria) => {
    const existe = categorias.value.some(
      (c) =>
        c?.nombre?.toLowerCase() === categoria.nombre.toLowerCase() && c.tipo === categoria.tipo,
    )
    if (existe) {
      throw new Error('Ya existe una categoría con ese nombre')
    }

    const listaNueva = [...categorias.value, categoria]
    await setDoc(getConfigRef(), { categorias: listaNueva }, { merge: true })
  }

  const editarCategoria = async (categoriaEditada: Categoria) => {
    const listaNueva = categorias.value.map((c) =>
      c.id === categoriaEditada.id ? categoriaEditada : c,
    )
    await setDoc(getConfigRef(), { categorias: listaNueva }, { merge: true })
  }

  const borrarCategoria = async (categoria: Categoria) => {
    const listaNueva = categorias.value.filter((c) => c.id !== categoria.id)
    await setDoc(getConfigRef(), { categorias: listaNueva }, { merge: true })
  }

  // ===========================================
  // PRESUPUESTOS
  // ===========================================

  const getPresupuestosRef = (fecha: Date) =>
    doc(db, `users/${getUid()}/presupuestos/${mesKeyDe(fecha)}`)

  const actualizarPresupuesto = async (categoria: string, monto: number) => {
    await setDoc(getPresupuestosRef(fechaVisual.value), { [categoria]: monto }, { merge: true })
  }

  const borrarPresupuesto = async (categoria: string) => {
    await setDoc(
      getPresupuestosRef(fechaVisual.value),
      { [categoria]: deleteField() },
      { merge: true },
    )
  }

  // Guarda todos los topes del mes visible en una sola escritura
  const guardarPresupuestos = async (valores: Record<string, number>) => {
    await setDoc(getPresupuestosRef(fechaVisual.value), valores, { merge: true })
  }

  // Devuelve false si el mes anterior no tenía presupuestos para copiar
  const copiarPresupuestoMesAnterior = async (): Promise<boolean> => {
    const fechaAnterior = sumarMeses(fechaVisual.value, -1)
    const presuAnteriorSnap = await getDoc(getPresupuestosRef(fechaAnterior))

    if (!presuAnteriorSnap.exists()) return false

    await setDoc(getPresupuestosRef(fechaVisual.value), presuAnteriorSnap.data())
    return true
  }

  // ===========================================
  // GASTOS / MOVIMIENTOS - CRUD
  // ===========================================

  const agregarMovimiento = async (
    monto: number,
    descripcion: string,
    categoria: string,
    tipo: 'gasto' | 'ingreso',
    cuotas: number = 1,
    fechaCustom?: Date,
  ) => {
    const uid = getUid()
    const colRef = collection(db, `users/${uid}/gastos`)
    const fechaBase = fechaCustom || fechaVisual.value

    if (cuotas <= 1 || tipo === 'ingreso') {
      await addDoc(colRef, {
        monto,
        descripcion,
        categoria,
        tipo,
        fecha: Timestamp.fromDate(fechaBase),
      })
      return
    }

    // Con cuotas: la última absorbe la diferencia de redondeo
    // para que la suma de las cuotas sea exactamente el monto total
    const montoCuota = Number((monto / cuotas).toFixed(2))
    const montoUltimaCuota = Number((monto - montoCuota * (cuotas - 1)).toFixed(2))
    const batchPromises = []

    for (let i = 0; i < cuotas; i++) {
      const fechaCuota = sumarMeses(fechaBase, i)

      batchPromises.push(
        addDoc(colRef, {
          monto: i === cuotas - 1 ? montoUltimaCuota : montoCuota,
          descripcion: `${descripcion} (${i + 1}/${cuotas})`,
          categoria,
          tipo: 'gasto',
          fecha: Timestamp.fromDate(fechaCuota),
          cuotaActual: i + 1,
          totalCuotas: cuotas,
        }),
      )
    }

    await Promise.all(batchPromises)
  }

  const editarGasto = async (id: string, data: Partial<Gasto>) => {
    const uid = getUid()
    const { fecha, ...resto } = data
    const dataToSave: Record<string, unknown> = { ...resto }
    if (fecha instanceof Date) {
      dataToSave.fecha = Timestamp.fromDate(fecha)
    }
    await setDoc(doc(db, `users/${uid}/gastos`, id), dataToSave, { merge: true })
  }

  const borrarGasto = async (id: string) => {
    const uid = getUid()
    await deleteDoc(doc(db, `users/${uid}/gastos`, id))
  }

  const getGasto = (id: string) => gastos.value.find((g) => g.id === id)

  // ===========================================
  // NAVEGACIÓN Y UTILIDADES
  // ===========================================

  const cambiarMes = (delta: number) => {
    fechaVisual.value = sumarMeses(fechaVisual.value, delta)
    subscribirseAPresupuestos()
  }

  const irAMes = (fecha: Date) => {
    fechaVisual.value = new Date(fecha)
    subscribirseAPresupuestos()
  }

  const guardarBorrador = (data: BorradorMovimiento) => {
    borradorGasto.value = data
  }

  const consumirBorrador = () => {
    const data = borradorGasto.value
    borradorGasto.value = null
    return data
  }

  const presupuestoConfigurado = computed(() => {
    return Object.keys(presupuestos.value).length > 0
  })

  // ===========================================
  // COMPUTED / GETTERS
  // ===========================================

  const movimientosDelMes = computed(() =>
    gastos.value.filter(
      (g) =>
        g.fecha.getMonth() === fechaVisual.value.getMonth() &&
        g.fecha.getFullYear() === fechaVisual.value.getFullYear(),
    ),
  )

  const gastosDelMes = computed(() => movimientosDelMes.value.filter((g) => g.tipo === 'gasto'))
  const ingresosDelMes = computed(() => movimientosDelMes.value.filter((g) => g.tipo === 'ingreso'))

  const totalGastosDelMes = computed(() => gastosDelMes.value.reduce((sum, g) => sum + g.monto, 0))
  const totalIngresosDelMes = computed(() =>
    ingresosDelMes.value.reduce((sum, g) => sum + g.monto, 0),
  )
  const balanceDelMes = computed(() => totalIngresosDelMes.value - totalGastosDelMes.value)

  const gastosPorCategoria = computed(() => {
    const agrupados: Record<string, { total: number; items: Gasto[] }> = {}

    gastosDelMes.value.forEach((gasto) => {
      if (!agrupados[gasto.categoria]) {
        agrupados[gasto.categoria] = { total: 0, items: [] }
      }
      const grupo = agrupados[gasto.categoria]
      if (grupo) {
        grupo.total += gasto.monto
        grupo.items.push(gasto)
      }
    })

    return agrupados
  })

  const estadoPresupuesto = computed(() => {
    const estado: Record<
      string,
      {
        gastado: number
        total: number
        porcentaje: number
        restante: number
        excedido: boolean
      }
    > = {}

    categoriasGasto.value.forEach((cat) => {
      const gastado = gastosDelMes.value
        .filter((g) => g.categoria === cat.nombre)
        .reduce((sum, g) => sum + g.monto, 0)

      const total = presupuestos.value[cat.nombre] || 0
      const porcentaje = total > 0 ? (gastado / total) * 100 : 0

      estado[cat.nombre] = {
        gastado,
        total,
        porcentaje: Math.min(porcentaje, 100),
        restante: total - gastado,
        excedido: gastado > total && total > 0,
      }
    })

    return estado
  })

  const categoriaMasUsada = computed(() => {
    const conteo: Record<string, number> = {}

    gastosDelMes.value.forEach((g) => {
      conteo[g.categoria] = (conteo[g.categoria] || 0) + 1
    })

    let max = 0
    let categoria = ''

    Object.entries(conteo).forEach(([cat, count]) => {
      if (count > max) {
        max = count
        categoria = cat
      }
    })

    return categoria
  })

  // ===========================================
  // RETURN
  // ===========================================

  return {
    // Estado
    gastos,
    presupuestos,
    categorias,
    cargando,
    fechaVisual,
    borradorGasto,

    // Inicialización
    inicializar,
    limpiarDatos,

    // Categorías
    agregarCategoria,
    editarCategoria,
    borrarCategoria,
    categoriasGasto,
    categoriasIngreso,

    // Presupuestos
    actualizarPresupuesto,
    borrarPresupuesto,
    guardarPresupuestos,
    copiarPresupuestoMesAnterior,
    presupuestoConfigurado,

    // Gastos
    agregarMovimiento,
    editarGasto,
    borrarGasto,
    getGasto,

    // Navegación
    cambiarMes,
    irAMes,
    guardarBorrador,
    consumirBorrador,

    // Computed
    movimientosDelMes,
    gastosDelMes,
    ingresosDelMes,
    totalGastosDelMes,
    totalIngresosDelMes,
    balanceDelMes,
    gastosPorCategoria,
    estadoPresupuesto,
    categoriaMasUsada,
  }
})
