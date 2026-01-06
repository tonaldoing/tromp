import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import AddView from '../views/AddView.vue'
import StatsView from '../views/StatsView.vue'
import EditView from '../views/EditView.vue'
import BudgetView from '../views/BudgetView.vue'
import CategoriesView from '../views/CategoriesView.vue'
import MethodsView from '../views/MethodsView.vue'
import LoginView from '../views/LoginView.vue'
import ProfileView from '../views/ProfileView.vue'
import OnboardingView from '../views/OnboardingView.vue'
import IngresosView from '../views/IngresosView.vue'
import GastosView from '../views/GastosView.vue'

// IMPORTAR EL STORE DE AUTH
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login', name: 'login', component: LoginView },
    { path: '/onboarding', name: 'onboarding', component: OnboardingView },
    { path: '/', name: 'home', component: HomeView },
    { path: '/add', name: 'add', component: AddView },
    { path: '/stats', name: 'stats', component: StatsView },
    { path: '/edit/:id', name: 'edit', component: EditView },
    { path: '/budget', name: 'budget', component: BudgetView },
    { path: '/categories', name: 'categories', component: CategoriesView },
    { path: '/methods', name: 'methods', component: MethodsView },
    { path: '/profile', name: 'profile', component: ProfileView },
    { path: '/ingresos', name: 'ingresos', component: IngresosView },
    { path: '/gastos', name: 'gastos', component: GastosView },
  ],
})

// --- AQUÍ ESTÁ LA CLAVE ---
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // 1. Si no sabemos si está logueado, esperamos a Firebase
  if (authStore.cargandoAuth) {
    await authStore.inicializarAuth()
  }

  // 2. Si NO hay usuario y quiere ir a cualquier lado que NO sea login...
  if (!authStore.user && to.name !== 'login') {
    // ... ¡AL CALABOZO! (Al login)
    next({ name: 'login' })
  } else {
    // 3. Si ya está logueado y quiere ir al login, lo mandamos al home
    if (authStore.user && to.name === 'login') {
      next({ name: 'home' })
    } else {
      // 4. Si está logueado pero NO tiene tableros y no está en onboarding...
      if (
        authStore.user &&
        authStore.userProfile &&
        (!authStore.userProfile.boards || authStore.userProfile.boards.length === 0) &&
        to.name !== 'onboarding'
      ) {
        // Lo mandamos al onboarding para que cree o se una a uno
        next({ name: 'onboarding' })
      } else {
        // Pase usted
        next()
      }
    }
  }
})

export default router
