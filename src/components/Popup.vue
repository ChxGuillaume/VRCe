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
    <v-tooltip v-else-if="cloudflare_error" right>
      <template v-slot:activator="{ on, attrs }">
        <v-btn
            fixed top left fab
            color="yellow darken-1"
            small
            light
            v-bind="attrs"
            v-on="on"
            @click="goToVRCLogin"
        >
          <v-icon>warning</v-icon>
        </v-btn>
      </template>
      <span>Please check VRChat Website <br> and try using the extension again</span>
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

    <h1 v-if="!hasUserData && !fetching" class="mt-2 text-center">Logged Off</h1>

    <v-row
        v-if="hasUserData"
        style="margin-bottom: 56px;"
    >
      <v-col
          cols="12" class="d-flex flex-column align-center pb-0"
      >
        <div
            class="d-inline-block rounded pa-1 mx-2"
            :style="{ background: user_data.rank ? user_data.rank.color : '' }"
        >
          <v-img
              :src="user_data.currentAvatarThumbnailImageUrl"
              class="rounded clickable"
              contain
              width="128"
              height="96"
              @click="fetchUserDetails($event, user_data.id)"
          >
            <template v-slot:placeholder>
              <v-row
                  class="fill-height ma-0"
                  align="center"
                  justify="center"
              >
                <v-progress-circular
                    indeterminate
                    color="grey lighten-5"
                />
              </v-row>
            </template>
          </v-img>
        </div>
        <h1
            class="mt-1 d-inline-block text-h5 font-weight-bold clickable"
            @click="fetchUserDetails($event, user_data.id)"
        >
          {{ user_data.displayName }}
        </h1>
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
                max-width="100%"
                height="max(calc(100vh - 280px), 320px)"
                tile
            >
              <v-list-item
                  v-for="[index, friendStatusGroup] of Object.entries(groupedSortedFriends)"
                  :key="friendStatusGroup.power"
                  class="pa-0 d-block"
                  :class="{ 'mb-6': groupedSortedFriends.length !== (parseInt(index) + 1) }"
              >
                <v-card>
                  <div class="py-3 d-flex justify-space-around">
                    <v-row class="mx-0 align-center">
                      <v-col cols="12" class="text-center d-flex align-center justify-center"
                             style="position:relative;">
                        <v-chip x-small class="mr-3" :color="friendStatusGroup.color"/>

                        <h3 class="d-inline-block subtitle-1"
                            style="overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">
                          {{ friendStatusGroup.name }}
                        </h3>

                        <v-tooltip color="grey darken-2" left>
                          <template v-slot:activator="{ on, attrs }">
                            <v-btn
                                icon absolute small
                                class="my-auto"
                                color="grey darken-2" style="bottom:0;top:0;right:6px;"
                                @click="closedGroupsToggle(friendStatusGroup.power)"
                                v-bind="attrs" v-on="on"
                            >
                              <v-icon small>{{
                                  !closed_groups.includes(friendStatusGroup.power) ? 'remove' : 'add'
                                }}
                              </v-icon>
                            </v-btn>
                          </template>
                          <span>{{
                              !closed_groups.includes(friendStatusGroup.power) ? 'Reduce' : 'Expand'
                            }} Group</span>
                        </v-tooltip>
                      </v-col>
                    </v-row>
                  </div>

                  <v-expand-transition>
                    <div v-if="!closed_groups.includes(friendStatusGroup.power)">
                      <v-list-item
                          v-for="friend of friendStatusGroup.friends"
                          :key="friend.id"
                          class="px-0"
                          :style="{ background: friend.status.color + '33' }"
                          @click="fetchUserDetails($event, friend.id)"
                          @click.right.prevent="openFriendMenu($event, friend)"
                      >
                        <friend-picture :friend="friend"/>

                        <v-list-item-content>
                          <v-row class="mx-0 align-center">
                            <v-col cols="9" class="text-center">
                              <h3 class="subtitle-1">{{ friend.displayName }}</h3>
                            </v-col>
                            <v-col cols="3" class="d-flex align-center justify-end">
                              <v-tooltip left color="grey darken-4">
                                <template v-slot:activator="{ on, attrs }">
                                  <v-btn
                                      v-if="friend.world_link"
                                      v-bind="attrs" v-on="on"
                                      icon
                                      @click="sendInviteToInstance(friend.location)"
                                  >
                                    <v-icon>add_location_alt</v-icon>
                                  </v-btn>
                                </template>
                                <span>Send me invite to Instance</span>
                              </v-tooltip>
                            </v-col>
                          </v-row>
                        </v-list-item-content>
                      </v-list-item>
                    </div>
                  </v-expand-transition>
                </v-card>
              </v-list-item>
            </v-card>
          </v-tab-item>
          <v-tab-item value="worlds">
            <worlds-tab
                :friends="friends"
                :worlds="worlds"
                @user-details="fetchUserDetails(null, $event)"
                @user-menu="openFriendMenu($event.$event, $event.friend)"
            />
          </v-tab-item>
          <v-tab-item value="events">
            <events-tab :friends="friends"/>
          </v-tab-item>
          <v-tab-item value="gallery" :disabled="!isUserVRCPlus">
            <gallery-tab :user_data="user_data" @new-user-data="user_data = $event"/>
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
                fixed top left fab
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
          <v-row class="pt-2">
            <v-col cols="12" class="pb-0 d-flex justify-center align-center flex-column">
              <h2 class="mr-2 text-h5 font-weight-bold d-inline-block">{{ user_details.displayName }}</h2>
              <span class="caption">{{ user_details.username }}</span>
            </v-col>
            <v-col cols="12" class="pt-1 d-flex justify-center align-center">
              <v-chip
                  v-if="user_details.status"
                  :color="user_details.status.color"
                  :light="user_details.status.light"
                  small
                  class="mx-2"
              >
                {{ user_details.status.name }}
              </v-chip>
              <v-chip
                  v-if="user_details.rank"
                  :color="user_details.rank.color"
                  :light="user_details.rank.light"
                  small
              >
                {{ user_details.rank.name }}
              </v-chip>
            </v-col>
            <v-col cols="12" class="d-flex justify-center">
              <div v-if="user_details.profilePicOverride" class="d-inline-block rounded pa-1 mx-1"
                   :style="{ background: user_details.rank ? user_details.rank.color : '' }">
                <v-img class="rounded" :src="user_details.profilePicOverride" height="75" width="133">
                  <template v-slot:placeholder>
                    <v-row
                        class="fill-height ma-0"
                        align="center"
                        justify="center"
                    >
                      <v-progress-circular
                          indeterminate
                          color="grey lighten-5"
                      />
                    </v-row>
                  </template>
                </v-img>
              </div>
              <div v-if="user_details.userIcon" class="d-inline-block rounded pa-1 mx-1"
                   :style="{ background: user_details.rank ? user_details.rank.color : '' }">
                <v-img class="rounded" :src="user_details.userIcon" height="75" width="75">
                  <template v-slot:placeholder>
                    <v-row
                        class="fill-height ma-0"
                        align="center"
                        justify="center"
                    >
                      <v-progress-circular
                          indeterminate
                          color="grey lighten-5"
                      />
                    </v-row>
                  </template>
                </v-img>
              </div>
              <div class="d-inline-block rounded pa-1 mx-1"
                   :style="{ background: user_details.rank ? user_details.rank.color : '' }">
                <v-img class="rounded" :src="user_details.currentAvatarThumbnailImageUrl" height="75" width="100">
                  <template v-slot:placeholder>
                    <v-row
                        class="fill-height ma-0"
                        align="center"
                        justify="center"
                    >
                      <v-progress-circular
                          indeterminate
                          color="grey lighten-5"
                      />
                    </v-row>
                  </template>
                </v-img>
              </div>
            </v-col>
            <v-col cols="12" v-if="user_details.statusDescription">
              <h4>Status:</h4>
              <span class="caption">{{ user_details.statusDescription }}</span>
            </v-col>
            <v-col cols="12">
              <h4>Bio:</h4>
              <span class="caption text-pre-wrap">
                {{ user_details.bio || '(No Bio)' }}
              </span>
            </v-col>
            <v-col cols="12" v-if="user_details.bioLinks && user_details.bioLinks.length">
              <h4>Bio Links:</h4>
              <a
                  v-for="link in user_details.bioLinks"
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
              <span class="caption">{{ user_details.last_platform }}</span>
            </v-col>
            <v-col cols="6">
              <h4>Date Joined:</h4>
              <span class="caption">{{ user_details.date_joined }}</span>
            </v-col>
            <v-col cols="6">
              <h4>Last Login:</h4>
              <span class="caption">{{ user_details.last_login }}</span>
            </v-col>
            <v-col cols="12" v-if="user_details.world">
              <h4>
                <span>World:</span>
                <span v-if="user_details.location_type" class="mx-2 caption grey--text font-italic">
                  ({{ user_details.location_type }})
                </span>
                <span v-if="user_details.location_region" class="caption grey--text font-italic">
                  ({{ user_details.location_region }})
                </span>
              </h4>
              <v-skeleton-loader type="image" width="256" height="192">
                <v-img :src="user_details.world.thumbnailImageUrl" class="rounded mx-auto my-2" width="256"
                       height="192"/>
              </v-skeleton-loader>
              <h5 class="mt-3 text-h6 text-center">{{ user_details.world.name }}</h5>
              <h6 v-if="user_details.world.author_tags" class="mb-3 subtitle-2 text-center grey--text">
                {{ user_details.world.author_tags.join(', ') }}
              </h6>
              <div class="my-2">
                <v-icon v-for="i in user_details.world.heat" :key="i" small color="orange">
                  local_fire_department
                </v-icon>
              </div>
              <p class="mt-2 mb-0 text-pre-wrap">{{ user_details.world.description }}</p>
              <v-simple-table v-if="user_details.world.id" class="my-2">
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
                    <td>{{ formatNumber(user_details.world.occupants) }}</td>
                    <td>{{ formatNumber(user_details.world.publicOccupants) }}</td>
                    <td>{{ formatNumber(user_details.world.privateOccupants) }}</td>
                  </tr>
                  </tbody>
                </template>
              </v-simple-table>
              <v-simple-table v-if="user_details.world.id" class="my-2">
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
                    <td>{{ formatNumber(user_details.world.favorites) }}</td>
                    <td>{{ formatNumber(user_details.world.visits) }}</td>
                    <td>{{ formatNumber(user_details.world.version) }}</td>
                  </tr>
                  </tbody>
                </template>
              </v-simple-table>
              <div v-if="user_details.world.created_at">
                Created: <strong>{{ user_details.world.created_at }}</strong>
              </div>
              <div v-if="user_details.world.updated_at">
                Last Update: <strong>{{ user_details.world.updated_at }}</strong>
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

    <v-snackbar
        v-model="invite_sent"
        :timeout="3000"
        bottom text color="primary"
        transition="slide-y-reverse-transition" style="bottom:56px;"
    >
      <v-icon color="primary" left>add_location_alt</v-icon>
      Invite Sent.
    </v-snackbar>

    <v-menu
        v-model="friend_menu"
        :position-x="menu_pos.x"
        :position-y="menu_pos.y"
        transition="slide-y-transition"
        offset-y
        fixed
    >
      <v-list class="pa-0">
        <v-list-item @click="toggleFavoriteFriend">
          <v-list-item-icon>
            <v-icon>
              {{ friend_menu_item.favorited ? 'star_outline' : 'star' }}
            </v-icon>
          </v-list-item-icon>
          <v-list-item-title>
            {{ friend_menu_item.favorited ? 'Unfavorite' : 'Favorite' }}
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>

    <v-bottom-navigation v-if="hasUserData" v-model="bottom_navigator" shift fixed grow color="primary">
      <v-btn height="100%" value="friends" color="transparent">
        <span>Friends</span>

        <v-icon>people</v-icon>
      </v-btn>

      <v-btn height="100%" value="worlds" color="transparent">
        <span>Worlds</span>

        <v-icon>public</v-icon>
      </v-btn>

      <v-btn height="100%" value="events" color="transparent">
        <span>Events</span>

        <v-icon>history</v-icon>
      </v-btn>

      <v-btn height="100%" value="gallery" color="transparent" :disabled="!isUserVRCPlus">
        <span>Gallery</span>

        <v-icon>collections</v-icon>
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
import EventsTab from "./PopupTabs/EventsTab";
import SettingsTab from "./PopupTabs/SettingsTab";
import WorldsTab from "./PopupTabs/WorldsTab";
import GalleryTab from "./PopupTabs/GalleryTab";
import FriendPicture from "./PopupComponents/FriendPicture";

