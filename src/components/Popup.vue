<template>
  <v-container fluid class="pb-0">
    <v-tooltip v-if="logged_in" location="right">
      <template v-slot:activator="{ props }">
        <v-btn
            v-bind="props"
            class="fab-top-left"
            position="fixed"
            icon
            size="small"
            color="red"
            @click="logoutFromVRChat"
        >
          <v-icon>logout</v-icon>
        </v-btn>
      </template>
      <span>Disconnect from VRChat Home</span>
    </v-tooltip>
    <v-tooltip v-else-if="cloudflare_error" location="right">
      <template v-slot:activator="{ props }">
        <v-btn
            v-bind="props"
            class="fab-top-left"
            position="fixed"
            icon
            size="small"
            color="yellow-darken-1"
            @click="goToVRCLogin"
        >
          <v-icon>warning</v-icon>
        </v-btn>
      </template>
      <span>Please check VRChat Website <br> and try using the extension again</span>
    </v-tooltip>
    <v-tooltip v-else location="right">
      <template v-slot:activator="{ props }">
        <v-btn
            v-bind="props"
            class="fab-top-left"
            position="fixed"
            icon
            size="small"
            color="green"
            @click="goToVRCLogin"
        >
          <v-icon>login</v-icon>
        </v-btn>
      </template>
      <span>Login to VRChat Home</span>
    </v-tooltip>

    <v-btn
        v-if="fetching"
        class="fab-top-left rotate"
        position="fixed"
        icon
        size="small"
        color="grey"
    >
      <v-icon>sync</v-icon>
    </v-btn>

    <v-speed-dial
        v-model="toolbox"
        location="bottom center"
        transition="slide-y-transition"
        open-on-hover
    >
      <template v-slot:activator="{ props: activatorProps }">
        <v-btn
            v-bind="activatorProps"
            class="fab-top-right"
            position="fixed"
            icon
            size="small"
            color="primary"
        >
          <v-icon>home_repair_service</v-icon>
        </v-btn>
      </template>
      <v-tooltip key="data" location="left" content-class="bg-grey-darken-2">
        <template v-slot:activator="{ props }">
          <v-btn
              v-bind="props"
              icon
              size="x-small"
              color="grey-darken-2"
              @click="goToData"
          >
            <v-icon>storage</v-icon>
          </v-btn>
        </template>
        <span>Open Data Table</span>
      </v-tooltip>
      <v-tooltip key="vr" location="left" content-class="bg-indigo">
        <template v-slot:activator="{ props }">
          <v-btn
              v-bind="props"
              icon
              size="x-small"
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
              width="128"
              height="96"
              @click="fetchUserDetails($event, user_data.id)"
          >
            <template v-slot:placeholder>
              <div class="d-flex fill-height align-center justify-center">
                <v-progress-circular
                    indeterminate
                    color="grey-lighten-5"
                />
              </div>
            </template>
          </v-img>
        </div>
        <h1
            class="mt-1 d-inline-block text-headline-small font-weight-bold clickable"
            @click="fetchUserDetails($event, user_data.id)"
        >
          {{ user_data.displayName }}
        </h1>
      </v-col>
      <v-col cols="12" class="pa-0">
        <v-window v-model="bottom_navigator">
          <v-window-item value="friends">
            <v-row class="mx-0">
              <v-col v-if="hasUserData" class="d-flex align-center justify-space-around my-2">
                <v-text-field
                    v-model="friend_search"
                    bg-color="grey-darken-3"
                    class="mt-0"
                    label="Search"
                    variant="solo"
                    hide-details
                    clearable
                />
              </v-col>
            </v-row>

            <v-card
                class="mx-auto overflow-y-auto"
                color="transparent"
                max-width="100%"
                height="max(calc(100vh - 280px), 320px)"
                rounded="0"
                flat
            >
              <div
                  v-for="[index, friendStatusGroup] of Object.entries(groupedSortedFriends)"
                  :key="friendStatusGroup.power"
                  :class="{ 'mb-6': groupedSortedFriends.length !== (parseInt(index) + 1) }"
              >
                <v-card>
                  <div class="py-3 d-flex justify-space-around">
                    <v-row class="mx-0 align-center">
                      <v-col cols="12" class="text-center d-flex align-center justify-center"
                             style="position:relative;">
                        <v-chip size="x-small" variant="flat" class="mr-3" :color="friendStatusGroup.color"/>

                        <h3 class="d-inline-block text-body-large"
                            style="overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">
                          {{ friendStatusGroup.name }}
                        </h3>

                        <v-tooltip location="left" content-class="bg-grey-darken-2">
                          <template v-slot:activator="{ props }">
                            <v-btn
                                v-bind="props"
                                icon
                                variant="text"
                                size="small"
                                class="my-auto"
                                color="grey-darken-2"
                                style="position:absolute;bottom:0;top:0;right:6px;"
                                @click="closedGroupsToggle(friendStatusGroup.power)"
                            >
                              <v-icon size="small">{{
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
                        <template v-slot:prepend>
                          <friend-picture :friend="friend"/>
                        </template>

                        <v-row class="mx-0 align-center">
                          <v-col cols="9" class="text-center">
                            <h3 class="text-body-large">{{ friend.displayName }}</h3>
                          </v-col>
                          <v-col cols="3" class="d-flex align-center justify-end">
                            <v-tooltip location="left" content-class="bg-grey-darken-4">
                              <template v-slot:activator="{ props }">
                                <v-btn
                                    v-if="friend.world_link"
                                    v-bind="props"
                                    icon
                                    variant="text"
                                    @click.stop="sendInviteToInstance(friend.location)"
                                >
                                  <v-icon>add_location_alt</v-icon>
                                </v-btn>
                              </template>
                              <span>Send me invite to Instance</span>
                            </v-tooltip>
                          </v-col>
                        </v-row>
                      </v-list-item>
                    </div>
                  </v-expand-transition>
                </v-card>
              </div>
            </v-card>
          </v-window-item>
          <v-window-item value="worlds">
            <worlds-tab
                :friends="friends"
                :worlds="worlds"
                @user-details="fetchUserDetails(null, $event)"
                @user-menu="openFriendMenu($event.$event, $event.friend)"
            />
          </v-window-item>
          <v-window-item value="events">
            <events-tab :friends="friends"/>
          </v-window-item>
          <v-window-item value="gallery" :disabled="!isUserVRCPlus">
            <gallery-tab :user_data="user_data" @new-user-data="user_data = $event"/>
          </v-window-item>
          <v-window-item value="settings">
            <settings-tab/>
          </v-window-item>
        </v-window>
      </v-col>
    </v-row>

    <v-navigation-drawer
        v-model="drawer"
        location="left"
        :width="drawer_width"
        temporary
    >
      <v-card min-height="100%" rounded="0">
        <v-tooltip v-if="logged_in" location="right">
          <template v-slot:activator="{ props }">
            <v-btn
                v-bind="props"
                class="fab-top-left"
                position="fixed"
                icon
                size="small"
                color="primary"
                style="top: 20px"
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
              <h2 class="mr-2 text-headline-small font-weight-bold d-inline-block">{{ user_details.displayName }}</h2>
              <span class="text-body-small">{{ user_details.username }}</span>
            </v-col>
            <v-col cols="12" class="pt-1 d-flex justify-center align-center">
              <v-chip
                  v-if="user_details.status"
                  :color="user_details.status.color"
                  variant="flat"
                  size="small"
                  class="mx-2"
              >
                {{ user_details.status.name }}
              </v-chip>
              <v-chip
                  v-if="user_details.rank"
                  :color="user_details.rank.color"
                  variant="flat"
                  size="small"
              >
                {{ user_details.rank.name }}
              </v-chip>
            </v-col>
            <v-col cols="12" class="d-flex justify-center">
              <div v-if="user_details.profilePicOverride" class="d-inline-block rounded pa-1 mx-1"
                   :style="{ background: user_details.rank ? user_details.rank.color : '' }">
                <v-img class="rounded" :src="user_details.profilePicOverride" height="75" width="133" cover>
                  <template v-slot:placeholder>
                    <div class="d-flex fill-height align-center justify-center">
                      <v-progress-circular
                          indeterminate
                          color="grey-lighten-5"
                      />
                    </div>
                  </template>
                </v-img>
              </div>
              <div v-if="user_details.userIcon" class="d-inline-block rounded pa-1 mx-1"
                   :style="{ background: user_details.rank ? user_details.rank.color : '' }">
                <v-img class="rounded" :src="user_details.userIcon" height="75" width="75" cover>
                  <template v-slot:placeholder>
                    <div class="d-flex fill-height align-center justify-center">
                      <v-progress-circular
                          indeterminate
                          color="grey-lighten-5"
                      />
                    </div>
                  </template>
                </v-img>
              </div>
              <div class="d-inline-block rounded pa-1 mx-1"
                   :style="{ background: user_details.rank ? user_details.rank.color : '' }">
                <v-img class="rounded" :src="user_details.currentAvatarThumbnailImageUrl" height="75" width="100" cover>
                  <template v-slot:placeholder>
                    <div class="d-flex fill-height align-center justify-center">
                      <v-progress-circular
                          indeterminate
                          color="grey-lighten-5"
                      />
                    </div>
                  </template>
                </v-img>
              </div>
            </v-col>
            <v-col cols="12" v-if="user_details.statusDescription">
              <h4>Status:</h4>
              <span class="text-body-small">{{ user_details.statusDescription }}</span>
            </v-col>
            <v-col cols="12">
              <h4>Bio:</h4>
              <span class="text-body-small text-pre-wrap">
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
              <span class="text-body-small">{{ user_details.last_platform }}</span>
            </v-col>
            <v-col cols="6">
              <h4>Date Joined:</h4>
              <span class="text-body-small">{{ user_details.date_joined }}</span>
            </v-col>
            <v-col cols="6">
              <h4>Last Login:</h4>
              <span class="text-body-small">{{ user_details.last_login }}</span>
            </v-col>
            <v-col cols="12" v-if="user_details.world">
              <h4>
                <span>World:</span>
                <span v-if="user_details.location_type" class="mx-2 text-body-small text-grey font-italic">
                  ({{ user_details.location_type }})
                </span>
                <span v-if="user_details.location_region" class="text-body-small text-grey font-italic">
                  ({{ user_details.location_region }})
                </span>
              </h4>
              <v-img :src="user_details.world.thumbnailImageUrl" class="rounded mx-auto my-2" width="256"
                     height="192" cover>
                <template v-slot:placeholder>
                  <v-skeleton-loader type="image" width="256" height="192"/>
                </template>
              </v-img>
              <h5 class="mt-3 text-title-large text-center">{{ user_details.world.name }}</h5>
              <h6 v-if="user_details.world.author_tags" class="mb-3 text-title-small text-center text-grey">
                {{ user_details.world.author_tags.join(', ') }}
              </h6>
              <div class="my-2">
                <v-icon v-for="i in user_details.world.heat" :key="i" size="small" color="orange">
                  local_fire_department
                </v-icon>
              </div>
              <p class="mt-2 mb-0 text-pre-wrap">{{ user_details.world.description }}</p>
              <v-table v-if="user_details.world.id" class="my-2">
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
              </v-table>
              <v-table v-if="user_details.world.id" class="my-2">
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
              </v-table>
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
        <v-card-title class="text-headline-small bg-primary mb-3">
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
              variant="text"
              @click="confirmOpenVRCSession"
          >
            Yes
          </v-btn>
          <v-btn
              color="grey"
              variant="text"
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
        location="bottom"
        variant="tonal"
        color="primary"
        transition="slide-y-reverse-transition"
        style="margin-bottom: 64px;"
    >
      <v-icon color="primary" start>add_location_alt</v-icon>
      Invite Sent.
    </v-snackbar>

    <v-menu
        v-model="friend_menu"
        :target="[menu_pos.x, menu_pos.y]"
        transition="slide-y-transition"
    >
      <v-list class="pa-0">
        <v-list-item
            :prepend-icon="friend_menu_item.favorited ? 'star_outline' : 'star'"
            :title="friend_menu_item.favorited ? 'Unfavorite' : 'Favorite'"
            @click="toggleFavoriteFriend"
        />
      </v-list>
    </v-menu>

    <v-bottom-navigation v-if="hasUserData" v-model="bottom_navigator" mode="shift" grow color="primary">
      <v-btn value="friends">
        <v-icon>people</v-icon>

        <span>Friends</span>
      </v-btn>

      <v-btn value="worlds">
        <v-icon>public</v-icon>

        <span>Worlds</span>
      </v-btn>

      <v-btn value="events">
        <v-icon>history</v-icon>

        <span>Events</span>
      </v-btn>

      <v-btn value="gallery" :disabled="!isUserVRCPlus">
        <v-icon>collections</v-icon>

        <span>Gallery</span>
      </v-btn>

      <v-btn value="settings">
        <v-icon>settings</v-icon>

        <span>Settings</span>
      </v-btn>
    </v-bottom-navigation>
  </v-container>
</template>

<script>
import dayjs from 'dayjs';
import EventsTab from "./PopupTabs/EventsTab.vue";
import SettingsTab from "./PopupTabs/SettingsTab.vue";
import WorldsTab from "./PopupTabs/WorldsTab.vue";
import GalleryTab from "./PopupTabs/GalleryTab.vue";
import FriendPicture from "./PopupComponents/FriendPicture.vue";
import {getFavoriteFriends, toggleFavoriteFriend} from '../shared/storage';
import {MessageType, sendToBackground} from '../shared/messages';

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
      drawer_width: window.innerWidth,
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

    getFavoriteFriends().then(favorite_friends => this.favorite_friends = favorite_friends);
    sendToBackground(MessageType.REFRESH_CONNECTION);

    window.addEventListener('resize', this.updateDrawerWidth);

    this.bottom_navigator = localStorage.getItem('default_tab') || 'friends';
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.updateDrawerWidth);
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
              data.created_at = dayjs(data.created_at).format('YYYY-MM-DD HH:mm:ss');
              data.updated_at = dayjs(data.updated_at).format('YYYY-MM-DD HH:mm:ss');

              data.publicationDate = data.publicationDate !== 'none'
                  ? dayjs(data.publicationDate).format('YYYY-MM-DD HH:mm:ss')
                  : data.publicationDate;

              data.labsPublicationDate = data.labsPublicationDate !== 'none'
                  ? dayjs(data.labsPublicationDate).format('YYYY-MM-DD HH:mm:ss')
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

        sendToBackground(MessageType.LOGOUT);
      })
    },
    goToVRCLogin() {
      chrome.tabs.create({url: `https://vrchat.com/home/login`});
    },
    goToData() {
      chrome.tabs.create({url: chrome.runtime.getURL('index.html')});
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
    confirmOpenVRCSession() {
      this.openVRCCurrentSessionInVR();
      this.no_session_dialog = false;
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
      user.last_login = dayjs(user.last_login).format('YYYY-MM-DD HH:mm:ss');
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

      toggleFavoriteFriend(this.friend_menu_item.id)
          .then(favorite_friends => this.favorite_friends = favorite_friends);
    },
    updateDrawerWidth() {
      this.drawer_width = window.innerWidth;
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
.fab-top-left {
  top: 16px;
  left: 16px;
}

.fab-top-right {
  top: 16px;
  right: 16px;
}

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
