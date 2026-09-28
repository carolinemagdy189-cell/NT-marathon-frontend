import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { TOKEN_KEY } from '../services/api'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/Login.vue'),
    meta: { public: true, layout: 'blank' },
  },
  {
    path: '/signup',
    name: 'signup',
    component: () => import('../views/SignUp.vue'),
    meta: { public: true, layout: 'blank' },
  },
  {
    path: '/home',
    name: 'home',
    component: () => import('../views/Home.vue'),
    meta: { requiresAuth: true, layout: 'user' },
  },
  {
    path: '/history',
    name: 'history',
    component: () => import('../views/History.vue'),
    meta: { requiresAuth: true, layout: 'user' },
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('../views/Profile.vue'),
    meta: { requiresAuth: true, layout: 'user' },
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('../views/AdminDashboard.vue'),
    meta: { requiresAuth: true, requiresAdmin: true, layout: 'admin' },
  },
  {
    path: '/admin/participants/:id',
    name: 'admin-participant-details',
    component: () => import('../views/AdminParticipantDetails.vue'),
    meta: { requiresAuth: true, requiresAdmin: true, layout: 'admin' },
  },
  {
    path: '/',
    redirect: '/home',
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  // New pages start at the top; browser back/forward restores position.
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0 }
  },
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  // Make sure a persisted session is validated against /auth/me before the
  // first guarded navigation (refresh on a protected page keeps the user in).
  if (!auth.isAuthenticated && localStorage.getItem(TOKEN_KEY)) {
    await auth.fetchCurrentUser()
  }

  // Public auth pages: send already-authenticated users to their home view.
  if (to.meta.public && auth.isAuthenticated) {
    return { path: auth.homeRoute }
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  // Admin routes must check the role explicitly rather than only
  // hiding the admin link in navigation. The backend enforces this too.
  if (to.meta.requiresAdmin && !auth.isAdmin) {
    return { path: auth.homeRoute }
  }

  /*
   * Role priority over marathon state: the admin is NEVER shown the normal
   * user dashboard (which displays the "marathon not started" state before
   * 2026-10-01). Admins land on the admin dashboard before, during and
   * after the marathon. Checked AFTER the role/role guard above.
   */
  if (auth.isAdmin && to.name === 'home') {
    return { path: '/admin' }
  }

  return true
})

export default router
