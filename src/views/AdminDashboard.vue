<script setup>
import { onMounted, onUnmounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import AdminLayout from '../layouts/AdminLayout.vue'
import {
  Search, Download, ChevronRight, ChevronLeft, Users, CheckCircle2,
  CircleDashed, Clock, Sparkles, ChevronDown, Eye, MessageSquare, Bell,
  AlertCircle, RefreshCw, CalendarDays, BookOpen, Loader2,
} from 'lucide-vue-next'
import { useAdminStore } from '../stores/admin'
import { formatCairoDateLabel, formatCairoTime } from '../utils/format'

const admin = useAdminStore()
const router = useRouter()
const searchInput = ref('')

/* الحالة بنفس مفاتيح الـ backend: completed | partial | not_registered */
const statusTabs = [
  { key: 'all', label: 'الكل' },
  { key: 'completed', label: 'أكملوا اليوم' },
  { key: 'partial', label: 'قراءة جزئية' },
  { key: 'not_registered', label: 'لم يسجلوا بعد' },
]

/* أرقام الملخص من الـ backend (stats: totalUsers, completed, partial, notRegistered + نسب) */
const stats = computed(() => admin.stats)
const marathon = computed(() => admin.marathon)
const community = computed(() => admin.community)

const dateBadge = computed(() => {
  const d = admin.dashboard
  if (!d) return ''
  // رقم اليوم المعروض (يتبع اليوم المختار — لا اليوم الحالي للماراثون)
  const dayPart = admin.selectedDayNumber ? ` اليوم ${admin.selectedDayNumber} من ${d.marathon?.totalDays ?? 89}` : ''
  return `${formatCairoDateLabel(d.date)}${dayPart} (1 أكتوبر – 28 ديسمبر 2026)`
})

/*
|--------------------------------------------------------------------------
| التنقل بين أيام الماراثون (1 → 89)
|--------------------------------------------------------------------------
| - أرقام الأيام وتواريخها كلها من /admin/calendar (مصدر الحقيقة — الخادم).
| - السجلات تُجلب من /admin/dashboard?date=YYYY-MM-DD (يدعمه الـ backend).
| - لا حساب تواريخ في الواجهة — تُعامل التواريخ كتواريخ تقويمية.
*/
const isToday = computed(() => admin.dashboard?.isToday !== false)
const canGoPrev = computed(() => {
  const n = admin.selectedDayNumber
  const b = admin.dayBounds
  return !!n && !!b && n > b.min
})
const canGoNext = computed(() => {
  const n = admin.selectedDayNumber
  const b = admin.dayBounds
  return !!n && !!b && n < b.max
})

const selectedReading = computed(() => admin.dashboard?.selectedDayReading ?? null)
const dayNumberLabel = computed(() =>
  admin.selectedDayNumber ? `اليوم ${admin.selectedDayNumber}` : ''
)

const selectedDayLine = computed(() => {
  const d = admin.dashboard
  if (!d || !admin.selectedDayNumber) return ''
  const parts = [`اليوم المعروض: اليوم ${admin.selectedDayNumber} من ${d.marathon?.totalDays ?? 89}`]
  if (d.selectedDayReading) parts.push(`${d.selectedDayReading} (${d.selectedDayTarget} إصحاحات)`)
  if (d.isToday) parts.push('اليوم الحالي')
  return parts.join(' • ')
})

async function goPrev() {
  if (canGoPrev.value) await admin.selectDay(admin.selectedDayNumber - 1)
}

async function goNext() {
  if (canGoNext.value) await admin.selectDay(admin.selectedDayNumber + 1)
}

async function goToday() {
  await admin.backToToday()
}

/* هل لدى اليوم المعروض أي سجلات قراءة؟ (يحدد عرض حالة "لا سجلات") */
const dayHasRecords = computed(() => admin.participants.some((p) => p.status !== 'not_registered'))

/* التراجع تلقائيًا كل 60 ثانية (كما يوفره الـ backend بالفعل) */
let pollTimer = null
onMounted(() => {
  admin.fetchDashboard()
  admin.fetchCalendar() // حدود الأيام (1 → 89) من الـ backend لتفعيل التنقل
  // التحديث التلقائي يrefresh اليوم المختار حاليًا — لا اليوم الافتراضي —
  // حتى لا يمسح اقتراع الـ 60 ثانية سجلات يوم اختاره المشرف للعرض.
  pollTimer = setInterval(() => admin.fetchDashboard(admin.selectedDate), 60_000)
})
onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})

