<script setup>
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AdminLayout from '../layouts/AdminLayout.vue'
import { ArrowRight, Mail, Clock, MessageSquare, Bell, BookOpen, AlertCircle } from 'lucide-vue-next'
import { useAdminStore } from '../stores/admin'
import { formatCairoDateTime, formatCairoShortDate } from '../utils/format'

const route = useRoute()
const router = useRouter()
const admin = useAdminStore()

onMounted(() => {
  admin.fetchUser(route.params.id)
})

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

function retry() {
  admin.fetchUser(route.params.id)
}
</script>

<template>
  <AdminLayout>
    <button type="button" class="flex items-center gap-1.5 text-sm text-marathon-dark/60 mb-4" @click="router.push('/admin')">
      <ArrowRight :size="15" />
      <span>الرجوع إلى قائمة المشاركين</span>
    </button>

    <!-- Error state -->
    <div
      v-if="admin.error && !admin.loading && !admin.selectedUser"
      class="flex flex-col items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-sm font-semibold rounded-xl px-4 py-5 mb-4 text-center"
    >
      <AlertCircle :size="20" />
      <span>{{ admin.error }}</span>
      <button
        type="button"
        class="mt-1 inline-flex items-center gap-1.5 border border-red-200 rounded-full px-4 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100 transition-colors"
        @click="retry"
      >
        إعادة المحاولة
      </button>
    </div>

    <div v-if="admin.selectedParticipant" class="max-w-2xl">
      <div class="card-surface p-5 mb-4">
        <div class="flex items-start justify-between mb-4">
          <span class="text-xs font-semibold px-3 py-1.5 rounded-full" :class="statusStyle(admin.selectedParticipant.status)">
            {{ statusText(admin.selectedParticipant.status) }}
          </span>
          <div class="flex items-center gap-3">
            <div class="text-right">
              <p class="font-extrabold text-marathon-darker">{{ admin.selectedParticipant.name }}</p>
              <p class="text-xs text-marathon-dark/45 flex items-center gap-1 justify-end mt-0.5">
                {{ admin.selectedParticipant.email }}
                <Mail :size="12" />
              </p>
              <p
                v-if="admin.selectedParticipant.lastLoginAt"
                class="text-[11px] text-marathon-dark/40 flex items-center gap-1 justify-end mt-0.5"
              >
                آخر دخول: {{ formatCairoDateTime(admin.selectedParticipant.lastLoginAt) }}
                <Clock :size="11" />
              </p>
            </div>
            <div class="w-11 h-11 rounded-full bg-marathon-light flex items-center justify-center text-sm font-bold text-marathon-dark">
              {{ admin.selectedParticipant.initials }}
            </div>
          </div>
        </div>

        <!-- Overall progress — كل الأرقام من GET /admin/users/:id -->
        <div class="grid grid-cols-3 gap-3 mb-4">
          <div class="bg-marathon-cream rounded-xl p-3 text-center">
            <p class="text-lg font-extrabold text-marathon-darker">{{ admin.selectedParticipant.totalRead }}/{{ admin.selectedParticipant.totalChapters }}</p>
            <p class="text-xs text-marathon-dark/50 mt-0.5">التقدم الكلي</p>
          </div>
          <div class="bg-marathon-cream rounded-xl p-3 text-center">
            <p class="text-lg font-extrabold text-marathon-darker">{{ admin.selectedParticipant.completedDays }}</p>
            <p class="text-xs text-marathon-dark/50 mt-0.5">أيام مكتملة</p>
          </div>
          <div class="bg-marathon-cream rounded-xl p-3 text-center">
            <p class="text-lg font-extrabold text-marathon-darker">{{ admin.selectedParticipant.remaining }}</p>
            <p class="text-xs text-marathon-dark/50 mt-0.5">المتبقي</p>
          </div>
        </div>

        <div class="h-1.5 rounded-full bg-marathon-gray overflow-hidden mb-2">
          <div class="h-1.5 bg-marathon-dark" :style="{ width: admin.selectedParticipant.percent + '%' }"></div>
        </div>
        <p class="text-xs text-marathon-dark/45 text-left">{{ admin.selectedParticipant.percent }}% من العهد الجديد</p>
      </div>

      <div class="card-surface p-5 mb-4">
        <p class="font-bold text-marathon-darker mb-3 flex items-center gap-2 justify-end">
          <span>مستهدف اليوم: {{ admin.selectedParticipant.targetToday || '—' }}</span>
          <BookOpen :size="16" />
        </p>
        <p v-if="admin.selectedParticipant.checkIn" class="flex items-center gap-1.5 text-sm text-marathon-dark/55 justify-end">
          <span>
            الدخول: {{ formatCairoDateTime(admin.selectedParticipant.checkIn) }}
            <template v-if="admin.selectedParticipant.checkOut"> • الحفظ: {{ formatCairoDateTime(admin.selectedParticipant.checkOut) }}</template>
          </span>
          <Clock :size="14" />
        </p>
      </div>

      <div v-if="admin.selectedParticipant.note" class="card-surface p-5 mb-4">
        <p class="font-bold text-marathon-darker mb-2 flex items-center gap-2 justify-end">
          <span>تأمل وملاحظة اليوم</span>
          <MessageSquare :size="16" />
        </p>
        <p class="text-sm text-marathon-dark/70 italic text-right leading-relaxed">«{{ admin.selectedParticipant.note }}»</p>
      </div>

      <!-- Full reading history (من نفس الـ endpoint) -->
      <div v-if="admin.selectedParticipant.history.length" class="card-surface p-5 mb-4">
        <p class="font-bold text-marathon-darker mb-3 flex items-center gap-2 justify-end">
          <span>سجل القراءات الكامل ({{ admin.selectedParticipant.history.length }} يوم)</span>
          <BookOpen :size="16" />
        </p>
        <div class="space-y-2.5">
          <div
            v-for="rec in admin.selectedParticipant.history"
            :key="rec.dayNumber"
            class="bg-marathon-cream rounded-xl p-3"
          >
            <div class="flex items-center justify-between mb-1">
              <span
                class="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                :class="statusStyle(rec.status)"
              >
                {{ rec.chaptersRead }}/{{ rec.assignedChapters }} • {{ statusText(rec.status) }}
              </span>
              <p class="text-xs font-bold text-marathon-darker">
                اليوم {{ rec.dayNumber }} • {{ formatCairoShortDate(rec.date) }} — {{ rec.title }}
              </p>
            </div>
            <p v-if="rec.reflection" class="text-xs text-marathon-dark/60 italic mt-1">«{{ rec.reflection }}»</p>
            <p v-if="rec.savedAt" class="text-[11px] text-marathon-dark/40 mt-1">
              سُجلت {{ formatCairoDateTime(rec.savedAt) }}
            </p>
          </div>
        </div>
      </div>

      <button
        v-if="admin.selectedParticipant.status === 'not_registered'"
        type="button"
        class="btn-primary-dark w-full py-3 flex items-center justify-center gap-2 text-sm"
      >
        <Bell :size="15" />
        <span>إرسال تذكير بالمحبة</span>
      </button>
    </div>

    <!-- Loading -->
    <div v-else-if="admin.loading" class="text-center text-marathon-dark/50 py-16">
      جارٍ تحميل بيانات المشارك...
    </div>
  </AdminLayout>
</template>
