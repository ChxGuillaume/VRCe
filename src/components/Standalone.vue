<template>
  <v-container fluid class="pa-0">
    <v-tooltip v-if="user_data.id" location="right">
      <template v-slot:activator="{ props }">
        <v-scale-transition origin="center">
          <v-btn
              v-if="!hideFab"
              v-bind="props"
              icon
              size="large"
              color="red"
              position="fixed"
              location="top left"
              class="ma-4"
              style="z-index: 5"
              @click="logoutFromVRChat"
          >
            <v-icon>logout</v-icon>
          </v-btn>
        </v-scale-transition>
      </template>
      <span>Disconnect From VRChat Home</span>
    </v-tooltip>

    <template v-if="user_data.id">
      <v-tabs v-model="tab" class="mt-16" align-tabs="center" bg-color="transparent" slider-color="transparent">
        <v-tab value="friends">
          <v-icon start>
            people
          </v-icon>
          Friends
        </v-tab>
        <v-tab value="moderation">
          <v-icon start>
            shield
          </v-icon>
          Moderation Actions
        </v-tab>
        <v-tab value="personal">
          <v-icon start>
            account_circle
          </v-icon>
          Personal Infos
        </v-tab>
      </v-tabs>

      <v-window v-model="tab">
        <v-window-item value="friends" class="pt-3">
          <v-row class="text-center" v-if="friends.length">
            <v-col cols="12">
              <v-chip
                  v-for="rank in ranksStats"
                  :key="rank.name"
                  class="mx-2"
                  :color="rank.color"
                  variant="outlined"
              >
                {{ rank.count }} {{ rank.name }}
              </v-chip>
            </v-col>
            <v-col cols="12">
              <v-card :loading="isLoading">
                <div class="d-flex align-center ga-4 pa-4">
                  <v-select
                      v-model="friends_shown_headers"
                      :items="friendsHeadersSelectItems"
                      label="Hide Columns"
                      multiple
                  >
                    <template v-slot:prepend-item>
                      <v-list-item
                          ripple
                          @click="toggleFriendsShownHeaders"
                      >
                        <template v-slot:prepend>
                          <v-icon :color="friends_shown_headers.length > 0 ? 'grey' : ''">
                            {{ icon }}
                          </v-icon>
                        </template>
                        <v-list-item-title>
                          Select All
                        </v-list-item-title>
                      </v-list-item>
                      <v-divider class="mt-2"></v-divider>
                    </template>
                    <template v-slot:selection="{ index }">
                      <span
                          v-if="index === 0"
                          class="text-grey text-body-small"
                      >
                        ({{ friends_shown_headers.length }} columns shown)
                      </span>
                    </template>
                  </v-select>
                  <v-spacer/>
                  <div v-if="isLoading">
                    <span>{{ friends.length }} / {{ user_data.friends.length }}</span>
                  </div>
                  <v-spacer/>
                  <v-text-field
                      v-model="friends_search"
                      label="Search"
                  />
                </div>
                <v-data-table
                    :items="friends"
                    :headers="friendsHeaders"
                    :items-per-page="25"
                    :items-per-page-options="itemsPerPageOptions"
                    :search="friends_search"
                    :sort-by="[{key: 'state.power', order: 'asc'}]"
                    height="73vh"
                >
                  <template v-slot:item.worldId="{ item: { worldId } }">
                    <v-img
                        v-if="worlds[worldId]"
                        class="rounded"
                        :src="worlds[worldId].thumbnailImageUrl"
                        width="200"
                        min-height="150"
                        cover
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
                    <v-img
                        v-else-if="worldId === 'private'"
                        class="rounded"
                        src="https://assets.vrchat.com/www/images/default_private_image.png"
                        width="200"
                        min-height="150"
                        cover
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
                  </template>
                  <template v-slot:item.userIcon="{ item }">
                    <v-img
                        v-if="item.userIcon"
                        :src="item.userIcon"
                        class="rounded"
                        width="150"
                        min-height="150"
                        cover
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
                  </template>
                  <template v-slot:item.avatar="{ item }">
                    <v-img
                        :src="item.currentAvatarThumbnailImageUrl"
                        class="rounded"
                        width="200"
                        min-height="150"
                        cover
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
                  </template>
                  <template v-slot:item.badges="{ item }">
                    <v-img
                        v-if="item.tags.includes('system_early_adopter')"
                        :src="earlyAdopterBadge"
                        width="50"
                        title="Early Adopter"
                    />
                    <v-img
                        v-if="item.tags.includes('system_supporter')"
                        :src="supporterBadge"
                        width="50"
                        title="Supporter"
                    />
                  </template>
                  <template v-slot:item.state.power="{ item: { state } }">
                    <v-chip :color="state.color" variant="flat">
                      {{ state.name }}
                    </v-chip>
                  </template>
                  <template v-slot:item.status.power="{ item: { status } }">
                    <v-chip :color="status.color" variant="flat">
                      {{ status.name }}
                    </v-chip>
                  </template>
                  <template v-slot:item.rank.power="{ item: { rank } }">
                    <v-chip :color="rank.color" variant="flat">
                      {{ rank.name }}
                    </v-chip>
                  </template>
                  <template v-slot:item.languages="{ item: { languages } }">
                    {{ languages.join(', ') }}
                  </template>
                  <template v-slot:item.tags="{ item }">
                    <v-chip
                        v-for="tag in item.tags"
                        :key="tag"
                        class="my-1"
                        size="small"
                    >
                      {{ tag }}
                    </v-chip>
                  </template>
                  <template v-slot:item.bioLinks="{ item }">
                    <v-chip
                        v-for="link in item.bioLinks"
                        :key="link"
                        :href="link"
                        target="_blank"
                        class="my-1"
                        color="primary"
                        variant="flat"
                        size="small"
                    >
                      {{ link }}
                    </v-chip>
                  </template>
                  <template v-slot:item.date_joined="{ item: { date_joined } }">
                    <pre>{{ date_joined }}</pre>
                  </template>
                  <template v-slot:item.last_login="{ item: { last_login } }">
                    <pre>{{ last_login }}</pre>
                  </template>
                </v-data-table>
              </v-card>
            </v-col>
          </v-row>
        </v-window-item>
        <v-window-item value="moderation">
          <player-moderation-tab :logged_in="!!user_data"/>
        </v-window-item>
        <v-window-item value="personal" class="pt-3">
          <personal-infos-tab :user_data="user_data"/>
        </v-window-item>
      </v-window>
    </template>
    <v-dialog
        v-model="need_login_form"
        transition="dialog-bottom-transition"
        max-width="600"
        persistent
    >
      <v-card>
        <v-card-title class="text-headline-small bg-red-lighten-1">
          Not Logged In
        </v-card-title>

        <v-card-text class="pt-5 text-center">
          You are actually disconnected from VRChat Home.
          <br>
          Please login here
          <a href="https://vrchat.com/home/login" target="_blank">https://vrchat.com/home/login</a>
          and then click the button below.
        </v-card-text>

        <v-divider/>

        <v-card-actions class="d-flex justify-center">
          <v-btn
              color="primary"
              variant="outlined"
              @click="fetchUser"
          >
            I'm now connected
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog
        v-model="need_visit_vrc_home_form"
        transition="dialog-bottom-transition"
        max-width="600"
        persistent
    >
      <v-card>
        <v-card-title class="text-headline-small bg-orange-lighten-1">
          Cloudflare Error
        </v-card-title>

        <v-card-text class="pt-5 text-center">
          Cloudflare need to check your browser.
          <br>
          Please check
          <a href="https://vrchat.com/home/login" target="_blank">https://vrchat.com/home</a>
          and then click the button below.
        </v-card-text>

        <v-divider/>

        <v-card-actions class="d-flex justify-center">
          <v-btn
              color="primary"
              variant="outlined"
              @click="fetchUser"
          >
            My browser is verified
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import dayjs from 'dayjs';
import {
  getCurrentUser,
  getUserWithProfile,
  getWorld,
  isCloudflareError,
  isUnauthorized,
  logout,
  withProfile
} from '../shared/vrchat-api';
import PlayerModerationTab from './StandaloneTabs/PlayerModerationTab.vue';
import PersonalInfosTab from './StandaloneTabs/PersonalInfosTab.vue';
import earlyAdopterBadge from '../assets/early_adopter.png';
import supporterBadge from '../assets/supporter.png';

