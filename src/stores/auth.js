import { defineStore } from 'pinia'
import api, { TOKEN_KEY, USER_KEY, apiErrorMessage } from '../services/api'
import { useReadingStore } from './reading'
import { useAdminStore } from './admin'

/**
 * Authentication store — the ONLY place that owns the JWT + current user.
 *
 * Backend contract (all wrapped in { success, data }):
 *   POST /auth/register { name, email, password, confirmPassword } -> { token, user }
 *   POST /auth/login    { email, password }                        -> { token, user }
 *   GET  /auth/me                                                  -> user
 *   POST /auth/logout                                              -> placeholder (stateless JWT)
 *
 * The token lives in localStorage (ntm_token); the cached user copy in
 * localStorage is a convenience only — /auth/me is always the authority.
 * Passwords are NEVER persisted anywhere.
 */
export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem(TOKEN_KEY) || null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  }),

  getters: {
    // Kept as an alias so existing views using `auth.currentUser` keep working.
    currentUser: (state) => state.user,
    isAdmin: (state) => state.user?.role === 'admin',
    /** Where an authenticated user should land after login. Backend role decides. */
    homeRoute: (state) => (state.user?.role === 'admin' ? '/admin' : '/home'),
  },

  actions: {
    _setSession({ token, user }) {
      this.token = token
      this.user = user
      this.isAuthenticated = !!token && !!user
      localStorage.setItem(TOKEN_KEY, token)
      // Cached copy only — refreshed from /auth/me on startup.
      localStorage.setItem(USER_KEY, JSON.stringify(user))
    },

    _clearSession() {
      this.token = null
      this.user = null
      this.isAuthenticated = false
      this.error = null
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      // User data isolation: wipe any previous user's reading/admin state
      // before another account loads its own data.
      useReadingStore().$reset()
      useAdminStore().$reset()
    },

    /**
     * POST /auth/login — expects data: { token, user: { ..., role } }.
     * The role returned by the backend decides the redirect target
     * (/home for users, /admin for admins); see the homeRoute getter.
     */
    async login({ email, password }) {
      this.isLoading = true
      this.error = null
      try {
        const { data } = await api.post('/auth/login', { email, password })
        this._setSession(data.data)
        return this.user
      } catch (err) {
        this.error = apiErrorMessage(err)
        throw err
      } finally {
        this.isLoading = false
      }
    },

    /**
     * POST /auth/register — creates a normal user account (the backend
     * ignores any role sent here; it always assigns 'user') and
     * auto-authenticates by returning { token, user }.
     */
    async register({ name, email, password, confirmPassword }) {
      this.isLoading = true
      this.error = null
      try {
        const { data } = await api.post('/auth/register', {
          name,
          email,
          password,
          confirmPassword,
        })
        this._setSession(data.data)
        return this.user
      } catch (err) {
        this.error = apiErrorMessage(err)
        throw err
      } finally {
        this.isLoading = false
      }
    },

    /**
     * GET /auth/me — the backend is the source of truth for the session.
     * Called on app start (router guard) to validate the persisted token.
     */
    async fetchCurrentUser() {
      const token = localStorage.getItem(TOKEN_KEY)
      if (!token) {
        this.isAuthenticated = false
        return null
      }
      this.token = token

      this.isLoading = true
      try {
        const { data } = await api.get('/auth/me')
        this._setSession({ token, user: data.data })
        return this.user
      } catch {
        // 401s are already cleared globally by the axios interceptor; any
        // other failure means we cannot confirm the session.
        this._clearSession()
        return null
      } finally {
        this.isLoading = false
      }
    },

    /** Alias kept for existing callers. */
    async restoreSession() {
      return this.fetchCurrentUser()
    },

    /** POST /auth/logout, then drop token + all user-specific state. */
    async logout() {
      try {
        await api.post('/auth/logout')
      } catch {
        // The JWT is stateless: local cleanup below is what actually logs out.
      }
      this._clearSession()
    },
  },
})
