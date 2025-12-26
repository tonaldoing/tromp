import { ref } from 'vue'
import { defineStore } from 'pinia'
import { auth, db, googleProvider } from '../firebase'
import { signInWithPopup, signOut, onAuthStateChanged, type User } from 'firebase/auth'
import { doc, getDoc, setDoc, onSnapshot, Timestamp } from 'firebase/firestore'
import { useRouter } from 'vue-router'
import { useGastosStore } from './gastos'

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  photoURL: string
  boards: string[]
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const userProfile = ref<UserProfile | null>(null)
  const cargandoAuth = ref(true)
  const router = useRouter()

  let unsubscribeProfile: Function | null = null

  // Cargar/recargar perfil del usuario (exportada para uso externo)
  const cargarPerfilUsuario = async () => {
    if (!user.value) return null

    const userRef = doc(db, 'users', user.value.uid)
    const docSnap = await getDoc(userRef)

    if (docSnap.exists()) {
      userProfile.value = docSnap.data() as UserProfile
      return userProfile.value
    }

    return null
  }

  // Escuchar cambios en tiempo real del perfil
  const escucharPerfil = (uid: string) => {
    if (unsubscribeProfile) {
      unsubscribeProfile()
    }

    const userRef = doc(db, 'users', uid)
    unsubscribeProfile = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        userProfile.value = doc.data() as UserProfile
      }
    })
  }

  // Crear board por defecto para nuevo usuario
  const crearBoardInicial = async (firebaseUser: User): Promise<string> => {
    const nuevoBoardId = `board_${Date.now()}_${Math.floor(Math.random() * 1000)}`

    // Crear el Board
    await setDoc(doc(db, 'boards', nuevoBoardId), {
      nombre: 'Mis Gastos',
      owner: firebaseUser.uid,
      members: [firebaseUser.uid],
      createdAt: Timestamp.now(),
    })

    // Crear config inicial del board con categorías de gasto e ingreso
    await setDoc(doc(db, `boards/${nuevoBoardId}/config/general`), {
      categorias: [
        // Categorías de gasto
        { id: 'super', nombre: 'Supermercado', icono: 'shopping-cart', tipo: 'gasto' },
        { id: 'salidas', nombre: 'Salidas', icono: 'beer', tipo: 'gasto' },
        { id: 'servicios', nombre: 'Servicios', icono: 'zap', tipo: 'gasto' },
        { id: 'transporte', nombre: 'Transporte', icono: 'car', tipo: 'gasto' },
        { id: 'varios', nombre: 'Varios', icono: 'star', tipo: 'gasto' },
        // Categorías de ingreso
        { id: 'sueldo', nombre: 'Sueldo', icono: 'briefcase', tipo: 'ingreso' },
        { id: 'freelance', nombre: 'Freelance', icono: 'laptop', tipo: 'ingreso' },
        { id: 'regalo', nombre: 'Regalo', icono: 'gift', tipo: 'ingreso' },
        { id: 'venta', nombre: 'Venta', icono: 'tag', tipo: 'ingreso' },
        { id: 'otros_ing', nombre: 'Otros', icono: 'plus-circle', tipo: 'ingreso' },
      ],
      usuarios: [
        {
          id: firebaseUser.uid,
          nombre: firebaseUser.displayName || 'Yo',
          emoji: 'user',
          email: firebaseUser.email,
          foto: firebaseUser.photoURL,
        },
      ],
      metodosPago: ['Efectivo', 'Débito', 'Crédito'],
    })

    return nuevoBoardId
  }

  // Sincronizar usuario de Google con Firestore
  const sincronizarUsuario = async (firebaseUser: User) => {
    const userRef = doc(db, 'users', firebaseUser.uid)
    const docSnap = await getDoc(userRef)

    if (docSnap.exists()) {
      // Usuario existente
      const perfil = docSnap.data() as UserProfile

      // Ya no creamos un board automáticamente
      // Si no tiene boards, el router lo redirigirá a /onboarding
      if (!perfil.boards) {
        perfil.boards = []
      }

      userProfile.value = perfil

      // Escuchar cambios futuros
      escucharPerfil(firebaseUser.uid)
    } else {
      // NUEVO USUARIO - Crear perfil SIN board
      console.log('Nuevo usuario, creando perfil sin tablero inicial...')

      const newProfile: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || 'Usuario',
        photoURL: firebaseUser.photoURL || '',
        boards: [], // Sin tableros - será redirigido a onboarding
      }

      await setDoc(userRef, newProfile)
      userProfile.value = newProfile

      // Escuchar cambios futuros
      escucharPerfil(firebaseUser.uid)
    }
  }

  // Login con Google
  const login = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider)
      return result.user
    } catch (error) {
      console.error('Error login:', error)
      throw error
    }
  }

  // Logout
  const logout = async () => {
    if (unsubscribeProfile) {
      unsubscribeProfile()
      unsubscribeProfile = null
    }

    const gastosStore = useGastosStore()
    gastosStore.limpiarDatos()

    await signOut(auth)
    user.value = null
    userProfile.value = null
    router.push('/login')
  }

  // Inicializador (Se llama en App.vue)
  const inicializarAuth = (): Promise<User | null> => {
    return new Promise((resolve) => {
      onAuthStateChanged(auth, async (currentUser) => {
        user.value = currentUser

        if (currentUser) {
          await sincronizarUsuario(currentUser)
        } else {
          userProfile.value = null
        }

        cargandoAuth.value = false
        resolve(currentUser)
      })
    })
  }

  // Actualizar datos visuales del perfil
  const actualizarPerfil = async (nombre: string, foto: string) => {
    if (!user.value) return

    await setDoc(
      doc(db, 'users', user.value.uid),
      {
        displayName: nombre,
        photoURL: foto,
      },
      { merge: true },
    )
  }

  return {
    user,
    userProfile,
    cargandoAuth,
    login,
    logout,
    inicializarAuth,
    actualizarPerfil,
    cargarPerfilUsuario,
  }
})
