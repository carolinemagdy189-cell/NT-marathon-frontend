<script setup>
import { Loader2 } from 'lucide-vue-next'

defineProps({
  type: { type: String, default: 'button' },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  label: { type: String, default: '' },
  loadingLabel: { type: String, default: '' },
  icon: { type: [Object, Function], default: null },
  iconClass: { type: String, default: '' },
})

defineEmits(['click'])
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    class="btn-primary-dark w-full py-3.5 flex items-center justify-center gap-2 text-[15px] active:scale-[0.99] transition-transform"
    @click="$emit('click', $event)"
  >
    <Loader2 v-if="loading" :size="17" class="animate-spin" />
    <component :is="icon" v-else-if="icon" :size="17" :class="iconClass" />
    <span>{{ loading ? (loadingLabel || 'Loading…') : label }}</span>
  </button>
</template>
