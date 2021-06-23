<template>
  <v-card
      class="mx-auto pt-4 overflow-y-auto"
      color="transparent"
      max-width="400"
      height="384"
      tile
  >
    <v-list-item
        v-for="[index, instance] of Object.entries(instances)"
        :key="instance.location"
        class="pa-0 d-block"
        :class="{ 'mb-6': instances.length !== (parseInt(index) + 1) }"
    >
      <v-card>
        <div class="d-flex justify-space-around">
          <v-img :src="instance.world.thumbnailImageUrl" max-width="100" height="75"/>

          <v-row class="mx-0 align-center">
            <v-col cols="12" class="text-center">
              <h3 class="subtitle-1">{{ instance.world.name }}</h3>
              <h4 v-if="instance.location !== 'private'" class="caption">
                Friends in instance:
                {{ instance.friends.length }}
                <span v-if="instance.instance"> / {{ instance.instance[1] }}</span>
              </h4>
            </v-col>
          </v-row>
        </div>

        <v-list-item
            v-for="friend of instance.friends"
            :key="friend.id"
            class="px-0"
            :style="{ background: friend.status.color + '33' }"
        >
          <v-card width="100" color="transparent" class="py-2" flat>
            <v-img class="mx-auto rounded" :src="friend.currentAvatarThumbnailImageUrl" height="50" width="67"/>
          </v-card>

          <v-list-item-content>
            <v-row class="mx-0 align-center">
              <v-col cols="12" class="text-center">
                <h3 class="subtitle-1">{{ friend.displayName }}</h3>
              </v-col>
            </v-row>
          </v-list-item-content>
        </v-list-item>
      </v-card>
    </v-list-item>
  </v-card>
</template>

<script>
export default {
  name: 'WorldsTab',
  props: {
    friends: {
      type: Array,
      required: true
    },
    worlds: {
      type: Array,
      required: true
    }
  },
  computed: {
    instances() {
      const instances = {};

      this.friends
          .filter(e => !['', 'offline'].includes(e.location))
          .forEach(friend => {
            const splicedLocation = friend.location.split(':');

            const world = this.worlds.find(e => e.id === splicedLocation[0]);

            if (world) {
              if (!instances[world.id])
                instances[friend.location] = {
                  location: friend.location,
                  instance: world.instances.find(e => e[0] === splicedLocation[1]),
                  world: world,
                  friends: [friend]
                };
              else
                instances[world.id].friends.push(friend);
            } else {
              if (!instances['private'])
                instances[friend.location] = {
                  location: 'private',
                  world: {
                    name: 'Private',
                    thumbnailImageUrl: 'https://assets.vrchat.com/www/images/default_private_image.png',
                  },
                  friends: [friend]
                };
              else
                instances['private'].friends.push(friend);
            }
          });

      return Object.values(instances).sort((a) => {
        return a.location === 'private' ? 1 : -1;
      });
    }
  }
}
</script>

<style scoped>

</style>