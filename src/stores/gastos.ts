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
  arrayUnion,
  arrayRemove,
  getDoc,
  getDocs,
  writeBatch,
} from 'firebase/firestore'
import { useAuthStore } from './auth'

// --- INTERFACES ---
export interface Usuario {
  id: string
  nombre: string
  emoji: string
  email?: string
  foto?: string
}

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
  pagadoPor: string
  categoria: string
  tipo: 'gasto' | 'ingreso'
  metodoPago: string
  cuotaActual?: number
  totalCuotas?: number
}

export const useGastosStore = defineStore('gastos', () => {
  // --- ESTADO ---
  const gastos = ref<Gasto[]>([])
  const presupuestos = ref<Record<string, number>>({})
  const categorias = ref<Categoria[]>([])
  const usuarios = ref<Usuario[]>([])
  const metodosPago = ref<string[]>([])

  const boardActivo = ref<string | null>(null)
  const infoBoard = ref<any>(null)

  const fechaVisual = ref(new Date())
  const cargando = ref(false)
  const borradorGasto = ref<any>(null)

  let unsubscribes: Function[] = []

  // --- HELPERS ---
  const checkBoard = () => {
    if (!boardActivo.value) throw new Error('No hay tablero seleccionado')
  }

  const getConfigRef = () => {
    checkBoard()
    return doc(db, `boards/${boardActivo.value}/config/general`)
  }

  // --- INICIALIZAR ---
  const inicializar = async () => {
    const authStore = useAuthStore()
    if (!authStore.userProfile || authStore.userProfile.boards.length === 0) return

    const primerBoard = authStore.userProfile.boards[0]
    if (!boardActivo.value && primerBoard) {
      seleccionarBoard(primerBoard)
    }
  }

  // Helper para subscribirse a presupuestos del mes actual
  let presupuestosUnsub: Function | null = null

  const subscribirseAPresupuestos = () => {
    if (!boardActivo.value) return

    // Cancelar subscripción anterior
    if (presupuestosUnsub) {
      presupuestosUnsub()
    }

    const year = fechaVisual.value.getFullYear()
    const month = fechaVisual.value.getMonth()
    const mesKey = `${year}-${String(month + 1).padStart(2, '0')}`

    // Usar subcolección: boards/{id}/presupuestos/{mesKey}
    const presuRef = doc(db, `boards/${boardActivo.value}/presupuestos/${mesKey}`)

    presupuestosUnsub = onSnapshot(presuRef, (snap) => {
      if (snap.exists()) {
        presupuestos.value = snap.data() as Record<string, number>
      } else {
        presupuestos.value = {}
      }
    })

    unsubscribes.push(presupuestosUnsub)
  }

  // --- SELECCIONAR TABLERO ---
  const seleccionarBoard = (boardId: string) => {
    unsubscribes.forEach((u) => u())
    unsubscribes = []
    presupuestosUnsub = null

    boardActivo.value = boardId
    cargando.value = true

    const boardRef = doc(db, 'boards', boardId)
    const gastosRef = collection(db, `boards/${boardId}/gastos`)
    const configRef = doc(db, `boards/${boardId}/config/general`)

    // A. Info del Board
    unsubscribes.push(
      onSnapshot(boardRef, (doc) => {
        infoBoard.value = doc.data()
      }),
    )

    // B. Gastos
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

    // C. Configuración
    unsubscribes.push(
      onSnapshot(configRef, (snap) => {
        if (snap.exists()) {
          const d = snap.data()

          // Filtrar categorías corruptas y migrar las que no tienen tipo
          categorias.value = (d.categorias || [])
            .filter((c: any) => c && c.nombre && c.id && c.icono)
            .map((c: any) => ({
              ...c,
              tipo: c.tipo || 'gasto',
            }))

          const listaUsuarios = d.usuarios || []
          usuarios.value = listaUsuarios
          metodosPago.value = d.metodosPago || []

          // Sincronización de Foto de Perfil
          const miEmail = auth.currentUser?.email
          const miFoto = auth.currentUser?.photoURL

          if (miEmail && miFoto) {
            const yoEnElArray = listaUsuarios.find((u: Usuario) => u.email === miEmail)
            if (yoEnElArray && yoEnElArray.foto !== miFoto) {
              const listaNueva = listaUsuarios.map((u: Usuario) =>
                u.id === yoEnElArray.id ? { ...u, foto: miFoto } : u,
              )
              updateDoc(configRef, { usuarios: listaNueva })
            }
          }
        } else {
          crearDefaults(boardId)
        }
      }),
    )

    // D. Presupuestos del mes actual
    subscribirseAPresupuestos()
  }

  // --- CREAR DEFAULTS ---
  const crearDefaults = async (boardId: string) => {
    const me: Usuario = {
      id: 'yo',
      nombre: 'Yo',
      emoji: 'user',
    }

    // Categorías de GASTO por defecto
    const defaultCatsGasto: Categoria[] = [
      { id: 'super', nombre: 'Supermercado', icono: 'shopping-cart', tipo: 'gasto' },
      { id: 'salidas', nombre: 'Salidas', icono: 'beer', tipo: 'gasto' },
      { id: 'servicios', nombre: 'Servicios', icono: 'zap', tipo: 'gasto' },
      { id: 'transporte', nombre: 'Transporte', icono: 'car', tipo: 'gasto' },
      { id: 'varios', nombre: 'Varios', icono: 'star', tipo: 'gasto' },
    ]

    // Categorías de INGRESO por defecto
    const defaultCatsIngreso: Categoria[] = [
      { id: 'sueldo', nombre: 'Sueldo', icono: 'briefcase', tipo: 'ingreso' },
      { id: 'freelance', nombre: 'Freelance', icono: 'laptop', tipo: 'ingreso' },
      { id: 'regalo', nombre: 'Regalo', icono: 'gift', tipo: 'ingreso' },
      { id: 'venta', nombre: 'Venta', icono: 'tag', tipo: 'ingreso' },
      { id: 'otros_ing', nombre: 'Otros', icono: 'plus-circle', tipo: 'ingreso' },
    ]

    await setDoc(
      doc(db, `boards/${boardId}/config/general`),
      {
        categorias: [...defaultCatsGasto, ...defaultCatsIngreso],
        usuarios: [me],
        metodosPago: ['Efectivo', 'Débito', 'Crédito'],
      },
      { merge: true },
    )
  }

  // --- LIMPIAR DATOS ---
  const limpiarDatos = () => {
    gastos.value = []
    categorias.value = []
    usuarios.value = []
    metodosPago.value = []
    presupuestos.value = {}
    unsubscribes.forEach((u) => u())
    unsubscribes = []
    boardActivo.value = null
    infoBoard.value = null
  }

  // ===========================================
  // CATEGORÍAS - CRUD COMPLETO
  // ===========================================

  const categoriasGasto = computed(() => categorias.value.filter((c) => c.tipo === 'gasto'))
  const categoriasIngreso = computed(() => categorias.value.filter((c) => c.tipo === 'ingreso'))

  const agregarCategoria = async (categoria: Categoria) => {
    checkBoard()
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
    checkBoard()
    const listaNueva = categorias.value.map((c) =>
      c.id === categoriaEditada.id ? categoriaEditada : c,
    )
    await updateDoc(getConfigRef(), { categorias: listaNueva })
  }

  const borrarCategoria = async (categoria: Categoria) => {
    checkBoard()
    const listaNueva = categorias.value.filter((c) => c.id !== categoria.id)
    await updateDoc(getConfigRef(), { categorias: listaNueva })
  }

  // ===========================================
  // USUARIOS
  // ===========================================
  // Los usuarios se agregan automáticamente al tablero mediante invitación
  // No hay CRUD manual de usuarios

  // ===========================================
  // MÉTODOS DE PAGO - CRUD
  // ===========================================

  const agregarMetodo = async (metodo: string) => {
    checkBoard()
    if (metodosPago.value.includes(metodo)) {
      throw new Error('Ya existe ese método de pago')
    }

    const listaNueva = [...metodosPago.value, metodo]
    await updateDoc(getConfigRef(), { metodosPago: listaNueva })
  }

  const borrarMetodo = async (metodo: string) => {
    checkBoard()
    // Proteger métodos fijos
    if (metodo === 'Efectivo' || metodo === 'Crédito') {
      throw new Error('No se pueden eliminar los métodos Efectivo y Crédito')
    }
    const listaNueva = metodosPago.value.filter((m) => m !== metodo)
    await updateDoc(getConfigRef(), { metodosPago: listaNueva })
  }

  // ===========================================
  // PRESUPUESTOS
  // ===========================================

  const actualizarPresupuesto = async (categoria: string, monto: number, anio?: number, mes?: number) => {
    checkBoard()
    // Si no se especifica año/mes, usar la fecha visual actual
    const year = anio ?? fechaVisual.value.getFullYear()
    const month = mes ?? fechaVisual.value.getMonth()
    const mesKey = `${year}-${String(month + 1).padStart(2, '0')}`

    await setDoc(
      doc(db, `boards/${boardActivo.value}/presupuestos/${mesKey}`),
      { [categoria]: monto },
      { merge: true },
    )
  }

  const borrarPresupuesto = async (categoria: string, anio?: number, mes?: number) => {
    checkBoard()
    const year = anio ?? fechaVisual.value.getFullYear()
    const month = mes ?? fechaVisual.value.getMonth()
    const mesKey = `${year}-${String(month + 1).padStart(2, '0')}`

    await setDoc(
      doc(db, `boards/${boardActivo.value}/presupuestos/${mesKey}`),
      { [categoria]: 0 },
      { merge: true },
    )
  }

  const copiarPresupuestoMesAnterior = async () => {
    checkBoard()

    // Mes actual
    const yearActual = fechaVisual.value.getFullYear()
    const monthActual = fechaVisual.value.getMonth()

    // Mes anterior
    const fechaAnterior = new Date(fechaVisual.value)
    fechaAnterior.setMonth(fechaAnterior.getMonth() - 1)
    const yearAnterior = fechaAnterior.getFullYear()
    const monthAnterior = fechaAnterior.getMonth()

    const mesKeyAnterior = `${yearAnterior}-${String(monthAnterior + 1).padStart(2, '0')}`
    const mesKeyActual = `${yearActual}-${String(monthActual + 1).padStart(2, '0')}`

    // Leer presupuesto mes anterior
    const presuAnteriorRef = doc(db, `boards/${boardActivo.value}/presupuestos/${mesKeyAnterior}`)
    const presuAnteriorSnap = await getDoc(presuAnteriorRef)

    if (presuAnteriorSnap.exists()) {
      const presuAnterior = presuAnteriorSnap.data()
      // Copiar al mes actual
      await setDoc(
        doc(db, `boards/${boardActivo.value}/presupuestos/${mesKeyActual}`),
        presuAnterior,
      )
    }
  }

  // ===========================================
  // GASTOS / MOVIMIENTOS - CRUD
  // ===========================================

  const agregarMovimiento = async (
    monto: number,
    descripcion: string,
    pagadoPor: string,
    categoria: string,
    tipo: 'gasto' | 'ingreso',
    metodoPago: string,
    cuotas: number = 1,
    fechaCustom?: Date,
  ) => {
    checkBoard()
    const colRef = collection(db, `boards/${boardActivo.value}/gastos`)
    const fechaBase = fechaCustom || fechaVisual.value

    // Sin cuotas o es ingreso - un solo documento
    if (cuotas <= 1 || tipo === 'ingreso') {
      await addDoc(colRef, {
        monto,
        descripcion,
        pagadoPor: tipo === 'ingreso' ? '' : pagadoPor,
        categoria,
        tipo,
        metodoPago: tipo === 'ingreso' ? '' : metodoPago,
        fecha: Timestamp.fromDate(fechaBase),
      })
      return
    }

    // Con cuotas (solo gastos)
    const montoCuota = Number((monto / cuotas).toFixed(2))
    const batchPromises = []

    for (let i = 0; i < cuotas; i++) {
      const fechaCuota = new Date(fechaBase)
      fechaCuota.setMonth(fechaBase.getMonth() + i)

      batchPromises.push(
        addDoc(colRef, {
          monto: montoCuota,
          descripcion: `${descripcion} (${i + 1}/${cuotas})`,
          pagadoPor,
          categoria,
          tipo: 'gasto',
          metodoPago,
          fecha: Timestamp.fromDate(fechaCuota),
          cuotaActual: i + 1,
          totalCuotas: cuotas,
        }),
      )
    }

    await Promise.all(batchPromises)
  }

  const editarGasto = async (id: string, data: Partial<Gasto>) => {
    checkBoard()
    const dataToSave = { ...data }
    if (data.fecha instanceof Date) {
      ;(dataToSave as any).fecha = Timestamp.fromDate(data.fecha)
    }
    await setDoc(doc(db, `boards/${boardActivo.value}/gastos`, id), dataToSave, { merge: true })
  }

  const borrarGasto = async (id: string) => {
    checkBoard()
    await deleteDoc(doc(db, `boards/${boardActivo.value}/gastos`, id))
  }

  const getGasto = (id: string) => gastos.value.find((g) => g.id === id)

  // ===========================================
  // TABLEROS
  // ===========================================

  const unirseABoard = async (boardId: string) => {
    const authStore = useAuthStore()
    const uid = authStore.user?.uid
    if (!uid) throw new Error('Usuario no autenticado')

    const boardRef = doc(db, 'boards', boardId)
    const boardSnap = await getDoc(boardRef)

    if (!boardSnap.exists()) {
      throw new Error('El código del tablero no existe')
    }

    await updateDoc(boardRef, { members: arrayUnion(uid) })
    await updateDoc(doc(db, 'users', uid), { boards: arrayUnion(boardId) })

    await authStore.cargarPerfilUsuario()
    seleccionarBoard(boardId)
  }

  const crearNuevoBoard = async (nombre: string) => {
    const authStore = useAuthStore()
    const uid = authStore.user?.uid
    if (!uid) throw new Error('Usuario no autenticado')

    if ((authStore.userProfile?.boards.length || 0) >= 2) {
      throw new Error('Límite de 2 tableros alcanzado')
    }

    const newId = `board_${Date.now()}`

    await setDoc(doc(db, 'boards', newId), {
      nombre,
      owner: uid,
      members: [uid],
      createdAt: Timestamp.now(),
    })

    await updateDoc(doc(db, 'users', uid), { boards: arrayUnion(newId) })
    await authStore.cargarPerfilUsuario()
    seleccionarBoard(newId)

    return newId
  }

  const salirDeBoard = async (boardId: string) => {
    const authStore = useAuthStore()
    const uid = authStore.user?.uid
    if (!uid) throw new Error('Usuario no autenticado')

    // Validar que no sea el último tablero
    const cantidadTableros = authStore.userProfile?.boards?.length || 0
    if (cantidadTableros <= 1) {
      throw new Error('No puedes salir de tu último tablero. Debes tener al menos uno.')
    }

    await updateDoc(doc(db, 'boards', boardId), { members: arrayRemove(uid) })
    await updateDoc(doc(db, 'users', uid), { boards: arrayRemove(boardId) })
    await authStore.cargarPerfilUsuario()

    if (boardActivo.value === boardId) {
      const otrosBoards = authStore.userProfile?.boards || []
      const primerBoard = otrosBoards[0]
      if (primerBoard) {
        seleccionarBoard(primerBoard)
      } else {
        limpiarDatos()
      }
    }
  }

  const eliminarBoard = async (boardId: string) => {
    const authStore = useAuthStore()
    const uid = authStore.user?.uid
    if (!uid) throw new Error('Usuario no autenticado')

    // Validar que no sea el último tablero
    const cantidadTableros = authStore.userProfile?.boards?.length || 0
    if (cantidadTableros <= 1) {
      throw new Error('No puedes eliminar tu último tablero. Debes tener al menos uno.')
    }

    const boardRef = doc(db, 'boards', boardId)
    const boardSnap = await getDoc(boardRef)

    if (!boardSnap.exists()) {
      throw new Error('El tablero no existe')
    }

    const boardData = boardSnap.data()

    if (boardData.owner !== uid) {
      throw new Error('Solo el creador puede eliminar el tablero')
    }

    const gastosRef = collection(db, `boards/${boardId}/gastos`)
    const gastosSnap = await getDocs(gastosRef)

    const batch = writeBatch(db)

    gastosSnap.docs.forEach((doc) => {
      batch.delete(doc.ref)
    })

    const configGeneralRef = doc(db, `boards/${boardId}/config/general`)
    const configPresupuestosRef = doc(db, `boards/${boardId}/config/presupuestos`)

    batch.delete(configGeneralRef)
    batch.delete(configPresupuestosRef)
    batch.delete(boardRef)

    await batch.commit()

    for (const memberId of boardData.members || []) {
      try {
        await updateDoc(doc(db, 'users', memberId), { boards: arrayRemove(boardId) })
      } catch (e) {
        console.warn(`No se pudo actualizar usuario ${memberId}`)
      }
    }

    await authStore.cargarPerfilUsuario()

    if (boardActivo.value === boardId) {
      const otrosBoards = authStore.userProfile?.boards || []
      const primerBoard = otrosBoards[0]
      if (primerBoard) {
        seleccionarBoard(primerBoard)
      } else {
        limpiarDatos()
      }
    }
  }

  // ===========================================
  // NAVEGACIÓN Y UTILIDADES
  // ===========================================

  const cambiarMes = (delta: number) => {
    const f = new Date(fechaVisual.value)
    f.setMonth(f.getMonth() + delta)
    fechaVisual.value = f
    // Recargar presupuestos del nuevo mes
    subscribirseAPresupuestos()
  }

  const irAMes = (fecha: Date) => {
    fechaVisual.value = new Date(fecha)
    // Recargar presupuestos del nuevo mes
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
      agrupados[gasto.categoria].total += gasto.monto
      agrupados[gasto.categoria].items.push(gasto)
    })

    return agrupados
  })

  const gastosPorUsuario = computed(() => {
    const agrupados: Record<string, { total: number; items: Gasto[] }> = {}

    gastosDelMes.value.forEach((gasto) => {
      if (!agrupados[gasto.pagadoPor]) {
        agrupados[gasto.pagadoPor] = { total: 0, items: [] }
      }
      agrupados[gasto.pagadoPor].total += gasto.monto
      agrupados[gasto.pagadoPor].items.push(gasto)
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

  const metodoPagoMasUsado = computed(() => {
    const conteo: Record<string, number> = {}

    gastosDelMes.value.forEach((g) => {
      conteo[g.metodoPago] = (conteo[g.metodoPago] || 0) + 1
    })

    let max = 0
    let metodo = ''

    Object.entries(conteo).forEach(([m, count]) => {
      if (count > max) {
        max = count
        metodo = m
      }
    })

    return metodo
  })

  // ===========================================
  // RETURN
  // ===========================================

  return {
    // Estado
    gastos,
    presupuestos,
    categorias,
    usuarios,
    metodosPago,
    cargando,
    fechaVisual,
    borradorGasto,
    boardActivo,
    infoBoard,

    // Inicialización
    inicializar,
    limpiarDatos,
    seleccionarBoard,

    // Categorías
    agregarCategoria,
    editarCategoria,
    borrarCategoria,
    categoriasGasto,
    categoriasIngreso,

    // Métodos de Pago
    agregarMetodo,
    borrarMetodo,

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

    // Tableros
    unirseABoard,
    crearNuevoBoard,
    salirDeBoard,
    eliminarBoard,

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
    gastosPorUsuario,
    estadoPresupuesto,
    categoriaMasUsada,
    metodoPagoMasUsado,
  }
})
