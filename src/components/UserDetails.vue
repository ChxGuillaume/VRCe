<template>
  <v-dialog
      v-model="dialog"
      :fullscreen="fullscreen"
      transition="scale-transition"
      width="500"
  >
    <v-card variant="outlined" class="pt-4">
      <v-tooltip v-if="logged_in" location="right">
        <template v-slot:activator="{ props }">
          <v-btn
              v-bind="props"
              icon
              position="absolute"
              location="top left"
              color="red"
              size="small"
              class="ml-4"
              style="top: 20px; z-index: 1"
              @click="dialog = false"
          >
            <v-icon>close</v-icon>
          </v-btn>
        </template>
        <span>Close</span>
      </v-tooltip>

      <v-card-text v-if="!friend" class="d-flex justify-center py-8">
        <v-progress-circular indeterminate/>
      </v-card-text>
      <v-card-text v-else>
        <v-row>
          <v-col cols="12" class="text-end">
            <div v-if="friend.userIcon" class="d-inline-block rounded pa-1 mx-2"
                 :style="{ background: friend.rank ? friend.rank.color : '' }">
              <v-img class="rounded" :src="friend.userIcon" height="75" width="75" cover/>
            </div>
            <div class="d-inline-block rounded pa-1 mx-2"
                 :style="{ background: friend.rank ? friend.rank.color : '' }">
              <v-img class="rounded" :src="friend.currentAvatarThumbnailImageUrl" height="75" width="100" cover/>
            </div>

          </v-col>
          <v-col cols="12" class="d-flex align-center pb-0">
            <h2 class="d-inline-block">{{ friend.displayName }}</h2>
            <v-chip
                v-if="friend.state"
                :color="friend.state.color"
                variant="flat"
                size="small"
                class="ml-2"
            >
              {{ friend.state.name }}
            </v-chip>
            <v-chip
                v-if="friend.status"
                :color="friend.status.color"
                variant="flat"
                size="small"
                class="ml-2"
            >
              {{ friend.status.name }}
            </v-chip>
            <v-chip
                v-if="friend.rank"
                :color="friend.rank.color"
                variant="flat"
                size="small"
                class="ml-2"
            >
              {{ friend.rank.name }}
            </v-chip>
          </v-col>
          <v-col cols="12" class="pt-0">
            <span class="text-body-small">{{ friend.username }}</span>
          </v-col>
          <v-col cols="12" v-if="friend.statusDescription">
            <h4>Status:</h4>
            <span class="text-body-small">{{ friend.statusDescription }}</span>
          </v-col>
          <v-col cols="12">
            <h4>Bio:</h4>
            <span class="text-body-small text-pre-wrap">
              {{ friend.bio || '(No Bio)' }}
            </span>
          </v-col>
          <v-col cols="12" v-if="friend.bioLinks && friend.bioLinks.length">
            <h4>Bio Links:</h4>
            <a
                v-for="link in friend.bioLinks"
                :key="link"
                :href="link"
                target="_blank"
                class="d-block text-no-wrap overflow-hidden"
                style="text-overflow: ellipsis"
            >
              {{ link }}
            </a>
          </v-col>
          <v-col cols="12">
            <h4>Last Platform:</h4>
            <span class="text-body-small">{{ friend.last_platform }}</span>
          </v-col>
          <v-col cols="6">
            <h4>Date Joined:</h4>
            <span class="text-body-small">{{ friend.date_joined }}</span>
          </v-col>
          <v-col cols="6">
            <h4>Last Login:</h4>
            <span class="text-body-small">{{ friend.last_login }}</span>
          </v-col>
          <v-col cols="12" v-if="friend.world">
            <h4>World:</h4>
            <v-img :src="friend.world.thumbnailImageUrl" class="rounded" width="256" height="192" cover>
              <template v-slot:placeholder>
                <v-skeleton-loader type="image" width="256" height="192"/>
              </template>
            </v-img>
            <h5>{{ friend.world.name }}</h5>
            <v-icon v-for="i in friend.world.heat" :key="i" size="small" color="orange">
              local_fire_department
            </v-icon>
            <p class="mt-2 mb-0">{{ friend.world.description }}</p>
            <v-table v-if="friend.world.id">
                <thead>
                <tr>
                  <th class="text-left">
                    Occupants
                  </th>
                  <th class="text-left">
                    Public
                  </th>
                  <th class="text-left">
                    Private
                  </th>
                </tr>
                </thead>
                <tbody>
                <tr>
                  <td>{{ friend.world.occupants }}</td>
                  <td>{{ friend.world.publicOccupants }}</td>
                  <td>{{ friend.world.privateOccupants }}</td>
                </tr>
                </tbody>
            </v-table>
            <v-table v-if="friend.world.id">
                <thead>
                <tr>
                  <th class="text-left">
                    Favorites
                  </th>
                  <th class="text-left">
                    Visits
                  </th>
                  <th class="text-left">
                    Version
                  </th>
                </tr>
                </thead>
                <tbody>
                <tr>
                  <td>{{ friend.world.favorites }}</td>
                  <td>{{ friend.world.visits }}</td>
                  <td>{{ friend.world.version }}</td>
                </tr>
                </tbody>
            </v-table>
            <div v-if="friend.world.created_at">
              Created: <strong>{{ friend.world.created_at }}</strong>
            </div>
            <div v-if="friend.world.updated_at">
              Last Update: <strong>{{ friend.world.updated_at }}</strong>
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {getUserWithProfile, getWorld} from '../shared/vrchat-api';
import {toUserRow, type UserRow} from '../types/standalone-users';

interface UserDetailsData {
  dialog: boolean;
  friend: UserRow | null;
}

export default defineComponent({
  name: 'UserDetails',
  props: {
    fullscreen: {
      type: Boolean
    },
    logged_in: {
      type: Boolean,
      required: true
    }
  },
  data(): UserDetailsData {
    return {
      dialog: false,
      friend: null
    }
  },
  methods: {
    fetchUser(id: string | null = null): void {
      if (!id) return;

      this.dialog = true;
      this.friend = null;

      getUserWithProfile(id)
          .then(data => {
            this.friend = toUserRow(data);

            if (data.worldId && !['private', 'offline'].includes(data.worldId))
              this.fetchWorld(data.id, data.worldId);
          })
          .catch(e => console.warn(`Could not fetch user ${id}`, e));
    },
    fetchWorld(userId: string, worldId: string): void {
      getWorld(worldId)
          .then(data => {
            // Go through the reactive proxy, and ignore late answers for a previously opened user
            if (this.friend?.id === userId) this.friend.world = data;
          })
          .catch(e => console.warn(`Could not fetch world ${worldId}`, e));
    }
  }
})
</script>


