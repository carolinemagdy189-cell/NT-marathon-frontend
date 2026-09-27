<script setup>
import { ref, computed, onMounted } from 'vue'
import UserLayout from '../layouts/UserLayout.vue'
import {
  User,
  BookOpen,
  CalendarDays,
  TrendingUp,
  CalendarCheck2,
  Check,
  MessageSquareText,
  Save,
  Clock,
  CircleCheck,
  Circle,
  AlertCircle,
} from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth'
import { useReadingStore } from '../stores/reading'
import { formatCairoDateLabel, formatCairoShortDate, formatCairoDateTime } from '../utils/format'

const auth = useAuthStore()
const reading = useReadingStore()

const selectedChapters = ref(null)
const note = ref('')
const saved = ref(false)
const errorMessage = ref('')

const chapterOptions = [
  { value: 1, label: '1', sub: 'إصحاح 1' },
  { value: 2, label: '2', sub: 'إصحاحين' },
  { value: 3, label: '3', sub: '3 إصحاحات' },
  { value: 4, label: '4', sub: '4 إصحاحات' },
  { value: '5+', label: '5+', sub: '+5 إصحاحات' },
]

/*
|--------------------------------------------------------------------------
| Backend payload access (source of truth)
|--------------------------------------------------------------------------
| GET /readings/today returns:
| { marathonState, reading: { dayNumber, date, books, chapters, title, totalDays },
|   todayStatus, todayTarget, todayReflection, savedAt, progress }
*/
const todayData = computed(() => reading.today)
const readingInfo = computed(() => todayData.value?.reading ?? null)
const progress = computed(() => todayData.value?.progress ?? reading.progress ?? null)

/* النص العربي ليوم الماراثون — فعّال فقط داخل نافذة الماراثون. */
const marathonActive = computed(() => todayData.value?.marathonState === 'active')

const greetingName = computed(
  () => (auth.currentUser?.name || '').split(' ')[0] || auth.currentUser?.name
)

/*
|--------------------------------------------------------------------------
| Already submitted today
|--------------------------------------------------------------------------
| الـ backend بيرجع todayStatus !== 'not_registered' لو المستخدم سجل قراءة اليوم بالفعل.
| بنستخدمها كـ source of truth عشان حتى بعد refresh يفضل ممنوع التسجيل.
*/
const alreadySubmittedToday = computed(() => {
  if (!todayData.value) return false
  return todayData.value.todayStatus && todayData.value.todayStatus !== 'not_registered'
})

/* وقت حفظ القراءة (من الـ backend). */
const savedAtLabel = computed(() => {
  if (!todayData.value?.savedAt) return ''
  return formatCairoDateTime(todayData.value.savedAt)
})

/*
|--------------------------------------------------------------------------
| Form disabled
|--------------------------------------------------------------------------
| الفورم يتقفل لو:
| - القراءة اتسجلت بالفعل
| - أو المستخدم ضغط حفظ والـ request لسه شغال
*/
const formDisabled = computed(() => {
  return alreadySubmittedToday.value || reading.submitting || saved.value
})

/*
|--------------------------------------------------------------------------
| Reading complete
|--------------------------------------------------------------------------
*/
const isComplete = computed(() => {
  if (!readingInfo.value || selectedChapters.value === null) return false

  const req = todayData.value.todayTarget ?? readingInfo.value.chapters

  return (
    (typeof selectedChapters.value === 'number' && selectedChapters.value >= req) ||
    selectedChapters.value === '5+'
  )
})

/*
|--------------------------------------------------------------------------
| Can save
|--------------------------------------------------------------------------
| لازم:
| - يختار عدد الإصحاحات
| - يكتب comment
| - ما يكونش سجل قبل كده
| - مفيش request شغال
*/
const canSave = computed(() => {
  const hasChapters = selectedChapters.value !== null
  const hasNote = note.value.trim().length > 0

  return (
    hasChapters &&
    hasNote &&
    !alreadySubmittedToday.value &&
    !reading.submitting &&
    !saved.value
  )
})