function applySearch() {
  admin.setFilter('search', searchInput.value)
}

function statusStyle(status) {
  if (status === 'completed') return 'bg-marathon-light text-marathon-dark'
  if (status === 'partial') return 'bg-marathon-peach text-marathon-peachtext'
  return 'bg-marathon-gray text-marathon-dark/50'
}

function statusText(status) {
  if (status === 'completed') return 'مكتمل'
  if (status === 'partial') return 'جزئي'
  return 'لم يسجل'
}

function openDetails(id) {
  router.push(`/admin/participants/${id}`)
}

function retry() {
  admin.fetchDashboard()
}

function pctOf(part, whole) {
  if (!whole) return 0
  return (part / whole) * 100
}

function fmtDate(iso) {
  return formatCairoTime(iso)
}
</script>

<template>
  <AdminLayout>
    <!-- Banner -->
    <div class="rounded-2xl bg-marathon-light/60 border border-marathon-light p-4 md:p-5 mb-5 flex items-start justify-between gap-4 flex-wrap">
      <div class="text-right flex-1 min-w-[240px]">
        <p class="font-extrabold text-marathon-darker mb-1">الإشراف الرعوي والمتابعة المباشرة</p>
        <p class="text-xs text-marathon-dark/55 mb-2">لوحة إدارة الرحلة والمتابعة المباشرة — {{ dateBadge || 'جارٍ التحميل...' }}</p>
        <p v-if="!isToday && selectedDayLine" class="text-xs text-marathon-dark/55 mb-2 flex items-center gap-1.5 justify-end flex-wrap">
          <span>{{ selectedDayLine }}</span>
          <button
            type="button"
            class="inline-flex items-center gap-1 bg-marathon-dark text-white text-[11px] font-bold px-2.5 py-1 rounded-full disabled:opacity-40"
            :disabled="admin.loading"
            @click="goToday"
          >
            <CalendarDays :size="11" />
            <span>العودة لليوم الحالي</span>
          </button>
        </p>
        <p v-if="marathon" class="text-xs text-marathon-dark/45 flex items-center gap-1.5 justify-end">
          <span>هدف اليوم: {{ selectedReading || '—' }} ({{ admin.dashboard?.selectedDayTarget ?? marathon.todayTarget }} إصحاحات) • تحديث تلقائي كل 60 ثانية</span>
        </p>
      </div>
      <div class="w-11 h-11 rounded-xl bg-marathon-dark flex items-center justify-center shrink-0">
        <Sparkles :size="18" class="text-white" />
      </div>
    </div>

    <!-- Mobile day navigator (البديل المدمج للشريط السفلي الموجود في شريط الأدوات) -->
    <div class="md:hidden flex items-center justify-between gap-2 border border-marathon-border rounded-full px-2 py-1.5 mb-4 bg-white">
      <button
        type="button"
        title="اليوم السابق"
        :disabled="!canGoPrev || admin.loading"
        class="w-8 h-8 rounded-full flex items-center justify-center text-marathon-dark/60 hover:text-marathon-dark disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
        @click="goPrev"
      >
        <ChevronRight :size="16" />
      </button>
      <span class="flex-1 text-center text-xs font-bold text-marathon-darker truncate flex items-center justify-center gap-1.5">
        <Loader2 v-if="admin.loading" :size="12" class="animate-spin shrink-0 text-marathon-dark/50" />
        <CalendarDays :size="12" class="shrink-0 text-marathon-dark/50" />
        <span class="truncate">اليوم {{ admin.selectedDayNumber ?? '—' }} • {{ dateBadge.split(' (')[0] }}</span>
      </span>
      <button
        type="button"
        title="اليوم التالي"
        :disabled="!canGoNext || admin.loading"
        class="w-8 h-8 rounded-full flex items-center justify-center text-marathon-dark/60 hover:text-marathon-dark disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
        @click="goNext"
      >
        <ChevronLeft :size="16" />
      </button>
    </div>

    <!-- Error state (with retry) -->
    <div
      v-if="admin.error && !admin.loading && !admin.dashboard"
      class="flex flex-col items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-sm font-semibold rounded-xl px-4 py-5 mb-5 text-center"
    >
      <AlertCircle :size="20" />
      <span>{{ admin.error }}</span>
      <button
        type="button"
        class="mt-1 inline-flex items-center gap-1.5 border border-red-200 rounded-full px-4 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100 transition-colors"
        @click="retry"
      >
        <RefreshCw :size="13" />
        <span>إعادة المحاولة</span>
      </button>
    </div>

    <!-- Loading state -->
    <div v-else-if="admin.loading && !admin.dashboard" class="space-y-3 mb-5">
      <div class="card-surface p-5 animate-pulse">
        <div class="h-4 w-1/3 bg-marathon-gray rounded mb-4"></div>
        <div class="grid grid-cols-4 gap-4">
          <div v-for="n in 4" :key="n" class="h-16 bg-marathon-gray rounded-xl"></div>
        </div>
      </div>
      <div class="card-surface p-5 animate-pulse">
        <div class="h-4 w-1/4 bg-marathon-gray rounded mb-3"></div>
        <div class="h-3 w-3/4 bg-marathon-gray rounded"></div>
      </div>
    </div>

    <!-- Stat cards: desktop -->
    <div v-if="stats" class="hidden md:grid grid-cols-4 gap-4 mb-5">
      <div class="card-surface p-4 flex items-center gap-3">
        <Clock :size="20" class="text-marathon-dark/40" />
        <div class="text-right flex-1">
          <p class="text-xs text-marathon-dark/50 mb-1">بانتظار التسجيل</p>
          <p class="text-xl font-extrabold text-marathon-darker">{{ stats.notRegistered }} متبقين</p>
        </div>
      </div>
      <div class="card-surface p-4">
        <div class="flex items-center gap-3 mb-2">
          <div class="w-8 h-8 rounded-lg bg-marathon-peach flex items-center justify-center shrink-0">
            <CircleDashed :size="15" class="text-marathon-peachtext" />
          </div>
          <div class="text-right flex-1">
            <p class="text-xs text-marathon-dark/50">قراءة جزئية ({{ stats.partial }}/{{ stats.totalUsers }})</p>
            <p class="font-extrabold text-marathon-darker">{{ stats.partial }} قيد المتابعة</p>
          </div>
        </div>
        <div class="h-1.5 rounded-full bg-marathon-gray overflow-hidden mb-1">
          <div class="h-1.5 bg-marathon-peachtext" :style="{ width: (stats.partialPercentage ?? 0) + '%' }"></div>
        </div>
        <p class="text-[11px] text-marathon-dark/40">{{ stats.partialPercentage ?? pctOf(stats.partial, stats.totalUsers).toFixed(1) }}% من المجموعة</p>
      </div>
      <div class="card-surface p-4">
        <div class="flex items-center gap-3 mb-2">
          <div class="w-8 h-8 rounded-lg bg-marathon-light flex items-center justify-center shrink-0">
            <CheckCircle2 :size="15" class="text-marathon-dark" />
          </div>
          <div class="text-right flex-1">
            <p class="text-xs text-marathon-dark/50">أكملوا اليوم ({{ stats.completed }}/{{ stats.totalUsers }})</p>
            <p class="font-extrabold text-marathon-darker">{{ stats.completed }} / {{ stats.totalUsers }} قارئًا</p>
          </div>
        </div>
        <div class="h-1.5 rounded-full bg-marathon-gray overflow-hidden mb-1">
          <div class="h-1.5 bg-marathon-dark" :style="{ width: (stats.completedPercentage ?? 0) + '%' }"></div>
        </div>
        <p class="text-[11px] text-marathon-dark/40">{{ stats.completedPercentage ?? pctOf(stats.completed, stats.totalUsers).toFixed(1) }}% في الموعد المحدد</p>
      </div>
      <div class="card-surface p-4 flex items-center gap-3">
        <Users :size="20" class="text-marathon-dark/40" />
        <div class="text-right flex-1">
          <p class="text-xs text-marathon-dark/50">إجمالي المشاركين</p>
          <p class="text-xl font-extrabold text-marathon-darker">{{ stats.totalUsers }} شابًا وشابة</p>
          <p class="text-[11px] text-marathon-dark/40">مشاركون في الرحلة</p>
        </div>
      </div>
    </div>

    <!-- Stat cards: mobile -->
    <div v-if="stats" class="grid grid-cols-2 gap-3 mb-5 md:hidden">
      <div class="card-surface p-3">
        <span class="inline-block text-[11px] font-bold bg-marathon-light text-marathon-dark px-2 py-0.5 rounded-md mb-2">{{ (stats.completedPercentage ?? pctOf(stats.completed, stats.totalUsers)).toFixed(0) }}%</span>
        <p class="text-xl font-extrabold text-marathon-darker">{{ stats.completed }}</p>
        <p class="text-xs text-marathon-dark/50">أكملوا اليوم</p>
      </div>
      <div class="card-surface p-3">
        <span class="inline-block text-[11px] font-bold bg-marathon-gray text-marathon-dark/60 px-2 py-0.5 rounded-md mb-2">
          <Users :size="11" class="inline" />
        </span>
        <p class="text-xl font-extrabold text-marathon-darker">{{ stats.totalUsers }}</p>
        <p class="text-xs text-marathon-dark/50">إجمالي المشاركين</p>
      </div>
      <div class="card-surface p-3">
        <span class="inline-block text-[11px] font-bold bg-marathon-gray text-marathon-dark/60 px-2 py-0.5 rounded-md mb-2">
          {{ (stats.notRegisteredPercentage ?? pctOf(stats.notRegistered, stats.totalUsers)).toFixed(0) }}%
        </span>
        <p class="text-xl font-extrabold text-marathon-darker">{{ stats.notRegistered }}</p>
        <p class="text-xs text-marathon-dark/50">لم يسجلوا بعد</p>
      </div>
      <div class="card-surface p-3">
        <span class="inline-block text-[11px] font-bold bg-marathon-peach text-marathon-peachtext px-2 py-0.5 rounded-md mb-2">
          {{ (stats.partialPercentage ?? pctOf(stats.partial, stats.totalUsers)).toFixed(0) }}%
        </span>
        <p class="text-xl font-extrabold text-marathon-darker">{{ stats.partial }}</p>
        <p class="text-xs text-marathon-dark/50">قراءة جزئية</p>
      </div>
    </div>

    <!-- Cumulative progress -->
    <div v-if="community" class="card-surface p-4 md:p-5 mb-5">
      <div class="flex items-start justify-between gap-4 flex-wrap">
        <div class="text-right flex-1 min-w-[240px]">
          <p class="font-bold text-marathon-darker mb-2">الإنجاز التراكمي للعهد الجديد</p>
          <p class="text-xs text-marathon-dark/55">
            المستهدف: {{ community.totalPossibleChapters.toLocaleString('en-US') }} إصحاحًا إجماليًا
            ({{ community.totalUsers }} مشارك × 260 إصحاحًا) •
            {{ community.totalChaptersRead.toLocaleString('en-US') }} من {{ community.totalPossibleChapters.toLocaleString('en-US') }} إصحاحًا تم قراءتها جماعيًا
          </p>
        </div>
        <Sparkles :size="18" class="text-marathon-dark/40" />
      </div>
      <div class="h-1.5 rounded-full bg-marathon-gray overflow-hidden my-3">
        <div class="h-1.5 bg-marathon-dark" :style="{ width: community.communityPercentage + '%' }"></div>
      </div>
      <div class="flex items-center justify-between text-xs text-marathon-dark/50 flex-wrap gap-2">
        <span class="inline-flex items-center gap-1.5 bg-marathon-light text-marathon-dark font-semibold px-2.5 py-1 rounded-full">{{ community.communityPercentage }}% إنجاز جماعي</span>
        <span>متوسط المجموعة: {{ community.totalUsers ? (community.totalChaptersRead / community.totalUsers).toFixed(1) : 0 }} إصحاحًا لكل مشارك</span>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="flex flex-col gap-3 mb-4">
      <div class="flex items-center gap-2 flex-wrap">
        <button type="button" class="hidden md:flex items-center gap-2 border border-marathon-border rounded-full px-4 py-2 text-sm font-semibold text-marathon-dark/70 hover:bg-marathon-gray/40">
          <Download :size="15" />
          <span>تصدير التقرير (Excel / CSV)</span>
        </button>
        <div class="hidden md:flex items-center gap-2 border border-marathon-border rounded-full px-4 py-2 text-sm text-marathon-dark/70">
          <button
            type="button"
            title="اليوم السابق"
            :disabled="!canGoPrev || admin.loading"
            class="disabled:opacity-30 disabled:cursor-not-allowed hover:text-marathon-dark transition-colors"
            @click="goPrev"
          >
            <ChevronRight :size="15" />
          </button>
          <span class="flex items-center gap-1.5"><Clock :size="13" />{{ dateBadge }}</span>
          <button
            type="button"
            title="اليوم التالي"
            :disabled="!canGoNext || admin.loading"
            class="disabled:opacity-30 disabled:cursor-not-allowed hover:text-marathon-dark transition-colors"
            @click="goNext"
          >
            <ChevronLeft :size="15" />
          </button>
        </div>
        <div class="relative flex-1 min-w-[220px]">
          <Search :size="15" class="absolute right-3.5 top-1/2 -translate-y-1/2 text-marathon-dark/35" />
          <input
            v-model="searchInput"
            type="text"
            placeholder="ابحث باسم المشارك، البريد، أو كلمات الملاحظة..."
            class="w-full bg-white border border-marathon-border rounded-full pr-9 pl-4 py-2 text-sm outline-none focus:border-marathon-dark/30"
            @input="applySearch"
          />
        </div>
      </div>

      <div class="flex items-center gap-2 flex-wrap justify-between">
        <div class="flex items-center gap-2 flex-wrap">
          <button
            v-for="tab in statusTabs"
            :key="tab.key"
            type="button"
            class="text-xs font-semibold px-3.5 py-2 rounded-full border transition-colors"
            :class="admin.filters.status === tab.key
              ? 'bg-marathon-dark text-white border-marathon-dark'
              : 'bg-white text-marathon-dark/60 border-marathon-border'"
            @click="admin.setFilter('status', tab.key)"
          >
            {{ tab.label }} ({{ admin.statusCounts[tab.key] ?? admin.statusCounts.all }})
          </button>
        </div>
        <button type="button" class="hidden md:flex items-center gap-1.5 text-xs font-semibold text-marathon-dark/60 border border-marathon-border rounded-full px-3.5 py-2">
          <span>الترتيب حسب: أحدث وقت تسجيل</span>
          <ChevronDown :size="13" />
        </button>
      </div>
    </div>

    <!-- Desktop table -->
    <div class="hidden md:block card-surface overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-right text-xs text-marathon-dark/45 border-b border-marathon-border">
            <th class="py-3 px-4 font-semibold">المشارك</th>
            <th class="py-3 px-4 font-semibold">مستهدف اليوم</th>
            <th class="py-3 px-4 font-semibold">قراءة اليوم</th>
            <th class="py-3 px-4 font-semibold">الحالة</th>
            <th class="py-3 px-4 font-semibold">التقدم الكلي</th>
            <th class="py-3 px-4 font-semibold">المتبقي</th>
            <th class="py-3 px-4 font-semibold">أوقات التواجد</th>
            <th class="py-3 px-4 font-semibold">تأمل وملاحظة اليوم</th>
            <th class="py-3 px-4 font-semibold">إجراءات سريعة</th>
          </tr>
        </thead>
        <tbody>
          <!-- Empty state: لا سجلات لهذا اليوم (ليست بيانات يوم آخر) -->
          <tr v-if="!admin.loading && admin.filteredParticipants.length === 0">
            <td colspan="9" class="py-10 text-center text-sm text-marathon-dark/50">
              لا توجد سجلات قراءة لهذا اليوم بعد.
            </td>
          </tr>
          <tr v-for="p in admin.pagedParticipants" :key="p.id" class="border-b border-marathon-border last:border-0 hover:bg-marathon-cream/60">
            <td class="py-3 px-4">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-full bg-marathon-light flex items-center justify-center text-xs font-bold text-marathon-dark shrink-0">
                  {{ p.initials }}
                </div>
                <div>
                  <p class="font-semibold text-marathon-darker">{{ p.name }}</p>
                  <p class="text-xs text-marathon-dark/40">{{ p.email }}</p>
                </div>
              </div>
            </td>
            <td class="py-3 px-4 text-marathon-dark/70">{{ p.targetToday || '—' }}</td>
            <td class="py-3 px-4 font-semibold text-marathon-darker">{{ p.chaptersRead }} / {{ p.chaptersRequired }}</td>
            <td class="py-3 px-4">
              <span class="text-xs font-semibold px-2.5 py-1 rounded-full" :class="statusStyle(p.status)">
                {{ statusText(p.status) }}
              </span>
            </td>
            <td class="py-3 px-4">
              <div class="flex items-center gap-2 w-28">
                <div class="h-1.5 flex-1 rounded-full bg-marathon-gray overflow-hidden">
                  <div class="h-1.5 bg-marathon-dark" :style="{ width: p.percent + '%' }"></div>
                </div>
                <span class="text-xs text-marathon-dark/50 shrink-0">{{ p.totalRead }}/{{ p.totalChapters }}</span>
              </div>
            </td>
            <td class="py-3 px-4 text-marathon-dark/60">{{ p.remaining }} إصحاح</td>
            <td class="py-3 px-4 text-xs text-marathon-dark/50">
              <span v-if="p.checkIn">دخول {{ fmtDate(p.checkIn) }}<span v-if="p.savedAt"> • حفظ {{ fmtDate(p.savedAt) }}</span></span>
              <span v-else>—</span>
            </td>
            <td class="py-3 px-4 text-xs text-marathon-dark/50 max-w-[180px] truncate">{{ p.note || '—' }}</td>
            <td class="py-3 px-4">
              <div class="flex items-center gap-1.5">
                <button type="button" title="عرض التفاصيل" class="w-8 h-8 rounded-full border border-marathon-border flex items-center justify-center text-marathon-dark/50 hover:bg-marathon-gray/40" @click="openDetails(p.id)">
                  <Eye :size="14" />
                </button>
                <button type="button" title="إرسال تذكير" class="w-8 h-8 rounded-full border border-marathon-border flex items-center justify-center text-marathon-dark/50 hover:bg-marathon-gray/40">
                  <Bell :size="14" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <!-- Empty state: يوم بلا سجلات (مثل الأيام المستقبلية) -->
      <div
        v-if="!dayHasRecords && !admin.loading"
        class="px-4 py-3 bg-marathon-cream/70 border-t border-marathon-border text-center text-xs text-marathon-dark/50"
      >
        لا توجد سجلات قراءة لهذا اليوم بعد — جميع المشاركين في حالة «لم يسجل».
      </div>

      <div class="flex items-center justify-between px-4 py-3 text-xs text-marathon-dark/45 border-t border-marathon-border">
        <span>
          سجلات {{ selectedReading ? `اليوم ${admin.selectedDayNumber} (${selectedReading})` : `اليوم ${admin.selectedDayNumber ?? ''}` }} •
          عرض {{ admin.pagedParticipants.length }} من أصل {{ admin.filteredParticipants.length }} مشاركًا •
          تزامن تلقائي كل 60 ثانية
        </span>
        <div class="flex items-center gap-1">
          <button
            type="button"
            class="px-2 py-1 rounded hover:bg-marathon-gray/40 disabled:opacity-40"
            :disabled="admin.page <= 1"
            @click="admin.setPage(admin.page - 1)"
          >السابق</button>
          <button
            v-for="n in admin.pageCount"
            :key="n"
            type="button"
            class="w-7 h-7 rounded-full"
            :class="n === admin.page ? 'bg-marathon-dark text-white' : 'hover:bg-marathon-gray/40'"
            @click="admin.setPage(n)"
          >{{ n }}</button>
          <button
            type="button"
            class="px-2 py-1 rounded hover:bg-marathon-gray/40 disabled:opacity-40"
            :disabled="admin.page >= admin.pageCount"
            @click="admin.setPage(admin.page + 1)"
          >التالي</button>
        </div>
      </div>
    </div>

    <!-- Mobile participant cards -->
    <div class="md:hidden space-y-3">
      <div v-for="p in admin.pagedParticipants" :key="p.id" class="card-surface p-4">
        <div class="flex items-start justify-between mb-2">
          <span class="text-xs font-semibold px-2.5 py-1 rounded-full" :class="statusStyle(p.status)">
            {{ statusText(p.status) }} ({{ p.chaptersRead }} من {{ p.chaptersRequired }})
          </span>
          <div class="flex items-center gap-2">
            <div class="text-right">
              <p class="font-bold text-marathon-darker text-sm">{{ p.name }}</p>
              <p class="text-[11px] text-marathon-dark/40">{{ p.email }}</p>
            </div>
            <div class="w-8 h-8 rounded-full bg-marathon-light flex items-center justify-center text-xs font-bold text-marathon-dark shrink-0">
              {{ p.initials }}
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between text-xs text-marathon-dark/55 mb-2">
          <span>{{ p.percent }}%</span>
          <span>المطلوب: {{ p.targetToday }}</span>
        </div>
        <div class="h-1.5 rounded-full bg-marathon-gray overflow-hidden mb-2">
          <div class="h-1.5 bg-marathon-dark" :style="{ width: p.percent + '%' }"></div>
        </div>
        <div class="flex items-center justify-between text-xs text-marathon-dark/50 mb-2">
          <span>متبقي {{ p.remaining }} إصحاح</span>
          <span>إجمالي الرحلة: {{ p.totalRead }} من {{ p.totalChapters }}</span>
        </div>

        <p v-if="p.checkIn" class="flex items-center gap-1.5 text-xs text-marathon-dark/45 mb-2">
          <Clock :size="12" />
          <span>الدخول: {{ fmtDate(p.checkIn) }}<template v-if="p.savedAt"> • الحفظ: {{ fmtDate(p.savedAt) }}</template></span>
        </p>

        <p v-if="p.note" class="flex items-start gap-1.5 text-xs text-marathon-dark/55 bg-marathon-cream rounded-xl p-2.5 mb-2">
          <MessageSquare :size="13" class="shrink-0 mt-0.5" />
          <span>«{{ p.note }}»</span>
        </p>

        <div class="flex items-center gap-2 mt-2">
          <button
            v-if="p.status === 'not_registered'"
            type="button"
            class="btn-primary-dark flex-1 py-2 text-xs flex items-center justify-center gap-1.5"
          >
            <Bell :size="13" />
            <span>إرسال تذكير بالمحبة</span>
          </button>
          <button type="button" class="flex-1 border border-marathon-border rounded-full py-2 text-xs font-semibold text-marathon-dark/70 flex items-center justify-center gap-1.5" @click="openDetails(p.id)">
            <span>عرض التفاصيل الكاملة</span>
            <ChevronLeft :size="13" />
          </button>
        </div>
      </div>

      <!-- Empty state (mobile): يوم بلا سجلات -->
      <div
        v-if="!dayHasRecords && !admin.loading && admin.participants.length > 0"
        class="card-surface p-4 text-center text-xs text-marathon-dark/50"
      >
        لا توجد سجلات قراءة لهذا اليوم بعد — جميع المشاركين في حالة «لم يسجل».
      </div>
      <div v-if="admin.participants.length === 0 && !admin.loading && !admin.error" class="card-surface p-6 text-center text-sm text-marathon-dark/50">
        لا يوجد مشاركون مسجلون بعد.
      </div>
    </div>
  </AdminLayout>
</template>
