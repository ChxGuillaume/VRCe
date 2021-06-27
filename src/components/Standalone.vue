<template>
  <v-container fluid class="pa-0">
    <v-tooltip v-if="user_data.id" right>
      <template v-slot:activator="{ on, attrs }">
        <v-btn
            fixed top left fab
            color="red"
            v-bind="attrs"
            v-on="on"
            @click="logoutFromVRChat"
        >
          <v-icon>logout</v-icon>
        </v-btn>
      </template>
      <span>Disconnect From VRChat Home</span>
    </v-tooltip>

    <v-tabs v-if="user_data.id" class="mt-16" centered background-color="transparent" slider-color="transparent">
      <v-tab>
        <v-icon left>
          people
        </v-icon>
        Friends
      </v-tab>
      <v-tab>
        <v-icon left>
          shield
        </v-icon>
        Moderation Actions
      </v-tab>
      <v-tab>
        <v-icon left>
          account_circle
        </v-icon>
        Personal Infos
      </v-tab>

      <v-tab-item class="pt-3">
        <v-row class="text-center" v-if="friends.length">
          <v-col cols="12">
            <v-chip
                v-for="rank in ranksStats"
                :key="rank.name"
                class="mx-2"
                :color="rank.color"
                outlined
            >
              {{ rank.count }} {{ rank.name }}
            </v-chip>
          </v-col>
          <v-col cols="12">
            <v-card :loading="isLoading">
              <v-card-title>
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
                      <v-list-item-action>
                        <v-icon :color="friends_shown_headers.length > 0 ? 'gray' : ''">
                          {{ icon }}
                        </v-icon>
                      </v-list-item-action>
                      <v-list-item-content>
                        <v-list-item-title>
                          Select All
                        </v-list-item-title>
                      </v-list-item-content>
                    </v-list-item>
                    <v-divider class="mt-2"></v-divider>
                  </template>
                  <template v-slot:selection="{ item, index }">
                <span
                    v-if="index === 0"
                    class="grey--text text-caption"
                >
                  ({{ friends_shown_headers.length }} columns shown)
                </span>
                  </template>
                </v-select>
                <v-spacer/>
                <div v-if="isLoading">
                  <span>{{ friends.length }} / {{ user_data.friends.length}}</span>
                </div>
                <v-spacer/>
                <v-text-field
                    v-model="friends_search"
                    label="Search"
                />
              </v-card-title>
              <v-data-table
                  v-if="show_table"
                  :items="friends"
                  :headers="friendsHeaders"
                  :items-per-page="25"
                  :search="friends_search"
                  :footer-props="{
                'items-per-page-options': [10, 25, 50, 100, -1]
              }"
                  sort-by="state.power"
                  height="73vh"
              >
                <template v-slot:item.worldId="{ item: { worldId } }">
                  <v-img
                      v-if="worlds[worldId]"
                      class="rounded"
                      :src="worlds[worldId].thumbnailImageUrl"
                      width="200"
                      min-height="150"
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
                  <v-img
                      v-else-if="worldId === 'private'"
                      class="rounded"
                      src="https://assets.vrchat.com/www/images/default_private_image.png"
                      width="200"
                      min-height="150"
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
                </template>
                <template v-slot:item.userIcon="{ item }">
                  <v-img
                      v-if="item.userIcon"
                      :src="item.userIcon"
                      class="rounded"
                      width="150"
                      min-height="150"
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
                </template>
                <template v-slot:item.avatar="{ item }">
                  <v-img
                      :src="item.currentAvatarThumbnailImageUrl"
                      class="rounded"
                      width="200"
                      min-height="150"
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
                </template>
                <template v-slot:item.badges="{ item }">
                  <v-img
                      v-if="item.tags.includes('system_early_adopter')"
                      :src="require('../assets/early_adopter.png')"
                      width="50"
                      title="Early Adopter"
                  />
                  <v-img
                      v-if="item.tags.includes('system_supporter')"
                      :src="require('../assets/supporter.png')"
                      width="50"
                      title="Supporter"
                  />
                </template>
                <template v-slot:item.state.power="{ item: { state } }">
                  <v-chip :color="state.color" :light="state.light">
                    {{ state.name }}
                  </v-chip>
                </template>
                <template v-slot:item.status.power="{ item: { status } }">
                  <v-chip :color="status.color">
                    {{ status.name }}
                  </v-chip>
                </template>
                <template v-slot:item.rank.power="{ item: { rank } }">
                  <v-chip :color="rank.color">
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
                      small
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
                      small
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
      </v-tab-item>
      <v-tab-item class="pt-3">
        <player-moderation-tab :logged_in="!!user_data"/>
      </v-tab-item>
      <v-tab-item class="pt-3">
        <personal-infos-tab :user_data="user_data"/>
      </v-tab-item>
    </v-tabs>
    <v-dialog
        v-model="need_login_form"
        transition="dialog-bottom-transition"
        max-width="600"
        persistent
    >
      <template v-slot:default>
        <v-card>
          <v-card-title class="text-h5 red lighten-1">
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
                outlined
                @click="fetchUser"
            >
              I'm now connected
            </v-btn>
          </v-card-actions>
        </v-card>
      </template>
    </v-dialog>
    <v-dialog
        v-model="need_visit_vrc_home_form"
        transition="dialog-bottom-transition"
        max-width="600"
        persistent
    >
      <template v-slot:default>
        <v-card>
          <v-card-title class="text-h5 orange lighten-1">
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
                outlined
                @click="fetchUser"
            >
              My browser is verified
            </v-btn>
          </v-card-actions>
        </v-card>
      </template>
    </v-dialog>
  </v-container>
