<template>
  <div>
    <v-row class="mx-0">
      <v-col class="d-flex align-center justify-space-around my-2">
        <v-select
            v-model="event_types_shown"
            :items="event_types"
            hide-details multiple solo
            background-color="grey darken-3"
            style="max-width: 80px"
            @change="saveTypesShown"
        >
          <template v-slot:selection="{ index }">
            <v-icon v-if="index === 0">playlist_add_check</v-icon>
          </template>
          <template v-slot:item="{ item }">
            <v-card width="200px" class="d-flex align-center justify-space-between" color="transparent" flat>
              <v-simple-checkbox
                  :value="event_types_shown.includes(item.value)"
              />
              {{ item.text }}
              <v-icon right :color="getBackgroundColor(item.value)">
                adjust
              </v-icon>
            </v-card>
          </template>
        </v-select>
        <v-spacer class="mx-3"/>
        <v-text-field
            v-model="search" class="mt-0" label="Search"
            hide-details solo clearable
            background-color="grey darken-3"
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
          v-for="[index, event] of filteredEvents.entries()"
          :key="index"
          class="pl-0 d-flex align-center"
          style="height: 75px;"
          :style="{ background: getBackgroundColor(event.type) + '44' }"
      >
        <v-img
            v-if="['friend-add', 'friend-delete', 'friend-online', 'friend-active', 'friend-offline', 'friend-update', 'user-update'].includes(event.type) && event.content.user"
            :src="event.content.user.currentAvatarThumbnailImageUrl"
            max-width="100"
            height="75"
        />
        <v-img
            v-if="event.type === 'friend-location' && event.content.location === 'private'"
            src="https://assets.vrchat.com/www/images/default_private_image.png"
            max-width="100"
            height="75"
        />
        <v-img
            v-else-if="event.type === 'friend-location'"
            :src="event.content.world.thumbnailImageUrl"
            max-width="100"
            height="75"
        />
        <div v-else-if="event.type === 'notification'" style="position: relative">
          <v-icon
              v-if="event.content.details.imageUrl"
              size="20" class="mx-auto" :color="getNotificationColor(event.content.type)"
              style="position: absolute; top: 10px; right : 10px; z-index: 1"
          >
            {{ getNotificationsIcon(event.content.type) }}
          </v-icon>
          <v-img
              v-if="event.content.details.imageUrl"
              :src="event.content.details.imageUrl"
              max-width="100"
              height="75"
          />
          <v-list-item-icon v-else class="mx-0 align-self-center" style="width: 100px">
            <v-icon size="40" class="mx-auto" :color="getNotificationColor(event.content.type)">
              {{ getNotificationsIcon(event.content.type) }}
            </v-icon>
          </v-list-item-icon>
        </div>

        <v-list-item-content>
          <v-row class="mx-0 align-center">
            <v-col cols="9" class="text-center">
              <h3 v-if="event.type === 'friend-location'" class="subtitle-1">
                <span v-if="event.content.user">{{ event.content.user.displayName }}</span>
                <span v-if="event.content.world.name" class="d-block mt-1 caption">{{ event.content.world.name }}</span>
                <span v-else class="d-block mt-1">Private</span>
              </h3>
              <h3 v-else-if="['friend-add', 'friend-delete', 'friend-online', 'friend-active', 'friend-offline', 'friend-update', 'user-update'].includes(event.type)" class="subtitle-1">
                {{ event_types.find(e => event.type === e.value).text }}
                <span v-if="event.content.user" class="d-block mt-1 caption">{{ event.content.user.displayName }}</span>
              </h3>
              <h3 v-else-if="event.type === 'notification'" class="subtitle-1">
                <span class="d-block mt-1">
                  {{ event.content.senderUsername }}
                </span>
                <span v-if="event.content.details.requestMessage" class="d-block mt-1 caption">
                  {{ event.content.details.requestMessage }}
                </span>
                <span v-if="event.content.details.responseMessage" class="d-block mt-1 caption">
                  {{ event.content.details.responseMessage }}
                </span>
              </h3>
              <h3 v-else class="subtitle-1">{{ event.type }}</h3>
            </v-col>
            <v-col cols="3" class="px-0 text-center">
              <h4 class="mt-3 subtitle-2">{{ event.display_date }}</h4>
            </v-col>
          </v-row>
        </v-list-item-content>
      </v-list-item>
      <div v-if="!filteredEvents.length" class="fill-height d-flex align-center justify-center flex-column">
        <h2 class="text-h6">No events right now.</h2>
        <h3 class="subtitle-1">This will auto-refresh when events happen !!</h3>
      </div>
    </v-card>
  </div>
</template>

<script>
import moment from 'moment';

