<script setup lang="ts">
import {computed} from 'vue';
import {type PresenceKey, PRESENCES, RANKS} from '../../lib/vrchat';
import type {DashboardFriend} from './useDashboardFriends';

const props = defineProps<{rows: DashboardFriend[]; loaded: boolean}>();

const IN_GAME: PresenceKey[] = ['join-me', 'online', 'ask-me', 'busy'];

const countBy = (keys: PresenceKey[]) => props.rows.filter(row => keys.includes(row.presence.key)).length;

const cards = computed(() => [
  {label: 'Friends', value: props.rows.length, icon: 'i-lucide-users', accent: 'from-aurora-500/25'},
  {label: 'In VRChat', value: countBy(IN_GAME), icon: 'i-lucide-gamepad-2', accent: 'from-emerald-500/20'},
  {label: 'On the website', value: countBy(['active']), icon: 'i-lucide-monitor', accent: 'from-amber-400/20'},
  {label: 'Offline', value: countBy(['offline']), icon: 'i-lucide-moon', accent: 'from-zinc-500/20'}
]);

const presences = computed(() => Object.values(PRESENCES)
    .filter(presence => presence.key !== 'offline')
    .map(presence => ({...presence, count: countBy([presence.key])})));

const ranked = computed(() => props.rows.filter(row => row.rank));

const ranks = computed(() => Object.values(RANKS)
    .map(rank => ({...rank, count: ranked.value.filter(row => row.rank?.key === rank.key).length}))
    .filter(rank => rank.count)
    .reverse());
</script>

<template>
  <div class="grid shrink-0 grid-cols-2 gap-3 md:grid-cols-4">
    <div
        v-for="card in cards"
        :key="card.label"
        class="relative overflow-hidden rounded-xl bg-elevated/50 p-4 ring-1 ring-default"
    >
      <div class="pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent to-60%" :class="card.accent"/>
      <div class="relative flex items-start justify-between gap-3">
        <div>
          <p class="text-xs font-medium tracking-wide text-muted uppercase">{{ card.label }}</p>
          <USkeleton v-if="!loaded" class="mt-1 h-9 w-14"/>
          <p v-else class="mt-1 font-display text-3xl font-bold text-highlighted tabular-nums">{{ card.value }}</p>
        </div>
        <span class="grid size-9 place-items-center rounded-lg bg-default/60 ring-1 ring-default">
          <UIcon :name="card.icon" class="size-4.5 text-muted"/>
        </span>
      </div>
    </div>
  </div>

  <div class="grid shrink-0 gap-3 md:grid-cols-2">
    <div class="rounded-xl bg-elevated/50 p-4 ring-1 ring-default">
      <p class="mb-3 text-xs font-medium tracking-wide text-muted uppercase">Presence</p>
      <div class="flex flex-wrap gap-x-5 gap-y-2">
        <span v-for="presence in presences" :key="presence.key" class="inline-flex items-center gap-2 text-sm">
          <span class="size-2.5 rounded-full" :style="{background: presence.color, boxShadow: `0 0 10px ${presence.color}80`}"/>
          <span class="text-muted">{{ presence.label }}</span>
          <span class="font-semibold text-highlighted tabular-nums">{{ presence.count }}</span>
        </span>
      </div>
    </div>

    <div class="rounded-xl bg-elevated/50 p-4 ring-1 ring-default">
      <div class="mb-3 flex items-center justify-between">
        <p class="text-xs font-medium tracking-wide text-muted uppercase">Trust ranks</p>
        <p v-if="ranked.length < rows.length" class="text-xs text-dimmed">{{ ranked.length }}/{{ rows.length }} known</p>
      </div>

      <div v-if="ranked.length" class="flex h-2.5 overflow-hidden rounded-full bg-accented">
        <UTooltip v-for="rank in ranks" :key="rank.key" :text="`${rank.label}: ${rank.count}`">
          <span class="h-full transition-all" :style="{width: `${rank.count / ranked.length * 100}%`, background: rank.color}"/>
        </UTooltip>
      </div>
      <USkeleton v-else class="h-2.5 w-full rounded-full"/>

      <div class="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        <span v-for="rank in ranks" :key="rank.key" class="inline-flex items-center gap-1.5 text-xs">
          <span class="size-2 rounded-full" :style="{background: rank.color}"/>
          <span class="text-muted">{{ rank.label }}</span>
          <span class="font-semibold text-highlighted tabular-nums">{{ rank.count }}</span>
        </span>
      </div>
    </div>
  </div>
</template>
