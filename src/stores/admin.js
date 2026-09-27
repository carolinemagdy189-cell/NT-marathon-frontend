import { defineStore } from 'pinia'
import api, { apiErrorMessage } from '../services/api'
import { initialsOf } from '../utils/format'

/**
 * Admin store — wraps /api/admin/* (JWT + role=admin enforced by the backend).
 *
 * Backend shapes (always { success, data }):
 *   GET /admin/dashboard          -> { date, isToday, marathon: {...}, stats: { totalUsers, completed, partial, notRegistered, ...Percentage }, dayNumber, marathonActive, selectedDayTarget, selectedDayReading, community: { totalUsers, totalChaptersRead, totalPossibleChapters, communityPercentage }, users: [row] }
 *   GET /admin/users              -> { date, dayNumber, page, limit, totalUsers, returned, summary, users: [row] }
 *   GET /admin/users/:id          -> { user, progress, history: [...] }
 *   GET /admin/readings?date=     -> { date, dayNumber, marathonActive, todayTarget, todayReading, summary, readings: [row] }
 *   GET /admin/progress           -> { community, users: [{ id, name, email, lastLoginAt, progress }] }
 *   GET /admin/calendar           -> { days: [{ dayNumber, date, title, chapters, completed, partial }] }
 *
 * Row shape (per user, for a selected date):
 *   { id, name, email, today: { dayNumber, target, reading, chaptersRead, status, reflection, savedAt, completedAt }, overall: { chaptersRead, totalChapters, remaining, percentage }, loginAt, lastLoginAt }
 *   status is "completed" | "partial" | "not_registered" (backend-computed).
 */
