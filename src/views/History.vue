<script setup>
import { ref, computed, onMounted } from 'vue'
import UserLayout from '../layouts/UserLayout.vue'
import {
  User, BookOpen, RadioTower, CalendarDays, TrendingUp, ShieldCheck,
  Bookmark, Clock, Share2, ChevronLeft, Flag, MessageCircle, AlertCircle, Loader2,
} from 'lucide-vue-next'
import { useReadingStore } from '../stores/reading'
import { formatCairoDateLabel, formatCairoShortDate, formatCairoTime, formatCairoDateTime } from '../utils/format'

const reading = useReadingStore()
const activeFilter = ref('all')

/*
|--------------------------------------------------------------------------
| تفاصيل يوم محدد (GET /readings/history/:dayNumber)
|--------------------------------------------------------------------------
*/
const dayDetail = ref(null)
const dayDetailLoading = ref(false)
const dayDetailError = ref('')

async function openDayDetail(dayNumber) {
  dayDetail.value = null
  dayDetailError.value = ''
  dayDetailLoading.value = true
  try {
    dayDetail.value = await reading.fetchHistoryByDay(dayNumber)
  } catch (err) {
    dayDetailError.value = err?.response?.data?.message || 'تعذر تحميل تفاصيل اليوم. حاول مرة أخرى.'
  } finally {
    dayDetailLoading.value = false
  }
}

function closeDayDetail() {
  dayDetail.value = null
  dayDetailError.value = ''
}

onMounted(() => {
  /*
  | كل البيانات من الـ backend — لا يوجد أي سجل أو ملخص محلي:
  |  - GET /readings/history  -> historyRecords
  |  - GET /progress          -> progress (نفس أرقام الصفحة الرئيسية)
  |  - GET /progress/books    -> bookProgress (تقدم الأسفار)
  |  - GET /progress/next     -> nextDay (محطة الغد)
  */
  reading.fetchHistory()
  reading.fetchProgress()
  reading.fetchBookProgress()
  reading.fetchNextDay()
})

const historySummary = computed(() => {
  if (!reading.progress) return null
  const p = reading.progress
  return {
    daysCompleted: p.completedDays,
    totalDays: p.totalDays,
    chaptersRead: p.chaptersRead,
    totalChapters: p.totalChapters,
    percent: p.journeyPercentage,
    commitment: p.commitmentPercentage,
  }
})

const currentBook = computed(() => {
  // السفر الحالي = أول سفر لم يكتمل بعد من قائمة /progress/books
  return reading.bookProgress.find((b) => b.percentage < 100) ?? null
})

const filters = computed(() => {
  const records = reading.historyRecords
  return [
    { key: 'all', label: 'جميع السجلات', count: records.length },
    { key: 'completed', label: 'مكتمل', count: records.filter((r) => r.status === 'completed').length },
    { key: 'partial', label: 'قراءة جزئية', count: records.filter((r) => r.status === 'partial').length },
    { key: 'notes', label: 'ملاحظات', count: records.filter((r) => r.reflection).length },
  ]
})

const filteredRecords = computed(() => {
  const records = reading.historyRecords
  if (activeFilter.value === 'all') return records
  if (activeFilter.value === 'notes') return records.filter((r) => r.reflection)
  return records.filter((r) => r.status === activeFilter.value)
})

function statusLabel(status) {
  return status === 'completed' ? 'مكتمل' : 'قيد المتابعة'
}

/* إعادة المحاولة عند فشل التحميل */
function retry() {
  reading.fetchHistory()
  reading.fetchProgress()
  reading.fetchBookProgress()
  reading.fetchNextDay()
}
</script>

