```vue
<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  BookOpen,
  CalendarDays,
  Mail,
  ArrowLeft,
  Quote,
  Flower2,
} from 'lucide-vue-next'

import coverImage from '../assets/cover.jpg'

import { useAuthStore } from '../stores/auth'
import FormInput from '../components/common/FormInput.vue'
import PasswordInput from '../components/common/PasswordInput.vue'
import LoadingButton from '../components/common/LoadingButton.vue'
import FormError from '../components/common/FormError.vue'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const form = reactive({
  email: '',
  password: '',
})

const fieldErrors = reactive({
  email: '',
  password: '',
})

const submitting = ref(false)

const dateLabel = 'Oct 1 – Dec 28, 2026 • 260 Ch • 89 Days'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateField(field) {
  if (field === 'email') {
    if (!form.email.trim()) {
      fieldErrors.email = 'Email is required.'
    } else if (!EMAIL_PATTERN.test(form.email.trim())) {
      fieldErrors.email = 'Please enter a valid email address.'
    } else {
      fieldErrors.email = ''
    }
  }

  if (field === 'password') {
    if (!form.password) {
      fieldErrors.password = 'Password is required.'
    } else {
      fieldErrors.password = ''
    }
  }
}

const formValid = computed(
  () =>
    form.email.trim() &&
    EMAIL_PATTERN.test(form.email.trim()) &&
    form.password &&
    !fieldErrors.email &&
    !fieldErrors.password
)

async function handleSubmit() {
  auth.error = null

  validateField('email')
  validateField('password')

  if (!formValid.value) return

  submitting.value = true

  try {
    await auth.login({
      email: form.email.trim(),
      password: form.password,
    })

    navigateAfterAuth()
  } catch {
    // auth.error already holds the friendly API message shown below.
  } finally {
    submitting.value = false
  }
}

/**
 * Route to the page the user originally requested,
 * or by backend role.
 */
function navigateAfterAuth() {
  const redirect = route.query.redirect

  if (
    redirect &&
    typeof redirect === 'string' &&
    redirect.startsWith('/')
  ) {
    router.push(redirect)
  } else {
    router.push(auth.homeRoute)
  }
}
</script>

<template>
  <div dir="ltr" class="min-h-screen bg-marathon-cream font-sans">
    <div class="max-w-md mx-auto px-5 pt-8 pb-12">

      <!-- Header -->
      <div class="flex items-start gap-3 mb-5">
        <div
          class="w-9 h-9 rounded-xl bg-marathon-light flex items-center justify-center shrink-0"
        >
          <BookOpen
            :size="18"
            class="text-marathon-dark"
          />
        </div>

        <div>
          <p
            class="text-xs font-semibold tracking-wide text-marathon-green"
          >
            RIDE
          </p>

          <h1
            class="text-xl font-extrabold text-marathon-darker leading-tight"
          >
            NEW TESTAMENT
          </h1>
        </div>
      </div>

      <!-- Date badge -->
      <div
        class="inline-flex items-center gap-2 bg-marathon-light text-marathon-dark text-sm font-medium px-4 py-2 rounded-full mb-5"
      >
        <CalendarDays :size="15" />

        <span>
          {{ dateLabel }}
        </span>
      </div>

      <!-- Hero image -->
      <div
        class="relative rounded-2xl overflow-hidden h-44 mb-6 shadow-soft"
      >
        <img
          :src="coverImage"
          alt="Open Bible under olive trees"
          class="absolute inset-0 w-full h-full object-cover"
        />

        <!-- Bottom gradient -->
        <div
          class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/5"
        ></div>

        <!-- Image text -->
        <div
          class="absolute bottom-4 left-4 right-4 text-white"
        >
          <p
            class="text-xs font-semibold tracking-wide opacity-90 mb-1"
          >
            NEW TESTAMENT JOURNEY
          </p>

          <p
            class="text-lg font-bold leading-snug"
          >
            Grow in the Word, together.
          </p>
        </div>
      </div>

      <!-- Form card -->
      <div class="card-surface p-6">

        <!-- Welcome -->
        <div
          class="flex flex-col items-center text-center mb-6"
        >
          <div
            class="w-14 h-14 rounded-2xl bg-marathon-light flex items-center justify-center mb-4"
          >
            <Flower2
              :size="26"
              class="text-marathon-dark"
            />
          </div>

          <h2
            class="text-2xl font-extrabold text-marathon-darker mb-2"
          >
            Welcome Back
          </h2>

          <p
            class="text-sm text-marathon-dark/60 leading-relaxed"
          >
            Log in to continue your marathon journey.
          </p>
        </div>

        <!-- Login form -->
        <form
          class="space-y-5"
          novalidate
          @submit.prevent="handleSubmit"
        >

          <!-- Email -->
          <FormInput
            id="login-email"
            v-model="form.email"
            name="email"
            type="email"
            label="Email Address"
            hint="Your registered email"
            placeholder="e.g. caroline@example.com"
            autocomplete="email"
            :icon="Mail"
            :error="fieldErrors.email"
            @blur="validateField('email')"
          />

          <!-- Password -->
          <PasswordInput
            id="login-password"
            v-model="form.password"
            name="password"
            label="Password"
            hint="Keep it safe"
            placeholder="Enter your password"
            autocomplete="current-password"
            :error="fieldErrors.password"
            @blur="validateField('password')"
          />

          <!-- API error -->
          <FormError
            :message="auth.error"
          />

          <!-- Login button -->
          <LoadingButton
            type="submit"
            label="Log In"
            loading-label="Signing in…"
            :loading="submitting"
            :icon="ArrowLeft"
            icon-class="rotate-180"
          />
        </form>

        <!-- Sign up -->
        <p
          class="text-sm text-center text-marathon-dark/60 mt-6"
        >
          Don't have an account?

          <RouterLink
            to="/signup"
            class="font-semibold text-marathon-dark hover:text-marathon-darker transition-colors"
          >
            Sign up
          </RouterLink>
        </p>

        <!-- Bible verse -->
        <div
          class="mt-6 bg-marathon-light/70 rounded-2xl p-4 flex gap-3"
        >
          <Quote
            :size="18"
            class="text-marathon-dark/50 shrink-0 mt-0.5"
          />

          <div>
            <p
              class="text-sm text-marathon-darker leading-relaxed italic"
            >
              "Thy word is a lamp unto my feet, and a light unto my path."
            </p>

            <p
              class="text-xs font-semibold text-marathon-dark/60 mt-1"
            >
              Psalm 119:105
            </p>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>