export default {
  name: 'Popup',
  components: {FriendPicture, GalleryTab, WorldsTab, SettingsTab, EventsTab},
  data() {
    return {
      toolbox: false,
      fetching: true,
      logged_in: false,
      cloudflare_error: false,
      user_data: {},
      friends: [],
      favorite_friends: [],
      friend_search: '',
      user_details: {},
      worlds: [],
      drawer: false,
      no_session_dialog: false,
      bottom_navigator: 'friends',
      invite_sent: false,
      closed_groups: [0],
      friend_menu: false,
      friend_menu_item: {},
      menu_pos: {
        x: 0,
        y: 0
      }
    }
  },
  watch: {
    friend_search: {
      handler(friend_search) {
        if (friend_search)
          this.closed_groups.splice(this.closed_groups.indexOf(0), 1)
        else if (!this.closed_groups.includes(0))
          this.closed_groups.push(0)
      },
      deep: true
    }
  },
  computed: {
    sortedFriends() {
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
    groupedSortedFriends() {
      return Object.values(this.sortedFriends.reduce((acc, cur) => {
        if (!acc[cur.status.power])
          acc[cur.status.power] = {
            power: cur.status.power,
            color: cur.status.color,
            name: cur.status.name,
            friends: []
          };

        acc[cur.status.power].friends.push(cur);

        return acc;
      }, {})).sort((a, b) => {
        return b.power - a.power;
      });
    },
    hasUserData() {
      return !this.fetching && this.user_data.id;
    },
    isUserVRCPlus() {
      return this.hasUserData && this.user_data.tags.includes('system_supporter');
    }
  },
  mounted() {
    this.fetchUser();

    this.port = (browser.runtime || chrome.extension).connect({
      name: 'popup-app'
    });

    this.port.onMessage.addListener((msg) => {
      if (msg.type === 'favorite_friends') {
        this.favorite_friends = msg.favorite_friends;
      }
    });

    this.bottom_navigator = localStorage.getItem('default_tab') || 'friends';
  },
  methods: {
    fetchUser() {
      this.fetching = true;

      fetch('https://vrchat.com/api/1/auth/user')
          .then(response => {
            if (response.status === 503)
              this.cloudflare_error = true;
            else
              return response.json();
          })
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
    fetchUserDetails(ev, friend_id) {
      if (ev && ['I', 'SPAN'].includes(ev.target.nodeName))
        return;

      this.drawer = true;
      this.user_details = {};

      fetch(`https://vrchat.com/api/1/users/${friend_id}`)
          .then(response => response.json())
          .then(data => {
            this.setUserData(data);
            this.user_details = data;

            if (data.worldId && !['offline'].includes(data.worldId))
              this.fetchWorld(data.worldId, true);
          })
    },
    fetchWorld(worldId, showDrawer = false) {
      if (worldId !== 'private') {
        fetch(`https://vrchat.com/api/1/worlds/${worldId}`)
            .then(response => response.json())
            .then(data => {
              data.created_at = moment(data.created_at).format('YYYY-MM-DD HH:mm:ss');
              data.updated_at = moment(data.updated_at).format('YYYY-MM-DD HH:mm:ss');

              data.publicationDate = data.publicationDate !== 'none'
                  ? moment(data.publicationDate).format('YYYY-MM-DD HH:mm:ss')
                  : data.publicationDate;

              data.labsPublicationDate = data.labsPublicationDate !== 'none'
                  ? moment(data.labsPublicationDate).format('YYYY-MM-DD HH:mm:ss')
                  : data.labsPublicationDate;

              data.author_tags = data.tags.filter(e => e.includes('author_tag')).map(e => e.replace('author_tag_', '')) || [];

              this.worlds.push(data);

              this.user_details.world = data;
              if (showDrawer) this.refreshDrawer();
            })
      } else {
        this.user_details.world = {
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

            data.forEach(friend => {
              const splicedLocation = friend.location.split(':');

              if (splicedLocation && splicedLocation[0].startsWith('wrld_'))
                this.fetchWorld(splicedLocation[0]);
            });

            this.friends = this.friends.concat(data.filter(e => !this.friends.find(s => e.id === s.id)));

            if (data.length === count)
              this.fetchFriends(offline, offset + count);
            else if (!offline && data.length !== count)
              this.fetchFriends(true, 0);
          })
    },
    sendInviteToInstance(location) {
      fetch(`https://vrchat.com/api/1/instances/${location}/invite`, {
        method: 'POST'
      }).then(() => this.invite_sent = true)
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
      if (this.user_data.activeFriends.includes(user.id))
        user.location = '';

      this.setRank(user);
      this.setStatus(user);
      this.setBioLinks(user);
      this.setLastLogin(user);
      this.setWorldIcon(user);
      this.setWorldLink(user);
      this.setLastPlatform(user);

      user.favorited = this.favorite_friends.includes(user.id);
      user.location_type = this.getLocationType(user.location);
      user.location_region = this.getLocationRegion(user.location);
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
    getLocationType(location) {
      const splicedLocation = location.split(':');

      if (location && !['private', 'offline'].includes(location)) {
        if (splicedLocation[1].includes('~private'))
          return 'invite/invite+';
        if (splicedLocation[1].includes('~hidden'))
          return 'friends+';
        else if (splicedLocation[1].includes('~friends'))
          return 'friends';
        else
          return 'public';
      } else return location;
    },
    getLocationRegion(location) {
      const splicedLocation = location.split(':');

      if (location && !['private', 'offline'].includes(location)) {
        if (splicedLocation[1].includes('~region(eu)'))
          return 'eu';
        else if (splicedLocation[1].includes('~region(jp)'))
          return 'jp';
        else
          return 'us';
      } else return null;
    },
    formatNumber(number) {
      return Intl.NumberFormat('fr-FR').format(parseInt(number))
    },
    refreshDrawer() {
      this.drawer = false;

      this.$nextTick(() => {
        this.drawer = true;
      });
    },
    openFriendMenu(e, friend) {
      this.friend_menu = false;

      this.menu_pos.x = e.clientX;
      this.menu_pos.y = e.clientY;
      this.friend_menu_item = friend;

      this.$nextTick(() => {
        this.friend_menu = true;
      });
    },
    closedGroupsToggle(power) {
      if (this.closed_groups.includes(power))
        this.closed_groups.splice(this.closed_groups.indexOf(power), 1);
      else
        this.closed_groups.push(power);
    },
    toggleFavoriteFriend() {
      this.friend_menu_item.favorited = !this.friend_menu_item.favorited;

      this.port.postMessage({
        type: 'toggleFavoriteFriend',
        user_id: this.friend_menu_item.id
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

.clickable {
  cursor: pointer;
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
