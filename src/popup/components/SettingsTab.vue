<script setup lang="ts">
import {onMounted, ref, watch} from 'vue';
import {useToast} from '@nuxt/ui/composables';
import BrandLogo from '../../components/base/BrandLogo.vue';
import {MessageType, sendToBackground} from '../../shared/messages';
import {DEFAULT_SETTINGS, getSettings, saveSettings, type Settings} from '../../shared/storage';

interface NotificationSetting {
  key: keyof Settings;
  label: string;
  description: string;
  icon: string;
}

const NOTIFICATION_SETTINGS: NotificationSetting[] = [
  {key: 'notify_online', label: 'Friends coming online', description: 'When any friend launches VRChat.', icon: 'i-lucide-zap'},
  {key: 'notify_online_favorited', label: 'Favorite friends coming online', description: 'Only for the friends you starred.', icon: 'i-lucide-star'},
  {key: 'notify_notifications', label: 'VRChat notifications', description: 'Invites, invite requests, replies, friend requests and boops.', icon: 'i-lucide-bell'}
];

// Same storage key and values as the previous UI.
const DEFAULT_TAB_KEY = 'default_tab';
const TABS = [
  {label: 'Friends', value: 'friends', icon: 'i-lucide-users'},
  {label: 'Worlds', value: 'worlds', icon: 'i-lucide-earth'},
  {label: 'Events', value: 'events', icon: 'i-lucide-history'}
];

const toast = useToast();

const settings = ref<Settings>({...DEFAULT_SETTINGS});
const settingsLoaded = ref(false);
const defaultTab = ref(localStorage.getItem(DEFAULT_TAB_KEY) || 'friends');
const confirmClear = ref(false);
const version = chrome.runtime.getManifest().version;

onMounted(async () => {
  settings.value = await getSettings();
  settingsLoaded.value = true;
});

watch(settings, value => {
  if (settingsLoaded.value) saveSettings({...value}).catch(e => console.error('Could not save the settings', e));
}, {deep: true});

watch(defaultTab, tab => localStorage.setItem(DEFAULT_TAB_KEY, tab));

async function clearEvents(): Promise<void> {
  await sendToBackground(MessageType.CLEAR_EVENTS);
  confirmClear.value = false;
  toast.add({title: 'Event history cleared', icon: 'i-lucide-trash-2', color: 'neutral'});
}

const openUrl = (url: string) => chrome.tabs.create({url});
</script>

<template>
  <div class="flex flex-col gap-4 p-3">
    <section>
      <h3 class="mb-2 px-1 text-[11px] font-semibold tracking-wider text-dimmed uppercase">Desktop notifications</h3>
      <div class="divide-y divide-default overflow-hidden rounded-xl bg-elevated/60 ring-1 ring-default">
        <label
            v-for="setting of NOTIFICATION_SETTINGS"
            :key="setting.key"
            class="flex cursor-pointer items-center gap-3 px-3 py-2.5 transition hover:bg-elevated"
        >
          <span class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <UIcon :name="setting.icon" class="size-4"/>
          </span>
          <span class="min-w-0 flex-1">
            <span class="block text-sm font-medium text-highlighted">{{ setting.label }}</span>
            <span class="block text-xs text-muted">{{ setting.description }}</span>
          </span>
          <USwitch v-model="settings[setting.key]" :disabled="!settingsLoaded"/>
        </label>
      </div>
    </section>

    <section>
      <h3 class="mb-2 px-1 text-[11px] font-semibold tracking-wider text-dimmed uppercase">Popup</h3>
      <div class="divide-y divide-default overflow-hidden rounded-xl bg-elevated/60 ring-1 ring-default">
        <div class="flex items-center gap-3 px-3 py-2.5">
          <span class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
            <UIcon name="i-lucide-panel-bottom" class="size-4"/>
          </span>
          <span class="min-w-0 flex-1">
            <span class="block text-sm font-medium text-highlighted">Default tab</span>
            <span class="block text-xs text-muted">Shown when the popup opens.</span>
          </span>
          <USelect v-model="defaultTab" :items="TABS" value-key="value" size="sm" class="w-32"/>
        </div>

        <div class="flex items-center gap-3 px-3 py-2.5">
          <span class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-error/10 text-error">
            <UIcon name="i-lucide-history" class="size-4"/>
          </span>
          <span class="min-w-0 flex-1">
            <span class="block text-sm font-medium text-highlighted">Event history</span>
            <span class="block text-xs text-muted">Events are kept for 24 hours.</span>
          </span>
          <UButton label="Clear" icon="i-lucide-trash-2" color="error" variant="subtle" size="sm" @click="confirmClear = true"/>
        </div>
      </div>
    </section>

    <section class="vrce-glow flex flex-col items-center gap-2 rounded-xl bg-muted px-4 py-5 text-center ring-1 ring-default">
      <BrandLogo/>
      <p class="text-xs text-muted">Version {{ version }} · Manage your VRChat experience.</p>
      <div class="flex gap-1.5">
        <UButton
            label="GitHub"
            icon="i-lucide-github"
            color="neutral"
            variant="subtle"
            size="xs"
            @click="openUrl('https://github.com/ChxGuillaume/VRCe')"
        />
        <UButton
            label="VRChat API docs"
            icon="i-lucide-book-open"
            color="neutral"
            variant="subtle"
            size="xs"
            @click="openUrl('https://vrchat.community')"
        />
      </div>
    </section>

    <UModal
        v-model:open="confirmClear"
        title="Clear the event history?"
        description="Every recorded event will be removed. New events keep coming in."
    >
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton label="Cancel" color="neutral" variant="ghost" @click="confirmClear = false"/>
          <UButton label="Clear history" icon="i-lucide-trash-2" color="error" @click="clearEvents"/>
        </div>
      </template>
    </UModal>
  </div>
</template>
