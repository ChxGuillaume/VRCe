<template>
  <v-card
      class="mx-auto pt-4 overflow-y-auto"
      color="transparent"
      max-width="400"
      height="384"
      rounded="0"
      flat
  >
    <v-list-item>
      <v-select
          v-model="default_tab"
          :items="tabs"
          item-title="text"
          item-value="value"
          label="Default Tab"
          @update:model-value="saveDefaultTab"
      />
    </v-list-item>
    <v-list
        v-model:selected="settings"
        select-strategy="classic"
        lines="two"
        bg-color="transparent"
        @update:selected="saveSettings"
    >
      <v-list-item
          v-for="setting of setting_items"
          :key="setting.value"
          :value="setting.value"
          :title="setting.title"
          :subtitle="setting.subtitle"
      >
        <template v-slot:prepend="{ isSelected }">
          <v-list-item-action start>
            <v-checkbox-btn :model-value="isSelected" color="primary"/>
          </v-list-item-action>
        </template>
      </v-list-item>
    </v-list>
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
        opacity="0.9"
    >
      <v-card>
        <v-card-title class="text-headline-small">
          Are you sure?
        </v-card-title>
        <v-card-text class="pt-2">
          By clicking the <span class="text-red text-uppercase">Delete All</span> button you will delete all stored
          events.
          <br><br>
          Those events can't be recovered.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
              color="primary-darken-1"
              variant="text"
              @click="delete_data_dialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
              color="red-darken-1"
              variant="text"
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
import {DEFAULT_SETTINGS, getSettings, saveSettings} from '../../shared/storage';
import {MessageType, sendToBackground} from '../../shared/messages';

export default {
  name: 'SettingsTab',
  data() {
    return {
      settings: [],
      setting_items: [
        {
          value: 'notify_online',
          title: 'Notify on Friend Connect',
          subtitle: 'Get notified when a friend launch VRChat'
        },
        {
          value: 'notify_online_favorited',
          title: 'Notify on Favorite Friend Connect',
          subtitle: 'Get notified when a favorited friend launch VRChat'
        },
        {
          value: 'notify_notifications',
          title: 'Notify on Notifications',
          subtitle: 'Invite, Invite Request, Reply, Friend Request'
        }
      ],
      tabs: [
        {text: 'Friends', value: 'friends'},
        {text: 'Worlds', value: 'worlds'},
        {text: 'Events', value: 'events'}
      ],
      default_tab: '',
      delete_data_dialog: false,
    }
  },
  async mounted() {
    this.default_tab = localStorage.getItem('default_tab') || 'friends';

    const settings = await getSettings();
    this.settings = Object.keys(settings).filter(e => settings[e]);
  },
  methods: {
    saveSettings() {
      saveSettings(Object.fromEntries(
          Object.keys(DEFAULT_SETTINGS).map(key => [key, this.settings.includes(key)])
      ));
    },
    clearEvents() {
      this.delete_data_dialog = false;

      sendToBackground(MessageType.CLEAR_EVENTS);
    },
    saveDefaultTab() {
      localStorage.setItem('default_tab', this.default_tab);
    }
  }
}
</script>
