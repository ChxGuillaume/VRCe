<template>
  <v-dialog
      v-model="dialog"
      :fullscreen="fullscreen"
      transition="scale-transition"
      width="500"
  >
    <v-card outlined class="pt-4">
      <v-tooltip v-if="logged_in" right>
        <template v-slot:activator="{ on, attrs }">
          <v-btn
              absolute top left fab
              color="red"
              small
              style="top: 20px"
              v-bind="attrs"
              v-on="on"
              @click="dialog = false"
          >
            <v-icon>close</v-icon>
          </v-btn>
        </template>
        <span>Close</span>
      </v-tooltip>

      <v-card-text>
        <v-row>
          <v-col cols="12" class="text-end">
            <div v-if="friend.userIcon" class="d-inline-block rounded pa-1 mx-2"
                 :style="{ background: friend.rank ? friend.rank.color : '' }">
              <v-img class="rounded" :src="friend.userIcon" height="75" width="75"/>
            </div>
            <div class="d-inline-block rounded pa-1 mx-2"
                 :style="{ background: friend.rank ? friend.rank.color : '' }">
              <v-img class="rounded" :src="friend.currentAvatarThumbnailImageUrl" height="75" width="100"/>
            </div>
            <div v-if="friend.profilePicOverride" class="d-inline-block rounded pa-1 mx-2"
                 :style="{ background: friend.rank ? friend.rank.color : '' }">
              <v-img class="rounded" :src="friend.profilePicOverride" height="75" width="100"/>
            </div>
          </v-col>
          <v-col cols="12" class="d-flex align-center pb-0">
            <h2 class="d-inline-block">{{ friend.displayName }}</h2>
            <v-chip
                v-if="friend.state"
                :color="friend.state.color"
                :light="friend.state.light"
                small
                class="ml-2"
            >
              {{ friend.state.name }}
            </v-chip>
            <v-chip
                v-if="friend.status"
                :color="friend.status.color"
                :light="friend.status.light"
                small
                class="ml-2"
            >
              {{ friend.status.name }}
            </v-chip>
            <v-chip
                v-if="friend.rank"
                :color="friend.rank.color"
                :light="friend.rank.light"
                small
                class="ml-2"
            >
              {{ friend.rank.name }}
            </v-chip>
          </v-col>
          <v-col cols="12" class="pt-0">
            <span class="caption">{{ friend.username }}</span>
          </v-col>
          <v-col cols="12" v-if="friend.statusDescription">
            <h4>Status:</h4>
            <span class="caption">{{ friend.statusDescription }}</span>
          </v-col>
          <v-col cols="12">
            <h4>Bio:</h4>
            <span class="caption text-pre-wrap">
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
            <span class="caption">{{ friend.last_platform }}</span>
          </v-col>
          <v-col cols="6">
            <h4>Date Joined:</h4>
            <span class="caption">{{ friend.date_joined }}</span>
          </v-col>
          <v-col cols="6">
            <h4>Last Login:</h4>
            <span class="caption">{{ friend.last_login }}</span>
          </v-col>
          <v-col cols="12" v-if="friend.world">
            <h4>World:</h4>
            <v-skeleton-loader type="image" width="256" height="192">
              <v-img :src="friend.world.thumbnailImageUrl" class="rounded" width="256" height="192"/>
            </v-skeleton-loader>
            <h5>{{ friend.world.name }}</h5>
            <v-icon v-for="i in friend.world.heat" :key="i" small color="orange">
              local_fire_department
            </v-icon>
            <p class="mt-2 mb-0">{{ friend.world.description }}</p>
            <v-simple-table v-if="friend.world.id">
              <template v-slot:default>
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
              </template>
            </v-simple-table>
            <v-simple-table v-if="friend.world.id">
              <template v-slot:default>
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
              </template>
            </v-simple-table>
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

<script>
import * as moment from "moment";

export default {
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
  data() {
    return {
      dialog: false,
      friend: {}
    }
  },
  methods: {
    fetchUser(id = null) {
      if (!id) return;

      this.dialog = true;
      this.friend = {};

      fetch(`https://vrchat.com/api/1/users/${id}`)
          .then(response => response.json())
          .then(data => {
            this.setUserData(data);
            this.friend = data;

            if (data.worldId && !['private', 'offline'].includes(data.worldId))
              this.fetchWorld(data);
          })
    },
    fetchWorld(user) {
      fetch(`https://vrchat.com/api/1/worlds/${user.worldId}`)
          .then(response => response.json())
          .then(data => {
            user.world = data;
            this.refreshTable();
          })
    },
    setUserData(user) {
      this.setRank(user);
      this.setState(user);
      this.setStatus(user);
      this.setBioLinks(user);
      this.setLanguages(user);
      this.setLastLogin(user);
      this.setLastPlatform(user);
    },
    setRank(user) {
      const tags = user.tags

      if (tags.includes('system_legend') && tags.includes('system_trust_legend') && tags.includes('system_trust_trusted')) {
        user.rank = {color: '#FF69B4', name: 'Legend', power: 0}
      } else if (tags.includes('system_trust_legend') && tags.includes('system_trust_trusted')) {
        user.rank = {color: '#5D88BB', name: 'Veteran', power: 1}
      } else if (tags.includes('system_trust_veteran') && tags.includes('system_trust_trusted')) {
        user.rank = {color: '#8143E6', name: 'Trusted', power: 2}
      } else if (tags.includes('system_trust_trusted')) {
        user.rank = {color: '#FF7B42', name: 'Known', power: 3}
      } else if (tags.includes('system_trust_known')) {
        user.rank = {color: '#2BCF5C', name: 'User', power: 4}
      } else if (tags.includes('system_trust_basic')) {
        user.rank = {color: '#1778FF', name: 'New User', power: 5}
      } else {
        user.rank = {color: '#CCCCCC', name: 'Visitor', power: 6}
      }
    },
    setState(user) {
      switch (user.state) {
        case 'online':
          user.state = {color: '#60ad5e', name: 'Online', power: 0};
          break;
        case 'active':
          user.state = {color: '#ebd23b', name: 'Active', power: 1};
          break;
        case 'offline':
          user.state = {color: '#dddddd', name: 'Offline', power: 2, light: true};
          break;
        default:
          user.state = {color: '#CCCCCC', name: user.state, power: 3, light: true};
      }
    },
    setStatus(user) {
      switch (user.status) {
        case 'join me':
          user.status = {color: '#42caff', name: 'Join Me', power: 4};
          break;
        case 'active':
          user.status = {color: '#60ad5e', name: 'Active', power: 3};
          break;
        case 'ask me':
          user.status = {color: '#e88134', name: 'Ask Me', power: 2};
          break;
        case 'busy':
          user.status = {color: '#5b0b0b', name: 'Busy', power: 1};
          break;
        default:
          user.status = {color: '#CCCCCC', name: user.status, power: 0};
      }
    },
    setBioLinks(user) {
      user.bioLinks = user.bioLinks.filter(e => e);
    },
    setLanguages(user) {
      user.langagues = user.tags.filter(e => e.startsWith('language_')).map(e => e.replace('language_', ''));
    },
    setLastLogin(user) {
      user.last_login = moment(user.last_login).format('YYYY-MM-DD HH:mm:ss');
    },
    setLastPlatform(user) {
      switch (user.last_platform) {
        case 'standalonewindows':
          user.last_platform = 'PC/VR';
          break;
        case 'android':
          user.last_platform = 'Quest';
          break;
      }
    },
  }
}
</script>

<style scoped>

</style>