</template>

<script>
import 'material-design-icons-iconfont/dist/material-design-icons.css'
import * as moment from 'moment';
import PlayerModerationTab from "./StandaloneTabs/PlayerModerationTab";
import PersonalInfosTab from "./StandaloneTabs/PersonalInfosTab";

export default {
  name: 'Standalone',
  components: {PersonalInfosTab, PlayerModerationTab},
  data: () => ({
    user_data: {},
    friends: [],
    friends_search: '',
    friends_headers: [
      {text: 'World', align: 'start', value: 'worldId'},
      {text: 'Avatar Icon', value: 'userIcon'},
      {text: 'Avatar', value: 'avatar', sortable: false},
      {text: 'Username', value: 'username'},
      {text: 'Display Name', value: 'displayName'},
      {text: 'Badges', value: 'badges', sortable: false},
      {text: 'State', value: 'state.power'},
      {text: 'Status', value: 'status.power'},
      {text: 'Status Description', value: 'statusDescription'},
      {text: 'Rank', value: 'rank.power'},
      {text: 'Languages', value: 'languages'},
      {text: 'Tags', value: 'tags'},
      {text: 'Tags Length', value: 'tags.length'},
      {text: 'Bio', value: 'bio'},
      {text: 'Bio Links', value: 'bioLinks'},
      {text: 'Last Platform', value: 'last_platform'},
      {text: 'Join Date', value: 'date_joined'},
      {text: 'Last Login', value: 'last_login'},
    ],
    friends_shown_headers: [],
    worlds: {},
    need_login_form: false,
    need_visit_vrc_home_form: false,
    show_table: true
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
      return this.friends_headers.map(e => e.text)
    },
    friendsHeaders() {
      return this.friends_headers.filter(e => this.friends_shown_headers.includes(e.text))
    },
    isLoading() {
      return !this.user_data.id || this.friends.length < this.user_data.friends.length;
    }
  },
  mounted() {
    document.title = "Friend List Data";

    this.friends_shown_headers = this.friendsHeadersSelectItems.filter(e => !e.includes('Tag') && !e.includes('Link'));

    this.fetchUser();
  },
  methods: {
    fetchUser() {
      this.need_login_form = false;

      fetch('https://vrchat.com/api/1/auth/user')
          .then(response => {
            if (response.status === 503)
              this.need_visit_vrc_home_form = true;
            else if (response.status === 401)
              this.need_login_form = true;
            else
              return response.json();
          })
          .then(data => {
            if (data) {
              this.setUserData(data);
              this.user_data = data;

              this.fetchFriends();
            }
          });
    },
    fetchFriends() {
      this.friends = [];
      for (const friend of this.user_data.friends) {
        fetch(`https://vrchat.com/api/1/users/${friend}`)
            .then(response => response.json())
            .then(data => {
              this.setUserData(data);
              this.friends.push(data);

              if (data.worldId && !['private', 'offline'].includes(data.worldId))
                this.fetchWorld(data.worldId);
            })
      }
    },
    fetchWorld(worldId) {
      fetch(`https://vrchat.com/api/1/worlds/${worldId}`)
          .then(response => response.json())
          .then(data => {
            this.worlds[worldId] = data;
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
      user.languages = user.tags.filter(e => e.startsWith('language_')).map(e => e.replace('language_', ''));
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
    toggleFriendsShownHeaders() {
      this.$nextTick(() => {
        if (this.friendsHeadersShowAll) {
          this.friends_shown_headers = []
        } else {
          this.friends_shown_headers = this.friends_headers.map(e => e.text)
        }
      })
    },
    logoutFromVRChat() {
      fetch('https://vrchat.com/api/1/logout', {
        method: 'PUT'
      }).then(() => {
        this.user_data = {};
        this.friends = [];
        this.fetchUser();
      })
    },
    refreshTable() {
      this.show_table = false;

      this.$nextTick(() => {
        this.show_table = true;
      });
    }
  }
}
</script>
