<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref, watch} from 'vue';
import type {DropdownMenuItem, NavigationMenuItem} from '@nuxt/ui';
import BrandLogo from '../components/base/BrandLogo.vue';
import SessionGate from '../components/base/SessionGate.vue';
import UserAvatar from '../components/base/UserAvatar.vue';
import {useSession} from '../composables/useSession';
import {presenceOf} from '../lib/vrchat';
import {userImageUrl} from '../shared/vrchat-api';
import FriendsPanel from './components/FriendsPanel.vue';
import ModerationPanel from './components/ModerationPanel.vue';
import ProfilePanel from './components/ProfilePanel.vue';
import UserDetailsSlideover from './components/UserDetailsSlideover.vue';
import {useDashboardFriends} from './components/useDashboardFriends';
import {useModerations} from './components/useModerations';

type Section = 'friends' | 'moderation' | 'profile';

const SECTIONS: Section[] = ['friends', 'moderation', 'profile'];

const {user, status, load: loadSession, logout} = useSession();
const {rows: friends, load: loadFriends} = useDashboardFriends();
const {moderations, load: loadModerations} = useModerations();

// The section lives in the URL hash, so a reload (or a bookmark) keeps it.
const sectionFromHash = (): Section => {
  const hash = location.hash.slice(1) as Section;
  return SECTIONS.includes(hash) ? hash : 'friends';
};

const section = ref<Section>(sectionFromHash());
const onHashChange = () => section.value = sectionFromHash();

function go(target: Section): void {
  if (location.hash !== `#${target}`) history.replaceState(null, '', `#${target}`);
  section.value = target;
}

onMounted(() => {
  window.addEventListener('hashchange', onHashChange);
  loadSession();
});

onUnmounted(() => window.removeEventListener('hashchange', onHashChange));

// Load the data once logged in (again after a logout / login).
watch(status, value => {
  if (value === 'ready') {
    loadFriends();
    loadModerations();
  }
}, {immediate: true});

const TITLES: Record<Section, string> = {friends: 'Friends', moderation: 'Moderation', profile: 'Profile'};

watch(section, value => document.title = `${TITLES[value]} · VRCe`, {immediate: true});

const navigation = computed<NavigationMenuItem[]>(() => [
  {
    label: 'Friends',
    icon: 'i-lucide-users',
    badge: friends.value.length ? String(friends.value.length) : undefined,
    active: section.value === 'friends',
    onSelect: () => go('friends')
  },
  {
    label: 'Moderation',
    icon: 'i-lucide-shield-ban',
    badge: moderations.value.length ? String(moderations.value.length) : undefined,
    active: section.value === 'moderation',
    onSelect: () => go('moderation')
  },
  {
    label: 'Profile',
    icon: 'i-lucide-circle-user-round',
    active: section.value === 'profile',
    onSelect: () => go('profile')
  }
]);

const links: NavigationMenuItem[] = [
  {
    label: 'VRChat Home',
    icon: 'i-lucide-external-link',
    to: 'https://vrchat.com/home',
    target: '_blank'
  },
  {
    label: 'Launch VRChat',
    icon: 'i-lucide-rocket',
    to: 'vrchat://launch?ref=vrchat.com'
  }
];

const userMenu = computed<DropdownMenuItem[][]>(() => [
  [{type: 'label', label: user.value?.displayName ?? ''}],
  [
    {label: 'My profile', icon: 'i-lucide-circle-user-round', onSelect: () => go('profile')},
    {
      label: 'Open on vrchat.com',
      icon: 'i-lucide-external-link',
      onSelect: () => user.value && chrome.tabs.create({url: `https://vrchat.com/home/user/${user.value.id}`})
    }
  ],
  [{label: 'Log out', icon: 'i-lucide-log-out', color: 'error', onSelect: logout}]
]);
</script>

<template>
  <UApp :tooltip="{delayDuration: 200}">
    <div v-if="status !== 'ready'" class="vrce-glow flex min-h-screen flex-col items-center justify-center gap-8 p-6">
      <BrandLogo class="scale-125"/>
      <div class="w-full max-w-md rounded-2xl bg-elevated/60 p-2 ring-1 ring-default backdrop-blur">
        <SessionGate/>
      </div>
    </div>

    <UDashboardGroup v-else storage="local" storage-key="vrce-dashboard" unit="rem">
      <UDashboardSidebar
          collapsible
          resizable
          :default-size="16"
          :min-size="14"
          :max-size="22"
          class="bg-muted/40"
          :ui="{footer: 'border-t border-default'}"
      >
        <template #header="{collapsed}">
          <BrandLogo :compact="collapsed" :class="collapsed ? 'mx-auto' : ''"/>
        </template>

        <template #default="{collapsed}">
          <UNavigationMenu :collapsed="collapsed" :items="navigation" orientation="vertical" highlight/>

          <UNavigationMenu :collapsed="collapsed" :items="links" orientation="vertical" class="mt-auto"/>
        </template>

        <template #footer="{collapsed}">
          <UDropdownMenu
              v-if="user"
              :items="userMenu"
              :content="{align: 'center', collisionPadding: 12}"
              :ui="{content: collapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)'}"
          >
            <button
                type="button"
                class="flex w-full items-center gap-3 rounded-lg p-1.5 text-left transition hover:bg-elevated"
                :class="collapsed ? 'justify-center' : ''"
            >
              <UserAvatar :src="userImageUrl(user)" :name="user.displayName" :presence="presenceOf(user)" size="md"/>
              <span v-if="!collapsed" class="min-w-0 flex-1">
                <span class="block truncate font-display text-sm font-semibold text-highlighted">{{ user.displayName }}</span>
                <span class="block truncate text-xs text-muted">{{ user.statusDescription || presenceOf(user).label }}</span>
              </span>
              <UIcon v-if="!collapsed" name="i-lucide-chevrons-up-down" class="size-4 text-dimmed"/>
            </button>
          </UDropdownMenu>
        </template>
      </UDashboardSidebar>

      <FriendsPanel v-if="section === 'friends'"/>
      <ModerationPanel v-else-if="section === 'moderation'"/>
      <ProfilePanel v-else/>

      <UserDetailsSlideover/>
    </UDashboardGroup>
  </UApp>
</template>
