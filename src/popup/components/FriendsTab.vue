<script setup lang="ts">
import {computed, reactive, ref} from 'vue';
import {type Friend, useFriends} from '../../composables/useFriends';
import {PRESENCES, type PresenceKey} from '../../lib/vrchat';
import FriendRow from './FriendRow.vue';

const {friends, loading, loaded} = useFriends();

const search = ref('');

interface FriendSection {
  key: 'favorites' | PresenceKey;
  label: string;
  color?: string;
  friends: Friend[];
}

const PRESENCE_ORDER: PresenceKey[] = ['join-me', 'online', 'ask-me', 'busy', 'active', 'offline'];

// Offline friends are collapsed by default, they are usually the longest list.
const collapsed = reactive<Record<FriendSection['key'], boolean>>({
  'favorites': false,
  'join-me': false,
  'online': false,
  'ask-me': false,
  'busy': false,
  'active': false,
  'offline': true
});

const filtered = computed(() => {
  const query = search.value.trim().toLowerCase();

  return query ? friends.value.filter(friend => friend.displayName.toLowerCase().includes(query)) : friends.value;
});

const sections = computed<FriendSection[]>(() => {
  // Online favorites get their own section, offline ones stay with the offline friends.
  const isPinned = (friend: Friend) => friend.favorite && friend.presence.key !== 'offline';
  const favorites: FriendSection = {key: 'favorites', label: 'Favorites', friends: filtered.value.filter(isPinned)};

  const byPresence = PRESENCE_ORDER.map<FriendSection>(key => ({
    key,
    label: PRESENCES[key].label,
    color: PRESENCES[key].color,
    friends: filtered.value.filter(friend => friend.presence.key === key && !isPinned(friend))
  }));

  return [favorites, ...byPresence].filter(section => section.friends.length);
});

const onlineCount = computed(() => friends.value.filter(friend => friend.presence.key !== 'offline').length);

// While searching, every section is expanded so matches are visible.
const isOpen = (section: FriendSection) => !!search.value.trim() || !collapsed[section.key];
</script>

<template>
  <div class="flex min-h-full flex-col">
    <div class="sticky top-0 z-10 bg-default/85 px-3 pt-3 pb-2 backdrop-blur">
      <UInput
          v-model="search"
          icon="i-lucide-search"
          placeholder="Search friends"
          variant="soft"
          class="w-full"
          :ui="{base: 'bg-elevated/70 ring-1 ring-default'}"
      >
        <template #trailing>
          <UButton
              v-if="search"
              icon="i-lucide-x"
              color="neutral"
              variant="link"
              size="xs"
              aria-label="Clear search"
              @click="search = ''"
          />
          <span v-else-if="loaded" class="text-xs text-dimmed tabular-nums">{{ onlineCount }} online</span>
        </template>
      </UInput>
    </div>

    <div v-if="!loaded" class="space-y-1 px-3 pt-1">
      <div v-for="index in 7" :key="index" class="flex items-center gap-3 px-2.5 py-2">
        <USkeleton class="size-8 rounded-full"/>
        <div class="flex-1 space-y-1.5">
          <USkeleton class="h-3.5 w-32"/>
          <USkeleton class="h-3 w-48"/>
        </div>
      </div>
    </div>

    <UEmpty
        v-else-if="!sections.length"
        :icon="search ? 'i-lucide-search-x' : 'i-lucide-users'"
        :title="search ? 'No friend matches' : 'No friends yet'"
        :description="search ? `Nobody is called “${search}”.` : 'Your VRChat friends will show up here.'"
        variant="naked"
        class="flex-1"
    />

    <div v-else class="space-y-2 px-2 pb-3">
      <section v-for="section of sections" :key="section.key">
        <button
            type="button"
            class="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold tracking-wide text-muted uppercase transition-colors hover:text-default"
            @click="collapsed[section.key] = !collapsed[section.key]"
        >
          <UIcon v-if="section.key === 'favorites'" name="i-lucide-star" class="size-3.5 fill-amber-400 text-amber-400"/>
          <span v-else class="size-2 rounded-full" :style="{background: section.color, boxShadow: `0 0 8px ${section.color}`}"/>
          {{ section.label }}
          <span class="rounded-full bg-elevated px-1.5 py-px text-[10px] text-dimmed tabular-nums">{{ section.friends.length }}</span>
          <span class="h-px flex-1 bg-(--ui-border)"/>
          <UIcon
              name="i-lucide-chevron-down"
              class="size-4 transition-transform"
              :class="isOpen(section) ? '' : '-rotate-90'"
          />
        </button>

        <div v-if="isOpen(section)" class="mt-0.5 space-y-0.5">
          <FriendRow v-for="friend of section.friends" :key="friend.id" :friend="friend"/>
        </div>
      </section>

      <p v-if="loading" class="flex items-center justify-center gap-2 py-2 text-xs text-dimmed">
        <UIcon name="i-lucide-loader-circle" class="size-3.5 animate-spin"/>
        Loading offline friends…
      </p>
    </div>
  </div>
</template>
