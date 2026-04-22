import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import AddView from '../views/AddView.vue'
import StatsView from '../views/StatsView.vue'
import EditView from '../views/EditView.vue'
import BudgetView from '../views/BudgetView.vue'
import CategoriesView from '../views/CategoriesView.vue'
import LoginView from '../views/LoginView.vue'

import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login', name: 'login', component: LoginView },
    { path: '/', name: 'home', component: HomeView },
    { path: '/add', name: 'add', component: AddView },
    { path: '/stats', name: 'stats', component: StatsView },
    { path: '/edit/:id', name: 'edit', component: EditView },
    { path: '/budget', name: 'budget', component: BudgetView },
    { path: '/categories', name: 'categories', component: CategoriesView },
  ],
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  if (authStore.cargandoAuth) {
    await authStore.inicializarAuth()
  }

  if (!authStore.user && to.name !== 'login') {
    next({ name: 'login' })
  } else if (authStore.user && to.name === 'login') {
    next({ name: 'home' })
  } else {
    next()
  }
})

export default router
