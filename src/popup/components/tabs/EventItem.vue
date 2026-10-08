<script setup lang="ts">
import {computed, ref} from 'vue';
import LocationBadges from '../../../components/base/LocationBadges.vue';
import {useFriendDetails} from '../../../composables/useFriendDetails';
import {chosenStatus, formatDate, fromNow, parseLocation} from '../../../lib/vrchat';
import type {EventUser, PipelineEvent} from '../../../types/events';
import {eventMessage, eventSentence, eventStyle, type UserChange} from './events';

export interface EventEntry {
  event: PipelineEvent;
  user?: EventUser;
  name: string;
  image?: string;
  changes: UserChange[];
}

const props = defineProps<{entry: EventEntry}>();

const {open: openDetails} = useFriendDetails();

const style = computed(() => eventStyle(props.entry.event));
const sentence = computed(() => eventSentence(props.entry.event));
const message = computed(() => eventMessage(props.entry.event));
const place = computed(() => props.entry.event.type === 'friend-location' ? parseLocation(props.entry.event.content.location) : null);
const worldImage = computed(() => props.entry.event.content.world?.thumbnailImageUrl);
const userId = computed(() => props.entry.user?.id ?? props.entry.event.content.userId ?? props.entry.event.content.senderUserId);

const expanded = ref(false);

function openUser(): void {
  if (userId.value && props.entry.event.type !== 'user-update') openDetails(userId.value);
}
</script>

<template>
  <div class="group rounded-lg px-1.5 py-2 transition hover:bg-elevated/60">
    <div class="flex items-start gap-2.5">
      <button type="button" class="relative shrink-0" @click="openUser">
        <UAvatar :src="entry.image" :alt="entry.name" size="md" class="bg-elevated ring-1 ring-default"/>
        <span
            class="absolute -right-1 -bottom-1 flex size-4.5 items-center justify-center rounded-full ring-2 ring-(--ui-bg)"
            :style="{background: style.color}"
        >
          <UIcon :name="style.icon" class="size-2.5 text-black/80"/>
        </span>
      </button>

      <div class="min-w-0 flex-1">
        <p class="text-sm leading-snug">
          <button type="button" class="font-semibold text-highlighted hover:underline" @click="openUser">{{ entry.name }}</button>
          <span class="text-muted">{{ ` ${sentence}` }}</span>
        </p>

        <div v-if="place && place.kind === 'instance'" class="mt-1">
          <LocationBadges :place="place"/>
        </div>

        <p v-if="message" class="mt-1 line-clamp-2 rounded-md bg-muted px-2 py-1 text-xs text-toned italic">“{{ message }}”</p>

        <button
            v-if="entry.changes.length"
            type="button"
            class="mt-1 flex items-center gap-1 text-xs text-primary hover:underline"
            @click="expanded = !expanded"
        >
          <UIcon name="i-lucide-chevron-right" class="size-3.5 transition" :class="expanded && 'rotate-90'"/>
          {{ entry.changes.map(change => change.label).join(', ') }}
        </button>

        <ul v-if="expanded" class="mt-1.5 flex flex-col gap-1.5 rounded-lg bg-muted p-2 ring-1 ring-default">
          <li v-for="change of entry.changes" :key="change.key" class="text-xs">
            <span class="mb-0.5 block text-[10px] font-semibold tracking-wider text-dimmed uppercase">{{ change.label }}</span>

            <div v-if="change.kind === 'image'" class="flex items-center gap-2">
              <img :src="change.previous" alt="" class="h-10 w-14 rounded object-cover opacity-60">
              <UIcon name="i-lucide-arrow-right" class="size-3.5 text-dimmed"/>
              <img :src="change.current" alt="" class="h-10 w-14 rounded object-cover">
            </div>

            <div v-else-if="change.kind === 'status'" class="flex items-center gap-2">
              <span :style="{color: chosenStatus(change.previous).color}" class="opacity-70">{{ chosenStatus(change.previous).label }}</span>
              <UIcon name="i-lucide-arrow-right" class="size-3.5 text-dimmed"/>
              <span :style="{color: chosenStatus(change.current).color}">{{ chosenStatus(change.current).label }}</span>
            </div>

            <div v-else class="flex flex-col gap-0.5">
              <span class="text-dimmed line-through">{{ change.previous || '(empty)' }}</span>
              <span class="text-default">{{ change.current || '(empty)' }}</span>
            </div>
          </li>
        </ul>
      </div>

      <div class="flex shrink-0 flex-col items-end gap-1">
        <UTooltip :text="formatDate(entry.event.date, 'YYYY-MM-DD HH:mm:ss')">
          <span class="text-[11px] whitespace-nowrap text-dimmed">{{ fromNow(entry.event.date) }}</span>
        </UTooltip>
        <img v-if="worldImage" :src="worldImage" alt="" class="h-8 w-12 rounded object-cover ring-1 ring-default">
      </div>
    </div>
  </div>
</template>
