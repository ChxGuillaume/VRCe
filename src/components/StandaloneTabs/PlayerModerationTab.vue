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
              :variant="type_filter.includes(type.type) ? 'flat' : 'outlined'"
              :value="type.type"
          >
            <v-icon start>
              {{ type.icon }}
            </v-icon>
            {{ type.icon_text }} ({{ type.count }})
          </v-chip>
        </v-chip-group>
        <v-text-field
            v-model="name_filter"
            hide-details
            clearable
            variant="outlined"
            rounded
            density="compact"
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
        @click="openUser(user.targetUserId)"

      >
        <v-row density="compact">
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

<script lang="ts">
import {defineComponent} from 'vue';
import dayjs from 'dayjs';
import UserDetails from '../UserDetails.vue';
import {getPlayerModerations} from '../../shared/vrchat-api';
import type {PlayerModeration} from '../../types/vrchat';

interface ModerationRow extends PlayerModeration {
  icon: string;
  icon_text: string;
}

interface ModerationTypeStat {
  type: string;
  icon: string;
  icon_text: string;
  count: number;
}

interface PlayerModerationData {
  loading: boolean;
  type_filter: string[];
  name_filter: string | null;
  player_moderation: ModerationRow[];
}

// Icon and label of each moderation type, unknown types fall back to their raw name.
const TYPE_DISPLAY: Record<string, {icon_text: string; icon: string}> = {
  mute: {icon_text: 'Mute', icon: 'volume_off'},
  unmute: {icon_text: 'Unmute', icon: 'volume_up'},
  muteChat: {icon_text: 'Mute Chat', icon: 'speaker_notes_off'},
  unmuteChat: {icon_text: 'Unmute Chat', icon: 'chat'},
  interactOff: {icon_text: 'Interact Off', icon: 'do_not_touch'},
  interactOn: {icon_text: 'Interact On', icon: 'touch_app'},
  showAvatar: {icon_text: 'Show Avatar', icon: 'visibility'},
  hideAvatar: {icon_text: 'Hide Avatar', icon: 'visibility_off'},
  block: {icon_text: 'Block', icon: 'block'}
};

const TYPE_COLORS: Record<string, string> = {
  mute: 'brown',
  unmute: 'blue',
  showAvatar: 'green',
  hideAvatar: 'orange',
  block: 'red',
  muteChat: 'deep-orange',
  unmuteChat: 'light-blue',
  interactOff: 'purple',
  interactOn: 'teal'
};

function toModerationRow(moderation: PlayerModeration): ModerationRow {
  return {
    ...moderation,
    ...(TYPE_DISPLAY[moderation.type] || {icon_text: moderation.type, icon: 'help_outline'}),
    created: dayjs(moderation.created).format('YYYY-MM-DD HH:mm:ss')
  };
}

export default defineComponent({
  name: 'PlayerModerationTab',
  components: {UserDetails},
  props: {
    logged_in: {
      type: Boolean,
      required: true
    }
  },
  data(): PlayerModerationData {
    return {
      loading: true,
      type_filter: [],
      name_filter: '',
      player_moderation: []
    }
  },
  computed: {
    playerModerationOrdered(): ModerationRow[] {
      return [...this.player_moderation].sort((a, b) => b.created.localeCompare(a.created))
    },
    playerModerationFiltered(): ModerationRow[] {
      const nameFilter = (this.name_filter || '').toLowerCase();

      return this.playerModerationOrdered
          .filter(e =>
              (!this.type_filter.length || this.type_filter.includes(e.type))
              && (e.targetDisplayName || '').toLowerCase().includes(nameFilter)
          )
    },
    playerModerationTypes(): ModerationTypeStat[] {
      const types = new Map<string, ModerationTypeStat>();

      this.player_moderation.forEach(pm => {
        const stat = types.get(pm.type);

        if (stat) stat.count++;
        else types.set(pm.type, {type: pm.type, icon: pm.icon, icon_text: pm.icon_text, count: 1});
      });

      return [...types.values()];
    }
  },
  mounted() {
    this.getPlayerModeration();
  },
  methods: {
    getPlayerModeration(): void {
      getPlayerModerations()
          .then(data => {
            this.player_moderation = data.map(toModerationRow);
          })
          .catch(e => console.warn('Could not fetch player moderations', e))
          .finally(() => this.loading = false);
    },
    openUser(userId: string): void {
      (this.$refs.userDetails as InstanceType<typeof UserDetails>).fetchUser(userId);
    },
    getTypeColor(type: string): string {
      return TYPE_COLORS[type] || 'grey';
    }
  }
})
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
