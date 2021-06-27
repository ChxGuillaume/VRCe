<template>
  <div>
    <v-data-table
        :items="player_moderation"
        :headers="player_moderation_headers"
        :items-per-page="-1"
        sort-by="created"
        sort-desc
        group-by="type"
        show-group-by
        height="85vh"
    >
      <template v-slot:group.header="{ group, items, toggle }">
        <td class="ma-2" @click="toggle" style="cursor: pointer">
          Type: <v-icon>{{ items.find(e => e.type === group).icon }}</v-icon>
          {{ group }} ({{ items.length }} / {{ player_moderation.length }})
        </td>
        <td></td>
      </template>
      <template v-slot:item.targetDisplayName="{ item }">
        <a @click="$refs.userDetails.fetchUser(item.targetUserId)">
          {{ item.targetDisplayName }}
        </a>
      </template>
    </v-data-table>

    <user-details ref="userDetails" :logged_in="logged_in"/>
  </div>
</template>

<script>
import * as moment from 'moment';
import UserDetails from "../UserDetails";

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
    setCreated(row) {
      row.created = moment(row.created).format('YYYY-MM-DD HH:mm:ss');
    }
  }
}
</script>

<style scoped>

</style>