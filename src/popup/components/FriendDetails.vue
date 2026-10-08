<script setup lang="ts">
import {computed, ref, watch} from 'vue';
import LocationBadges from '../../components/base/LocationBadges.vue';
import PresenceBadge from '../../components/base/PresenceBadge.vue';
import RankBadge from '../../components/base/RankBadge.vue';
import UserAvatar from '../../components/base/UserAvatar.vue';
import {useFriendDetails} from '../../composables/useFriendDetails';
import {useFriends} from '../../composables/useFriends';
import {useWorlds} from '../../composables/useWorlds';
import {
  formatDate,
  formatNumber,
  fromNow,
  isVRCPlus,
  languagesOf,
  parseLocation,
  platformLabel,
  presenceOf,
  trustRankOf
} from '../../lib/vrchat';
import {getUserWithProfile, type ProfileFields, userImageUrl} from '../../shared/vrchat-api';
import type {User} from '../../types/vrchat';
import {useInstanceJoin} from './useInstanceJoin';

type DetailedUser = User & ProfileFields;

const {userId, close} = useFriendDetails();
const {friendById, toggleFavorite} = useFriends();
const {loadWorld, worldOf} = useWorlds();
const {joining, join, launch} = useInstanceJoin();

const user = ref<DetailedUser | null>(null);
const failed = ref(false);

watch(userId, async (id) => {
  user.value = null;
  failed.value = false;
  if (!id) return;

  try {
    const loaded = await getUserWithProfile(id);
    // Ignore a late answer for a panel that was closed or switched to someone else.
    if (userId.value !== id) return;

    user.value = loaded;

    const place = parseLocation(loaded.location);
    if (place.kind === 'instance') loadWorld(place.worldId);
  } catch (e) {
    console.error(`Could not load user ${id}`, e);
    if (userId.value === id) failed.value = true;
  }
}, {immediate: true});

const open = computed({
  get: () => userId.value !== null,
  set: (value: boolean) => {
    if (!value) close();
  }
});

// What the friend list already knows, shown while the full user loads.
const preview = computed(() => userId.value ? friendById(userId.value) : undefined);

const name = computed(() => user.value?.displayName ?? preview.value?.displayName ?? '');
const image = computed(() => user.value ? userImageUrl(user.value) : preview.value ? userImageUrl(preview.value) : undefined);
const presence = computed(() => user.value ? presenceOf(user.value) : preview.value?.presence ?? null);
const rank = computed(() => trustRankOf(user.value?.tags));
const place = computed(() => parseLocation(user.value?.location ?? preview.value?.location));
const instance = computed(() => place.value.kind === 'instance' ? place.value : null);
const world = computed(() => worldOf(instance.value?.worldId));
const favorite = computed(() => preview.value?.favorite ?? false);
const languages = computed(() => languagesOf(user.value?.tags));
const bioLinks = computed(() => (user.value?.bioLinks ?? []).filter(link => link));

const LINK_ICONS: [RegExp, string][] = [
  [/(twitter|x)\.com/, 'i-lucide-twitter'],
  [/youtu(\.be|be\.com)/, 'i-lucide-youtube'],
  [/twitch\.tv/, 'i-lucide-twitch'],
  [/github\.com/, 'i-lucide-github'],
  [/instagram\.com/, 'i-lucide-instagram'],
  [/discord\.(gg|com)/, 'i-lucide-message-circle']
];

function linkIcon(link: string): string {
  return LINK_ICONS.find(([pattern]) => pattern.test(link))?.[1] ?? 'i-lucide-link';
}

function linkLabel(link: string): string {
  try {
    const url = new URL(link);
    return (url.hostname.replace(/^www\./, '') + url.pathname).replace(/\/$/, '');
  } catch {
    return link;
  }
}

function openProfile(): void {
  if (userId.value) chrome.tabs.create({url: `https://vrchat.com/home/user/${userId.value}`});
}

function joinInstance(): void {
  if (instance.value) join(instance.value.location, world.value?.name);
}
</script>

