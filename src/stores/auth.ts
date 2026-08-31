import { ref } from 'vue'
import { defineStore } from 'pinia'
import { auth, db, googleProvider } from '../firebase'
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'
import { doc, getDoc, setDoc, onSnapshot, type Unsubscribe } from 'firebase/firestore'
import { FirebaseError } from 'firebase/app'
import { useRouter } from 'vue-router'
import { useGastosStore } from './gastos'

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  photoURL: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const userProfile = ref<UserProfile | null>(null)
  const cargandoAuth = ref(true)
  const router = useRouter()

  let unsubscribeProfile: Unsubscribe | null = null

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

  const sincronizarUsuario = async (firebaseUser: User) => {
    const userRef = doc(db, 'users', firebaseUser.uid)
    const docSnap = await getDoc(userRef)

    if (docSnap.exists()) {
      userProfile.value = docSnap.data() as UserProfile
    } else {
      // Nuevo usuario - crear perfil y config por defecto
      const newProfile: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || 'Usuario',
        photoURL: firebaseUser.photoURL || '',
      }

      await setDoc(userRef, newProfile)

      // Crear config por defecto con categorías iniciales
      await setDoc(doc(db, `users/${firebaseUser.uid}/config/general`), {
        categorias: [
          { id: 'super', nombre: 'Supermercado', icono: 'shopping-cart', tipo: 'gasto' },
          { id: 'salidas', nombre: 'Salidas', icono: 'beer', tipo: 'gasto' },
          { id: 'servicios', nombre: 'Servicios', icono: 'zap', tipo: 'gasto' },
          { id: 'transporte', nombre: 'Transporte', icono: 'car', tipo: 'gasto' },
          { id: 'varios', nombre: 'Varios', icono: 'star', tipo: 'gasto' },
          { id: 'sueldo', nombre: 'Sueldo', icono: 'briefcase', tipo: 'ingreso' },
          { id: 'freelance', nombre: 'Freelance', icono: 'laptop', tipo: 'ingreso' },
          { id: 'regalo', nombre: 'Regalo', icono: 'gift', tipo: 'ingreso' },
          { id: 'venta', nombre: 'Venta', icono: 'tag', tipo: 'ingreso' },
          { id: 'otros_ing', nombre: 'Otros', icono: 'plus-circle', tipo: 'ingreso' },
        ],
      })

      userProfile.value = newProfile
    }

    escucharPerfil(firebaseUser.uid)
  }

  const login = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider)
      return result.user
    } catch (error) {
      const isPopupBlocked =
        error instanceof FirebaseError &&
        (error.code === 'auth/popup-blocked' ||
          error.code === 'auth/cancelled-popup-request' ||
          error.message.includes('popup'))

      if (isPopupBlocked) {
        await signInWithRedirect(auth, googleProvider)
        return null
      }

      throw error
    }
  }

  const manejarRedirectResult = async () => {
    try {
      const result = await getRedirectResult(auth)
      if (result) return result.user
    } catch (error) {
      console.error('Error manejando redirect:', error)
      throw error
    }
    return null
  }

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

  // Promesa compartida: App.vue y el guard del router pueden llamar a
  // inicializarAuth a la vez, pero el listener se registra una sola vez
  let promesaAuth: Promise<User | null> | null = null

  const inicializarAuth = (): Promise<User | null> => {
    if (promesaAuth) return promesaAuth

    promesaAuth = new Promise(async (resolve) => {
      try {
        await manejarRedirectResult()
      } catch (error) {
        console.error('Error procesando redirect:', error)
      }

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

    return promesaAuth
  }

  return {
    user,
    userProfile,
    cargandoAuth,
    login,
    logout,
    inicializarAuth,
    manejarRedirectResult,
  }
})
