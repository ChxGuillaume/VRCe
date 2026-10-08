<script setup lang="ts">
withDefaults(defineProps<{compact?: boolean}>(), {compact: false});
</script>

<template>
  <span class="inline-flex items-center gap-2 select-none">
    <img src="/icons/vrce-logo-48_x_48.png" alt="" class="size-7 rounded-lg shadow-[0_0_24px_-4px] shadow-primary/60">
    <span
        v-if="!compact"
        class="font-display text-lg font-bold tracking-tight bg-gradient-to-r from-aurora-300 via-aurora-400 to-cyan-300 bg-clip-text text-transparent"
    >VRCe</span>
  </span>
</template>
