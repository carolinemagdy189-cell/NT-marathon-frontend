import { defineStore } from 'pinia'
import api, { apiErrorMessage } from '../services/api'

/**
 * Reading store — wraps /api/readings/* and /api/progress/*.
 *
 * All schedule/progress logic lives in the backend; this store only stores
 * and exposes the responses (single source of truth).
 *
 * Backend shapes (always { success, data }):
 *   GET  /readings/today   -> { marathonState, message?, reading: null | { dayNumber, date, books, chapters, title, totalDays }, todayStatus, todayTarget, todayReflection, savedAt, progress }
 *   POST /readings/today   -> { dayNumber, chaptersRead, assignedChapters, status, reflection, savedAt, completedAt }
 *   GET  /readings/timeline-> { marathonState, days: [{ dayNumber, date, books, chapters, title, isPast, isToday, isFuture, locked, status, chaptersRead, assignedChapters }] }
 *   GET  /readings/history -> { history: [{ dayNumber, date, books, title, assignedChapters, chaptersRead, status, reflection, savedAt, completedAt }] }
 *   GET  /readings/history/:dayNumber -> { day: {...}, record: {...} | null, status }
 *   GET  /progress         -> { totalChapters, chaptersRead, chaptersRemaining, journeyPercentage, currentDay, totalDays, elapsedDays, completedDays, partialDays, missedDays, commitmentPercentage }
 *   GET  /progress/books   -> { books: [{ book, chaptersRead, totalChapters, percentage }] }
 *   GET  /progress/next    -> { marathonState, nextDay: { dayNumber, date, title, books, chapters } | null, message? }
 */
export const useReadingStore = defineStore('reading', {
  state: () => ({
    today: null, // raw /readings/today payload (marathonState, reading, status…)
    progress: null, // raw /progress payload
    timeline: [], // /readings/timeline days
    bookProgress: [], // /progress/books
    nextDay: null, // /progress/next payload
    historyRecords: [],
    loading: false,
    submitting: false,
    error: null,
    lastSubmission: null,
  }),

  actions: {
    /** GET /readings/today — full home-dashboard payload. */
    async fetchToday() {
      this.loading = true
      this.error = null
      try {
        const { data } = await api.get('/readings/today')
        this.today = data.data
      } catch (err) {
        this.error = apiErrorMessage(err)
      } finally {
        this.loading = false
      }
    },

    /** GET /progress — overall journey progress (backend-owned numbers). */
    async fetchProgress() {
      try {
        const { data } = await api.get('/progress')
        this.progress = data.data
      } catch (err) {
        this.error = apiErrorMessage(err)
      }
    },

    /** GET /readings/timeline — all 89 days with per-user status + locks. */
    async fetchTimeline() {
      try {
        const { data } = await api.get('/readings/timeline')
        this.timeline = data.data.days || []
      } catch (err) {
        this.error = apiErrorMessage(err)
      }
    },

    /** GET /progress/books — per-book progress list. */
    async fetchBookProgress() {
      try {
        const { data } = await api.get('/progress/books')
        this.bookProgress = data.data.books || []
      } catch (err) {
        this.error = apiErrorMessage(err)
      }
    },

    /** GET /progress/next — "غدًا" preview. */
    async fetchNextDay() {
      try {
        const { data } = await api.get('/progress/next')
        this.nextDay = data.data
      } catch (err) {
        this.error = apiErrorMessage(err)
      }
    },

    /** GET /readings/history — the user's submitted records, newest first. */
    async fetchHistory() {
      this.loading = true
      this.error = null
      try {
        const { data } = await api.get('/readings/history')
        this.historyRecords = data.data.history || []
      } catch (err) {
        this.error = apiErrorMessage(err)
      } finally {
        this.loading = false
      }
    },

    /** GET /readings/history/:dayNumber — one past day's detail. */
    async fetchHistoryByDay(dayNumber) {
      const { data } = await api.get(`/readings/history/${dayNumber}`)
      return data.data
    },

    /**
     * POST /readings/today — { chaptersRead, reflection }.
     * Reflection is required (frontend validates non-empty after trim;
     * the backend remains the final authority). One submission per day —
     * a duplicate returns 409 which is rethrown for the view to display.
     */
    async submitToday({ chaptersRead, reflection }) {
      this.submitting = true
      this.error = null
      try {
        const { data } = await api.post('/readings/today', {
          chaptersRead,
          reflection: reflection.trim(),
        })
        this.lastSubmission = data.data

        // Refresh today's state + progress from the backend (rule: no fake
        // local state — always re-read the source of truth).
        await Promise.all([this.fetchToday(), this.fetchProgress()])

        return { success: true, data: this.lastSubmission }
      } catch (err) {
        this.error = apiErrorMessage(err)
        // Duplicate submission (409): refresh today so the UI shows the
        // already-registered state instead of trusting local flags.
        if (err?.response?.status === 409) {
          await this.fetchToday()
        }
        throw err
      } finally {
        this.submitting = false
      }
    },
  },
})
