<script setup lang="ts">
import {computed, h, ref, watch} from 'vue';
import type {DropdownMenuItem, SelectMenuItem, TableColumn, TableRow} from '@nuxt/ui';
import LocationBadges from '../../components/base/LocationBadges.vue';
import PresenceBadge from '../../components/base/PresenceBadge.vue';
import RankBadge from '../../components/base/RankBadge.vue';
import UserAvatar from '../../components/base/UserAvatar.vue';
import {useFriendDetails} from '../../composables/useFriendDetails';
import {useWorlds} from '../../composables/useWorlds';
import {formatDate, fromNow, platformLabel, type PresenceKey, PRESENCES, type RankKey, RANKS} from '../../lib/vrchat';
import FriendStats from './FriendStats.vue';
import SortableHeader from './SortableHeader.vue';
import {type DashboardFriend, useDashboardFriends} from './useDashboardFriends';

const {rows, loading, loaded, enriching, enrichedCount} = useDashboardFriends();
const {worldOf} = useWorlds();
const {open} = useFriendDetails();

// -- Filters ----------------------------------------------------------------------------------------------------------

const search = ref('');
const presenceFilter = ref<PresenceKey[]>([]);
const rankFilter = ref<RankKey[]>([]);

const presenceItems = Object.values(PRESENCES).map(presence => ({label: presence.label, value: presence.key, color: presence.color}));
const rankItems = Object.values(RANKS).reverse().map(rank => ({label: rank.label, value: rank.key, color: rank.color}));

const worldName = (row: DashboardFriend): string => worldOf(row.worldId)?.name ?? '';

const filteredRows = computed(() => {
  const query = search.value.trim().toLowerCase();

  return rows.value.filter(row =>
      (!presenceFilter.value.length || presenceFilter.value.includes(row.presence.key))
      && (!rankFilter.value.length || (row.rank !== null && rankFilter.value.includes(row.rank.key)))
      && (!query || [row.displayName, row.username, row.statusDescription, worldName(row), ...row.languages]
          .some(value => value?.toLowerCase().includes(query))));
});

const hasFilters = computed(() => !!search.value || !!presenceFilter.value.length || !!rankFilter.value.length);

function clearFilters(): void {
  search.value = '';
  presenceFilter.value = [];
  rankFilter.value = [];
}

// -- Columns ----------------------------------------------------------------------------------------------------------

const sortable = (label: string): TableColumn<DashboardFriend>['header'] =>
    ({column}) => h(SortableHeader, {column, label});

const timestamp = (date: string | null | undefined) => date ? new Date(date).getTime() : 0;

const columns: TableColumn<DashboardFriend>[] = [
  {id: 'user', accessorFn: row => row.displayName.toLowerCase(), header: sortable('Friend'), enableHiding: false},
  {id: 'presence', accessorFn: row => row.presence.order, header: sortable('Presence')},
  {id: 'status', accessorFn: row => row.statusDescription, header: 'Status'},
  {id: 'rank', accessorFn: row => row.rank?.order ?? -1, header: sortable('Rank')},
  {id: 'location', accessorFn: row => worldName(row), header: sortable('Location')},
  {id: 'platform', accessorFn: row => platformLabel(row.platform), header: sortable('Platform')},
  {id: 'languages', accessorFn: row => row.languages.join(', '), header: 'Languages'},
  {id: 'lastLogin', accessorFn: row => timestamp(row.lastLogin), header: sortable('Last login')},
  {id: 'dateJoined', accessorFn: row => timestamp(row.dateJoined), header: sortable('Joined')},
  {id: 'badges', header: 'Badges', enableSorting: false}
];

const COLUMN_LABELS: Record<string, string> = {
  presence: 'Presence',
  status: 'Status',
  rank: 'Rank',
  location: 'Location',
  platform: 'Platform',
  languages: 'Languages',
  lastLogin: 'Last login',
  dateJoined: 'Joined',
  badges: 'Badges'
};

const sorting = ref([{id: 'presence', desc: true}]);

// -- Column visibility, remembered per browser -------------------------------------------------------------------------

const VISIBILITY_KEY = 'vrce-dashboard-columns';

function readVisibility(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(VISIBILITY_KEY) || '') as Record<string, boolean>;
  } catch {
    return {dateJoined: false};
  }
}

const columnVisibility = ref<Record<string, boolean>>(readVisibility());

