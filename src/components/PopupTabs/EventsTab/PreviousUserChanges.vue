<template>
  <v-card tile elevation="0">
    <v-row class="ma-0">
      <v-col v-if="previous_user_changes.currentAvatarThumbnailImageUrl" cols="12"
             class="d-flex align-center justify-space-around">
        <h4 class="text-center text-subtitle-1 grey--text">Avatar<br>Change</h4>
        <div class="d-flex align-center justify-space-around px250">
          <v-img
              class="rounded" :src="previous_user_changes.currentAvatarThumbnailImageUrl"
              max-width="100" height="75" contain
          />
          <v-img
              class="rounded" :src="user.currentAvatarThumbnailImageUrl"
              max-width="100" height="75" contain
          />
        </div>
      </v-col>
      <v-col v-if="previous_user_changes.status" cols="12" class="d-flex align-center justify-space-around">
        <h4 class="text-center text-subtitle-1 grey--text">Status<br>Change</h4>
        <div class="d-flex align-center justify-space-around px250">
          <v-chip class="mx-2" :color="getStatusColor(previous_user_changes.status)">
            {{ getStatusText(previous_user_changes.status) }}
          </v-chip>
          <v-chip class="mx-2" :color="getStatusColor(user.status)">
            {{ getStatusText(user.status) }}
          </v-chip>
        </div>
      </v-col>
      <v-col v-if="previous_user_changes.statusDescription" cols="12" class="d-flex align-center justify-space-around">
        <h4 class="text-center text-subtitle-1 grey--text">Status<br>Change</h4>
        <div class="d-flex align-center justify-space-around px250">
          <h5 class="mx-2 subtitle-2 text-center" style="max-width: 120px">{{
              previous_user_changes.statusDescription
            }}</h5>
          <h5 class="mx-2 subtitle-2 text-center" style="max-width: 120px">{{ user.statusDescription }}</h5>
        </div>
      </v-col>
      <v-col v-if="previous_user_changes.bio" cols="12" class="d-flex align-center justify-space-around">
        <h4 class="text-center text-subtitle-1 grey--text">Bio<br>Change</h4>
        <div class="d-flex align-center justify-space-around px250">
          <h5 class="mx-2 subtitle-2 text-center" style="max-width: 120px">{{ previous_user_changes.bio }}</h5>
          <h5 class="mx-2 subtitle-2 text-center" style="max-width: 120px">{{ user.bio }}</h5>
        </div>
      </v-col>
<!--      <v-col cols="12">-->
<!--        {{ previous_user_changes }}-->
<!--      </v-col>-->
    </v-row>
  </v-card>
</template>

<script>
export default {
  name: 'PreviousUserChanges',
  props: {
    user: {
      type: Object,
      required: true
    },
    previous_user: {
      type: Object,
      required: true
    },
    previous_user_changes: {
      type: Object,
      required: true
    }
  },
  methods: {
    getStatusText(status) {
      switch (status) {
        case 'join me':
          return 'Join Me';
        case 'active':
          return 'Online';
        case 'ask me':
          return 'Ask Me';
        case 'busy':
          return 'Busy';
        case 'offline':
          return 'Offline';
        default:
          return status;
      }
    },
    getStatusColor(status) {
      switch (status) {
        case 'join me':
          return '#42caff';
        case 'active':
          return '#60ad5e';
        case 'ask me':
          return '#e88134';
        case 'busy':
          return '#5b0b0b';
        case 'offline':
          return '#CCCCCC';
        default:
          return '#CCCCCC';
      }
    }
  }
}
</script>

<style scoped>
.px250 {
  width: 250px;
}
</style>