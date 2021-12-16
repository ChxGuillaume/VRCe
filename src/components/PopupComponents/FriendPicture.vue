<template>
  <v-card width="100" color="transparent" class="py-2 d-flex justify-center" flat>
    <v-badge
        :value="friend.favorited"
        color="orange darken-1"
        icon="star"
        overlap
    >
      <v-img
          class="rounded"
          :src="friend.profilePicOverride ? friend.profilePicOverride : friend.currentAvatarThumbnailImageUrl"
          height="50"
          width="67"
      >
        <template v-slot:placeholder>
          <v-row
              class="fill-height ma-0"
              align="center"
              justify="center"
          >
            <v-progress-circular
                indeterminate
                color="grey lighten-5"
            />
          </v-row>
        </template>
      </v-img>
    </v-badge>
  </v-card>
</template>

<script>
export default {
  props: {
    friend: {
      type: Object,
      required: true,
    },
  },
}
</script>

<style scoped>

</style>