onMounted(async () => {
  await Promise.all([
    reading.fetchToday(),
    reading.fetchProgress(),
    reading.fetchTimeline(),
  ])

  /*
   * لو المستخدم سجل قبل كده في نفس اليوم،
   * نظهر الحالة المقفولة + نعرض التأمل المحفوظ من الـ backend.
   */
  if (alreadySubmittedToday.value) {
    saved.value = true
    note.value = todayData.value.todayReflection || ''
  }
})

/*
|--------------------------------------------------------------------------
| Select chapters
|--------------------------------------------------------------------------
*/
function selectChapters(value) {
  // ممنوع تغيير الاختيار بعد التسجيل
  if (formDisabled.value) return

  selectedChapters.value = value
  errorMessage.value = ''
  saved.value = false
}

/*
|--------------------------------------------------------------------------
| Save reading
|--------------------------------------------------------------------------
*/
async function handleSave() {
  errorMessage.value = ''

  // حماية إضافية
  if (alreadySubmittedToday.value || saved.value) {
    errorMessage.value = 'لقد قمت بتسجيل قراءة اليوم بالفعل.'
    return
  }

  // لازم يختار عدد الإصحاحات (1..10 — خيار 5+ يطلب الرقم الفعلي)
  if (selectedChapters.value === null) {
    errorMessage.value = 'من فضلك اختر عدد الإصحاحات التي قرأتها.'
    return
  }

  if (selectedChapters.value === '5+') {
    const parsed = Number(prompt('كم إصحاحًا قرأت فعلًا؟ (من 5 إلى 10)'))
    if (!Number.isInteger(parsed) || parsed < 5 || parsed > 10) {
      errorMessage.value = 'من فضلك أدخل عددًا صحيحًا بين 5 و 10.'
      return
    }
    selectedChapters.value = parsed
  }

  // لازم يكتب comment (فوق لا يقبل الفراغات)
  if (!note.value.trim()) {
    errorMessage.value = 'من فضلك اكتب تعليقًا أو مشاركة قبل حفظ قراءة اليوم.'
    return
  }

  try {
    const result = await reading.submitToday({
      chaptersRead: selectedChapters.value,
      reflection: note.value,
    })

    if (result.success) {
      saved.value = true

      /*
       * مهم جدًا:
       * الـ store عمل refresh لـ today و progress من الـ backend
       * (source of truth) — لا نعتمد على أي حالة محلية مصطنعة.
       */
      errorMessage.value = ''
    } else {
      errorMessage.value =
        result.message ||
        'حدث خطأ أثناء حفظ القراءة. حاول مرة أخرى.'
    }
  } catch (error) {
    console.error('Submit reading error:', error)

    errorMessage.value =
      error?.response?.data?.message ||
      reading.error ||
      'حدث خطأ أثناء حفظ القراءة. حاول مرة أخرى.'
  }
}

function statusIcon(status) {
  if (status === 'completed') return CircleCheck
  if (status === 'active' || status === 'current') return BookOpen
  return Circle
}

/*
|--------------------------------------------------------------------------
| Timeline entries (from GET /readings/timeline)
|--------------------------------------------------------------------------
| Backend flags per day: isPast / isToday / isFuture / locked + status
| (completed | partial | not_registered). The status of the row the UI
| highlights as "current" is whatever the backend marked isToday.
*/
const journeyItems = computed(() => {
  return reading.timeline.map((d) => ({
    day: d.dayNumber,
    book: d.books?.[0] ?? '',
    range: d.title?.replace(/^[^\s]+\s*/, '') ?? '',
    title: d.title,
    chapters: d.chapters,
    date: formatCairoShortDate(d.date),
    // الحالة من الـ backend: completed | partial | not_registered
    backendStatus: d.status,
    chaptersRead: d.chaptersRead ?? 0,
    status: d.isToday ? 'current' : d.isPast && d.status === 'completed' ? 'completed' : 'upcoming',
    isPast: d.isPast,
    isFuture: d.isFuture,
    locked: d.locked,
  }))
})

