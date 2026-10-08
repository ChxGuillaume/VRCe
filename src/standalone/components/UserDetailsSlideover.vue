<script setup lang="ts">
import {computed, ref, watch} from 'vue';
import LocationBadges from '../../components/base/LocationBadges.vue';
import PresenceBadge from '../../components/base/PresenceBadge.vue';
import RankBadge from '../../components/base/RankBadge.vue';
import {useFriendDetails} from '../../composables/useFriendDetails';
import {type Friend, useFriends} from '../../composables/useFriends';
import {useWorlds} from '../../composables/useWorlds';
import {
  authorTagsOf,
  formatDate,
  formatNumber,
  fromNow,
  isEarlyAdopter,
  isVRCPlus,
  languagesOf,
  launchUrl,
  parseLocation,
  platformLabel,
  presenceOf,
  trustRankOf
} from '../../lib/vrchat';
import {inviteMyselfTo, userImageUrl} from '../../shared/vrchat-api';
import BioLinks from './BioLinks.vue';
import HeroAvatar from './HeroAvatar.vue';
import InfoTile from './InfoTile.vue';
import {type FullUser, loadFullUser, useDashboardFriends} from './useDashboardFriends';

const {userId, close} = useFriendDetails();
const {friendById, toggleFavorite} = useFriends();
const {loadWorld, worldOf} = useWorlds();
const {fullUserOf} = useDashboardFriends();
const toast = useToast();

const fromFriend = (friend: Friend): DetailsUser => ({
  id: friend.id,
  displayName: friend.displayName,
  location: friend.location,
  status: friend.status,
  statusDescription: friend.statusDescription,
  last_platform: friend.last_platform,
  last_login: friend.last_login ?? undefined,
  currentAvatarImageUrl: friend.currentAvatarImageUrl,
  iconUrl: friend.iconUrl
});

// Starts as what's already known (the friend list entry or a previously fetched user), then the fresh full user.
type DetailsUser = Partial<FullUser> & {id: string; displayName: string};

const user = ref<DetailsUser | null>(null);
const loading = ref(false);
const failed = ref(false);
const inviting = ref(false);

const open = computed({
  get: () => userId.value !== null,
  set: value => {
    if (!value) close();
  }
});

watch(userId, async id => {
  failed.value = false;
  if (!id) return;

  const known = friendById(id);
  user.value = fullUserOf(id) ?? (known ? fromFriend(known) : null);
  loading.value = true;

  const fresh = await loadFullUser(id, true);
  if (userId.value !== id) return;

  loading.value = false;
  if (fresh) user.value = fresh;
  else failed.value = !user.value;
}, {immediate: true});

const friend = computed(() => user.value ? friendById(user.value.id) : undefined);
const presence = computed(() => user.value ? presenceOf(user.value) : null);
const rank = computed(() => trustRankOf(user.value?.tags));
const place = computed(() => parseLocation(user.value?.location));
const instance = computed(() => place.value.kind === 'instance' ? place.value : null);
const world = computed(() => worldOf(instance.value?.worldId));
const languages = computed(() => languagesOf(user.value?.tags));
const heroImage = computed(() => user.value?.currentAvatarImageUrl || user.value?.currentAvatarThumbnailImageUrl || user.value?.userIcon);

watch(instance, value => {
  if (value) loadWorld(value.worldId);
}, {immediate: true});

async function joinInstance(): Promise<void> {
  if (!instance.value) return;
  inviting.value = true;

  try {
    await inviteMyselfTo(instance.value.location);
    toast.add({title: 'Invite sent', description: 'Check your notifications in VRChat.', icon: 'i-lucide-send', color: 'success'});
  } catch (e) {
    console.error('Could not send the self invite', e);
    toast.add({title: 'Couldn\'t send the invite', description: 'The instance may be closed or full.', icon: 'i-lucide-circle-x', color: 'error'});
  } finally {
    inviting.value = false;
  }
}

const launch = () => instance.value && chrome.tabs.create({url: launchUrl(instance.value.location)});
const openOnVRChat = () => user.value && chrome.tabs.create({url: `https://vrchat.com/home/user/${user.value.id}`});
const openWorld = () => instance.value && chrome.tabs.create({url: `https://vrchat.com/home/world/${instance.value.worldId}`});
</script>

