<script setup lang="ts">
import {computed, watch} from 'vue';
import PresenceBadge from '../../components/base/PresenceBadge.vue';
import RankBadge from '../../components/base/RankBadge.vue';
import {useSession} from '../../composables/useSession';
import {useWorlds} from '../../composables/useWorlds';
import {formatDate, fromNow, isEarlyAdopter, isVRCPlus, languagesOf, platformLabel, presenceOf, trustRankOf} from '../../lib/vrchat';
import {userImageUrl} from '../../shared/vrchat-api';
import BioLinks from './BioLinks.vue';
import HeroAvatar from './HeroAvatar.vue';
import InfoTile from './InfoTile.vue';

const {user} = useSession();
const {loadWorld, worldOf} = useWorlds();

const presence = computed(() => user.value ? presenceOf(user.value) : null);
// Copies, the session user is readonly.
const tags = computed(() => user.value?.tags);
const rank = computed(() => trustRankOf(tags.value));
const languages = computed(() => languagesOf(tags.value));
const homeWorld = computed(() => worldOf(user.value?.homeLocation));
const heroImage = computed(() => user.value?.bannerUrl || user.value?.currentAvatarImageUrl || user.value?.currentAvatarThumbnailImageUrl);

watch(() => user.value?.homeLocation, worldId => {
  if (worldId?.startsWith('wrld_')) loadWorld(worldId);
}, {immediate: true});

// Most recent first.
const pastNames = computed(() => [...(user.value?.pastDisplayNames ?? [])]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()));

const statusHistory = computed(() => (user.value?.statusHistory ?? []).filter(status => status));

const openOnVRChat = () => user.value && chrome.tabs.create({url: `https://vrchat.com/home/user/${user.value.id}`});
const openSecurity = () => chrome.tabs.create({url: 'https://vrchat.com/home/profile'});
</script>

