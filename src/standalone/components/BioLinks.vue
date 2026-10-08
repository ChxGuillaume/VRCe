<script setup lang="ts">
defineProps<{links: string[]}>();

function hostOf(link: string): string {
  try {
    return new URL(link).hostname.replace(/^www\./, '');
  } catch {
    return link;
  }
}

// A recognisable icon for the most common link targets, a plain link icon otherwise.
const ICONS: [RegExp, string][] = [
  [/(^|\.)twitter\.com$|(^|\.)x\.com$/, 'i-lucide-twitter'],
  [/(^|\.)youtube\.com$|(^|\.)youtu\.be$/, 'i-lucide-youtube'],
  [/(^|\.)twitch\.tv$/, 'i-lucide-twitch'],
  [/(^|\.)github\.com$/, 'i-lucide-github'],
  [/(^|\.)instagram\.com$/, 'i-lucide-instagram'],
  [/(^|\.)discord\.(gg|com)$/, 'i-lucide-message-circle']
];

const iconOf = (link: string) => ICONS.find(([pattern]) => pattern.test(hostOf(link)))?.[1] ?? 'i-lucide-link';

</script>

<template>
  <div class="flex flex-wrap gap-2">
    <UButton
        v-for="link in links"
        :key="link"
        :to="link"
        target="_blank"
        :icon="iconOf(link)"
        :label="hostOf(link)"
        color="neutral"
        variant="subtle"
        size="sm"
        trailing-icon="i-lucide-arrow-up-right"
        :ui="{trailingIcon: 'size-3.5 opacity-60'}"
    />
  </div>
</template>
