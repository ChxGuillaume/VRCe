<template>
  <v-card width="100" color="transparent" class="py-2 d-flex justify-center" flat>
    <v-badge
        :model-value="!!friend.favorited"
        color="orange-darken-1"
        icon="star"
    >
      <v-img
          class="rounded"
          :src="userImageUrl(friend)"
          height="50"
          width="67"
          cover
      >
        <template v-slot:placeholder>
          <div class="d-flex fill-height align-center justify-center">
            <v-progress-circular
                indeterminate
                color="grey-lighten-5"
            />
          </div>
        </template>
      </v-img>
    </v-badge>
  </v-card>
</template>

<script lang="ts">
import {defineComponent, type PropType} from 'vue';
import {userImageUrl, type UserImageSource} from '../../shared/vrchat-api';

// Any user object with a picture, optionally flagged as a favorite friend.
export type FriendPictureUser = UserImageSource & {favorited?: boolean};

export default defineComponent({
  props: {
    friend: {
      type: Object as PropType<FriendPictureUser>,
      required: true,
    },
  },
  methods: {
    userImageUrl
  }
})
</script>
