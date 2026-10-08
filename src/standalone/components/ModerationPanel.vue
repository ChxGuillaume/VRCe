<script setup lang="ts">
import {computed, h, ref} from 'vue';
import type {TableColumn, TableRow} from '@nuxt/ui';
import {useFriendDetails} from '../../composables/useFriendDetails';
import {formatDate, fromNow} from '../../lib/vrchat';
import type {PlayerModeration} from '../../types/vrchat';
import SortableHeader from './SortableHeader.vue';
import {moderationKindOf, useModerations} from './useModerations';

const {moderations, loading, loaded, load} = useModerations();
const {open} = useFriendDetails();

const search = ref('');
const typeFilter = ref<string | null>(null);

// Filter chips, one per moderation type present, with its count.
const types = computed(() => {
  const counts = new Map<string, number>();
  moderations.value.forEach(moderation => counts.set(moderation.type, (counts.get(moderation.type) ?? 0) + 1));

  return [...counts.entries()]
      .map(([type, count]) => ({type, count, kind: moderationKindOf(type)}))
      .sort((a, b) => b.count - a.count);
});

const filtered = computed(() => {
  const query = search.value.trim().toLowerCase();

  return moderations.value.filter(moderation =>
      (!typeFilter.value || moderation.type === typeFilter.value)
      && (!query || moderation.targetDisplayName?.toLowerCase().includes(query)));
});

const sortable = (label: string): TableColumn<PlayerModeration>['header'] =>
    ({column}) => h(SortableHeader, {column, label});

const columns: TableColumn<PlayerModeration>[] = [
  {id: 'target', accessorFn: row => row.targetDisplayName?.toLowerCase() ?? '', header: sortable('User')},
  {id: 'type', accessorFn: row => moderationKindOf(row.type).label, header: sortable('Action')},
  {id: 'created', accessorFn: row => new Date(row.created).getTime(), header: sortable('Date')},
  {id: 'actions', header: '', enableSorting: false}
];

const sorting = ref([{id: 'created', desc: true}]);

const onSelect = (_e: Event, row: TableRow<PlayerModeration>) => open(row.original.targetUserId);

const openOnVRChat = (userId: string) => chrome.tabs.create({url: `https://vrchat.com/home/user/${userId}`});
</script>

<template>
  <UDashboardPanel id="moderation">
    <template #header>
      <UDashboardNavbar title="Moderation" :ui="{title: 'font-display'}">
        <template #leading>
          <UDashboardSidebarCollapse/>
        </template>

        <template #trailing>
          <UBadge v-if="moderations.length" :label="moderations.length" variant="subtle"/>
        </template>

        <template #right>
          <UButton icon="i-lucide-refresh-cw" color="neutral" variant="ghost" :loading="loading" aria-label="Refresh" @click="load"/>
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <UInput v-model="search" icon="i-lucide-search" placeholder="Search users…" class="w-full max-w-xs"/>
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <div class="flex shrink-0 flex-wrap gap-2">
        <UButton
            label="All"
            :color="typeFilter === null ? 'primary' : 'neutral'"
            :variant="typeFilter === null ? 'soft' : 'outline'"
            size="sm"
            class="rounded-full"
            @click="typeFilter = null"
        >
          <template #trailing>
            <span class="text-xs tabular-nums opacity-70">{{ moderations.length }}</span>
          </template>
        </UButton>

        <UButton
            v-for="entry in types"
            :key="entry.type"
            :label="entry.kind.label"
            :icon="entry.kind.icon"
            :color="typeFilter === entry.type ? entry.kind.color : 'neutral'"
            :variant="typeFilter === entry.type ? 'soft' : 'outline'"
            size="sm"
            class="rounded-full"
            @click="typeFilter = typeFilter === entry.type ? null : entry.type"
        >
          <template #trailing>
            <span class="text-xs tabular-nums opacity-70">{{ entry.count }}</span>
          </template>
        </UButton>
      </div>

      <div class="shrink-0 overflow-hidden rounded-xl bg-elevated/40 ring-1 ring-default">
        <UTable
            v-model:sorting="sorting"
            :data="filtered"
            :columns="columns"
            :loading="loading && !loaded"
            sticky="header"
            :empty="moderations.length ? 'No moderation matches these filters.' : 'You haven\'t moderated anyone.'"
            class="max-h-[calc(100vh-13rem)]"
            :ui="{
              thead: 'bg-muted/90 backdrop-blur',
              th: 'py-2 text-xs font-semibold text-muted whitespace-nowrap',
              tr: 'cursor-pointer transition-colors hover:bg-elevated/70',
              td: 'py-2.5'
            }"
            @select="onSelect"
        >
          <template #target-cell="{row}">
            <div class="flex items-center gap-3">
              <span class="grid size-9 place-items-center rounded-full bg-accented font-display text-sm font-semibold text-muted uppercase">
                {{ row.original.targetDisplayName?.slice(0, 1) || '?' }}
              </span>
              <div class="min-w-0">
                <p class="truncate font-display font-semibold text-highlighted">{{ row.original.targetDisplayName || 'Unknown user' }}</p>
                <p class="truncate font-mono text-[11px] text-dimmed">{{ row.original.targetUserId }}</p>
              </div>
            </div>
          </template>

          <template #type-cell="{row}">
            <UBadge
                :icon="moderationKindOf(row.original.type).icon"
                :label="moderationKindOf(row.original.type).label"
                :color="moderationKindOf(row.original.type).color"
                variant="subtle"
            />
          </template>

          <template #created-cell="{row}">
            <UTooltip :text="formatDate(row.original.created)">
              <span class="text-sm whitespace-nowrap text-muted">{{ fromNow(row.original.created) }}</span>
            </UTooltip>
          </template>

          <template #actions-cell="{row}">
            <div class="flex justify-end">
              <UTooltip text="Open on vrchat.com">
                <UButton
                    icon="i-lucide-external-link"
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    aria-label="Open on vrchat.com"
                    @click.stop="openOnVRChat(row.original.targetUserId)"
                />
              </UTooltip>
            </div>
          </template>
        </UTable>
      </div>
    </template>
  </UDashboardPanel>
</template>
