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
        <span class="caption">Default Tab</span>
        <v-select
            v-model="default_tab"
            :items="tabs"
            label="Default Tab"
            hide-details solo
            background-color="grey darken-3"
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
    <v-row class="ma-0">
      <v-col cols="12" class="d-flex justify-center">
        <v-btn color="red" @click="delete_data_dialog = true">
          Clear Data
        </v-btn>
      </v-col>
    </v-row>

    <v-dialog
        v-model="delete_data_dialog"
        persistent
        max-width="290"
        overlay-opacity="0.9"
    >
      <v-card>
        <v-card-title class="text-h5">
          Are you sure?
        </v-card-title>
        <v-card-text class="pt-2">
          By clicking the <span class="red--text text-uppercase">Delete All</span> button you will delete all stored
          events.
          <br><br>
          Those events can't be recovered.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
              color="primary darken-1"
              text
              @click="delete_data_dialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
              color="red darken-1"
              text
              @click="clearEvents"
          >
            Delete All
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script>
export default {
  name: 'SettingsTab',
  data() {
    return {
      settings: [],
      tabs: [
        {text: 'Friends', value: 'friends'},
        {text: 'Worlds', value: 'worlds'},
        {text: 'Events', value: 'events'}
      ],
      default_tab: '',
      port: null,
      delete_data_dialog: false,
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
      this.port.postMessage({
        type: 'update_settings',
        settings: Object.fromEntries(this.settings.map(e => [e, true]))
      });
    },
    clearEvents() {
      this.delete_data_dialog = false;

      this.port.postMessage({
        type: 'clear_events'
      });
    },
    saveDefaultTab() {
      localStorage.setItem('default_tab', this.default_tab);
    }
  }
}
</script>

<style scoped>

</style>
