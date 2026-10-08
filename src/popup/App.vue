<script setup lang="ts">
import {onMounted} from 'vue';
import BrandLogo from '../components/base/BrandLogo.vue';
import SessionGate from '../components/base/SessionGate.vue';
import UserAvatar from '../components/base/UserAvatar.vue';
import PresenceBadge from '../components/base/PresenceBadge.vue';
import {useSession} from '../composables/useSession';
import {presenceOf} from '../lib/vrchat';
import {userImageUrl} from '../shared/vrchat-api';

const {user, load} = useSession();
onMounted(load);
</script>

<template>
  <UApp>
    <div class="vrce-glow w-[400px] h-[600px] flex flex-col">
      <header class="flex items-center justify-between px-4 py-3">
        <BrandLogo/>
        <UButton icon="i-lucide-layout-dashboard" color="neutral" variant="ghost"/>
      </header>
      <SessionGate>
        <div v-if="user" class="flex items-center gap-3 px-4">
          <UserAvatar :src="userImageUrl(user)" :name="user.displayName" :presence="presenceOf(user)" size="xl"/>
          <div>
            <p class="font-display font-semibold">{{ user.displayName }}</p>
            <PresenceBadge :presence="presenceOf(user)"/>
          </div>
        </div>
      </SessionGate>
    </div>
  </UApp>
</template>
