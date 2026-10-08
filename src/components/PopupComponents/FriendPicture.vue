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

<script>
import {userImageUrl} from '../../shared/vrchat-api';

export default {
  props: {
    friend: {
      type: Object,
      required: true,
    },
  },
  methods: {
    userImageUrl
  }
}
</script>
