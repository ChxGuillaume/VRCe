<script setup lang="ts">
import {computed, onMounted, ref, watch} from 'vue';
import SessionGate from '../components/base/SessionGate.vue';
import {useFriends} from '../composables/useFriends';
import {useSession} from '../composables/useSession';
import {isVRCPlus} from '../lib/vrchat';
import {MessageType, sendToBackground} from '../shared/messages';
import BottomDock from './components/BottomDock.vue';
import EventsTab from './components/EventsTab.vue';
import FriendDetails from './components/FriendDetails.vue';
import FriendsTab from './components/FriendsTab.vue';
import GalleryTab from './components/GalleryTab.vue';
import PopupHeader from './components/PopupHeader.vue';
import SettingsTab from './components/SettingsTab.vue';
import {defaultTab, POPUP_TABS, type PopupTab} from './components/navigation';
import WorldsTab from './components/WorldsTab.vue';

const {user, status, load} = useSession();
const {load: loadFriends} = useFriends();

const tab = ref<PopupTab>(defaultTab());

// The gallery is a VRChat+ feature.
const tabs = computed(() => POPUP_TABS.filter(item => item.value !== 'gallery' || isVRCPlus(user.value?.tags)));

// Falls back to the friends tab when the default tab isn't available (e.g. gallery without VRC+).
watch(tabs, (available) => {
  if (status.value === 'ready' && !available.some(item => item.value === tab.value)) tab.value = 'friends';
});

const scroller = ref<HTMLElement | null>(null);
watch(tab, () => scroller.value?.scrollTo({top: 0}));

onMounted(() => {
  sendToBackground(MessageType.REFRESH_CONNECTION);
  load();
});

// Once logged in (on open, or later from the session gate).
watch(status, (current, previous) => {
  if (current === 'ready' && previous !== 'ready') loadFriends();
});
</script>

<template>
  <UApp :toaster="{position: 'top-center', duration: 3000}">
    <div class="flex h-[600px] w-[400px] flex-col overflow-hidden bg-default">
      <PopupHeader/>

      <main ref="scroller" class="relative min-h-0 flex-1 overflow-y-auto">
        <SessionGate>
          <FriendsTab v-if="tab === 'friends'"/>
          <WorldsTab v-else-if="tab === 'worlds'"/>
          <EventsTab v-else-if="tab === 'events'"/>
          <GalleryTab v-else-if="tab === 'gallery'"/>
          <SettingsTab v-else-if="tab === 'settings'"/>
        </SessionGate>
      </main>

      <BottomDock v-if="status === 'ready'" v-model="tab" :tabs="tabs"/>

      <FriendDetails/>
    </div>
  </UApp>
</template>

<style>
html, body {
  width: 400px;
  height: 600px;
  margin: 0;
  overflow: hidden;
}
</style>
