<script setup lang="ts">
import {computed} from 'vue';
import {type InstanceAccess, type ParsedLocation, REGION_LABELS} from '../../lib/vrchat';

const props = defineProps<{place: ParsedLocation}>();

const ACCESS_ICONS: Record<InstanceAccess, string> = {
  'public': 'i-lucide-globe',
  'friends+': 'i-lucide-users-round',
  'friends': 'i-lucide-user-round-check',
  'invite+': 'i-lucide-mail-plus',
  'invite': 'i-lucide-mail',
  'group': 'i-lucide-shield',
  'group+': 'i-lucide-shield-plus',
  'group public': 'i-lucide-shield-check'
};

const instance = computed(() => props.place.kind === 'instance' ? props.place : null);
</script>

<template>
  <span v-if="instance" class="inline-flex items-center gap-1">
    <UBadge
        :icon="ACCESS_ICONS[instance.access]"
        :label="instance.access"
        color="neutral"
        variant="subtle"
        size="sm"
        class="capitalize"
    />
    <UBadge :label="instance.region.toUpperCase()" :title="REGION_LABELS[instance.region]" color="neutral" variant="outline" size="sm"/>
  </span>
  <UBadge v-else-if="place.kind === 'private'" icon="i-lucide-eye-off" label="Private" color="neutral" variant="subtle" size="sm"/>
  <UBadge v-else-if="place.kind === 'traveling'" icon="i-lucide-plane" label="Traveling" color="neutral" variant="subtle" size="sm"/>
  <UBadge v-else-if="place.kind === 'website'" icon="i-lucide-monitor" label="Website" color="neutral" variant="subtle" size="sm"/>
</template>
