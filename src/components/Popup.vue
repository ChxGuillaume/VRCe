<template>
  <v-container fluid class="pb-0">
    <v-tooltip v-if="logged_in" right>
      <template v-slot:activator="{ on, attrs }">
        <v-btn
            fixed top left fab
            color="red"
            small
            v-bind="attrs"
            v-on="on"
            @click="logoutFromVRChat"
        >
          <v-icon>logout</v-icon>
        </v-btn>
      </template>
      <span>Disconnect from VRChat Home</span>
    </v-tooltip>
    <v-tooltip v-else right>
      <template v-slot:activator="{ on, attrs }">
        <v-btn
            fixed top left fab
            color="green"
            small
            v-bind="attrs"
            v-on="on"
            @click="goToVRCLogin"
        >
          <v-icon>login</v-icon>
        </v-btn>
      </template>
      <span>Login to VRChat Home</span>
    </v-tooltip>

    <v-btn
        v-if="fetching"
        fixed top left fab
        class="rotate"
        color="grey"
        small
    >
      <v-icon>sync</v-icon>
    </v-btn>


    <v-speed-dial
        v-model="toolbox"
        direction="bottom"
        top right fixed open-on-hover
        transition="slide-y-transition"
    >
      <template v-slot:activator>
        <v-btn
            v-model="toolbox"
            fab small
            color="primary"
        >
          <v-icon>home_repair_service</v-icon>
        </v-btn>
      </template>
      <v-tooltip left color="grey darken-2">
        <template v-slot:activator="{ on, attrs }">
          <v-btn
              v-bind="attrs"
              v-on="on"
              fab
              dark
              x-small
              color="grey darken-2"
              @click="goToData"
          >
            <v-icon>storage</v-icon>
          </v-btn>
        </template>
        <span>Open Data Table</span>
      </v-tooltip>
      <v-tooltip left color="indigo">
        <template v-slot:activator="{ on, attrs }">
          <v-btn
              v-bind="attrs"
              v-on="on"
              fab
              dark
              x-small
              color="indigo"
              @click="checkVRCCurrentSessionInVR"
          >
            <v-icon>view_in_ar</v-icon>
          </v-btn>
        </template>
        <span>Open current session in VR</span>
      </v-tooltip>
    </v-speed-dial>

    <v-row style="margin-bottom: 56px;">
      <v-col v-if="hasUserData" cols="12" class="text-center pb-0">
        <div class="d-inline-block rounded pa-1 mx-2"
             :style="{ background: user_data.rank ? user_data.rank.color : '' }">
          <v-img
              :src="user_data.currentAvatarThumbnailImageUrl"
              class="rounded"
              contain
              width="128"
          />
        </div>
        <h1 class="mt-1">{{ user_data.displayName }}</h1>
      </v-col>
      <v-col v-else-if="!fetching" cols="12" class="text-center">
        <h1 class="mt-2">Logged Off</h1>
      </v-col>
      <v-col cols="12" class="pa-0">
        <v-tabs-items v-model="bottom_navigator" style="background-color: transparent">
          <v-tab-item value="friends">
            <v-row class="mx-0">
              <v-col v-if="hasUserData" class="d-flex align-center justify-space-around my-2">
                <v-text-field
                    v-model="friend_search"
                    background-color="grey darken-3"
                    class="mt-0"
                    label="Search"
                    hide-details
                    clearable
                    solo
                />
              </v-col>
            </v-row>

            <v-card
                class="mx-auto overflow-y-auto"
                color="transparent"
                max-width="400"
                height="320"
                tile
            >
              <v-list-item
                  v-for="friend of sortedFriends"
                  :key="friend.id"
                  class="pl-0"
                  :style="{ background: friend.status.color + '33' }"
                  @click="fetchFriendDetails($event, friend.id)"
              >
                <v-img :src="friend.currentAvatarThumbnailImageUrl" max-width="100" height="75"/>

                <v-list-item-content>
                  <v-row class="mx-0 align-center">
                    <v-col cols="9" class="text-center">
                      <h3>{{ friend.displayName }}</h3>
                      <h4 class="mt-2">{{ friend.status.name }}</h4>
                    </v-col>
                    <v-col cols="3" class="d-flex align-center justify-end">
                      <v-tooltip left color="grey darken-2">
                        <template v-slot:activator="{ on, attrs }">
                          <v-btn
                              v-if="friend.world_link"
                              v-bind="attrs"
                              v-on="on"
                              :href="friend.world_link"
                              target="_blank"
                              icon
                          >
                            <v-icon>{{ friend.world_icon }}</v-icon>
                          </v-btn>
                          <v-icon v-else style="margin-right: 6px">{{ friend.world_icon }}</v-icon>
                        </template>
                        <span>Join</span>
                      </v-tooltip>
                    </v-col>
                  </v-row>
                </v-list-item-content>
              </v-list-item>
            </v-card>
          </v-tab-item>
          <v-tab-item value="events">
            <events-tab :friends="friends"/>
          </v-tab-item>
          <v-tab-item value="settings">
            <settings-tab/>
          </v-tab-item>
        </v-tabs-items>
      </v-col>
    </v-row>

    <v-navigation-drawer
        v-model="drawer"
        fixed
        left
        width="100%"
    >
      <v-card min-height="100%">
        <v-tooltip v-if="logged_in" right>
          <template v-slot:activator="{ on, attrs }">
            <v-btn
                absolute top left fab
                color="primary"
                small
                style="top: 20px"
                v-bind="attrs"
                v-on="on"
                @click="drawer = false"
            >
              <v-icon>arrow_back</v-icon>
            </v-btn>
          </template>
          <span>Back</span>
        </v-tooltip>

        <v-card-text>
          <v-row>
            <v-col cols="12" class="text-end">
              <div v-if="friend_details.userIcon" class="d-inline-block rounded pa-1 mx-2"
                   :style="{ background: friend_details.rank ? friend_details.rank.color : '' }">
                <v-img class="rounded" :src="friend_details.userIcon" height="75" width="75"/>
              </div>
              <div class="d-inline-block rounded pa-1 mx-2"
                   :style="{ background: friend_details.rank ? friend_details.rank.color : '' }">
                <v-img class="rounded" :src="friend_details.currentAvatarThumbnailImageUrl" height="75" width="100"/>
              </div>
            </v-col>
            <v-col cols="12" class="d-flex align-center pb-0">
              <h2 class="d-inline-block">{{ friend_details.displayName }}</h2>
              <v-chip
                  v-if="friend_details.status"
                  :color="friend_details.status.color"
                  :light="friend_details.status.light"
                  small
                  class="mx-2"
              >
                {{ friend_details.status.name }}
              </v-chip>
              <v-chip
                  v-if="friend_details.rank"
                  :color="friend_details.rank.color"
                  :light="friend_details.rank.light"
                  small
              >
                {{ friend_details.rank.name }}
              </v-chip>
            </v-col>
            <v-col cols="12" class="pt-0">
              <span class="caption">{{ friend_details.username }}</span>
            </v-col>
            <v-col cols="12" v-if="friend_details.statusDescription">
              <h4>Status:</h4>
              <span class="caption">{{ friend_details.statusDescription }}</span>
            </v-col>
            <v-col cols="12">
              <h4>Bio:</h4>
              <span class="caption text-pre-wrap">
                {{ friend_details.bio || '(No Bio)' }}
              </span>
            </v-col>
            <v-col cols="12" v-if="friend_details.bioLinks && friend_details.bioLinks.length">
              <h4>Bio Links:</h4>
              <a
                  v-for="link in friend_details.bioLinks"
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
              <span class="caption">{{ friend_details.last_platform }}</span>
            </v-col>
            <v-col cols="6">
              <h4>Date Joined:</h4>
              <span class="caption">{{ friend_details.date_joined }}</span>
            </v-col>
            <v-col cols="6">
              <h4>Last Login:</h4>
              <span class="caption">{{ friend_details.last_login }}</span>
            </v-col>
            <v-col cols="12" v-if="friend_details.world">
              <h4>World:</h4>
              <v-skeleton-loader type="image" width="256" height="192">
                <v-img :src="friend_details.world.thumbnailImageUrl" class="rounded" width="256" height="192"/>
              </v-skeleton-loader>
              <h5>{{ friend_details.world.name }}</h5>
              <v-icon v-for="i in friend_details.world.heat" :key="i" small color="orange">
                local_fire_department
              </v-icon>
              <p class="mt-2 mb-0">{{ friend_details.world.description }}</p>
              <v-simple-table v-if="friend_details.world.id">
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
                    <td>{{ friend_details.world.occupants }}</td>
                    <td>{{ friend_details.world.publicOccupants }}</td>
                    <td>{{ friend_details.world.privateOccupants }}</td>
                  </tr>
                  </tbody>
                </template>
              </v-simple-table>
              <v-simple-table v-if="friend_details.world.id">
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
                    <td>{{ friend_details.world.favorites }}</td>
                    <td>{{ friend_details.world.visits }}</td>
                    <td>{{ friend_details.world.version }}</td>
                  </tr>
                  </tbody>
                </template>
              </v-simple-table>
              <div v-if="friend_details.world.created_at">
                Created: <strong>{{ friend_details.world.created_at }}</strong>
              </div>
              <div v-if="friend_details.world.updated_at">
                Last Update: <strong>{{ friend_details.world.updated_at }}</strong>
              </div>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-navigation-drawer>

    <v-dialog
        v-model="no_session_dialog"
        width="500"
    >
      <v-card>
        <v-card-title class="text-h5 primary mb-3">
          Info
        </v-card-title>

        <v-card-text>
          No actual session of VRChat detected. <br>
          Do you still want to open it ?
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
              color="primary"
              text
              @click="() => { this.openVRCCurrentSessionInVR(); this.no_session_dialog = false; }"
          >
            Yes
          </v-btn>
          <v-btn
              color="grey"
              text
              @click="no_session_dialog = false"
          >
            No
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-bottom-navigation v-model="bottom_navigator" shift fixed grow color="primary">
      <v-btn height="100%" value="friends" color="transparent">
        <span>Friends</span>

        <v-icon>people</v-icon>
      </v-btn>

      <v-btn height="100%" value="worlds" color="transparent" disabled>
        <span>Worlds</span>

        <v-icon>public</v-icon>
      </v-btn>

      <v-btn height="100%" value="events" color="transparent">
        <span>Events</span>

        <v-icon>history</v-icon>
      </v-btn>

      <v-btn height="100%" value="settings" color="transparent">
        <span>Settings</span>

        <v-icon>settings</v-icon>
      </v-btn>
    </v-bottom-navigation>
  </v-container>
