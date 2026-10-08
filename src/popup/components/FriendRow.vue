<script setup lang="ts">
import type {ContextMenuItem} from '@nuxt/ui';
import {computed} from 'vue';
import LocationBadges from '../../components/base/LocationBadges.vue';
import UserAvatar from '../../components/base/UserAvatar.vue';
import {type Friend, useFriends} from '../../composables/useFriends';
import {useFriendDetails} from '../../composables/useFriendDetails';
import {useWorlds} from '../../composables/useWorlds';
import {userImageUrl} from '../../shared/vrchat-api';
import {useInstanceJoin} from './useInstanceJoin';

const props = defineProps<{friend: Friend}>();

const {toggleFavorite} = useFriends();
const {open} = useFriendDetails();
const {worldOf} = useWorlds();
const {joining, join} = useInstanceJoin();

const instance = computed(() => props.friend.place.kind === 'instance' ? props.friend.place : null);
const world = computed(() => worldOf(instance.value?.worldId));

const placeLabel = computed(() => {
  switch (props.friend.place.kind) {
    case 'instance':
      return world.value?.name ?? 'Loading world…';
    case 'private':
      return 'Private world';
    case 'traveling':
      return 'Traveling…';
    case 'website':
      return 'On the website';
    default:
      return null;
  }
});

const PLACE_ICONS: Record<Friend['place']['kind'], string> = {
  instance: 'i-lucide-map-pin',
  private: 'i-lucide-eye-off',
  traveling: 'i-lucide-plane',
  website: 'i-lucide-monitor',
  offline: 'i-lucide-moon'
};

function joinInstance(): void {
  if (instance.value) join(instance.value.location, world.value?.name);
}

const menuItems = computed<ContextMenuItem[][]>(() => [
  [{type: 'label', label: props.friend.displayName}],
  [
    {label: 'View details', icon: 'i-lucide-circle-user-round', onSelect: () => open(props.friend.id)},
    {
      label: props.friend.favorite ? 'Remove from favorites' : 'Add to favorites',
      icon: props.friend.favorite ? 'i-lucide-star-off' : 'i-lucide-star',
      onSelect: () => toggleFavorite(props.friend.id)
    },
    {label: 'Join', icon: 'i-lucide-door-open', disabled: !instance.value, onSelect: joinInstance}
  ],
  [{
    label: 'Profile on vrchat.com',
    icon: 'i-lucide-external-link',
    onSelect: () => chrome.tabs.create({url: `https://vrchat.com/home/user/${props.friend.id}`})
  }]
]);
</script>

<template>
  <UContextMenu :items="menuItems" :ui="{content: 'w-52'}">
    <div
        role="button"
        tabindex="0"
        class="group flex w-full cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-elevated focus-visible:bg-elevated focus-visible:outline-none"
        @click="open(friend.id)"
        @keydown.enter="open(friend.id)"
    >
      <UserAvatar
          :src="userImageUrl(friend)"
          :name="friend.displayName"
          :presence="friend.presence"
          :favorite="friend.favorite"
      />

      <div class="min-w-0 flex-1">
        <p class="truncate font-display text-sm font-semibold text-highlighted">{{ friend.displayName }}</p>
        <p v-if="friend.statusDescription" class="truncate text-xs text-muted">{{ friend.statusDescription }}</p>
        <div v-if="placeLabel && friend.presence.key !== 'offline'" class="mt-0.5 flex min-w-0 items-center gap-1.5">
          <UIcon :name="PLACE_ICONS[friend.place.kind]" class="size-3 shrink-0 text-dimmed"/>
          <span class="truncate text-xs text-dimmed">{{ placeLabel }}</span>
          <LocationBadges v-if="instance" :place="friend.place" class="shrink-0 scale-90 origin-left"/>
        </div>
      </div>

      <UTooltip v-if="instance" text="Send me an invite">
        <UButton
            icon="i-lucide-door-open"
            color="primary"
            variant="ghost"
            size="sm"
            :loading="joining === instance.location"
            class="opacity-70 group-hover:opacity-100"
            aria-label="Join"
            @click.stop="joinInstance"
        />
      </UTooltip>
    </div>
  </UContextMenu>
</template>
