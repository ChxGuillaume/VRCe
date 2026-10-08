<script setup lang="ts">
import type {Presence, TrustRank} from '../../lib/vrchat';

// Large avatar for hero areas: rounded square, rank colored ring and glow, presence dot.
withDefaults(defineProps<{src?: string; name: string; presence?: Presence | null; rank?: TrustRank | null; size?: 'md' | 'lg'}>(), {size: 'lg'});
</script>

<template>
  <div class="relative shrink-0" :class="size === 'lg' ? 'size-28' : 'size-20'">
    <div
        class="size-full overflow-hidden rounded-2xl bg-elevated ring-2"
        :style="{
          '--tw-ring-color': rank?.color ?? 'var(--ui-border-accented)',
          boxShadow: rank ? `0 0 40px -8px ${rank.color}99` : undefined
        }"
    >
      <img v-if="src" :src="src" :alt="name" class="size-full object-cover">
      <span v-else class="grid size-full place-items-center font-display text-3xl font-bold text-muted uppercase">
        {{ name.slice(0, 1) }}
      </span>
    </div>
    <span
        v-if="presence"
        class="absolute -right-1.5 -bottom-1.5 rounded-full ring-4 ring-(--ui-bg)"
        :class="size === 'lg' ? 'size-5' : 'size-4'"
        :style="{background: presence.color}"
        :title="presence.label"
    />
  </div>
</template>
