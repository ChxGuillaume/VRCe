<script setup lang="ts">
import type {TrustRank} from '../../lib/vrchat';

defineProps<{rank: TrustRank}>();
</script>

<template>
  <span
      class="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap"
      :style="{borderColor: `color-mix(in oklab, ${rank.color} 45%, transparent)`, color: rank.color}"
  >
    <UIcon name="i-lucide-shield-check" class="size-3"/>
    {{ rank.label }}
  </span>
</template>
