<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Home, CalendarClock, User } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

const props = defineProps({
  variant: { type: String, default: 'user' }, // 'user' | 'admin'
})

const items = computed(() => {
  if (props.variant === 'admin') {
    return [
      { name: 'profile', label: 'حسابي', icon: User, to: '/profile' },
      { name: 'history', label: 'سجل القراءة', icon: CalendarClock, to: '/history' },
      { name: 'admin', label: 'الرئيسية', icon: Home, to: '/admin' },
    ]
  }
  return [
    { name: 'profile', label: 'حسابي', icon: User, to: '/profile' },
    { name: 'history', label: 'سجل القراءة', icon: CalendarClock, to: '/history' },
    { name: 'home', label: 'الرئيسية', icon: Home, to: '/' },
  ]
})

function isActive(name) {
  return route.name === name
}
</script>

<template>
  <nav
    class="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-marathon-border"
    style="padding-bottom: env(safe-area-inset-bottom, 0px)"
  >
    <div class="max-w-md mx-auto grid grid-cols-3 gap-2 px-3 py-2">
      <button
        v-for="item in items"
        :key="item.name"
        type="button"
        class="flex flex-col items-center justify-center gap-1 py-2 rounded-2xl transition-all duration-200 active:scale-95"
        :class="isActive(item.name) ? 'bg-marathon-dark text-white' : 'text-marathon-dark/50 hover:text-marathon-dark/80'"
        @click="router.push(item.to)"
      >
        <component :is="item.icon" :size="20" :stroke-width="2" />
        <span class="text-xs font-medium">{{ item.label }}</span>
      </button>
    </div>
  </nav>
</template>
