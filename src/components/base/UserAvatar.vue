<script setup lang="ts">
import {computed} from 'vue';
import type {Presence, TrustRank} from '../../lib/vrchat';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';

const props = withDefaults(defineProps<{
  src?: string;
  name: string;
  presence?: Presence | null;
  // Draws a ring in the trust rank color.
  rank?: TrustRank | null;
  favorite?: boolean;
  size?: AvatarSize;
}>(), {size: 'md'});

const DOT_SIZES: Record<AvatarSize, string> = {
  'xs': 'size-2',
  'sm': 'size-2.5',
  'md': 'size-3',
  'lg': 'size-3.5',
  'xl': 'size-4',
  '2xl': 'size-4.5',
  '3xl': 'size-5'
};

const ringStyle = computed(() => props.rank ? {'--tw-ring-color': props.rank.color} : undefined);
</script>

<template>
  <span class="relative inline-flex shrink-0">
    <UAvatar
        :src="src"
        :alt="name"
        :size="size"
        class="bg-elevated"
        :class="rank ? 'ring-2 ring-offset-2 ring-offset-(--ui-bg)' : 'ring-1 ring-default'"
        :style="ringStyle"
    />
    <span
        v-if="presence"
        class="absolute -right-0.5 -bottom-0.5 rounded-full ring-2 ring-(--ui-bg)"
        :class="DOT_SIZES[size]"
        :style="{background: presence.color}"
        :title="presence.label"
    />
    <UIcon
        v-if="favorite"
        name="i-lucide-star"
        class="absolute -top-1 -right-1 size-3.5 fill-amber-400 text-amber-400 drop-shadow"
    />
  </span>
</template>