watch(columnVisibility, value => {
  try {
    localStorage.setItem(VISIBILITY_KEY, JSON.stringify(value));
  } catch {
    // Not critical, the default columns are shown next time.
  }
}, {deep: true});

const columnItems = computed<DropdownMenuItem[]>(() => Object.entries(COLUMN_LABELS).map(([id, label]) => ({
  label,
  type: 'checkbox' as const,
  checked: columnVisibility.value[id] !== false,
  onUpdateChecked: (checked: boolean) => columnVisibility.value = {...columnVisibility.value, [id]: checked},
  onSelect: (e: Event) => e.preventDefault()
})));

const onSelect = (_e: Event, row: TableRow<DashboardFriend>) => open(row.original.id);

const filterValueLabel = (count: number, single: string) => count ? `${count} ${single}${count > 1 ? 's' : ''}` : undefined;

const presenceSelectItems = computed<SelectMenuItem[]>(() => presenceItems);
const rankSelectItems = computed<SelectMenuItem[]>(() => rankItems);
</script>

<template>
  <UDashboardPanel id="friends">
    <template #header>
      <UDashboardNavbar title="Friends" :ui="{title: 'font-display'}">
        <template #leading>
          <UDashboardSidebarCollapse/>
        </template>

        <template #trailing>
          <UBadge v-if="rows.length" :label="rows.length" variant="subtle"/>
        </template>

        <template #right>
          <span v-if="enriching" class="hidden items-center gap-2 text-xs text-muted sm:flex">
            <UIcon name="i-lucide-loader-circle" class="size-3.5 animate-spin text-primary"/>
            Loading details {{ enrichedCount }}/{{ rows.length }}
          </span>
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <UInput
              v-model="search"
              icon="i-lucide-search"
              placeholder="Search friends, worlds, languages…"
              class="w-full max-w-xs"
              :ui="{trailing: 'pe-1'}"
          >
            <template v-if="search" #trailing>
              <UButton color="neutral" variant="link" size="sm" icon="i-lucide-x" aria-label="Clear search" @click="search = ''"/>
            </template>
          </UInput>

          <USelectMenu
              v-model="presenceFilter"
              :items="presenceSelectItems"
              value-key="value"
              multiple
              :search-input="false"
              placeholder="Presence"
              icon="i-lucide-activity"
              class="w-40"
          >
            <template #default>
              <span :class="presenceFilter.length ? 'text-highlighted' : 'text-dimmed'">
                {{ filterValueLabel(presenceFilter.length, 'presence') ?? 'Presence' }}
              </span>
            </template>
            <template #item-leading="{item}">
              <span class="size-2 rounded-full" :style="{background: (item as {color: string}).color}"/>
            </template>
          </USelectMenu>

          <USelectMenu
              v-model="rankFilter"
              :items="rankSelectItems"
              value-key="value"
              multiple
              :search-input="false"
              placeholder="Rank"
              icon="i-lucide-shield-check"
              class="w-36"
          >
            <template #default>
              <span :class="rankFilter.length ? 'text-highlighted' : 'text-dimmed'">
                {{ filterValueLabel(rankFilter.length, 'rank') ?? 'Rank' }}
              </span>
            </template>
            <template #item-leading="{item}">
              <span class="size-2 rounded-full" :style="{background: (item as {color: string}).color}"/>
            </template>
          </USelectMenu>

          <UButton v-if="hasFilters" label="Clear" color="neutral" variant="ghost" icon="i-lucide-filter-x" @click="clearFilters"/>
        </template>

        <template #right>
          <UDropdownMenu :items="columnItems" :content="{align: 'end'}">
            <UButton label="Columns" color="neutral" variant="outline" icon="i-lucide-columns-3" trailing-icon="i-lucide-chevron-down"/>
          </UDropdownMenu>
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <FriendStats :rows="rows" :loaded="loaded"/>

      <div class="shrink-0 overflow-hidden rounded-xl bg-elevated/40 ring-1 ring-default">
        <UTable
            v-model:sorting="sorting"
            v-model:column-visibility="columnVisibility"
            :data="filteredRows"
            :columns="columns"
            :loading="loading && !rows.length"
            :get-row-id="(row: DashboardFriend) => row.id"
            sticky="header"
            :empty="hasFilters ? 'No friend matches these filters.' : 'No friends to show.'"
            class="max-h-[calc(100vh-8.5rem)] min-h-64"
            :ui="{
              thead: 'bg-muted/90 backdrop-blur',
              th: 'py-2 text-xs font-semibold text-muted whitespace-nowrap',
              tr: 'cursor-pointer transition-colors hover:bg-elevated/70 data-[selected=true]:bg-elevated',
              td: 'py-2.5 align-middle'
            }"
            @select="onSelect"
        >
          <template #user-cell="{row}">
            <div class="flex min-w-48 items-center gap-3">
              <UserAvatar :src="row.original.image" :name="row.original.displayName" :presence="row.original.presence"
                          :rank="row.original.rank" :favorite="row.original.favorite" size="md"/>
              <div class="min-w-0">
                <p class="truncate font-display font-semibold text-highlighted">{{ row.original.displayName }}</p>
                <p v-if="row.original.username" class="truncate text-xs text-dimmed">@{{ row.original.username }}</p>
                <USkeleton v-else-if="!row.original.enriched" class="mt-1 h-3 w-20"/>
              </div>
            </div>
          </template>

          <template #presence-cell="{row}">
            <PresenceBadge :presence="row.original.presence"/>
          </template>

          <template #status-cell="{row}">
            <p class="max-w-56 truncate text-sm text-muted" :title="row.original.statusDescription">
              {{ row.original.statusDescription || '—' }}
            </p>
          </template>

          <template #rank-cell="{row}">
            <RankBadge v-if="row.original.rank" :rank="row.original.rank"/>
            <USkeleton v-else-if="!row.original.enriched" class="h-5 w-16 rounded-full"/>
            <span v-else class="text-dimmed">—</span>
          </template>

          <template #location-cell="{row}">
            <div v-if="row.original.worldId" class="flex min-w-56 items-center gap-2.5">
              <img
                  v-if="worldOf(row.original.worldId)?.thumbnailImageUrl"
                  :src="worldOf(row.original.worldId)?.thumbnailImageUrl"
                  alt=""
                  class="h-9 w-14 shrink-0 rounded-md object-cover ring-1 ring-default"
              >
              <USkeleton v-else class="h-9 w-14 shrink-0 rounded-md"/>
              <div class="min-w-0">
                <p class="max-w-48 truncate text-sm font-medium text-default">
                  {{ worldOf(row.original.worldId)?.name ?? 'Loading world…' }}
                </p>
                <LocationBadges :place="row.original.place" class="mt-0.5"/>
              </div>
            </div>
            <LocationBadges v-else-if="row.original.presence.key !== 'offline'" :place="row.original.place"/>
            <span v-else class="text-dimmed">—</span>
          </template>

          <template #platform-cell="{row}">
            <span class="text-sm whitespace-nowrap text-muted">{{ platformLabel(row.original.platform) }}</span>
          </template>

          <template #languages-cell="{row}">
            <div v-if="row.original.languages.length" class="flex gap-1">
              <UBadge v-for="language in row.original.languages" :key="language" :label="language.toUpperCase()"
                      color="neutral" variant="subtle" size="sm"/>
            </div>
            <USkeleton v-else-if="!row.original.enriched" class="h-5 w-12"/>
            <span v-else class="text-dimmed">—</span>
          </template>

          <template #lastLogin-cell="{row}">
            <UTooltip :text="formatDate(row.original.lastLogin)">
              <span class="text-sm whitespace-nowrap text-muted">{{ fromNow(row.original.lastLogin) }}</span>
            </UTooltip>
          </template>

          <template #dateJoined-cell="{row}">
            <span v-if="row.original.dateJoined" class="text-sm whitespace-nowrap text-muted">
              {{ formatDate(row.original.dateJoined, 'YYYY-MM-DD') }}
            </span>
            <USkeleton v-else-if="!row.original.enriched" class="h-4 w-20"/>
            <span v-else class="text-dimmed">—</span>
          </template>

          <template #badges-cell="{row}">
            <div class="flex items-center gap-1.5">
              <UTooltip v-if="row.original.vrcPlus" text="VRChat+ supporter">
                <UBadge icon="i-lucide-gem" label="VRC+" color="secondary" variant="subtle" size="sm"/>
              </UTooltip>
              <UTooltip v-if="row.original.earlyAdopter" text="Early adopter">
                <UBadge icon="i-lucide-sparkles" color="warning" variant="subtle" size="sm" square/>
              </UTooltip>
            </div>
          </template>
        </UTable>
      </div>

      <p v-if="filteredRows.length !== rows.length" class="text-center text-xs text-dimmed">
        Showing {{ filteredRows.length }} of {{ rows.length }} friends
      </p>
    </template>
  </UDashboardPanel>
</template>
