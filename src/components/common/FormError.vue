<script setup>
import { CircleAlert } from 'lucide-vue-next'

defineProps({
  message: { type: String, default: '' },
})
</script>

<template>
  <Transition name="field-error">
    <div
      v-if="message"
      role="alert"
      class="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-3 py-2.5"
    >
      <CircleAlert :size="15" class="shrink-0 mt-0.5" />
      <span>{{ message }}</span>
    </div>
  </Transition>
</template>