<template>
  <USlideover
      v-model:open="open"
      side="right"
      :ui="{content: 'w-full max-w-full sm:max-w-full divide-y-0 bg-default'}"
  >
    <template #content>
      <div class="flex h-full flex-col overflow-y-auto">
        <!-- Hero -->
        <div class="relative shrink-0 overflow-hidden">
          <img
              v-if="image"
              :src="image"
              alt=""
              class="absolute inset-0 size-full scale-125 object-cover opacity-40 blur-2xl"
          >
          <div class="vrce-glow absolute inset-0"/>
          <div class="absolute inset-0 bg-gradient-to-b from-transparent via-default/40 to-default"/>

          <div class="relative flex items-center justify-between px-3 pt-3">
            <UButton icon="i-lucide-arrow-left" color="neutral" variant="ghost" size="sm" aria-label="Back" @click="close"/>
            <div class="flex items-center gap-1">
              <UTooltip :text="favorite ? 'Remove from favorites' : 'Add to favorites'">
                <UButton
                    icon="i-lucide-star"
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    :class="favorite ? '[&_svg]:fill-amber-400 text-amber-400' : ''"
                    aria-label="Toggle favorite"
                    @click="userId && toggleFavorite(userId)"
                />
              </UTooltip>
              <UTooltip text="Profile on vrchat.com">
                <UButton
                    icon="i-lucide-external-link"
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    aria-label="Open profile on vrchat.com"
                    @click="openProfile"
                />
              </UTooltip>
            </div>
          </div>

          <div class="relative flex flex-col items-center px-4 pt-2 pb-4 text-center">
            <UserAvatar :src="image" :name="name" :presence="presence" :rank="rank" size="3xl"/>

            <h2 class="mt-3 font-display text-xl font-bold text-highlighted">{{ name }}</h2>
            <p v-if="user?.pronouns" class="text-xs text-muted">{{ user.pronouns }}</p>

            <div class="mt-2 flex flex-wrap items-center justify-center gap-1.5">
              <PresenceBadge v-if="presence" :presence="presence"/>
              <RankBadge v-if="rank" :rank="rank"/>
              <UBadge v-if="isVRCPlus(user?.tags)" label="VRC+" size="sm" variant="subtle" color="primary"/>
            </div>

            <p v-if="user?.statusDescription ?? preview?.statusDescription" class="mt-2 text-sm text-default italic">
              “{{ user?.statusDescription ?? preview?.statusDescription }}”
            </p>
          </div>
        </div>

        <!-- Body -->
        <div v-if="failed" class="p-4">
          <UAlert icon="i-lucide-triangle-alert" color="error" variant="subtle" title="Couldn't load this user"/>
        </div>

        <div v-else-if="!user" class="space-y-3 p-4">
          <USkeleton class="h-24 w-full rounded-xl"/>
          <USkeleton class="h-16 w-full rounded-xl"/>
          <USkeleton class="h-28 w-full rounded-xl"/>
        </div>

        <div v-else class="space-y-3 px-4 pb-6">
          <!-- Current world -->
          <div v-if="instance" class="overflow-hidden rounded-xl bg-elevated/60 ring-1 ring-default">
            <div class="relative h-28">
              <img v-if="world" :src="world.thumbnailImageUrl" alt="" class="size-full object-cover">
              <USkeleton v-else class="size-full rounded-none"/>
              <div class="absolute inset-0 bg-gradient-to-t from-(--ui-bg-elevated) via-transparent to-transparent"/>
              <LocationBadges :place="place" class="absolute top-2 left-2"/>
            </div>
            <div class="flex items-end justify-between gap-3 px-3 pb-3">
              <div class="min-w-0">
                <p class="truncate font-display font-semibold text-highlighted">{{ world?.name ?? 'Loading world…' }}</p>
                <p v-if="world" class="truncate text-xs text-muted">
                  by {{ world.authorName }} · {{ formatNumber(world.occupants) }} in world
                </p>
              </div>
              <div class="flex shrink-0 gap-1">
                <UTooltip text="Send me an invite">
                  <UButton icon="i-lucide-door-open" size="sm" :loading="joining === instance.location" aria-label="Join"
                           @click="joinInstance"/>
                </UTooltip>
                <UTooltip text="Open in VRChat">
                  <UButton icon="i-lucide-rocket" color="neutral" variant="subtle" size="sm" aria-label="Open in VRChat"
                           @click="launch(instance.location)"/>
                </UTooltip>
              </div>
            </div>
          </div>
          <div v-else-if="place.kind === 'private'"
               class="flex items-center gap-3 rounded-xl bg-elevated/60 p-3 text-sm text-muted ring-1 ring-default">
            <UIcon name="i-lucide-eye-off" class="size-5 text-dimmed"/>
            In a private world
          </div>

          <!-- Bio -->
          <div v-if="user.bio" class="rounded-xl bg-elevated/60 p-3 ring-1 ring-default">
            <p class="mb-1 text-xs font-semibold tracking-wide text-dimmed uppercase">Bio</p>
            <p class="text-sm whitespace-pre-line text-default">{{ user.bio }}</p>
          </div>

          <!-- Links -->
          <div v-if="bioLinks.length" class="flex flex-wrap gap-1.5">
            <UButton
                v-for="link of bioLinks"
                :key="link"
                :icon="linkIcon(link)"
                :label="linkLabel(link)"
                :href="link"
                target="_blank"
                color="neutral"
                variant="subtle"
                size="xs"
                class="max-w-full"
                :ui="{label: 'truncate'}"
            />
          </div>

          <!-- Facts -->
          <dl class="grid grid-cols-2 gap-2">
            <div class="rounded-xl bg-elevated/60 p-3 ring-1 ring-default">
              <dt class="flex items-center gap-1.5 text-xs text-dimmed"><UIcon name="i-lucide-gamepad-2" class="size-3.5"/>Platform</dt>
              <dd class="mt-0.5 text-sm font-medium text-highlighted">{{ platformLabel(user.last_platform) }}</dd>
            </div>
            <div class="rounded-xl bg-elevated/60 p-3 ring-1 ring-default">
              <dt class="flex items-center gap-1.5 text-xs text-dimmed"><UIcon name="i-lucide-clock" class="size-3.5"/>Last login</dt>
              <UTooltip :text="formatDate(user.last_login)">
                <dd class="mt-0.5 text-sm font-medium text-highlighted">{{ fromNow(user.last_login) }}</dd>
              </UTooltip>
            </div>
            <div class="rounded-xl bg-elevated/60 p-3 ring-1 ring-default">
              <dt class="flex items-center gap-1.5 text-xs text-dimmed"><UIcon name="i-lucide-cake" class="size-3.5"/>Joined</dt>
              <dd class="mt-0.5 text-sm font-medium text-highlighted">{{ formatDate(user.date_joined, 'MMM D, YYYY') }}</dd>
            </div>
            <div class="rounded-xl bg-elevated/60 p-3 ring-1 ring-default">
              <dt class="flex items-center gap-1.5 text-xs text-dimmed"><UIcon name="i-lucide-languages" class="size-3.5"/>Languages</dt>
              <dd class="mt-0.5 truncate text-sm font-medium text-highlighted uppercase">
                {{ languages.length ? languages.join(', ') : '—' }}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </template>
  </USlideover>
</template>
