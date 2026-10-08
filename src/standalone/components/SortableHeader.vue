<script setup lang="ts">
import {computed} from 'vue';

// The part of a TanStack table column this header needs.
export interface SortableColumn {
  getIsSorted(): false | 'asc' | 'desc';
  toggleSorting(desc?: boolean): void;
}

const props = defineProps<{column: SortableColumn; label: string}>();

const sorted = computed(() => props.column.getIsSorted());
</script>

<template>
  <UButton
      color="neutral"
      variant="ghost"
      size="xs"
      :label="label"
      :trailing-icon="sorted === 'asc' ? 'i-lucide-arrow-up-narrow-wide' : sorted === 'desc' ? 'i-lucide-arrow-down-wide-narrow' : 'i-lucide-arrow-up-down'"
      class="-mx-2 text-xs font-semibold"
      :class="sorted ? 'text-highlighted' : 'text-muted'"
      :ui="{trailingIcon: sorted ? 'text-primary' : 'opacity-40'}"
      @click="column.toggleSorting(sorted === 'asc')"
  />
</template>
