<script setup>
import { computed, useSlots } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  label: { type: String, default: '' },
  hint: { type: String, default: '' },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  id: { type: String, default: '' },
  name: { type: String, default: '' },
  autocomplete: { type: String, default: 'off' },
  icon: { type: [Object, Function], default: null },
  error: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'blur'])

const slots = useSlots()
const hasError = computed(() => !!props.error)
const hasTrailing = computed(() => !!slots.trailing)
</script>

<template>
  <div>
    <div v-if="label" class="flex items-center justify-between mb-1.5">
      <label :for="id" class="text-sm font-semibold text-marathon-darker">{{ label }}</label>
      <span v-if="hint" class="text-xs text-marathon-dark/40">{{ hint }}</span>
    </div>
    <div class="relative">
      <component
        :is="icon"
        v-if="icon"
        :size="16"
        class="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors"
        :class="hasError ? 'text-red-400' : 'text-marathon-dark/40'"
      />
      <input
        :id="id"
        :type="type"
        :value="modelValue"
        :name="name"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :disabled="disabled"
        :aria-invalid="hasError ? 'true' : undefined"
        :aria-describedby="hasError && id ? `${id}-error` : undefined"
        class="w-full bg-marathon-gray/60 border rounded-xl py-3 text-sm outline-none transition-colors disabled:opacity-60"
        :class="[
          icon ? 'pl-9' : 'pl-3',
          hasTrailing ? 'pr-11' : 'pr-3',
          hasError
            ? 'border-red-300 bg-red-50/70 focus:border-red-400 focus:bg-red-50'
            : 'border-transparent focus:border-marathon-dark/30 focus:bg-white',
        ]"
        @input="emit('update:modelValue', $event.target.value)"
        @blur="emit('blur', $event)"
      />
      <!-- Optional trailing control (e.g. show/hide password toggle) -->
      <slot name="trailing"></slot>
    </div>
    <Transition name="field-error">
      <p
        v-if="hasError"
        :id="id ? `${id}-error` : undefined"
        class="text-xs text-red-600 mt-1.5"
      >
        {{ error }}
      </p>
    </Transition>
  </div>
</template>