</template>

<script>
import * as moment from "moment";
import EventsTab from "./EventsTab";
import SettingsTab from "./SettingsTab";

export default {
  name: 'Popup',
  components: {SettingsTab, EventsTab},
  data() {
    return {
      toolbox: false,
      fetching: true,
      logged_in: false,
      user_data: {},
      friends: [],
      friend_search: '',
      friend_details: {},
      drawer: false,
      no_session_dialog: false,
      bottom_navigator: 'friends'
    }
  },
  computed: {
    sortedFriends() {
      // TODO sort by name and rank

      const filteredFriends = this.friends.filter(e => {
        const displayName = e.displayName.toLowerCase();
        const userName = e.username.toLowerCase();
        const searchField = this.friend_search ? this.friend_search.toLowerCase() : '';

        return displayName.includes(searchField) || userName.includes(searchField);
      });

      return [...filteredFriends].sort((a, b) => {
        const result = b.status.power - a.status.power;

        if (result === 0) return a.displayName.localeCompare(b.displayName);

        return result;
      });
    },
    hasUserData() {
      return !this.fetching && this.user_data.id;
    }
  },
  mounted() {
    this.fetchUser();

    this.port = chrome.extension.connect({
      name: 'popup-app'
    });
  },
  methods: {
    fetchUser() {
      this.fetching = true;

      fetch('https://vrchat.com/api/1/auth/user')
          .then(response => response.json())
          .then(data => {
            this.fetching = false;

            if (!data.error) {
              this.logged_in = true;
              this.user_data = data;

              this.fetchFriends();
            } else if (data.error.status_code === 401) {
              this.need_login_form = true;
            }
          });
    },
    fetchFriendDetails(ev, friend_id) {
      if (['I', 'SPAN'].includes(ev.target.nodeName))
        return;

      this.drawer = true;
      this.friend_details = {};

      fetch(`https://vrchat.com/api/1/users/${friend_id}`)
          .then(response => response.json())
          .then(data => {
            this.setUserData(data);
            this.friend_details = data;

            if (data.worldId && !['offline'].includes(data.worldId))
              this.fetchFriendWorld(this.friend_details, data.worldId);
          })
    },
    fetchFriendWorld(friend, worldId) {
      if (worldId !== 'private') {
        fetch(`https://vrchat.com/api/1/worlds/${worldId}`)
            .then(response => response.json())
            .then(data => {
              data.created_at = moment(data.created_at).format('YYYY-MM-DD HH:mm:ss');
              data.updated_at = moment(data.updated_at).format('YYYY-MM-DD HH:mm:ss');
              data.publicationDate = moment(data.publicationDate).format('YYYY-MM-DD HH:mm:ss');
              data.labsPublicationDate = moment(data.labsPublicationDate).format('YYYY-MM-DD HH:mm:ss');
              this.friend_details.world = data;
              this.refreshDrawer();
            })
      } else {
        this.friend_details.world = {
          name: 'Private World',
          thumbnailImageUrl: 'https://assets.vrchat.com/www/images/default_private_image.png'
        };
      }
    },
    fetchFriends(offline = false, offset = 0) {
      const count = 100;

      fetch(`https://vrchat.com/api/1/auth/user/friends?offline=${offline}&n=${count}&offset=${offset}`)
          .then(res => res.json())
          .then(data => {
            data.forEach(friend => this.setUserData(friend));
            this.friends = this.friends.concat(data.filter(e => !this.friends.find(s => e.id === s.id)));

            if (data.length === count)
              this.fetchFriends(offline, offset + count);
            else if (!offline && data.length !== count)
              this.fetchFriends(true, 0);
          })
    },
    logoutFromVRChat() {
      fetch('https://vrchat.com/api/1/logout', {
        method: 'PUT'
      }).then(() => {
        this.logged_in = false;
        this.user_data = {};
        this.friends = [];
        this.fetchUser();
      })
    },
    goToVRCLogin() {
      chrome.tabs.create({url: `https://vrchat.com/home/login`});
    },
    goToData() {
      chrome.tabs.create({url: `/index.html`});
    },
    checkVRCCurrentSessionInVR() {
      fetch(`https://vrchat.com/api/1/users/${this.user_data.id}`)
          .then(res => res.json())
          .then(data => {
            if (data.location !== 'offline')
              this.openVRCCurrentSessionInVR(data.location);
            else
              this.no_session_dialog = true;
          })
    },
    openVRCCurrentSessionInVR(location = null) {
      const url = location ? `vrchat://launch?ref=vrchat.com&id=${location}` : `vrchat://launch?ref=vrchat.com`;
      chrome.tabs.create({url});
    },
    setUserData(user) {
      this.setRank(user);
      this.setStatus(user);
      this.setBioLinks(user);
      this.setLastLogin(user);
      this.setWorldIcon(user);
      this.setWorldLink(user);
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
        user.rank = {color: '#CCCCCC', name: 'Visitor', power: 6, light: true}
      }
    },
    setStatus(user) {
      if (!user.location)
        user.status = {color: '#ebd23b', name: 'Active', power: 1, light: true};
      else if (user.state && user.state === 'offline')
        user.status = {color: '#CCCCCC', name: 'Offline', power: 0, light: true};
      else
        switch (user.status) {
          case 'join me':
            user.status = {color: '#42caff', name: 'Join Me', power: 5};
            break;
          case 'active':
            user.status = {color: '#60ad5e', name: 'Online', power: 4};
            break;
          case 'ask me':
            user.status = {color: '#e88134', name: 'Ask Me', power: 3};
            break;
          case 'busy':
            user.status = {color: '#5b0b0b', name: 'Busy', power: 2};
            break;
          case 'offline':
            user.status = {color: '#CCCCCC', name: 'Offline', power: 0, light: true};
            break;
          default:
            user.status = {color: '#CCCCCC', name: user.status, power: -1, light: true};
        }
    },
    setBioLinks(user) {
      user.bioLinks = user.bioLinks ? user.bioLinks.filter(e => e) : [];
    },
    setLastLogin(user) {
      user.last_login = moment(user.last_login).format('YYYY-MM-DD HH:mm:ss');
    },
    setWorldIcon(user) {
      if (user.location && user.location !== 'offline') {
        switch (user.location) {
          case 'private':
            user.world_icon = 'public_off';
            break;
          default:
            user.world_icon = 'public';
        }
      } else user.world_icon = '';
    },
    setWorldLink(user) {
      if (user.location.startsWith('wrld')) {
        user.world_link = `vrchat://launch?ref=vrchat.com&id=${user.location}`;
      }
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
    refreshDrawer() {
      this.drawer = false;

      this.$nextTick(() => {
        this.drawer = true;
      });
    }
  }
}
</script>

<style>
::-webkit-scrollbar {
  width: 12px;
}

::-webkit-scrollbar-track {
  background: #121212;
}

::-webkit-scrollbar-thumb {
  background: #ffffff44;
  border-radius: 5px;
}
</style>

<style scoped>
.rotate {
  animation: linear rotate 2s infinite;
}

@keyframes rotate {
  0% {
    transform: rotate(0turn)
  }
  100% {
    transform: rotate(-1turn)
  }
}
</style>