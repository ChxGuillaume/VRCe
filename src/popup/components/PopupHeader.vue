<script setup lang="ts">
import type {DropdownMenuItem} from '@nuxt/ui';
import {useToast} from '@nuxt/ui/composables';
import {computed, ref} from 'vue';
import BrandLogo from '../../components/base/BrandLogo.vue';
import UserAvatar from '../../components/base/UserAvatar.vue';
import {useSession} from '../../composables/useSession';
import {isVRCPlus, launchUrl, presenceOf} from '../../lib/vrchat';
import {getUser, userImageUrl} from '../../shared/vrchat-api';

const {user, status, logout} = useSession();
const toast = useToast();

const presence = computed(() => user.value ? presenceOf(user.value) : null);
const launching = ref(false);

function openDashboard(): void {
  chrome.tabs.create({url: chrome.runtime.getURL('index.html')});
}

// Joins the instance the user is currently in, or just launches VRChat.
async function launchVRChat(): Promise<void> {
  if (!user.value) return;

  launching.value = true;

  try {
    const me = await getUser(user.value.id);
    const inInstance = me.location && !['offline', 'private', 'traveling'].includes(me.location);

    chrome.tabs.create({url: launchUrl(inInstance ? me.location : undefined)});
  } catch (e) {
    console.error('Could not get the current location', e);
    toast.add({title: 'Couldn\'t get your location', icon: 'i-lucide-triangle-alert', color: 'error'});
  } finally {
    launching.value = false;
  }
}

const menuItems = computed<DropdownMenuItem[][]>(() => [
  [{type: 'label', label: user.value?.displayName ?? 'VRCe'}],
  [
    {label: 'Open dashboard', icon: 'i-lucide-layout-dashboard', onSelect: openDashboard},
    {label: 'Launch VRChat', icon: 'i-lucide-rocket', onSelect: launchVRChat},
    {label: 'VRChat website', icon: 'i-lucide-external-link', onSelect: () => chrome.tabs.create({url: 'https://vrchat.com/home'})}
  ],
  [{label: 'Log out', icon: 'i-lucide-log-out', color: 'error', onSelect: logout}]
]);
</script>

<template>
  <header class="vrce-glow relative shrink-0 px-4 pt-3 pb-3">
    <div class="flex items-center justify-between">
      <BrandLogo/>

      <div class="flex items-center gap-1">
        <UTooltip text="Open dashboard">
          <UButton icon="i-lucide-layout-dashboard" color="neutral" variant="ghost" size="sm" aria-label="Open dashboard"
                   @click="openDashboard"/>
        </UTooltip>
        <UDropdownMenu v-if="status === 'ready'" :items="menuItems" :content="{align: 'end'}" :ui="{content: 'w-48'}">
          <UButton icon="i-lucide-ellipsis-vertical" color="neutral" variant="ghost" size="sm" aria-label="More"/>
        </UDropdownMenu>
      </div>
    </div>

    <div v-if="user && presence" class="mt-3 flex items-center gap-3 rounded-xl bg-elevated/50 p-2.5 ring-1 ring-default backdrop-blur">
      <UserAvatar :src="userImageUrl(user)" :name="user.displayName" :presence="presence" size="lg"/>

      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-1.5">
          <p class="truncate font-display font-semibold text-highlighted">{{ user.displayName }}</p>
          <UBadge v-if="isVRCPlus(user.tags)" label="VRC+" size="sm" variant="subtle" color="primary" class="shrink-0"/>
        </div>
        <p class="truncate text-xs text-muted">
          <span :style="{color: presence.color}">{{ presence.label }}</span>
          <template v-if="user.statusDescription"> · {{ user.statusDescription }}</template>
        </p>
      </div>

      <UTooltip text="Launch VRChat">
        <UButton icon="i-lucide-rocket" color="primary" variant="soft" size="sm" :loading="launching"
                 aria-label="Launch VRChat" @click="launchVRChat"/>
      </UTooltip>
    </div>
  </header>
</template>
