<script setup>
import { computed } from 'vue'
import { BookOpen, CalendarDays, LogOut } from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth'
import { useAdminStore } from '../stores/admin'
import { useRouter } from 'vue-router'
import { formatCairoDateLabel, initialsOf } from '../utils/format'

const auth = useAuthStore()
const admin = useAdminStore()
const router = useRouter()

const navTabs = [
  { key: 'participants', label: 'المشاركون', active: true },
  { key: 'schedule', label: 'جدول القراءات', active: false },
  { key: 'overview', label: 'نظرة عامة', active: false },
  { key: 'reports', label: 'التقارير', active: false },
]

const initials = computed(() => initialsOf(auth.currentUser?.name))

/*
|--------------------------------------------------------------------------
| Date strip — من بيانات الـ backend (GET /admin/dashboard)
|--------------------------------------------------------------------------
*/
const dateLabel = computed(() => {
  const d = admin.dashboard
  if (!d) return ''
  const base = formatCairoDateLabel(d.date)
  // رقم اليوم يتبع اليوم المختار في اللوحة (وليس بالضرورة يوم الماراثون الحالي)
  const dayNumber = admin.selectedDayNumber ?? d.marathon?.currentDay
  const dayPart = dayNumber ? ` • اليوم ${dayNumber} من ${d.marathon?.totalDays ?? 89}` : ''
  return `${base}${dayPart}`
})

/*
|--------------------------------------------------------------------------
| Logout — POST /auth/logout ثم مسح كل بيانات المستخدم
|--------------------------------------------------------------------------
*/
const loggingOut = computed(() => auth.isLoading)

async function handleLogout() {
  if (loggingOut.value) return
  await auth.logout()
  router.push('/login')
}
</script>

<template>
  <div dir="rtl" class="min-h-screen bg-marathon-cream font-arabic">
    <!-- Desktop header -->
    <header class="hidden md:block bg-white border-b border-marathon-border sticky top-0 z-20">
      <div class="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-6">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-marathon-dark flex items-center justify-center shrink-0">
            <BookOpen :size="18" class="text-white" />
          </div>
          <div class="text-right">
            <p class="font-extrabold text-marathon-darker leading-tight">رحلة العهد الجديد</p>
            <p class="text-xs text-marathon-dark/50">لوحة تحكم المشرف</p>
          </div>
        </div>

        <nav class="flex items-center gap-1 bg-marathon-cream rounded-full p-1">
          <button
            v-for="tab in navTabs"
            :key="tab.key"
            type="button"
            class="text-sm font-semibold px-4 py-1.5 rounded-full transition-colors"
            :class="tab.active ? 'bg-marathon-dark text-white' : 'text-marathon-dark/55 hover:text-marathon-dark'"
          >
            {{ tab.label }}
          </button>
        </nav>

        <div class="flex items-center gap-3 shrink-0">
          <span class="text-xs font-semibold bg-marathon-gray text-marathon-dark/60 px-3 py-1.5 rounded-full">مشارك</span>
          <span class="text-xs font-semibold bg-marathon-dark text-white px-3 py-1.5 rounded-full">مشرف</span>
          <div v-if="dateLabel" class="flex items-center gap-1.5 text-xs text-marathon-dark/60 border border-marathon-border rounded-full px-3 py-1.5">
            <CalendarDays :size="13" />
            <span>{{ dateLabel }}</span>
          </div>
          <div class="flex items-center gap-2 pr-2 border-r border-marathon-border">
            <div class="text-right leading-tight">
              <p class="text-xs font-bold text-marathon-darker">{{ auth.currentUser?.name }}</p>
              <p class="text-[11px] text-marathon-dark/45">منسق الرحلة العام</p>
            </div>
            <div class="w-8 h-8 rounded-full bg-marathon-light flex items-center justify-center text-xs font-bold text-marathon-dark">
              {{ initials }}
            </div>
            <button type="button" title="تسجيل الخروج" :disabled="loggingOut" class="text-marathon-dark/40 hover:text-marathon-dark disabled:opacity-50" @click="handleLogout">
              <LogOut :size="16" />
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Mobile header -->
    <header class="md:hidden bg-marathon-cream px-4 pt-5 pb-2">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <button
            type="button"
            title="تسجيل الخروج"
            :disabled="loggingOut"
            class="w-9 h-9 rounded-full border border-marathon-border flex items-center justify-center text-marathon-dark/50 hover:text-marathon-dark disabled:opacity-50"
            @click="handleLogout"
          >
            <LogOut :size="15" />
          </button>
        </div>
        <div class="text-right">
          <p class="font-extrabold text-marathon-darker leading-tight">رحلة العهد الجديد</p>
          <p class="text-xs text-marathon-dark/50">لوحة تحكم المشرف</p>
        </div>
        <div class="w-9 h-9 rounded-full bg-marathon-dark flex items-center justify-center">
          <BookOpen :size="16" class="text-white" />
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6 pb-28 md:pb-10">
      <slot />
    </main>
  </div>
</template>
