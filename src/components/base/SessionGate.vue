<script setup lang="ts">
import {useSession} from '../../composables/useSession';

// Shows the loading / logged out / Cloudflare / error states of the session, and the page once logged in.
const {status, load} = useSession();

const openLogin = () => chrome.tabs.create({url: 'https://vrchat.com/home/login'});
const openHome = () => chrome.tabs.create({url: 'https://vrchat.com/home'});
</script>

<template>
  <div v-if="status === 'loading'" class="flex h-full min-h-60 flex-col items-center justify-center gap-3 text-muted">
    <UIcon name="i-lucide-loader-circle" class="size-7 animate-spin text-primary"/>
    <span class="text-sm">Connecting to VRChat…</span>
  </div>

  <UEmpty
      v-else-if="status === 'logged-out'"
      icon="i-lucide-log-in"
      title="You're not logged in"
      description="VRCe uses your vrchat.com session. Log in on the VRChat website, then come back."
      :actions="[
        {label: 'Log in on vrchat.com', icon: 'i-lucide-external-link', onClick: openLogin},
        {label: 'I\'m logged in', color: 'neutral', variant: 'subtle', icon: 'i-lucide-refresh-cw', onClick: load}
      ]"
      class="h-full min-h-60"
  />

  <UEmpty
      v-else-if="status === 'cloudflare'"
      icon="i-lucide-shield-alert"
      title="Cloudflare check required"
      description="Cloudflare wants to verify your browser. Open the VRChat website once, then retry."
      :actions="[
        {label: 'Open vrchat.com', icon: 'i-lucide-external-link', onClick: openHome},
        {label: 'Retry', color: 'neutral', variant: 'subtle', icon: 'i-lucide-refresh-cw', onClick: load}
      ]"
      class="h-full min-h-60"
  />

  <UEmpty
      v-else-if="status === 'error'"
      icon="i-lucide-triangle-alert"
      title="Couldn't reach VRChat"
      description="The VRChat API didn't answer as expected."
      :actions="[{label: 'Retry', icon: 'i-lucide-refresh-cw', onClick: load}]"
      class="h-full min-h-60"
  />

  <slot v-else/>
</template>
