<template>
  <v-card
      class="mx-auto pt-4 overflow-y-auto"
      color="transparent"
      max-width="400"
      height="384"
      tile
  >
    <v-list-item>
      <v-list-item-content>
        <v-select
            v-model="default_tab"
            :items="tabs"
            label="Default Tab"
            @change="saveDefaultTab"
        />
      </v-list-item-content>
    </v-list-item>
    <v-list-item-group v-model="settings" multiple @change="saveSettings">
      <v-list-item value="notify_online">
        <template v-slot:default="{ active }">
          <v-list-item-action>
            <v-checkbox
                :input-value="active"
                color="primary"
            />
          </v-list-item-action>

          <v-list-item-content>
            <v-list-item-title>Notify on Friend Connect</v-list-item-title>
            <v-list-item-subtitle>Get notified when a friend launch VRChat</v-list-item-subtitle>
          </v-list-item-content>
        </template>
      </v-list-item>
      <v-list-item value="notify_online_favorited">
        <template v-slot:default="{ active }">
          <v-list-item-action>
            <v-checkbox
                :input-value="active"
                color="primary"
            />
          </v-list-item-action>

          <v-list-item-content>
            <v-list-item-title>Notify on Favorite Friend Connect</v-list-item-title>
            <v-list-item-subtitle>Get notified when a favorited friend launch VRChat</v-list-item-subtitle>
          </v-list-item-content>
        </template>
      </v-list-item>
      <v-list-item value="notify_notifications">
        <template v-slot:default="{ active }">
          <v-list-item-action>
            <v-checkbox
                :input-value="active"
                color="primary"
            />
          </v-list-item-action>

          <v-list-item-content>
            <v-list-item-title>Notify on Notifications</v-list-item-title>
            <v-list-item-subtitle>Invite, Invite Request, Reply, Friend Request</v-list-item-subtitle>
          </v-list-item-content>
        </template>
      </v-list-item>
    </v-list-item-group>
  </v-card>
</template>

<script>
export default {
  name: 'SettingsTab',
  data() {
    return {
      settings: [],
      tabs: [
        { text: 'Friends', value: 'friends' },
        { text: 'Worlds', value: 'worlds' },
        { text: 'Events', value: 'events' }
      ],
      default_tab: '',
      port: null
    }
  },
  mounted() {
    this.port = (browser.runtime || chrome.extension).connect({
      name: 'popup-settings'
    });

    this.port.onMessage.addListener((msg) => {
      if (msg.type === 'settings') {
        this.settings = Object.keys(msg.settings).filter(e => msg.settings[e]);
      }
    });

    this.default_tab = localStorage.getItem('default_tab') || 'friends';
  },
  methods: {
    saveSettings() {
      this.port.postMessage(Object.fromEntries(this.settings.map(e => [e, true])));
    },
    saveDefaultTab() {
      localStorage.setItem('default_tab', this.default_tab);
    }
  }
}
</script>

<style scoped>

</style>