<template>
  <UserLayout>
    <!-- Header -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2 text-marathon-darker">
        <BookOpen :size="17" />
        <span class="text-sm font-bold">رحلة العهد الجديد</span>
      </div>
      <div class="w-9 h-9 rounded-full bg-marathon-dark flex items-center justify-center">
        <User :size="17" class="text-white" />
      </div>
    </div>
    <div class="flex items-center justify-between mb-5">
      <div class="inline-flex items-center gap-1.5 bg-marathon-light text-marathon-dark text-xs font-bold px-3 py-1.5 rounded-full">
        <span>سجل المسيرة اليومية</span>
        <BookOpen :size="13" />
      </div>
      <div class="flex items-center gap-1.5 text-xs text-marathon-dark/50">
        <span>تزامن مباشر</span>
        <RadioTower :size="13" />
      </div>
    </div>

    <h1 class="text-2xl font-extrabold text-marathon-darker mb-2">سجل قراءتي اليومي</h1>
    <p v-if="historySummary" class="text-sm text-marathon-dark/60 leading-relaxed mb-5">
      متابعة مسيرتك الروحية خلال الـ {{ historySummary.totalDays }} يومًا في العهد الجديد
      (1 أكتوبر – 28 ديسمبر 2026)
    </p>

    <!-- Error state -->
    <div
      v-if="reading.error && !reading.loading && reading.historyRecords.length === 0"
      class="flex flex-col items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-sm font-semibold rounded-xl px-4 py-4 mb-5 text-center"
    >
      <AlertCircle :size="18" />
      <span>{{ reading.error }}</span>
      <button
        type="button"
        class="mt-1 border border-red-200 rounded-full px-4 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100 transition-colors"
        @click="retry"
      >
        إعادة المحاولة
      </button>
    </div>

    <!-- Loading state -->
    <div v-else-if="reading.loading && reading.historyRecords.length === 0" class="space-y-3 mb-5">
      <div v-for="n in 3" :key="n" class="card-surface p-4 animate-pulse">
        <div class="h-4 w-1/3 bg-marathon-gray rounded mb-3"></div>
        <div class="h-3 w-2/3 bg-marathon-gray rounded mb-2"></div>
        <div class="h-3 w-1/2 bg-marathon-gray rounded"></div>
      </div>
    </div>

    <template v-else>
      <!-- Stats -->
      <div v-if="historySummary" class="grid grid-cols-3 gap-2 mb-5">
        <div class="card-surface p-3 text-center">
          <div class="flex items-center justify-center gap-1 text-marathon-dark/50 text-xs mb-1">
            <span>الأيام</span>
            <CalendarDays :size="13" />
          </div>
          <p class="text-lg font-extrabold text-marathon-darker">{{ historySummary.daysCompleted }} / {{ historySummary.totalDays }}</p>
          <p class="text-[11px] text-marathon-dark/40 flex items-center justify-center gap-1 mt-0.5">
            <span class="w-1 h-1 rounded-full bg-marathon-dark/40"></span> وفق المخطط
          </p>
        </div>
        <div class="card-surface p-3 text-center">
          <div class="flex items-center justify-center gap-1 text-marathon-dark/50 text-xs mb-1">
            <span>الإصحاحات</span>
            <BookOpen :size="13" />
          </div>
          <p class="text-lg font-extrabold text-marathon-darker">{{ historySummary.chaptersRead }} / {{ historySummary.totalChapters }}</p>
          <p class="text-[11px] text-marathon-dark/40 flex items-center justify-center gap-1 mt-0.5">
            <TrendingUp :size="11" /> {{ historySummary.percent }}% منجز
          </p>
        </div>
        <div class="card-surface p-3 text-center">
          <div class="flex items-center justify-center gap-1 text-marathon-dark/50 text-xs mb-1">
            <span>الالتزام</span>
            <ShieldCheck :size="13" />
          </div>
          <p class="text-lg font-extrabold text-marathon-darker">{{ historySummary.commitment }}%</p>
          <p class="text-[11px] text-marathon-dark/40 flex items-center justify-center gap-1 mt-0.5">
            بلا انقطاع
          </p>
        </div>
      </div>

      <!-- Empty state -->
      <div
        v-if="reading.historyRecords.length === 0"
        class="card-surface p-6 mb-5 text-center"
      >
        <BookOpen :size="24" class="text-marathon-dark/30 mx-auto mb-2" />
        <p class="font-bold text-marathon-darker mb-1">لا توجد سجلات قراءة بعد</p>
        <p class="text-xs text-marathon-dark/50">
          سجّل قراءة اليوم من الصفحة الرئيسية ليظهر سجلك هنا.
        </p>
      </div>

      <!-- Current journey card -->
      <div v-if="currentBook" class="rounded-2xl bg-marathon-dark p-4 mb-5 text-white">
        <div class="flex items-center justify-between mb-2">
          <Bookmark :size="18" class="opacity-80" />
          <div class="text-right">
            <p class="text-xs opacity-70 mb-0.5">المسيرة الحالية</p>
            <p class="font-bold">{{ currentBook.book }}</p>
          </div>
        </div>
        <div class="inline-flex items-center gap-1.5 bg-white/15 text-xs font-semibold px-3 py-1 rounded-full mb-3">
          <span>{{ currentBook.chaptersRead }} / {{ currentBook.totalChapters }} إصحاح</span>
          <Clock :size="12" />
        </div>
        <div class="h-1.5 rounded-full bg-white/20 mb-2 overflow-hidden">
          <div class="h-1.5 rounded-full bg-white" :style="{ width: currentBook.percentage + '%' }"></div>
        </div>
        <div class="flex items-center justify-between text-xs opacity-75">
          <span>{{ currentBook.percentage }}% من سفر {{ currentBook.book }}</span>
          <span>من قائمة تقدم الأسفار</span>
        </div>
      </div>

      <!-- Filter tabs -->
      <div class="flex items-center gap-2 overflow-x-auto pb-1 mb-4 -mx-1 px-1" style="scrollbar-width:none">
        <button
          v-for="f in filters"
          :key="f.key"
          type="button"
          class="shrink-0 text-xs font-semibold px-3.5 py-2 rounded-full transition-colors"
          :class="activeFilter === f.key ? 'bg-marathon-dark text-white' : 'bg-white border border-marathon-border text-marathon-dark/60'"
          @click="activeFilter = f.key"
        >
          {{ f.label }} ({{ f.count }})
        </button>
      </div>

      <!-- Records (اضغط على اليوم لعرض تفاصيله من /readings/history/:dayNumber) -->
      <div class="space-y-3 mb-5">
        <div
          v-for="rec in filteredRecords"
          :key="rec.dayNumber"
          class="card-surface p-4 cursor-pointer hover:border-marathon-dark/30 transition-colors"
          role="button"
          tabindex="0"
          @click="openDayDetail(rec.dayNumber)"
          @keydown.enter="openDayDetail(rec.dayNumber)"
        >
          <div class="flex items-start justify-between mb-3">
            <div
              class="text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1"
              :class="rec.status === 'completed' ? 'bg-marathon-light text-marathon-dark' : 'bg-marathon-peach text-marathon-peachtext'"
            >
              <span>{{ rec.chaptersRead }} / {{ rec.assignedChapters }} إصحاحات</span>
              <span>• {{ statusLabel(rec.status) }}</span>
            </div>
            <div class="text-right">
              <p class="font-bold text-marathon-darker flex items-center gap-1.5 justify-end">
                اليوم {{ rec.dayNumber }} • {{ formatCairoShortDate(rec.date) }}
                <span class="w-1.5 h-1.5 rounded-full" :class="rec.status === 'completed' ? 'bg-marathon-dark' : 'bg-marathon-peachtext'"></span>
              </p>
            </div>
          </div>

          <div class="flex items-center justify-between text-xs text-marathon-dark/55 mb-3">
            <div class="flex items-center gap-1.5">
              <Clock :size="13" />
              <span v-if="rec.completedAt">أُكملت {{ formatCairoTime(rec.completedAt) }}</span>
              <span v-else-if="rec.savedAt">سُجلت {{ formatCairoTime(rec.savedAt) }}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span>{{ rec.title }}</span>
              <BookOpen :size="13" />
            </div>
          </div>

          <template v-if="rec.status === 'partial'">
            <div class="flex items-center gap-2 mb-1">
              <button type="button" class="w-9 h-9 rounded-full border border-marathon-border flex items-center justify-center text-marathon-dark/50 shrink-0">
                <Share2 :size="15" />
              </button>
              <button type="button" class="btn-primary-dark flex-1 py-2.5 flex items-center justify-center gap-1.5 text-sm">
                <span>استكمال القراءة غدًا </span>
                <ChevronLeft :size="15" />
              </button>
            </div>
          </template>

          <div v-if="rec.reflection" class="mt-3">
            <p class="flex items-center justify-center gap-1.5 text-xs text-marathon-dark/50 mb-1.5">
              <span>التأمل الروحي</span>
              <MessageCircle :size="13" />
            </p>
            <p class="text-sm text-marathon-darker/80 italic leading-relaxed text-center">«{{ rec.reflection }}»</p>
          </div>
        </div>
      </div>

      <!-- Day detail dialog (GET /readings/history/:dayNumber) -->
      <Teleport to="body">
        <div
          v-if="dayDetailLoading || dayDetail || dayDetailError"
          class="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4"
          @click.self="closeDayDetail"
        >
          <div class="card-surface w-full max-w-sm p-5">
            <div v-if="dayDetailLoading" class="flex items-center justify-center gap-2 text-marathon-dark/60 py-8">
              <Loader2 :size="18" class="animate-spin" />
              <span class="text-sm">جارٍ تحميل تفاصيل اليوم...</span>
            </div>

            <template v-else-if="dayDetail">
              <div class="flex items-center justify-between mb-3">
                <button
                  type="button"
                  class="text-marathon-dark/40 hover:text-marathon-dark text-lg leading-none"
                  aria-label="إغلاق"
                  @click="closeDayDetail"
                >
                  ×
                </button>
                <p class="font-bold text-marathon-darker">
                  اليوم {{ dayDetail.day.dayNumber }} — {{ dayDetail.day.title }}
                </p>
              </div>
              <p class="text-xs text-marathon-dark/50 mb-3 text-left">
                {{ formatCairoDateLabel(dayDetail.day.date) }} • {{ dayDetail.day.chapters }} إصحاحات
              </p>

              <div
                v-if="dayDetail.record"
                class="bg-marathon-cream rounded-xl p-3"
              >
                <div class="flex items-center justify-between mb-2">
                  <span
                    class="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    :class="dayDetail.record.status === 'completed' ? 'bg-marathon-light text-marathon-dark' : 'bg-marathon-peach text-marathon-peachtext'"
                  >
                    {{ dayDetail.record.chaptersRead }} / {{ dayDetail.record.assignedChapters }} إصحاحات •
                    {{ dayDetail.record.status === 'completed' ? 'مكتمل' : 'قيد المتابعة' }}
                  </span>
                  <span class="text-[11px] text-marathon-dark/45">حالتك</span>
                </div>
                <p v-if="dayDetail.record.reflection" class="text-sm text-marathon-darker/80 italic leading-relaxed">
                  «{{ dayDetail.record.reflection }}»
                </p>
                <p v-if="dayDetail.record.savedAt" class="text-[11px] text-marathon-dark/40 mt-2">
                  سُجلت {{ formatCairoDateTime(dayDetail.record.savedAt) }}
                  <template v-if="dayDetail.record.completedAt"> • أُكملت {{ formatCairoTime(dayDetail.record.completedAt) }}</template>
                </p>
              </div>

              <div v-else class="bg-marathon-gray/60 rounded-xl p-4 text-center">
                <p class="text-sm font-semibold text-marathon-dark/60">لم تسجل قراءة هذا اليوم</p>
                <p class="text-xs text-marathon-dark/40 mt-1">الحالة: غير مسجلة</p>
              </div>
            </template>

            <div v-else-if="dayDetailError" class="text-center py-6">
              <p class="text-sm text-red-600 font-semibold mb-3">{{ dayDetailError }}</p>
              <button
                type="button"
                class="border border-marathon-border rounded-full px-4 py-1.5 text-xs font-bold text-marathon-dark/70 hover:bg-marathon-gray/40 transition-colors"
                @click="closeDayDetail"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      </Teleport>

      <!-- Upcoming teaser (GET /progress/next) -->
      <div v-if="reading.nextDay?.nextDay" class="rounded-2xl bg-marathon-light/60 border border-marathon-light p-4 flex items-start gap-3">
        <div class="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0">
          <Flag :size="16" class="text-marathon-dark" />
        </div>
        <div class="flex-1">
          <p class="font-bold text-marathon-darker mb-1">محطة الغد الروحية — ميل جديد</p>
          <p class="text-xs text-marathon-dark/60 leading-relaxed mb-2">
            اليوم {{ reading.nextDay.nextDay.dayNumber }} يشمل {{ reading.nextDay.nextDay.title }}. انتظار صباح الغد بمشيئة الرب!
          </p>
          <div class="flex items-center gap-1.5 text-[11px] text-marathon-dark/45">
            <CalendarDays :size="12" />
            <span>مجدول لـ {{ formatCairoDateLabel(reading.nextDay.nextDay.date) }}</span>
          </div>
        </div>
        <div class="bg-white rounded-xl px-2.5 py-1.5 text-center shrink-0">
          <p class="text-[10px] text-marathon-dark/40">اليوم</p>
          <p class="font-bold text-marathon-darker text-sm">{{ reading.nextDay.nextDay.dayNumber }}</p>
        </div>
      </div>

      <!-- Marathon finished -->
      <div
        v-else-if="reading.nextDay?.marathonState === 'completed'"
        class="rounded-2xl bg-marathon-light/60 border border-marathon-light p-4 flex items-start gap-3"
      >
        <div class="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0">
          <Flag :size="16" class="text-marathon-dark" />
        </div>
        <div class="flex-1">
          <p class="font-bold text-marathon-darker mb-1">اكتملت الرحلة 🎉</p>
          <p class="text-xs text-marathon-dark/60 leading-relaxed">
            {{ reading.nextDay.message || 'أنهيت ماراثون العهد الجديد. أحسنتم!' }}
          </p>
        </div>
      </div>
    </template>
  </UserLayout>
</template>
