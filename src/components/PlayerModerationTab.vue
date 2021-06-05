<template>
  <div>
    <v-simple-table>
      <template v-slot:default>
        <thead>
        <tr>
          <th class="text-left">
            User
          </th>
          <th class="text-left">
            Type
          </th>
          <th class="text-left">
            Date
          </th>
        </tr>
        </thead>
        <tbody>
        <tr
            v-for="item in playerModerationOrdered"
            :key="item.name"
        >
          <td>{{ item.targetDisplayName }}</td>
          <td>
            <v-tooltip v-if="item.icon" right color="primary">
              <template v-slot:activator="{on, attrs}">
                <v-icon v-bind="attrs" v-on="on">{{ item.icon }}</v-icon>
              </template>
              <span>{{ item.icon_text }}</span>
            </v-tooltip>
            <span v-else>{{ item.type }}</span>
          </td>
          <td>{{ item.created }}</td>
        </tr>
        </tbody>
      </template>
    </v-simple-table>
  </div>
</template>

<script>
import * as moment from "moment";

export default {
  name: "PlayerModerationTab",
  data() {
    return {
      player_moderation: [],
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
            data.forEach(e => this.updateRow(e));
            console.log(data);
            this.player_moderation = data;
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