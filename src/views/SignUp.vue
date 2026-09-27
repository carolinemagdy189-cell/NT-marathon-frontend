<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { BookOpen, CalendarDays, User, Mail, ArrowLeft, Quote, Flower2 } from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth'
import FormInput from '../components/common/FormInput.vue'
import PasswordInput from '../components/common/PasswordInput.vue'
import LoadingButton from '../components/common/LoadingButton.vue'
import FormError from '../components/common/FormError.vue'

const router = useRouter()
const auth = useAuthStore()

const form = reactive({ name: '', email: '', password: '', confirm: '' })
const fieldErrors = reactive({ name: '', email: '', password: '', confirm: '' })
const submitting = ref(false)

const dateLabel = 'Oct 1 – Dec 28, 2026 • 260 Ch • 89 Days'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 8

function validateField(field) {
  switch (field) {
    case 'name':
      fieldErrors.name = form.name.trim() ? '' : 'Full name is required.'
      break
    case 'email':
      if (!form.email.trim()) fieldErrors.email = 'Email is required.'
      else if (!EMAIL_PATTERN.test(form.email.trim())) fieldErrors.email = 'Please enter a valid email address.'
      else fieldErrors.email = ''
      break
    case 'password': {
      const value = form.password
      if (!value) fieldErrors.password = 'Password is required.'
      else if (value.length < MIN_PASSWORD_LENGTH) fieldErrors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
      else if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) fieldErrors.password = 'Password must include letters and numbers.'
      else fieldErrors.password = ''
      // Re-validate confirmation since it depends on the password.
      if (form.confirm) validateField('confirm')
      break
    }
    case 'confirm':
      if (!form.confirm) fieldErrors.confirm = 'Please confirm your password.'
      else if (form.confirm !== form.password) fieldErrors.confirm = 'Passwords do not match.'
      else fieldErrors.confirm = ''
      break
  }
}

const formValid = computed(
  () =>
    form.name.trim() &&
    form.email.trim() &&
    EMAIL_PATTERN.test(form.email.trim()) &&
    form.password.length >= MIN_PASSWORD_LENGTH &&
    form.confirm &&
    form.confirm === form.password
)

async function handleSubmit() {
  auth.error = null
  Object.keys(fieldErrors).forEach(validateField)
  if (!formValid.value) return

  submitting.value = true
  try {
    // No role is ever submitted here — every self-registered account is a
    // normal user; the backend enforces authorization. confirmPassword goes
    // along so the backend can verify the match; neither is ever stored.
    await auth.register({
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      confirmPassword: form.confirm,
    })
    router.push(auth.homeRoute) // '/home' for the plain users created here
  } catch {
    // auth.error already holds the friendly API message shown below.
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div dir="ltr" class="min-h-screen bg-marathon-cream font-sans">
    <div class="max-w-md mx-auto px-5 pt-8 pb-12">
      <!-- Header -->
      <div class="flex items-start gap-3 mb-5">
        <div class="w-9 h-9 rounded-xl bg-marathon-light flex items-center justify-center shrink-0">
          <BookOpen :size="18" class="text-marathon-dark" />
        </div>
        <div>
          <p class="text-xs font-semibold tracking-wide text-marathon-green">MARATHON</p>
          <h1 class="text-xl font-extrabold text-marathon-darker leading-tight">NEW TESTAMENT</h1>
        </div>
      </div>

      <!-- Date badge -->
      <div class="inline-flex items-center gap-2 bg-marathon-light text-marathon-dark text-sm font-medium px-4 py-2 rounded-full mb-5">
        <CalendarDays :size="15" />
        <span>{{ dateLabel }}</span>
      </div>

      <!-- Form card -->
      <div class="card-surface p-6">
        <div class="flex flex-col items-center text-center mb-6">
          <div class="w-14 h-14 rounded-2xl bg-marathon-light flex items-center justify-center mb-4">
            <Flower2 :size="26" class="text-marathon-dark" />
          </div>
          <h2 class="text-2xl font-extrabold text-marathon-darker mb-2">Create Your Account</h2>
          <p class="text-sm text-marathon-dark/60 leading-relaxed">
            Join the marathon and abide in daily chapters alongside your fellowship cohort.
          </p>
        </div>

        <form class="space-y-5" novalidate @submit.prevent="handleSubmit">
          <FormInput
            id="signup-name"
            v-model="form.name"
            name="name"
            type="text"
            label="Full Name"
            hint="Fellowship record"
            placeholder="e.g. Caroline Magdy"
            autocomplete="name"
            :icon="User"
            :error="fieldErrors.name"
            @blur="validateField('name')"
          />

          <FormInput
            id="signup-email"
            v-model="form.email"
            name="email"
            type="email"
            label="Email Address"
            hint="For daily reflections"
            placeholder="e.g. caroline@example.com"
            autocomplete="email"
            :icon="Mail"
            :error="fieldErrors.email"
            @blur="validateField('email')"
          />

          <PasswordInput
            id="signup-password"
            v-model="form.password"
            name="new-password"
            label="Password"
            hint="Min 8 characters"
            placeholder="Create a password"
            autocomplete="new-password"
            :error="fieldErrors.password"
            @blur="validateField('password')"
          />

          <PasswordInput
            id="signup-confirm"
            v-model="form.confirm"
            name="confirm-password"
            label="Confirm Password"
            hint="Repeat your password"
            placeholder="Re-enter your password"
            autocomplete="new-password"
            :error="fieldErrors.confirm"
            @blur="validateField('confirm')"
          />

          <!-- API error area (email taken, server, network…) -->
          <FormError :message="auth.error" />

          <LoadingButton
            type="submit"
            label="Create Account"
            loading-label="Creating account…"
            :loading="submitting"
            :icon="ArrowLeft"
            icon-class="rotate-180"
          />
        </form>

        <p class="text-sm text-center text-marathon-dark/60 mt-6">
          Already have an account?
          <RouterLink
            to="/login"
            class="font-semibold text-marathon-dark hover:text-marathon-darker transition-colors"
          >Log in</RouterLink>
        </p>

        <div class="mt-6 bg-marathon-light/70 rounded-2xl p-4 flex gap-3">
          <Quote :size="18" class="text-marathon-dark/50 shrink-0 mt-0.5" />
          <div>
            <p class="text-sm text-marathon-darker leading-relaxed italic">
              "Thy word is a lamp unto my feet, and a light unto my path."
            </p>
            <p class="text-xs font-semibold text-marathon-dark/60 mt-1">Psalm 119:105</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
