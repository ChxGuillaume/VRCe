<template>
  <v-card :loading="loading" elevation="0">
    <v-row class="py-3">
      <v-col cols="12" class="d-flex justify-center align-center">
        <v-chip-group
            v-model="type_filter"
            multiple
            column
        >
          <v-chip
              v-for="type in playerModerationTypes"
              :key="type.type"
              :color="getTypeColor(type.type)"
              :outlined="!type_filter.includes(type.type)"
              :value="type.type"
          >
            <v-icon left>
              {{ type.icon }}
            </v-icon>
            {{ type.icon_text }} ({{ type.count }})
          </v-chip>
        </v-chip-group>
        <v-text-field
            v-model="name_filter"
            hide-details
            clearable
            outlined
            rounded
            dense
            placeholder="Search User..."
            style="max-width:250px;"
        />
      </v-col>
      <v-col
        v-for="user of playerModerationFiltered"
        :key="user.targetUserId + user.type"
        class="user_item"
        cols="6"
        sm="4"
        md="3"
        lg="2"
        @click="$refs.userDetails.fetchUser(user.targetUserId)"
      >
        <v-row dense>
          <v-col cols="2" class="d-flex align-center">
            <v-icon
                size="20" class="mx-auto"
                :color="getTypeColor(user.type)"
            >
              {{ user.icon }}
            </v-icon>
          </v-col>
          <v-col cols="10">
            <div class="font-weight-bold">{{ user.targetDisplayName }}</div>
            <div>{{ user.created }}</div>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <user-details ref="userDetails" :logged_in="logged_in"/>
  </v-card>
</template>

<script>
import * as moment from 'moment';
import UserDetails from '../UserDetails';

export default {
  name: 'PlayerModerationTab',
  components: {UserDetails},
  props: {
    logged_in: {
      type: Boolean,
      required: true
    }
  },
  data() {
    return {
      loading: true,
      type_filter: [],
      name_filter: '',
      player_moderation: [],
      player_moderation_headers: [
        {text: 'User', align: 'start', value: 'targetDisplayName', groupable: false},
        {text: 'Type', align: 'start', value: 'type'},
        {text: 'Date', align: 'start', value: 'created', groupable: false},
      ],
    }
  },
  computed: {
    playerModerationOrdered() {
      return [...this.player_moderation].sort((a, b) => b.created.localeCompare(a.created))
    },
    playerModerationFiltered() {
      return this.playerModerationOrdered
          .filter(e =>
              (!this.type_filter.length ^ this.type_filter.includes(e.type))
              && (e.targetDisplayName.toLowerCase().includes((this.name_filter || '').toLowerCase()))
          )
    },
    playerModerationTypes () {
      const types = {};

      this.player_moderation.forEach(pm => {
        if (!types[pm.type])
          types[pm.type] = {
            type: pm.type,
            icon: pm.icon,
            icon_text: pm.icon_text,
            count: 1
          }
        else
          types[pm.type].count++;
      });

      return Object.values(types);
    }
  },
  mounted() {
    this.getPlayerModeration();
  },
  methods: {
    getPlayerModeration() {
      fetch('https://vrchat.com/api/1/auth/user/playermoderations')
          .then(res => res.json())
          .then(data => {
            if (!data.error) {
              data.forEach(e => this.updateRow(e));

              this.player_moderation = data;
            }

            this.loading = false
          })
    },
    updateRow(row) {
      this.setIcon(row);
      this.setCreated(row);
    },
    setIcon(row) {
      switch (row.type) {
        case 'mute':
          row.icon_text = 'Mute';
          row.icon = 'volume_off';
          break;
        case 'unmute':
          row.icon_text = 'Unmute';
          row.icon = 'volume_on';
          break;
        case 'showAvatar':
          row.icon_text = 'Show Avatar';
          row.icon = 'visibility';
          break;
        case 'hideAvatar':
          row.icon_text = 'Hide Avatar';
          row.icon = 'visibility_off';
          break;
        case 'block':
          row.icon_text = 'Block';
          row.icon = 'block';
          break;
        default:
          row.icon_text = row.type;
          row.icon = row.type;
      }
    },
    getTypeColor(type) {
      switch (type) {
        case 'mute':
          return 'brown';
        case 'unmute':
          return 'blue';
        case 'showAvatar':
          return 'green';
        case 'hideAvatar':
          return 'orange';
        case 'block':
          return 'red';
        default:
          return 'grey';
      }
    },
    setCreated(row) {
      row.created = moment(row.created).format('YYYY-MM-DD HH:mm:ss');
    }
  }
}
</script>

<style lang="scss" scoped>
.user_item {
  transition: .1s ease;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, .15);
  }
}
</style>
