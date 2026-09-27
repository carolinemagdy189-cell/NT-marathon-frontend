import axios from 'axios'

/**
 * Central axios instance. Base URL comes from the environment
 * (VITE_API_BASE_URL, e.g. http://localhost:5000/api) — never hardcode it.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

export const TOKEN_KEY = 'ntm_token'
export const USER_KEY = 'ntm_user'

// Attach JWT automatically to every authenticated request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// React to auth failures (expired/invalid token) in one place.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      // Redirect to login for expired/invalid sessions, except on the
      // public auth pages themselves (they handle the failure inline).
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/signup')) {
        window.location.assign('/login')
      }
    }
    return Promise.reject(error)
  }
)

/**
 * The backend always answers with { success, data } or { success, message }.
 * These helpers give every store the same friendly error mapping.
 */
export function apiErrorMessage(err) {
  const status = err?.response?.status

  if (err?.response) {
    const message = err.response.data?.message
    if (status === 401) return message || 'Invalid email or password.'
    if (status === 403) return message || "You don't have permission to do that."
    if (status === 409) return message || 'This record already exists.'
    if (status === 404) return message || 'Not found.'
    if (status === 400 || status === 422) return message || 'Please check your information and try again.'
    if (status >= 500) return message || 'Server error. Please try again later.'
    return message || 'Something went wrong. Please try again.'
  }

  if (err?.request) return 'Unable to connect to the server. Please try again.'
  return err?.message || 'Something went wrong. Please try again.'
}

export default api
