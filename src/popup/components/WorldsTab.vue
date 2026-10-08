<script setup lang="ts">
import {computed, ref} from 'vue';
import {useToast} from '@nuxt/ui/composables';
import LocationBadges from '../../components/base/LocationBadges.vue';
import UserAvatar from '../../components/base/UserAvatar.vue';
import {type Friend, useFriends} from '../../composables/useFriends';
import {useFriendDetails} from '../../composables/useFriendDetails';
import {useWorlds} from '../../composables/useWorlds';
import {launchUrl, type ParsedLocation} from '../../lib/vrchat';
import {inviteMyselfTo, userImageUrl} from '../../shared/vrchat-api';

type InstancePlace = Extract<ParsedLocation, {kind: 'instance'}>;

interface InstanceGroup {
  place: InstancePlace;
  friends: Friend[];
}

const PRIVATE_WORLD_IMAGE = 'https://assets.vrchat.com/www/images/default_private_image.png';

const {friends, loaded} = useFriends();
const {worldOf} = useWorlds();
const {open: openDetails} = useFriendDetails();
const toast = useToast();

const instances = computed<InstanceGroup[]>(() => {
  const groups = new Map<string, InstanceGroup>();

  for (const friend of friends.value) {
    if (friend.place.kind !== 'instance') continue;

    const group = groups.get(friend.place.location);
    if (group) group.friends.push(friend);
    else groups.set(friend.place.location, {place: friend.place, friends: [friend]});
  }

  return [...groups.values()].sort((a, b) => b.friends.length - a.friends.length);
});

const privateFriends = computed(() => friends.value.filter(friend => friend.place.kind === 'private'));

const inviting = ref<string | null>(null);

async function joinInstance(location: string): Promise<void> {
  inviting.value = location;

  try {
    await inviteMyselfTo(location);
    toast.add({title: 'Invite sent', description: 'Check your notifications in VRChat.', icon: 'i-lucide-send', color: 'success'});
  } catch (e) {
    console.error('Could not send the invite', e);
    toast.add({title: 'Could not send the invite', icon: 'i-lucide-circle-x', color: 'error'});
  } finally {
    inviting.value = null;
  }
}

const openInVRChat = (location: string) => chrome.tabs.create({url: launchUrl(location)});
</script>

<template>
  <div class="flex flex-col gap-3 p-3">
    <div v-if="!loaded" class="flex flex-col gap-3">
      <USkeleton v-for="i in 3" :key="i" class="h-36 w-full rounded-xl"/>
    </div>

    <UEmpty
        v-else-if="!instances.length && !privateFriends.length"
        icon="i-lucide-earth"
        title="Nobody's in a world"
        description="None of your friends are in a visible instance right now."
        variant="naked"
        class="py-12"
    />

    <template v-else>
      <article
          v-for="instance of instances"
          :key="instance.place.location"
          class="overflow-hidden rounded-xl bg-elevated/60 ring-1 ring-default"
      >
        <div class="relative h-28">
          <img
              v-if="worldOf(instance.place.worldId)?.thumbnailImageUrl"
              :src="worldOf(instance.place.worldId)?.thumbnailImageUrl"
              alt=""
              class="absolute inset-0 size-full object-cover"
          >
          <div v-else class="absolute inset-0 vrce-glow bg-muted"/>
          <div class="absolute inset-0 bg-gradient-to-t from-(--ui-bg) via-(--ui-bg)/60 to-transparent"/>

          <div class="absolute inset-x-3 bottom-2 flex items-end justify-between gap-2">
            <div class="min-w-0">
              <h3 class="truncate font-display text-base font-semibold text-highlighted">
                {{ worldOf(instance.place.worldId)?.name ?? 'Loading world…' }}
              </h3>
              <LocationBadges :place="instance.place" class="mt-1"/>
            </div>
            <span class="flex shrink-0 items-center gap-1 rounded-full bg-default/70 px-2 py-0.5 text-xs text-muted backdrop-blur">
              <UIcon name="i-lucide-users" class="size-3.5"/>
              {{ instance.friends.length }}
            </span>
          </div>
        </div>

        <div class="flex flex-wrap gap-1.5 px-3 pt-2.5">
          <button
              v-for="friend of instance.friends"
              :key="friend.id"
              type="button"
              class="flex items-center gap-1.5 rounded-full bg-muted py-0.5 pr-2.5 pl-0.5 text-xs ring-1 ring-default transition hover:bg-accented"
              @click="openDetails(friend.id)"
          >
            <UserAvatar :src="userImageUrl(friend)" :name="friend.displayName" :presence="friend.presence" :favorite="friend.favorite" size="xs"/>
            <span class="max-w-28 truncate">{{ friend.displayName }}</span>
          </button>
        </div>

        <div class="flex justify-end gap-1.5 p-2.5">
          <UButton
              label="Open in VRChat"
              icon="i-lucide-gamepad-2"
              color="neutral"
              variant="ghost"
              size="sm"
              @click="openInVRChat(instance.place.location)"
          />
          <UButton
              label="Join"
              icon="i-lucide-log-in"
              size="sm"
              :loading="inviting === instance.place.location"
              @click="joinInstance(instance.place.location)"
          />
        </div>
      </article>

      <article
          v-if="privateFriends.length"
          class="flex items-center gap-3 rounded-xl bg-muted p-3 ring-1 ring-default"
      >
        <img :src="PRIVATE_WORLD_IMAGE" alt="" class="h-12 w-20 shrink-0 rounded-lg object-cover opacity-80">
        <div class="min-w-0 flex-1">
          <h3 class="font-display text-sm font-semibold text-highlighted">Private worlds</h3>
          <p class="text-xs text-muted">{{ privateFriends.length }} {{ privateFriends.length > 1 ? 'friends' : 'friend' }} in hidden instances</p>
        </div>
        <UAvatarGroup :max="4" size="sm">
          <UTooltip v-for="friend of privateFriends" :key="friend.id" :text="friend.displayName">
            <UAvatar
                :src="userImageUrl(friend)"
                :alt="friend.displayName"
                class="cursor-pointer"
                @click="openDetails(friend.id)"
            />
          </UTooltip>
        </UAvatarGroup>
      </article>
    </template>
  </div>
</template>
