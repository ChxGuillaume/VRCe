<template>
  <v-card
      class="mx-auto overflow-y-auto"
      color="transparent"
      max-width="400"
      height="384"
      tile
  >
    <v-row class="mx-0">
      <v-col>
        <v-checkbox
            v-model="settings.notify_online"
            label="Notify on Friend Connect"
            @change="saveSettings"
        />
      </v-col>
    </v-row>
  </v-card>
</template>

<script>
export default {
  name: 'SettingsTab',
  data () {
    return {
      settings: {
        notify_online: false
      },
      port: null
    }
  },
  mounted() {
    this.port = chrome.extension.connect({
      name: 'popup-settings'
    });

    this.port.onMessage.addListener((msg) => {
      if (msg.type === 'settings') {
        this.settings = msg.settings;
      }
    });
  },
  methods: {
    saveSettings() {
      this.port.postMessage(this.settings);
    }
  }
}
</script>

<style scoped>

</style>