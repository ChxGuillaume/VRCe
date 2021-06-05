<template>
  <div>
    <v-row>
      <v-col cols="12" class="text-center">
        <div v-if="user_data.userIcon" class="d-inline-block rounded pa-1 mx-2"
             :style="{ background: user_data.rank ? user_data.rank.color : '' }">
          <v-img
              :src="user_data.userIcon"
              class="rounded"
              contain
              width="150"
              height="150"
          />
        </div>
        <div class="d-inline-block rounded pa-1 mx-2"
             :style="{ background: user_data.rank ? user_data.rank.color : '' }">
          <v-img
              :src="user_data.currentAvatarThumbnailImageUrl"
              class="rounded"
              contain
              width="200"
              min-height="150"
          />
        </div>
        <h1 class="mt-2">{{ user_data.displayName }}</h1>
      </v-col>
    </v-row>
  </div>
</template>

<script>
export default {
  name: 'PersonalInfosTab',
  props: {
    user_data: {
      type: Object,
      required: true
    }
  }
}
</script>

<style scoped>

</style>