<template>
  <UDashboardPanel id="profile">
    <template #header>
      <UDashboardNavbar title="Profile" :ui="{title: 'font-display'}">
        <template #leading>
          <UDashboardSidebarCollapse/>
        </template>

        <template #right>
          <UButton label="Edit on vrchat.com" icon="i-lucide-external-link" color="neutral" variant="outline" @click="openOnVRChat"/>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <template v-if="user">
        <UAlert
            v-if="!user.twoFactorAuthEnabled"
            icon="i-lucide-shield-alert"
            color="warning"
            variant="subtle"
            title="Two-factor authentication is disabled"
            description="Protect your VRChat account by enabling 2FA in your account settings."
            :actions="[{label: 'Enable 2FA', color: 'warning', variant: 'solid', onClick: openSecurity}]"
            class="shrink-0"
        />

        <!-- Hero -->
        <section class="relative shrink-0 overflow-hidden rounded-2xl ring-1 ring-default">
          <div class="absolute inset-0">
            <img v-if="heroImage" :src="heroImage" alt="" class="size-full scale-110 object-cover opacity-35 blur-2xl">
            <div class="vrce-glow absolute inset-0"/>
            <div class="absolute inset-0 bg-gradient-to-t from-(--ui-bg) via-(--ui-bg)/70 to-transparent"/>
          </div>

          <div class="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-end sm:p-8">
            <HeroAvatar :src="userImageUrl(user)" :name="user.displayName" :presence="presence" :rank="rank"/>

            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <h1 class="font-display text-3xl font-bold tracking-tight text-highlighted">{{ user.displayName }}</h1>
                <span v-if="user.pronouns" class="text-sm text-muted">{{ user.pronouns }}</span>
              </div>
              <p class="mt-0.5 text-sm text-dimmed">@{{ user.username }}</p>

              <p v-if="user.statusDescription" class="mt-3 text-default">“{{ user.statusDescription }}”</p>

              <div class="mt-4 flex flex-wrap items-center gap-2">
                <PresenceBadge v-if="presence" :presence="presence"/>
                <RankBadge v-if="rank" :rank="rank"/>
                <UBadge v-if="isVRCPlus(tags)" icon="i-lucide-gem" label="VRChat+" color="secondary" variant="subtle"/>
                <UBadge v-if="isEarlyAdopter(tags)" icon="i-lucide-sparkles" label="Early adopter" color="warning" variant="subtle"/>
                <UBadge
                    :icon="user.twoFactorAuthEnabled ? 'i-lucide-shield-check' : 'i-lucide-shield-off'"
                    :label="user.twoFactorAuthEnabled ? '2FA enabled' : '2FA disabled'"
                    :color="user.twoFactorAuthEnabled ? 'success' : 'warning'"
                    variant="subtle"
                />
              </div>
            </div>

            <div class="flex gap-6 sm:text-right">
              <div>
                <p class="font-display text-2xl font-bold text-highlighted tabular-nums">{{ user.friends.length }}</p>
                <p class="text-xs tracking-wide text-muted uppercase">Friends</p>
              </div>
              <div>
                <p class="font-display text-2xl font-bold text-highlighted tabular-nums">{{ user.onlineFriends?.length ?? 0 }}</p>
                <p class="text-xs tracking-wide text-muted uppercase">Online</p>
              </div>
            </div>
          </div>
        </section>

        <div class="grid shrink-0 gap-4 xl:grid-cols-3">
          <!-- About -->
          <section class="space-y-4 rounded-xl bg-elevated/50 p-5 ring-1 ring-default xl:col-span-2">
            <h2 class="font-display text-lg font-semibold text-highlighted">About</h2>

            <p class="text-sm leading-relaxed whitespace-pre-line text-default" :class="{'text-dimmed italic': !user.bio}">
              {{ user.bio || 'No bio yet.' }}
            </p>

            <BioLinks v-if="user.bioLinks?.length" :links="user.bioLinks.filter(link => link)"/>

            <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <InfoTile icon="i-lucide-monitor-smartphone" label="Last platform" :value="platformLabel(user.last_platform)"/>
              <InfoTile icon="i-lucide-clock" label="Last login">
                <UTooltip :text="formatDate(user.last_login)">
                  <span>{{ fromNow(user.last_login) }}</span>
                </UTooltip>
              </InfoTile>
              <InfoTile icon="i-lucide-calendar" label="Joined" :value="formatDate(user.date_joined, 'MMMM D, YYYY')"/>
              <InfoTile icon="i-lucide-languages" label="Languages">
                <div v-if="languages.length" class="flex flex-wrap gap-1">
                  <UBadge v-for="language in languages" :key="language" :label="language.toUpperCase()" color="neutral" variant="subtle" size="sm"/>
                </div>
                <span v-else class="text-dimmed">None set</span>
              </InfoTile>
              <InfoTile icon="i-lucide-house" label="Home world" :value="homeWorld?.name ?? (user.homeLocation ? 'Loading…' : 'None')"/>
              <InfoTile icon="i-lucide-user-round-check" label="Age verification" :value="user.ageVerified ? 'Verified' : 'Not verified'"/>
            </div>
          </section>

          <!-- History -->
          <section class="space-y-5 rounded-xl bg-elevated/50 p-5 ring-1 ring-default">
            <div>
              <h2 class="mb-3 font-display text-lg font-semibold text-highlighted">Past display names</h2>
              <ol v-if="pastNames.length" class="relative space-y-3 border-l border-default pl-4">
                <li v-for="name in pastNames" :key="name.displayName + name.updated_at" class="relative">
                  <span class="absolute top-1.5 -left-[21px] size-2.5 rounded-full bg-primary ring-4 ring-(--ui-bg-elevated)"/>
                  <p class="text-sm font-medium text-highlighted">
                    {{ name.displayName }}
                    <UBadge v-if="name.reverted" label="reverted" color="neutral" variant="outline" size="sm" class="ml-1"/>
                  </p>
                  <p class="text-xs text-dimmed">{{ formatDate(name.updated_at, 'MMM D, YYYY') }}</p>
                </li>
              </ol>
              <p v-else class="text-sm text-dimmed italic">You never changed your display name.</p>
            </div>

            <USeparator/>

            <div>
              <h2 class="mb-3 font-display text-lg font-semibold text-highlighted">Status history</h2>
              <div v-if="statusHistory.length" class="flex flex-wrap gap-1.5">
                <UBadge v-for="(status, index) in statusHistory" :key="index" :label="status" color="neutral" variant="subtle"/>
              </div>
              <p v-else class="text-sm text-dimmed italic">No status history.</p>
            </div>
          </section>
        </div>
      </template>
    </template>
  </UDashboardPanel>
</template>
