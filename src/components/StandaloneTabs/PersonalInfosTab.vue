<template>
  <v-row class="pb-3">
    <v-col cols="12" class="text-center">
      <div
          v-if="user_data.userIcon"
          class="d-inline-block rounded pa-1 mx-2"
          :style="{ background: user_data.rank ? user_data.rank.color : '' }">
        <v-img
            :src="user_data.userIcon"
            class="rounded"
            width="150"
            height="150"
        >
          <template v-slot:placeholder>
            <v-row class="fill-height ma-0 align-center justify-center">
              <v-progress-circular
                  indeterminate
                  color="grey-lighten-5"
              />
            </v-row>
          </template>
        </v-img>
      </div>
      <div
          class="d-inline-block rounded pa-1 mx-2"
          :style="{ background: user_data.rank ? user_data.rank.color : '' }"
      >
        <v-img
            :src="user_data.currentAvatarThumbnailImageUrl"
            class="rounded"
            width="200"
            min-height="150"
        >
          <template v-slot:placeholder>
            <v-row class="fill-height ma-0 align-center justify-center">
              <v-progress-circular
                  indeterminate
                  color="grey-lighten-5"
              />
            </v-row>
          </template>
        </v-img>
      </div>
    </v-col>
    <v-col v-if="user_data.id" cols="12" class="text-center">
      <h1>{{ user_data.displayName }} <span class="text-body-small">{{ user_data.username }}</span></h1>
    </v-col>
    <v-col v-if="user_data.id" cols="12" class="text-center">
      <v-chip class="mx-1" :color="user_data.rank.color" variant="flat">
        {{ user_data.rank.name }}
      </v-chip>
      <v-chip class="mx-1" :color="user_data.state.color" variant="flat">
        {{ user_data.state.name }}
      </v-chip>
      <v-chip class="mx-1" :color="user_data.status.color" variant="flat">
        {{ user_data.status.name }}
      </v-chip>
      <v-chip class="mx-1" color="primary" variant="flat">
        <span v-if="user_data.id">{{ user_data.friends.length }} Friends</span>
      </v-chip>
      <v-chip
          class="mx-1"
          :color="user_data.twoFactorAuthEnabled ? 'green' : 'red'"
          variant="flat"
          href="https://vrchat.com/home/profile"
          target="_blank"
      >
        <v-icon size="small" start>devices</v-icon>
        <span v-if="user_data.id">{{ user_data.twoFactorAuthEnabled ? '2FA Enabled' : 'Please enable 2FA' }}</span>
      </v-chip>
    </v-col>
    <v-col cols="6" class="px-16">
      <h2>Bio:</h2>
      <p class="text-pre-wrap">
        {{ user_data.bio || '(No Bio)' }}
      </p>
    </v-col>
    <v-col cols="4" class="px-16">
      <h2>Status:</h2>
      {{ user_data.statusDescription || '(No Status)' }}
    </v-col>
    <v-col cols="4" class="px-16">
      <h2>Bio Links:</h2>
      <ul>
        <li v-for="link of user_data.bioLinks" :key="link">
          <a :href="link">{{ link }}</a>
        </li>
      </ul>
      <span v-if="user_data.bioLinks && !user_data.bioLinks.length">
        (No Bio Links)
      </span>
    </v-col>
    <v-col cols="4" class="px-16">
      <h2>Status History:</h2>
      <ul>
        <li v-for="status of user_data.statusHistory" :key="status">
          {{ status }}
        </li>
      </ul>
      <span v-if="user_data.statusHistory && !user_data.statusHistory.length">
        (No Status History)
      </span>
    </v-col>
    <v-col cols="4" class="px-16">
      <h2>Display Name History:</h2>
      <ul>
        <li v-for="pastName of user_data.pastDisplayNames" :key="pastName.updated_at + pastName.displayName">
          {{ pastName.displayName }}
        </li>
      </ul>
      <span v-if="user_data.pastDisplayNames && !user_data.pastDisplayNames.length">
        (No Display Name History)
      </span>
    </v-col>
    <v-col cols="3" class="px-16">
      <h2>Languages:</h2>
      <span v-if="user_data.languages">
        {{ user_data.languages.join(', ') || '(No Languages Specified)' }}
      </span>
    </v-col>
    <v-col cols="3" class="px-16">
      <h2>Last Platform:</h2>
      {{ user_data.last_platform || '(No Bio)' }}
    </v-col>
    <v-col cols="3" class="px-16">
      <h2>Date Joined:</h2>
      {{ user_data.date_joined }}
    </v-col>
    <v-col cols="3" class="px-16">
      <h2>Last Login:</h2>
      {{ user_data.last_login }}
    </v-col>
  </v-row>
</template>

<script lang="ts">
import {defineComponent, type PropType} from 'vue';
import type {CurrentUserRow} from '../../types/standalone-users';

export default defineComponent({
  name: 'PersonalInfosTab',
  props: {
    user_data: {
      type: Object as PropType<CurrentUserRow>,
      required: true
    }
  }
})
</script>


