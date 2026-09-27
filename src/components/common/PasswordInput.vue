<script setup>
import { ref, computed } from 'vue'
import { Eye, EyeOff, Lock } from 'lucide-vue-next'
import FormInput from './FormInput.vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: '' },
  hint: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  id: { type: String, default: '' },
  name: { type: String, default: '' },
  autocomplete: { type: String, default: 'current-password' },
  error: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'blur'])

const visible = ref(false)
const inputType = computed(() => (visible.value ? 'text' : 'password'))
</script>

<template>
  <FormInput
    :model-value="modelValue"
    :label="label"
    :hint="hint"
    :type="inputType"
    :placeholder="placeholder"
    :id="id"
    :name="name"
    :autocomplete="autocomplete"
    :icon="Lock"
    :error="error"
    :disabled="disabled"
    @update:model-value="emit('update:modelValue', $event)"
    @blur="emit('blur', $event)"
  >
    <template #trailing>
      <button
        type="button"
        tabindex="-1"
        :title="visible ? 'Hide password' : 'Show password'"
        :aria-label="visible ? 'Hide password' : 'Show password'"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-marathon-dark/40 hover:text-marathon-dark transition-colors"
        @click="visible = !visible"
      >
        <Eye v-if="visible" :size="16" />
        <EyeOff v-else :size="16" />
      </button>
    </template>
  </FormInput>
</template>
