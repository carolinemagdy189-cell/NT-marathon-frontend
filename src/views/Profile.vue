<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import UserLayout from '../layouts/UserLayout.vue'
import { User, Mail, BookOpen, TrendingUp, CalendarDays, LogOut } from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth'
import { useReadingStore } from '../stores/reading'
import { formatCairoDateTime } from '../utils/format'

const auth = useAuthStore()
const reading = useReadingStore()
const router = useRouter()
const loggingOut = ref(false)

onMounted(() => {
  if (!reading.progress) reading.fetchProgress()
})

/*
|--------------------------------------------------------------------------
| Logout — POST /auth/logout ثم مسح كل بيانات المستخدم
|--------------------------------------------------------------------------
*/
async function handleLogout() {
  if (loggingOut.value) return
  loggingOut.value = true
  try {
    await auth.logout() // clears token + user-specific stores
  } finally {
    router.push('/login')
  }
}
</script>

<template>
  <UserLayout>
    <div class="flex items-center justify-between mb-6">
      <span class="text-sm font-bold text-marathon-darker">حسابي</span>
      <div class="flex items-center gap-2 text-marathon-darker">
        <BookOpen :size="17" />
        <span class="text-sm font-bold">ماراثون العهد الجديد</span>
      </div>
    </div>

    <div class="card-surface p-6 flex flex-col items-center text-center mb-5">
      <div class="w-16 h-16 rounded-full bg-marathon-dark flex items-center justify-center mb-3">
        <User :size="28" class="text-white" />
      </div>
      <h1 class="text-lg font-extrabold text-marathon-darker mb-1">{{ auth.currentUser?.name }}</h1>
      <p class="text-sm text-marathon-dark/50 flex items-center gap-1.5">
        <Mail :size="13" />
        {{ auth.currentUser?.email }}
      </p>
      <p
        v-if="auth.currentUser?.lastLoginAt"
        class="text-[11px] text-marathon-dark/40 mt-1"
      >
        آخر تسجيل دخول: {{ formatCairoDateTime(auth.currentUser.lastLoginAt) }}
      </p>
    </div>

    <!-- أرقام التقدم كلها من الـ backend (GET /progress) — لا حسابات محلية -->
    <div v-if="reading.progress" class="grid grid-cols-2 gap-3 mb-5">
      <div class="card-surface p-4 text-center">
        <TrendingUp :size="16" class="text-marathon-dark mx-auto mb-1.5" />
        <p class="text-lg font-extrabold text-marathon-darker">{{ reading.progress.journeyPercentage }}%</p>
        <p class="text-xs text-marathon-dark/50 mt-0.5">نسبة الإنجاز</p>
      </div>
      <div class="card-surface p-4 text-center">
        <CalendarDays :size="16" class="text-marathon-dark mx-auto mb-1.5" />
        <p class="text-lg font-extrabold text-marathon-darker">{{ reading.progress.currentDay ?? '—' }} / {{ reading.progress.totalDays }}</p>
        <p class="text-xs text-marathon-dark/50 mt-0.5">اليوم الحالي</p>
      </div>
      <div class="card-surface p-4 text-center">
        <BookOpen :size="16" class="text-marathon-dark mx-auto mb-1.5" />
        <p class="text-lg font-extrabold text-marathon-darker">{{ reading.progress.chaptersRead }} / {{ reading.progress.totalChapters }}</p>
        <p class="text-xs text-marathon-dark/50 mt-0.5">الإصحاحات المقروءة</p>
      </div>
      <div class="card-surface p-4 text-center">
        <BookOpen :size="16" class="text-marathon-dark mx-auto mb-1.5" />
        <p class="text-lg font-extrabold text-marathon-darker">{{ reading.progress.chaptersRemaining }}</p>
        <p class="text-xs text-marathon-dark/50 mt-0.5">الإصحاحات المتبقية</p>
      </div>
    </div>

    <!-- تفاصيل إضافية من نفس مصدر الحقيقة (الـ backend) -->
    <div v-if="reading.progress" class="card-surface p-4 mb-5">
      <div class="grid grid-cols-3 gap-2 text-center">
        <div>
          <p class="text-lg font-extrabold text-marathon-darker">{{ reading.progress.completedDays }}</p>
          <p class="text-[11px] text-marathon-dark/50">أيام مكتملة</p>
        </div>
        <div>
          <p class="text-lg font-extrabold text-marathon-darker">{{ reading.progress.partialDays }}</p>
          <p class="text-[11px] text-marathon-dark/50">أيام جزئية</p>
        </div>
        <div>
          <p class="text-lg font-extrabold text-marathon-darker">{{ reading.progress.commitmentPercentage }}%</p>
          <p class="text-[11px] text-marathon-dark/50">نسبة الالتزام</p>
        </div>
      </div>
    </div>

    <button
      type="button"
      :disabled="loggingOut"
      class="w-full flex items-center justify-center gap-2 border border-marathon-border text-marathon-dark/70 font-semibold text-sm py-3.5 rounded-full hover:bg-marathon-gray/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      @click="handleLogout"
    >
      <LogOut :size="16" />
      <span>{{ loggingOut ? 'جارٍ تسجيل الخروج...' : 'تسجيل الخروج' }}</span>
    </button>
  </UserLayout>
</template>
