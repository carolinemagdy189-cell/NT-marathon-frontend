<script setup>
import { RouterView, useRoute } from 'vue-router'

// Keyed by path so nested routes (e.g. /admin/participants/:id) transition too.
const route = useRoute()
</script>

<template>
  <RouterView v-slot="{ Component }">
    <Transition name="page" mode="out-in">
      <component :is="Component" :key="route.path" />
    </Transition>
  </RouterView>
</template>
