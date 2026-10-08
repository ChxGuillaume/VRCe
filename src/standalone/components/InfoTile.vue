<script setup lang="ts">
defineProps<{icon: string; label: string; value?: string}>();
</script>

<template>
  <div class="flex items-start gap-3 rounded-lg bg-default/50 p-3 ring-1 ring-default">
    <span class="grid size-8 shrink-0 place-items-center rounded-md bg-elevated text-muted ring-1 ring-default">
      <UIcon :name="icon" class="size-4"/>
    </span>
    <div class="min-w-0">
      <p class="text-[11px] font-medium tracking-wide text-dimmed uppercase">{{ label }}</p>
      <div class="mt-0.5 text-sm text-highlighted">
        <slot>{{ value || '—' }}</slot>
      </div>
    </div>
  </div>
</template>
