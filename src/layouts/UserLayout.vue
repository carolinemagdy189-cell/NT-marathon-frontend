<script setup>
import { computed } from 'vue'
import BottomNav from '../components/common/BottomNav.vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()

/*
|-----------------------------------------------------------------------------
| شريط التنقل السفلي — للمستخدم العادي فقط
|-----------------------------------------------------------------------------
| - أثناء استرجاع الجلسة (قبل اكتمال /auth/me) لا يُعرض الشريط أصلًا،
|   فلا يومض أمام المشرف قبل معرفة دوره.
| - المشرف (role === 'admin') لا يرى شريط المستخدم العادي إطلاقًا.
| - المستخدم العادي: isAuthenticated = true و isAdmin = false — كما كان.
*/
const showUserNav = computed(() => auth.isAuthenticated && !auth.isAdmin)
</script>

<template>
  <div dir="rtl" class="min-h-screen bg-marathon-cream font-arabic">
    <div class="max-w-md mx-auto px-4 pt-5 pb-28">
      <slot />
    </div>
    <BottomNav v-if="showUserNav" variant="user" />
  </div>
</template>
