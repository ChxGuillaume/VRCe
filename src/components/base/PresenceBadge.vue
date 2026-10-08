<script setup lang="ts">
import type {Presence} from '../../lib/vrchat';

defineProps<{presence: Presence}>();
</script>

<template>
  <span
      class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap"
      :style="{background: `color-mix(in oklab, ${presence.color} 14%, transparent)`, color: presence.color}"
  >
    <span class="size-1.5 rounded-full" :style="{background: presence.color}"/>
    {{ presence.label }}
  </span>
</template>
