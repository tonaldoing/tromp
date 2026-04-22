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
  updateDoc,
  getDoc,
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

export const useGastosStore = defineStore('gastos', () => {
  // --- ESTADO ---
  const gastos = ref<Gasto[]>([])
  const presupuestos = ref<Record<string, number>>({})
  const categorias = ref<Categoria[]>([])

  const fechaVisual = ref(new Date())
  const cargando = ref(false)
  const borradorGasto = ref<any>(null)

  let unsubscribes: Function[] = []

  // --- HELPERS ---
  const getUid = () => {
    const uid = auth.currentUser?.uid
    if (!uid) throw new Error('Usuario no autenticado')
    return uid
  }

  const getConfigRef = () => doc(db, `users/${getUid()}/config/general`)

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
      onSnapshot(q, (snap) => {
        gastos.value = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          fecha: d.data().fecha.toDate(),
        })) as Gasto[]
        cargando.value = false
      }),
    )

    // B. Configuración (categorías)
    const configRef = doc(db, `users/${uid}/config/general`)
    unsubscribes.push(
      onSnapshot(configRef, (snap) => {
        if (snap.exists()) {
          const d = snap.data()
          categorias.value = (d.categorias || [])
            .filter((c: any) => c && c.nombre && c.id && c.icono)
            .map((c: any) => ({
              ...c,
              tipo: c.tipo || 'gasto',
            }))
        }
      }),
    )

    // C. Presupuestos del mes actual
    subscribirseAPresupuestos()
  }

  // --- PRESUPUESTOS SUBSCRIPTION ---
  let presupuestosUnsub: Function | null = null

  const subscribirseAPresupuestos = () => {
    const uid = auth.currentUser?.uid
    if (!uid) return

    if (presupuestosUnsub) {
      presupuestosUnsub()
    }

    const year = fechaVisual.value.getFullYear()
    const month = fechaVisual.value.getMonth()
    const mesKey = `${year}-${String(month + 1).padStart(2, '0')}`

    const presuRef = doc(db, `users/${uid}/presupuestos/${mesKey}`)

    presupuestosUnsub = onSnapshot(presuRef, (snap) => {
      if (snap.exists()) {
        presupuestos.value = snap.data() as Record<string, number>
      } else {
        presupuestos.value = {}
      }
    })

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
    await updateDoc(getConfigRef(), { categorias: listaNueva })
  }

  const editarCategoria = async (categoriaEditada: Categoria) => {
    const listaNueva = categorias.value.map((c) =>
      c.id === categoriaEditada.id ? categoriaEditada : c,
    )
    await updateDoc(getConfigRef(), { categorias: listaNueva })
  }

  const borrarCategoria = async (categoria: Categoria) => {
    const listaNueva = categorias.value.filter((c) => c.id !== categoria.id)
    await updateDoc(getConfigRef(), { categorias: listaNueva })
  }

  // ===========================================
  // PRESUPUESTOS
  // ===========================================

  const actualizarPresupuesto = async (categoria: string, monto: number, anio?: number, mes?: number) => {
    const uid = getUid()
    const year = anio ?? fechaVisual.value.getFullYear()
    const month = mes ?? fechaVisual.value.getMonth()
    const mesKey = `${year}-${String(month + 1).padStart(2, '0')}`

    await setDoc(
      doc(db, `users/${uid}/presupuestos/${mesKey}`),
      { [categoria]: monto },
      { merge: true },
    )
  }

  const borrarPresupuesto = async (categoria: string, anio?: number, mes?: number) => {
    const uid = getUid()
    const year = anio ?? fechaVisual.value.getFullYear()
    const month = mes ?? fechaVisual.value.getMonth()
    const mesKey = `${year}-${String(month + 1).padStart(2, '0')}`

    await setDoc(
      doc(db, `users/${uid}/presupuestos/${mesKey}`),
      { [categoria]: 0 },
      { merge: true },
    )
  }

  const copiarPresupuestoMesAnterior = async () => {
    const uid = getUid()

    const yearActual = fechaVisual.value.getFullYear()
    const monthActual = fechaVisual.value.getMonth()

    const fechaAnterior = new Date(fechaVisual.value)
    fechaAnterior.setMonth(fechaAnterior.getMonth() - 1)
    const yearAnterior = fechaAnterior.getFullYear()
    const monthAnterior = fechaAnterior.getMonth()

    const mesKeyAnterior = `${yearAnterior}-${String(monthAnterior + 1).padStart(2, '0')}`
    const mesKeyActual = `${yearActual}-${String(monthActual + 1).padStart(2, '0')}`

    const presuAnteriorRef = doc(db, `users/${uid}/presupuestos/${mesKeyAnterior}`)
    const presuAnteriorSnap = await getDoc(presuAnteriorRef)

    if (presuAnteriorSnap.exists()) {
      const presuAnterior = presuAnteriorSnap.data()
      await setDoc(doc(db, `users/${uid}/presupuestos/${mesKeyActual}`), presuAnterior)
    }
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

    // Con cuotas
    const montoCuota = Number((monto / cuotas).toFixed(2))
    const batchPromises = []

    for (let i = 0; i < cuotas; i++) {
      const fechaCuota = new Date(fechaBase)
      fechaCuota.setMonth(fechaBase.getMonth() + i)

      batchPromises.push(
        addDoc(colRef, {
          monto: montoCuota,
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
    const dataToSave = { ...data }
    if (data.fecha instanceof Date) {
      ;(dataToSave as any).fecha = Timestamp.fromDate(data.fecha)
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
    const f = new Date(fechaVisual.value)
    f.setMonth(f.getMonth() + delta)
    fechaVisual.value = f
    subscribirseAPresupuestos()
  }

  const irAMes = (fecha: Date) => {
    fechaVisual.value = new Date(fecha)
    subscribirseAPresupuestos()
  }

  const guardarBorrador = (data: any) => {
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