export default {
  name: 'Standalone',
  components: {PersonalInfosTab, PlayerModerationTab},
  data: () => ({
    user_data: {},
    friends: [],
    friends_search: '',
    friends_headers: [
      {title: 'World', align: 'start', key: 'worldId', sortable: false},
      {title: 'Avatar Icon', key: 'userIcon', sortable: false},
      {title: 'Avatar', key: 'avatar', sortable: false},
      {title: 'Username', key: 'username'},
      {title: 'Display Name', key: 'displayName'},
      {title: 'Badges', key: 'badges', sortable: false},
      {title: 'State', key: 'state.power'},
      {title: 'Status', key: 'status.power'},
      {title: 'Status Description', key: 'statusDescription'},
      {title: 'Rank', key: 'rank.power'},
      {title: 'Languages', key: 'languages'},
      {title: 'Tags', key: 'tags'},
      {title: 'Tags Length', key: 'tags.length'},
      {title: 'Bio', key: 'bio'},
      {title: 'Bio Links', key: 'bioLinks'},
      {title: 'Last Platform', key: 'last_platform'},
      {title: 'Join Date', key: 'date_joined'},
      {title: 'Last Login', key: 'last_login'},
    ],
    friends_shown_headers: [],
    worlds: {},
    need_login_form: false,
    need_visit_vrc_home_form: false,
    scroll_top: 0,
    tab: 'friends',
    itemsPerPageOptions: [
      {value: 10, title: '10'},
      {value: 25, title: '25'},
      {value: 50, title: '50'},
      {value: 100, title: '100'},
      {value: -1, title: 'All'}
    ],
    earlyAdopterBadge,
    supporterBadge
  }),
  computed: {
    ranksStats() {
      const data = {}

      this.friends.forEach((user) => {
        if (!data[user.rank.power]) {
          data[user.rank.power] = Object.assign({count: 1}, user.rank)
        } else {
          data[user.rank.power].count++
        }
      })

      return Object.values(data).reverse()
    },
    icon() {
      if (this.friendsHeadersShowAll) return 'highlight_off'
      if (this.friends_shown_headers.length) return 'add_circle_outline'
      return 'add_circle_outline'
    },
    friendsHeadersShowAll() {
      return this.friends_headers.length === this.friends_shown_headers.length
    },
    friendsHeadersSelectItems() {
      return this.friends_headers.map(e => e.title)
    },
    friendsHeaders() {
      return this.friends_headers.filter(e => this.friends_shown_headers.includes(e.title))
    },
    isLoading() {
      return !this.user_data.id || this.friends.length < this.user_data.friends.length;
    },
    hideFab() {
      return (this.scroll_top) > 150
    }
  },
  mounted() {
    document.title = "Friend List Data";

    this.friends_shown_headers = this.friendsHeadersSelectItems.filter(e => !e.includes('Tag') && !e.includes('Link'));

    this.fetchUser();

    document.addEventListener('scroll', this.onScroll);
  },
  beforeUnmount() {
    document.removeEventListener('scroll', this.onScroll);
  },
  methods: {
    fetchUser() {
      this.need_login_form = false;
      this.need_visit_vrc_home_form = false;

      getCurrentUser()
          .then(withProfile)
          .then(data => {
            this.setUserData(data);
            this.user_data = data;

            this.fetchFriends();
          })
          .catch(e => {
            if (isCloudflareError(e))
              this.need_visit_vrc_home_form = true;
            else if (isUnauthorized(e))
              this.need_login_form = true;
            else
              console.error('Could not fetch the current user', e);
          });
    },
    fetchFriends() {
      this.friends = [];
      for (const friend of this.user_data.friends || []) {
        getUserWithProfile(friend)
            .then(data => {
              this.setUserData(data);
              this.friends.push(data);

              if (data.worldId && !['private', 'offline'].includes(data.worldId))
                this.fetchWorld(data.worldId);
            })
            .catch(e => console.warn(`Could not fetch friend ${friend}`, e));
      }
    },
    fetchWorld(worldId) {
      getWorld(worldId)
          .then(data => {
            this.worlds[worldId] = data;
          })
          .catch(e => console.warn(`Could not fetch world ${worldId}`, e));
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
      user.bioLinks = (user.bioLinks || []).filter(e => e);
    },
    setLanguages(user) {
      user.languages = (user.tags || []).filter(e => e.startsWith('language_')).map(e => e.replace('language_', ''));
    },
    setLastLogin(user) {
      user.last_login = dayjs(user.last_login).format('YYYY-MM-DD HH:mm:ss');
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
    toggleFriendsShownHeaders() {
      this.$nextTick(() => {
        if (this.friendsHeadersShowAll) {
          this.friends_shown_headers = []
        } else {
          this.friends_shown_headers = this.friends_headers.map(e => e.title)
        }
      })
    },
    logoutFromVRChat() {
      logout().catch(e => console.warn('Logout failed', e)).then(() => {
        this.user_data = {};
        this.friends = [];
        this.fetchUser();
      })
    },
    onScroll() {
      this.scroll_top = document.documentElement.scrollTop || document.body.scrollTop
    }
  }
}
</script>
