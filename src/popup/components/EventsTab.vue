<script setup lang="ts">
import {computed, reactive, ref, watch} from 'vue';
import dayjs from 'dayjs';
import EventItem, {type EventEntry} from './tabs/EventItem.vue';
import {useEvents} from '../../composables/useEvents';
import {useFriends} from '../../composables/useFriends';
import {getUserWithProfile, userImageUrl} from '../../shared/vrchat-api';
import type {EventUser, PipelineEvent} from '../../types/events';
import {
  DEFAULT_TYPES,
  EVENT_TYPES,
  dayLabel,
  TYPES_STORAGE_KEY,
  UPDATE_TYPES,
  userChanges
} from './tabs/events';

const PAGE_SIZE = 60;

const {events, ready} = useEvents();
const {friendById} = useFriends();

function loadTypes(): string[] {
  try {
    const stored = localStorage.getItem(TYPES_STORAGE_KEY);
    if (stored) return JSON.parse(stored) as string[];
  } catch (e) {
    console.warn('Could not read the event filter', e);
  }

  return [...DEFAULT_TYPES];
}

const shownTypes = ref<string[]>(loadTypes());
const search = ref('');
const shownCount = ref(PAGE_SIZE);

watch(shownTypes, types => {
  localStorage.setItem(TYPES_STORAGE_KEY, JSON.stringify(types));
  shownCount.value = PAGE_SIZE;
});
watch(search, () => shownCount.value = PAGE_SIZE);

// Users the events don't carry (offline / removed friends), fetched once per id.
const fetchedUsers = reactive(new Map<string, EventUser | null>());

function fetchUser(userId: string): void {
  if (fetchedUsers.has(userId)) return;

  fetchedUsers.set(userId, null);
  getUserWithProfile(userId)
      .then(user => fetchedUsers.set(userId, user))
      .catch(e => console.warn(`Could not fetch user ${userId}`, e));
}

function eventUser(event: PipelineEvent): EventUser | undefined {
  if (event.content.user) return event.content.user;

  // Notifications only name their sender.
  const userId = event.content.userId ?? (event.type === 'notification' ? event.content.senderUserId : undefined);
  if (!userId) return undefined;

  const friend = friendById(userId);
  if (friend) return {
    id: friend.id,
    displayName: friend.displayName,
    status: friend.status,
    statusDescription: friend.statusDescription,
    currentAvatarImageUrl: friend.currentAvatarImageUrl,
    iconUrl: friend.iconUrl
  };

  // Fetched outside of the computed evaluation.
  if (!fetchedUsers.has(userId)) queueMicrotask(() => fetchUser(userId));

  return fetchedUsers.get(userId) ?? undefined;
}

// Events are newest first, so the previous version of a user is in the next update event about them.
function previousUser(index: number, userId: string): EventUser | undefined {
  for (let i = index + 1; i < events.value.length; i++) {
    const other = events.value[i]!;

    if (UPDATE_TYPES.includes(other.type) && other.content.user?.id === userId) return other.content.user;
  }

  return undefined;
}

const entries = computed<EventEntry[]>(() => events.value.flatMap((event, index) => {
  const user = eventUser(event);
  const previous = UPDATE_TYPES.includes(event.type) && user ? previousUser(index, user.id) : undefined;
  const changes = previous && user ? userChanges(previous, user) : [];

  // A friend update we can't diff is just noise.
  if (event.type === 'friend-update' && !changes.length) return [];

  return [{
    event,
    user,
    name: user?.displayName ?? event.content.senderUsername ?? 'Someone',
    image: user ? userImageUrl(user) : undefined,
    changes
  }];
}));

const filtered = computed(() => {
  const query = search.value.trim().toLowerCase();

  return entries.value.filter(({event, name}) => shownTypes.value.includes(event.type) && (!query
      || name.toLowerCase().includes(query)
      || !!event.content.world?.name?.toLowerCase().includes(query)
      || !!event.content.details?.worldName?.toLowerCase().includes(query)));
});

const days = computed(() => {
  const groups: {label: string; key: string; entries: EventEntry[]}[] = [];

  for (const entry of filtered.value.slice(0, shownCount.value)) {
    const key = dayjs(entry.event.date).format('YYYY-MM-DD');
    const last = groups.at(-1);

    if (last?.key === key) last.entries.push(entry);
    else groups.push({key, label: dayLabel(entry.event.date), entries: [entry]});
  }

  return groups;
});
</script>

<template>
  <div class="flex flex-col">
    <div class="sticky top-0 z-20 flex gap-2 bg-default/85 px-3 pt-3 pb-2 backdrop-blur">
      <UInput
          v-model="search"
          icon="i-lucide-search"
          placeholder="Search people or worlds"
          size="sm"
          class="flex-1"
      />
      <USelectMenu
          v-model="shownTypes"
          :items="EVENT_TYPES"
          value-key="value"
          multiple
          :search-input="false"
          :ui="{content: 'min-w-52'}"
          icon="i-lucide-list-filter"
          size="sm"
          class="w-32"
          :content="{align: 'end'}"
      >
        <span class="truncate text-muted">{{ shownTypes.length }}/{{ EVENT_TYPES.length }} types</span>
      </USelectMenu>
    </div>

    <div v-if="!ready" class="flex flex-col gap-2 px-3 py-2">
      <div v-for="i in 6" :key="i" class="flex items-center gap-3">
        <USkeleton class="size-9 rounded-full"/>
        <div class="flex flex-1 flex-col gap-1.5">
          <USkeleton class="h-3 w-3/4"/>
          <USkeleton class="h-2.5 w-1/3"/>
        </div>
      </div>
    </div>

    <UEmpty
        v-else-if="!filtered.length"
        icon="i-lucide-radio"
        :title="events.length ? 'No matching events' : 'No events yet'"
        :description="events.length ? 'Try another search or enable more event types.' : 'Events show up here live as your friends move around.'"
        variant="naked"
        class="py-12"
    />

    <template v-else>
      <section v-for="day of days" :key="day.key">
        <h3 class="sticky top-[52px] z-10 bg-default/85 px-3 py-1.5 text-[11px] font-semibold tracking-wider text-dimmed uppercase backdrop-blur">
          {{ day.label }}
        </h3>
        <ul class="flex flex-col px-1.5">
          <li v-for="entry of day.entries" :key="entry.event.uid">
            <EventItem :entry="entry"/>
          </li>
        </ul>
      </section>

      <div class="flex justify-center p-3">
        <UButton
            v-if="filtered.length > shownCount"
            label="Load more"
            icon="i-lucide-chevrons-down"
            color="neutral"
            variant="subtle"
            size="sm"
            @click="shownCount += PAGE_SIZE"
        />
        <span v-else class="text-xs text-dimmed">Events are kept for 24 hours</span>
      </div>
    </template>
  </div>
</template>