export default {
  name: 'EventsTab',
  props: {
    friends: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      events: [],
      event_types: [
        {text: 'Friend Add', value: 'friend-add'},
        {text: 'Friend Delete', value: 'friend-delete'},
        {text: 'Friend Online', value: 'friend-online'},
        {text: 'Friend Active', value: 'friend-active'},
        {text: 'Friend Offline', value: 'friend-offline'},
        {text: 'Friend Location', value: 'friend-location'},
        {text: 'Friend Update', value: 'friend-update'},
        {text: 'User Update', value: 'user-update'},
        {text: 'Notifications', value: 'notification'},
      ],
      event_types_shown: [
        'friend-online',
        'friend-active',
        'friend-offline',
        'friend-location',
        'friend-update',
        'notification'
      ],
      search: '',
      users_fetched: [],
      fetched_users_ids: []
    }
  },
  computed: {
    filteredEvents() {
      const events = this.events
          .filter(event => {
            if (!this.search)
              return this.event_types_shown.includes(event.type)
            else
              return this.event_types_shown.includes(event.type)
                  && (event.content.user
                      && event.content.user.displayName.toLowerCase().includes(this.search.toLowerCase()))
                  || (event.content.senderUsername
                      && event.content.senderUsername.toLowerCase().includes(this.search.toLowerCase()))
          })
          .sort((a, b) => moment(new Date(a.date)) - moment(new Date(b.date)));

      const previousUserUpdate = {};
      events.forEach(event => {
        console.log(event.date)
        event.display_date = moment(new Date(event.date)).format('MM/DD HH:mm:ss')

        if (event.type === 'friend-offline' || event.type === 'friend-delete') {
          event.content.user = this.friends.find(friend => friend.id === event.content.userId);
          if (!event.content.user)
            event.content.user = this.users_fetched.find(friend => friend.id === event.content.userId);
          if (!event.content.user && !this.fetched_users_ids.includes(event.content.userId))
            this.fetchUser(event.content.userId)
                .then(data => event.content.user = data);
        } else if (event.type === 'friend-update' || event.type === 'user-update') {
          const user = event.content.user;
          const prevUser = previousUserUpdate[user.id];

          if (prevUser)
            Object.keys(user).forEach((key) => {
              if (user[key] !== prevUser[key]) {
                if (typeof user[key] === 'string') {
                  if (!event.content.previous_user) event.content.previous_user = {};
                  if (!event.content.previous_user_changes) event.content.previous_user_changes = {};

                  event.content.previous_user = prevUser;
                  event.content.previous_user_changes[key] = prevUser[key];
                }
              }
            });

          previousUserUpdate[user.id] = user;
        }
      })

      return events.filter(e => (e.type !== 'friend-update' || (e.type === 'friend-update' && e.content.previous_user_changes)));
    }
  },
  mounted() {
    this.loadTypesShown();

    const port = (browser.runtime || chrome.extension).connect({
      name: 'popup-event'
    });

    port.onMessage.addListener((msg) => {
      switch (msg.type) {
        case 'all_events':
          this.events = msg.events;
          break;
        case 'new_events':
          this.events.push(msg.event);
          break;
      }
    });
  },
  methods: {
    loadTypesShown() {
      if (localStorage.getItem('popup-events-types-shown'))
        this.event_types_shown = JSON.parse(localStorage.getItem('popup-events-types-shown'))
    },
    saveTypesShown() {
      localStorage.setItem('popup-events-types-shown', JSON.stringify(this.event_types_shown))
    },
    fetchUser(user_id) {
      this.fetched_users_ids.push(user_id);

      return new Promise((resolve) => {
        fetch(`https://vrchat.com/api/1/users/${user_id}`)
            .then(response => response.json())
            .then(data => {
              this.users_fetched.push(data);
              resolve(data);
            })
            .catch(() => this.fetchUser(user_id))
      })
    },
    getBackgroundColor(type) {
      switch (type) {
        case 'friend-location':
          return '#5E35B1'
        case 'friend-add':
          return '#C0CA33'
        case 'friend-delete':
          return '#880E4F'
        case 'friend-online':
          return '#7CB342'
        case 'friend-active':
          return '#FBC02D'
        case 'friend-offline':
          return '#B71C1C'
        case 'user-update':
        case 'friend-update':
          return '#039BE5'
        default:
          return '#757575'
      }
    },
    getNotificationsIcon(type) {
      switch (type) {
        case 'invite':
        case 'requestInvite':
        case 'inviteResponse':
          return 'drafts'
        case 'friendRequest':
          return 'person_add'
        default:
          return 'question'
      }
    },
    getNotificationColor(type) {
      switch (type) {
        case 'invite':
          return 'blue lighten-2'
        case 'requestInvite':
          return 'orange'
        case 'inviteResponse':
          return 'pink darken-3'
        case 'friendRequest':
          return 'green lighten-1'
        default:
          return 'grey'
      }
    }
  }
}
</script>

<style scoped>

</style>