export const useAdminStore = defineStore('admin', {
  state: () => ({
    dashboard: null, // raw /admin/dashboard payload
    calendar: [], // /admin/calendar days
    users: [], // per-date user rows (from dashboard/users responses)
    selectedUser: null, // raw /admin/users/:id payload
    readingsDate: null, // raw /admin/readings payload (per-date rows)
    progressOverview: null, // raw /admin/progress payload
    filters: { status: 'all', search: '' },
    page: 1,
    pageSize: 10,
    totalUsers: 0,
    loading: false,
    error: null,
    /*
     | اليوم المختار في لوحة المشرف (YYYY-MM-DD).
     | null = الافتراضي (يوم الماراثون الحالي — سلوك اللوحة الأصلي).
     | القيمة تأتي دائمًا من /admin/calendar — لا حساب تواريخ في الواجهة.
     */
    selectedDate: null,
  }),

  getters: {
    /** Summary stats block from the dashboard response. */
    stats: (state) => state.dashboard?.stats ?? null,

    /** Marathon block (currentDay, totalDays, todayTarget, todayReading…). */
    marathon: (state) => state.dashboard?.marathon ?? null,

    /**
     * رقم اليوم المعروض حاليًا:
     * - selectedDate محدد → نأخذ dayNumber من تقويم الـ backend (مصدر الحقيقة).
     * - selectedDate null → اليوم الافتراضي كما يرجعه الـ dashboard نفسه.
     */
    selectedDayNumber(state) {
      if (state.selectedDate) {
        return state.calendar.find((d) => d.date === state.selectedDate)?.dayNumber ?? null
      }
      return state.dashboard?.dayNumber ?? state.dashboard?.marathon?.currentDay ?? null
    },

    /** حدود الماراثون من تقويم الـ backend (1 → 89) — لا أرقام ثابتة في الواجهة. */
    dayBounds(state) {
      if (!state.calendar.length) return null
      return {
        min: state.calendar[0].dayNumber,
        max: state.calendar[state.calendar.length - 1].dayNumber,
      }
    },

    /** Community cumulative progress block. */
    community: (state) => state.dashboard?.community ?? null,

    /** User rows mapped to the shape the existing admin UI renders. */
    participants: (state) =>
      state.users.map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        initials: initialsOf(row.name),
        status: row.today?.status ?? 'not_registered',
        targetToday: row.today?.reading ?? null, // e.g. "متى 1-3"
        chaptersRequired: row.today?.target ?? 0,
        chaptersRead: row.today?.chaptersRead ?? 0,
        note: row.today?.reflection || '',
        savedAt: row.today?.savedAt ?? null, // when today's reading was saved
        checkIn: row.loginAt ?? null, // first login of the Cairo day
        lastLoginAt: row.lastLoginAt ?? null,
        totalRead: row.overall?.chaptersRead ?? 0,
        totalChapters: row.overall?.totalChapters ?? 0,
        remaining: row.overall?.remaining ?? 0,
        percent: row.overall?.percentage ?? 0,
      })),

    filteredParticipants(state) {
      let list = this.participants
      if (state.filters.status !== 'all') {
        list = list.filter((p) => p.status === state.filters.status)
      }
      if (state.filters.search.trim()) {
        const q = state.filters.search.trim().toLowerCase()
        list = list.filter(
          (p) => p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q)
        )
      }
      return list
    },

    pageCount() {
      return Math.max(1, Math.ceil(this.filteredParticipants.length / this.pageSize))
    },

    pagedParticipants() {
      const start = (this.page - 1) * this.pageSize
      return this.filteredParticipants.slice(start, start + this.pageSize)
    },

    statusCounts(state) {
      const counts = { all: this.participants.length, completed: 0, partial: 0, not_registered: 0 }
      for (const p of this.participants) {
        if (counts[p.status] !== undefined) counts[p.status] += 1
      }
      void state
      return counts
    },

    /**
     * Selected participant for the details page: profile + TODAY's row
     * (from the per-date users list) + overall progress + full history
     * (from GET /admin/users/:id).
     */
    selectedParticipant(state) {
      if (!state.selectedUser) return null
      const row = this.participants.find((p) => p.id === state.selectedUser.user?._id) || null
      const progress = state.selectedUser.progress ?? null
      const history = state.selectedUser.history ?? []

      return {
        id: state.selectedUser.user?._id,
        name: state.selectedUser.user?.name ?? row?.name ?? '',
        email: state.selectedUser.user?.email ?? row?.email ?? '',
        initials: initialsOf(state.selectedUser.user?.name ?? row?.name ?? ''),
        role: state.selectedUser.user?.role,
        lastLoginAt: state.selectedUser.user?.lastLoginAt ?? null,
        // Today's block comes from the per-date row (backend-computed status).
        status: row?.status ?? 'not_registered',
        targetToday: row?.targetToday ?? null,
        chaptersRead: row?.chaptersRead ?? 0,
        chaptersRequired: row?.chaptersRequired ?? 0,
        checkIn: row?.checkIn ?? null,
        checkOut: row?.savedAt ?? null,
        note: row?.note ?? '',
        // Overall progress comes from the authoritative /admin/users/:id calc.
        totalRead: progress?.chaptersRead ?? 0,
        totalChapters: progress?.totalChapters ?? 0,
        remaining: progress?.chaptersRemaining ?? 0,
        percent: progress?.journeyPercentage ?? 0,
        completedDays: progress?.completedDays ?? 0,
        partialDays: progress?.partialDays ?? 0,
        missedDays: progress?.missedDays ?? 0,
        commitmentPercentage: progress?.commitmentPercentage ?? 0,
        history,
      }
    },
  },

  actions: {
    /** GET /admin/dashboard — optional ?date=YYYY-MM-DD (previous days). */
    async fetchDashboard(dateKey = null) {
      this.loading = true
      this.error = null
      try {
        const { data } = await api.get('/admin/dashboard', {
          params: dateKey ? { date: dateKey } : {},
        })
        this.dashboard = data.data
        this.users = data.data.users || []
      } catch (err) {
        this.error = apiErrorMessage(err)
      } finally {
        this.loading = false
      }
    },

    /** GET /admin/users — paginated/searchable user table (?search&status&page&limit&date). */
    async fetchUsers({ search, status, page = 1, limit = 50, date } = {}) {
      this.loading = true
      this.error = null
      try {
        const params = { page, limit }
        if (search) params.search = search
        if (status && status !== 'all') params.status = status
        if (date) params.date = date
        const { data } = await api.get('/admin/users', { params })
        this.users = data.data.users || []
        this.totalUsers = data.data.totalUsers ?? this.users.length
      } catch (err) {
        this.error = apiErrorMessage(err)
      } finally {
        this.loading = false
      }
    },

    /** GET /admin/users/:id — profile + overall progress + full history. */
    async fetchUser(id) {
      this.loading = true
      this.error = null
      this.selectedUser = null
      try {
        const { data } = await api.get(`/admin/users/${id}`)
        this.selectedUser = data.data
      } catch (err) {
        this.error = apiErrorMessage(err)
      } finally {
        this.loading = false
      }
    },

    /** Alias kept for the existing detail view call. */
    async fetchParticipantDetails(id) {
      await this.fetchUser(id)
      return this.selectedParticipant
    },

    /** GET /admin/readings?date= — flat per-user reading rows for one date. */
    async fetchReadings(dateKey = null) {
      this.error = null
      try {
        const { data } = await api.get('/admin/readings', {
          params: dateKey ? { date: dateKey } : {},
        })
        this.readingsDate = data.data
      } catch (err) {
        this.error = apiErrorMessage(err)
      }
    },

    /** GET /admin/progress — community stats + per-user overall progress. */
    async fetchProgressOverview() {
      this.error = null
      try {
        const { data } = await api.get('/admin/progress')
        this.progressOverview = data.data
      } catch (err) {
        this.error = apiErrorMessage(err)
      }
    },

    /** GET /admin/calendar — the 89 days with per-day activity counts. */
    async fetchCalendar() {
      this.error = null
      try {
        const { data } = await api.get('/admin/calendar')
        this.calendar = data.data.days || []
      } catch (err) {
        this.error = apiErrorMessage(err)
      }
    },

    setFilter(key, value) {
      this.filters[key] = value
      this.page = 1
    },

    setPage(value) {
      this.page = Math.min(Math.max(1, value), this.pageCount)
    },

    /**
     * اختيار يوم ماراثون (1..89 — مؤمّن بحدود /admin/calendar) ثم جلب سجلاته.
     * الطلب الوحيد المطلوب: GET /admin/dashboard?date=YYYY-MM-DD — الـ backend
     * هو من يربط التاريخ بالمستخدمين وسجلاتهم (isolation by day من الخادم).
     */
    async selectDay(dayNumber) {
      const bounds = this.dayBounds
      if (!bounds) return

      const clamped = Math.min(Math.max(dayNumber, bounds.min), bounds.max)
      const day = this.calendar.find((d) => d.dayNumber === clamped)
      if (!day) return

      this.selectedDate = day.date
      await this.fetchDashboard(day.date)
    },

    /** الرجوع إلى اليوم الحالي (السلوك الافتراضي للوحة — selectedDate = null). */
    async backToToday() {
      this.selectedDate = null
      await this.fetchDashboard()
    },
  },
})