/* Show a focused window: past few days, today, and the next few days. */
const journeyWindow = computed(() => {
  const items = journeyItems.value
  const todayIdx = items.findIndex((i) => i.status === 'current')
  if (todayIdx === -1) return items.slice(0, 8)
  const start = Math.max(0, todayIdx - 3)
  return items.slice(start, start + 8)
})

const journeyLabel = computed(() => {
  const d = todayData.value?.reading
  if (!d) return ''
  const week = Math.ceil(d.dayNumber / 7)
  return `الأسبوع ${week} من 13`
})
</script>

<template>
  <UserLayout>
    <!-- Header -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2 text-marathon-darker">
        <BookOpen :size="17" />
        <span class="text-sm font-bold">رحلة العهد الجديد</span>
      </div>

      <div
        class="w-9 h-9 rounded-full bg-marathon-dark flex items-center justify-center"
      >
        <User :size="17" class="text-white" />
      </div>
    </div>

    <div class="flex items-center justify-between mb-5">
      <div
        v-if="reading.today"
        class="inline-flex items-center gap-1.5 bg-marathon-light text-marathon-dark text-xs font-bold px-3 py-1.5 rounded-full"
      >
        <span>
          اليوم {{ readingInfo?.dayNumber }} من {{ readingInfo?.totalDays ?? 89 }}
        </span>

        <span class="w-1.5 h-1.5 rounded-full bg-marathon-dark"></span>
      </div>

      <div
        v-if="reading.today"
        class="flex items-center gap-1.5 text-xs text-marathon-dark/60"
      >
        <span>{{ formatCairoDateLabel(readingInfo?.date) }}</span>
        <CalendarDays :size="14" />
      </div>
    </div>

    <!-- Greeting -->
    <h1 class="text-2xl font-extrabold text-marathon-darker mb-1">
      صباح الخير، {{ greetingName }}
    </h1>

    <p class="text-sm text-marathon-dark/60 mb-5">
      استمر، إصحاحًا بعد إصحاح.
    </p>

    <!-- Marathon finished / not started banners -->
    <div
      v-if="todayData && !marathonActive"
      class="flex items-center gap-2 bg-marathon-peach text-marathon-peachtext text-xs font-semibold rounded-xl px-3 py-3 mb-5"
    >
      <AlertCircle :size="16" />
      <span>{{ todayData.message || (marathonActive === false && todayData.marathonState === 'completed' ? 'انتهى الماراثون. أحسنتم!' : 'لم يبدأ الماراثون بعد.') }}</span>
    </div>

    <!-- Today's reading card -->
    <div
      v-if="readingInfo"
      class="rounded-2xl bg-marathon-light/60 border border-marathon-light p-4 mb-5"
    >
      <div class="flex items-center justify-between mb-3">
        <span class="text-xs font-semibold text-marathon-dark/60">
          {{ formatCairoDateLabel(readingInfo.date).split('،')[0] }} • قراءة اليوم المحددة
        </span>

        <div
          class="w-10 h-10 rounded-xl bg-marathon-dark flex items-center justify-center shrink-0"
        >
          <BookOpen :size="18" class="text-white" />
        </div>
      </div>

      <h2 class="text-2xl font-extrabold text-marathon-darker mb-3">
        {{ readingInfo.title }}
      </h2>

      <div class="flex items-center justify-between flex-wrap gap-2">
        <div
          class="flex items-center gap-1.5 text-xs text-marathon-dark/60"
        >
          <span>1 أكتوبر – 28 ديسمبر 2026</span>
          <CalendarDays :size="13" />
        </div>

        <div
          class="inline-flex items-center gap-1.5 bg-marathon-peach text-marathon-peachtext text-xs font-semibold px-3 py-1 rounded-full"
        >
          <span>
            {{ todayData.todayTarget }} إصحاحات مطلوبة
          </span>

          <CalendarCheck2 :size="13" />
        </div>
      </div>
    </div>

    <!-- Progress -->
    <div
      v-if="progress"
      class="card-surface p-4 mb-5"
    >
      <div class="flex items-center justify-between mb-4">
        <div
          class="inline-flex items-center gap-1.5 bg-marathon-light text-marathon-dark text-xs font-bold px-3 py-1 rounded-full"
        >
          <span>{{ progress.journeyPercentage }}% مكتمل</span>
          <TrendingUp :size="13" />
        </div>

        <div
          class="flex items-center gap-1.5 font-bold text-marathon-darker"
        >
          <span>تقدمي في الرحلة</span>
          <TrendingUp :size="16" />
        </div>
      </div>

      <div class="grid grid-cols-3 gap-2 mb-4">
        <div class="bg-marathon-cream rounded-xl p-3 text-center">
          <p class="text-lg font-extrabold text-marathon-darker">
            {{ progress.chaptersRemaining }}
          </p>

          <p class="text-xs text-marathon-dark/60 mt-0.5">
            المتبقي
          </p>

          <p class="text-[11px] text-marathon-dark/40">
            إصحاح حتى الرؤيا
          </p>
        </div>

        <div class="bg-marathon-cream rounded-xl p-3 text-center">
          <p class="text-lg font-extrabold text-marathon-darker">
            {{ progress.chaptersRead }}
            من
            {{ progress.totalChapters }}
          </p>

          <p class="text-xs text-marathon-dark/60 mt-0.5">
            المقروء
          </p>

          <p class="text-[11px] text-marathon-dark/40">
            إصحاح
          </p>
        </div>

        <div class="bg-marathon-cream rounded-xl p-3 text-center">
          <p class="text-lg font-extrabold text-marathon-darker">
            {{ progress.currentDay ?? '—' }}
            من
            {{ progress.totalDays }}
          </p>

          <p class="text-xs text-marathon-dark/60 mt-0.5">
            اليوم الحالي
          </p>

          <p class="text-[11px] text-marathon-dark/40">
            يومًا
          </p>
        </div>
      </div>

      <div class="h-1.5 rounded-full bg-marathon-gray relative mb-2">
        <div
          class="h-1.5 rounded-full bg-marathon-dark"
          :style="{ width: progress.journeyPercentage + '%' }"
        ></div>

        <div
          class="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-marathon-darker border-2 border-white"
          :style="{
            right:
              'calc(' +
              progress.journeyPercentage +
              '% - 6px)'
          }"
        ></div>
      </div>

      <div
        class="flex items-center justify-between text-[11px] text-marathon-dark/40"
      >
        <span>سفر الرؤيا 22</span>
        <span>الرسائل</span>
        <span>أعمال الرسل</span>
        <span>الأناجيل (متى 10)</span>
      </div>
    </div>

    <!-- Daily reading -->
    <div
      v-if="readingInfo"
      class="card-surface p-4 mb-5"
    >
      <div class="flex items-center gap-2 mb-1.5">
        <CalendarCheck2
          :size="18"
          class="text-marathon-dark"
        />

        <h3 class="font-bold text-marathon-darker">
          قرأت كام إصحاح النهارده؟
        </h3>
      </div>

      <p
        class="text-xs text-marathon-dark/60 leading-relaxed mb-4"
      >
        اختر عدد الإصحاحات التي أتممتها لقراءة اليوم
        {{ readingInfo.dayNumber }}
        (المطلوب:
        {{ readingInfo.title }}،
        {{ todayData.todayTarget }}
        إصحاحات):
      </p>

      <!-- Already submitted message -->
      <div
        v-if="alreadySubmittedToday"
        class="flex items-center gap-2 bg-marathon-light text-marathon-dark text-xs font-semibold rounded-xl px-3 py-3 mb-4"
      >
        <Check :size="16" />

        <span>
          تم تسجيل قراءة اليوم بالفعل. يمكنك تسجيل القراءة مرة واحدة فقط يوميًا.
        </span>
      </div>

      <!-- Chapter options -->
      <div class="grid grid-cols-5 gap-2 mb-4">
        <button
          v-for="opt in chapterOptions"
          :key="opt.value"
          type="button"
          :disabled="formDisabled"
          class="rounded-xl border py-2.5 flex flex-col items-center gap-0.5 transition-colors"
          :class="[
            selectedChapters === opt.value
              ? 'bg-marathon-light border-marathon-dark/40 text-marathon-darker'
              : 'bg-marathon-cream border-marathon-border text-marathon-dark/70',
            formDisabled
              ? 'opacity-60 cursor-not-allowed'
              : 'hover:border-marathon-dark/40'
          ]"
          @click="selectChapters(opt.value)"
        >
          <span class="flex items-center gap-1 font-extrabold text-base">
            <Check
              v-if="selectedChapters === opt.value"
              :size="13"
            />

            {{ opt.label }}
          </span>

          <span class="text-[10px]">
            {{ opt.sub }}
          </span>
        </button>
      </div>

      <!-- Saved reflection from the backend -->
      <div
        v-if="alreadySubmittedToday && note.trim()"
        class="bg-marathon-cream border border-marathon-border rounded-xl p-3 mb-4"
      >
        <p class="flex items-center gap-1.5 text-xs text-marathon-dark/50 mb-1.5">
          <MessageSquareText :size="13" />
          <span>التأمل المحفوظ</span>
        </p>
        <p class="text-sm text-marathon-darker/80 italic leading-relaxed">
          «{{ note }}»
        </p>
        <p
          v-if="savedAtLabel"
          class="flex items-center gap-1.5 text-[11px] text-marathon-dark/40 mt-2"
        >
          <Clock :size="12" />
          <span>تم الحفظ: {{ savedAtLabel }}</span>
        </p>
      </div>

      <!-- Complete reading message -->
      <div
        v-if="isComplete"
        class="flex items-center gap-2 bg-marathon-light text-marathon-dark text-xs font-semibold rounded-xl px-3 py-2.5 mb-5"
      >
        <Check :size="14" />

        <span>
          اكتملت قراءة اليوم:
          {{ selectedChapters }}
          من
          {{ todayData.todayTarget }}
          إصحاحات مطلوبة بنجاح
        </span>
      </div>

      <!-- Comment -->
      <div class="mb-2">
        <div class="flex items-center gap-2 mb-1.5">
          <MessageSquareText
            :size="17"
            class="text-marathon-dark"
          />

          <h4 class="font-bold text-marathon-darker text-sm">
            حابب تشاركنا بحاجة؟
            <span class="text-red-500">*</span>
          </h4>
        </div>

        <p class="text-xs text-marathon-dark/60 mb-2">
          اكتب فكرة، صلاة، أو ملاحظة من قراءة النهارده.
          <span class="font-bold text-marathon-dark">
            المشاركة مطلوبة لتسجيل القراءة.
          </span>
        </p>

        <textarea
          v-model="note"
          rows="3"
          required
          :disabled="formDisabled"
          placeholder="قراءة متى النهارده لمست قلبي جدًا بخصوص الإيمان وعدم الخوف، وتسليم الغد ليد الله بكل طمأنينة وسلام."
          class="w-full bg-marathon-cream border border-marathon-border rounded-xl p-3 text-sm outline-none focus:border-marathon-dark/30 resize-none placeholder:text-marathon-dark/35 disabled:opacity-60 disabled:cursor-not-allowed"
          :class="{
            'border-red-400 focus:border-red-400':
              errorMessage && !note.trim()
          }"
          @input="errorMessage = ''"
        ></textarea>
      </div>

      <!-- Error -->
      <div
        v-if="errorMessage"
        class="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-xs font-semibold rounded-xl px-3 py-2.5 mt-3"
      >
        <AlertCircle :size="15" />

        <span>
          {{ errorMessage }}
        </span>
      </div>

      <!-- Save button -->
      <button
        type="button"
        :disabled="!canSave"
        class="btn-primary-dark w-full py-3.5 flex items-center justify-center gap-2 text-[15px] mt-3 disabled:opacity-50 disabled:cursor-not-allowed"
        @click="handleSave"
      >
        <Save :size="16" />

        <span v-if="reading.submitting">
          جارٍ الحفظ...
        </span>

        <span v-else-if="alreadySubmittedToday || saved">
          تم تسجيل قراءة اليوم
        </span>

        <span v-else>
          حفظ قراءة اليوم
        </span>
      </button>

      <!-- Success -->
      <p
        v-if="saved || alreadySubmittedToday"
        class="flex items-center justify-center gap-1.5 text-xs text-marathon-dark/50 mt-2.5"
      >
        <Clock :size="12" />

        <span>
          تم تسجيل القراءة بنجاح — لا يمكن تسجيل قراءة أخرى اليوم
        </span>
      </p>
    </div>

    <!-- Reading Journey -->
    <div class="flex items-center justify-between mb-3">
      <span class="text-xs text-marathon-dark/40">
        {{ journeyLabel }}
      </span>

      <div
        class="flex items-center gap-1.5 font-bold text-marathon-darker"
      >
        <span>رحلتي في القراءة</span>
        <TrendingUp :size="16" />
      </div>
    </div>

    <div class="space-y-2.5">
      <div
        v-for="item in journeyWindow"
        :key="item.day"
        class="rounded-2xl p-3.5 flex items-center justify-between"
        :class="
          item.status === 'current'
            ? 'bg-marathon-dark text-white'
            : 'card-surface'
        "
      >
        <div class="flex items-center gap-2">
          <span
            class="text-[11px] font-semibold px-2.5 py-1 rounded-full"
            :class="
              item.status === 'current'
                ? 'bg-white/15 text-white'
                : 'bg-marathon-cream text-marathon-dark/60'
            "
          >
            {{ item.chapters }} إصحاحات
          </span>

          <component
            :is="statusIcon(item.status)"
            :size="18"
            :class="
              item.status === 'completed' || (item.status === 'current' && item.backendStatus === 'completed')
                ? 'text-marathon-dark'
                : item.status === 'current'
                ? 'text-white'
                : 'text-marathon-dark/25'
            "
          />
        </div>

        <div class="text-right">
          <p
            class="text-sm font-bold"
            :class="
              item.status === 'current'
                ? 'text-white'
                : 'text-marathon-darker'
            "
          >
            اليوم {{ item.day }}:
            {{ item.title }}
          </p>

          <p
            class="text-xs mt-0.5"
            :class="
              item.status === 'current'
                ? 'text-white/70'
                : 'text-marathon-dark/45'
            "
          >
            <template v-if="item.status === 'current' && item.backendStatus === 'completed'">
              اكتملت قراءة اليوم ({{ item.chaptersRead }}/{{ item.chapters }}) ✓
            </template>

            <template v-else-if="item.status === 'current' && item.backendStatus === 'partial'">
              قراءة جزئية اليوم ({{ item.chaptersRead }}/{{ item.chapters }})
            </template>

            <template v-else-if="item.status === 'current'">
              قراءة اليوم الحالية • جارية الآن
            </template>

            <template v-else-if="item.status === 'completed'">
              تمت القراءة في {{ item.date }}
            </template>

            <template v-else-if="item.isPast">
              لم تُسجل — {{ item.date }}
            </template>

            <template v-else>
              {{ item.date }}
            </template>
          </p>
        </div>
      </div>
    </div>
  </UserLayout>
</template>