<template>
  <USlideover
      v-model:open="open"
      side="right"
      :title="user?.displayName ?? 'User'"
      :ui="{content: 'max-w-xl', header: 'hidden', body: 'p-0 sm:p-0'}"
  >
    <template #body>
      <div v-if="failed" class="p-6">
        <UEmpty icon="i-lucide-user-x" title="Couldn't load this user" description="The VRChat API didn't return this user."/>
      </div>

      <div v-else-if="!user" class="space-y-4 p-6">
        <USkeleton class="h-40 w-full rounded-xl"/>
        <USkeleton class="h-6 w-1/2"/>
        <USkeleton class="h-4 w-3/4"/>
      </div>

      <template v-else>
        <!-- Hero -->
        <section class="relative overflow-hidden border-b border-default">
          <div class="absolute inset-0">
            <img v-if="heroImage" :src="heroImage" alt="" class="size-full scale-110 object-cover opacity-40 blur-2xl">
            <div class="vrce-glow absolute inset-0"/>
            <div class="absolute inset-0 bg-gradient-to-t from-(--ui-bg) via-(--ui-bg)/60 to-transparent"/>
          </div>

          <div class="absolute top-3 right-3 z-10 flex gap-1">
            <UTooltip v-if="friend" :text="friend.favorite ? 'Remove from favorites' : 'Add to favorites'">
              <UButton
                  icon="i-lucide-star"
                  color="neutral"
                  variant="ghost"
                  :class="friend.favorite ? 'text-amber-400 [&_svg]:fill-amber-400' : ''"
                  aria-label="Toggle favorite"
                  @click="toggleFavorite(friend.id)"
              />
            </UTooltip>
            <UTooltip text="Open on vrchat.com">
              <UButton icon="i-lucide-external-link" color="neutral" variant="ghost" aria-label="Open on vrchat.com" @click="openOnVRChat"/>
            </UTooltip>
            <UButton icon="i-lucide-x" color="neutral" variant="ghost" aria-label="Close" @click="close"/>
          </div>

          <div class="relative flex items-end gap-5 px-6 pt-16 pb-6">
            <HeroAvatar :src="userImageUrl(user)" :name="user.displayName" :presence="presence" :rank="rank" size="md"/>
            <div class="min-w-0 flex-1">
              <h2 class="truncate font-display text-2xl font-bold tracking-tight text-highlighted">{{ user.displayName }}</h2>
              <p class="text-sm text-dimmed">
                <span v-if="user.username">@{{ user.username }}</span>
                <span v-if="user.pronouns" class="ml-2">{{ user.pronouns }}</span>
              </p>
              <div class="mt-3 flex flex-wrap items-center gap-1.5">
                <PresenceBadge v-if="presence" :presence="presence"/>
                <RankBadge v-if="rank" :rank="rank"/>
                <UBadge v-if="isVRCPlus(user.tags)" icon="i-lucide-gem" label="VRC+" color="secondary" variant="subtle" size="sm"/>
                <UBadge v-if="isEarlyAdopter(user.tags)" icon="i-lucide-sparkles" label="Early adopter" color="warning" variant="subtle" size="sm"/>
                <UIcon v-if="loading" name="i-lucide-loader-circle" class="size-4 animate-spin text-dimmed"/>
              </div>
            </div>
          </div>
        </section>

        <div class="space-y-6 p-6">
          <p v-if="user.statusDescription" class="rounded-lg bg-elevated/60 px-4 py-3 text-sm text-default ring-1 ring-default">
            <UIcon name="i-lucide-message-square-quote" class="mr-1.5 inline size-4 align-text-bottom text-primary"/>
            {{ user.statusDescription }}
          </p>

          <!-- Current world -->
          <section v-if="instance" class="overflow-hidden rounded-xl bg-elevated/50 ring-1 ring-default">
            <div class="relative h-36">
              <img v-if="world?.imageUrl || world?.thumbnailImageUrl" :src="world.imageUrl || world.thumbnailImageUrl" alt=""
                   class="size-full object-cover">
              <USkeleton v-else class="size-full rounded-none"/>
              <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent"/>
              <div class="absolute inset-x-4 bottom-3">
                <p class="text-[11px] font-medium tracking-wide text-white/60 uppercase">Currently in</p>
                <button type="button" class="block max-w-full truncate text-left font-display text-lg font-semibold text-white hover:underline" @click="openWorld">
                  {{ world?.name ?? 'Loading world…' }}
                </button>
              </div>
            </div>
            <div class="flex flex-wrap items-center justify-between gap-3 p-4">
              <div class="space-y-1.5">
                <LocationBadges :place="instance"/>
                <p v-if="world" class="text-xs text-dimmed">
                  by {{ world.authorName }} · {{ formatNumber(world.occupants) }} in world · capacity {{ world.capacity }}
                </p>
                <div v-if="authorTagsOf(world?.tags).length" class="flex flex-wrap gap-1">
                  <UBadge v-for="tag in authorTagsOf(world?.tags).slice(0, 5)" :key="tag" :label="tag" color="neutral" variant="outline" size="sm"/>
                </div>
              </div>
              <div class="flex gap-2">
                <UButton label="Invite me" icon="i-lucide-send" :loading="inviting" @click="joinInstance"/>
                <UTooltip text="Launch VRChat into this instance">
                  <UButton icon="i-lucide-rocket" color="neutral" variant="subtle" aria-label="Launch VRChat" @click="launch"/>
                </UTooltip>
              </div>
            </div>
          </section>

          <div v-else-if="presence?.key !== 'offline'" class="flex items-center gap-2 text-sm text-muted">
            <LocationBadges :place="place"/>
          </div>

          <!-- Bio -->
          <section class="space-y-3">
            <h3 class="font-display text-sm font-semibold tracking-wide text-muted uppercase">Bio</h3>
            <USkeleton v-if="loading && user.bio === undefined" class="h-16 w-full"/>
            <p v-else class="text-sm leading-relaxed whitespace-pre-line text-default" :class="{'text-dimmed italic': !user.bio}">
              {{ user.bio || 'No bio.' }}
            </p>
            <BioLinks v-if="user.bioLinks?.length" :links="user.bioLinks.filter(link => link)"/>
          </section>

          <!-- Info -->
          <section class="grid grid-cols-2 gap-3">
            <InfoTile icon="i-lucide-monitor-smartphone" label="Platform" :value="platformLabel(user.last_platform)"/>
            <InfoTile icon="i-lucide-clock" label="Last login">
              <UTooltip :text="formatDate(user.last_login)">
                <span>{{ fromNow(user.last_login) }}</span>
              </UTooltip>
            </InfoTile>
            <InfoTile icon="i-lucide-calendar" label="Joined" :value="user.date_joined ? formatDate(user.date_joined, 'MMM D, YYYY') : undefined"/>
            <InfoTile icon="i-lucide-languages" label="Languages">
              <div v-if="languages.length" class="flex flex-wrap gap-1">
                <UBadge v-for="language in languages" :key="language" :label="language.toUpperCase()" color="neutral" variant="subtle" size="sm"/>
              </div>
              <span v-else class="text-dimmed">—</span>
            </InfoTile>
          </section>
        </div>
      </template>
    </template>
  </USlideover>
</template>
