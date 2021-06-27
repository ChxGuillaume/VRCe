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
          <v-img :src="instance.world.thumbnailImageUrl" max-width="100" height="75">
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

          <v-row class="mx-0 align-center">
            <v-col cols="12" class="pr-7 text-center" style="position: relative">
              <h3 class="subtitle-1" style="width:240px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">
                {{ instance.world.name }}</h3>
              <h4 class="caption">
                <span v-if="instance.location !== 'private'">Friends in instance:</span>
                <span v-else>Friends in private:</span>
                {{ instance.friends.length }}
                <span v-if="instance.instance"> / {{ instance.instance[1] }}</span>
                <span v-if="instance.instance_type" class="grey--text font-italic">
                  ({{ instance.instance_type }})
                </span>
                <span v-if="instance.instance_region" class="grey--text font-italic">
                  ({{ instance.instance_region }})
                </span>
              </h4>

              <v-btn icon absolute small
                     color="grey darken-2" style="bottom:6px;right:6px;"
                     @click="changeShowFriendsState(instance)"
              >
                <v-icon small>{{ instance.show_friends ? 'remove' : 'add' }}</v-icon>
              </v-btn>
            </v-col>
          </v-row>
        </div>

        <v-expand-transition>
          <div v-if="instance.show_friends">
            <v-list-item
                v-for="friend of instance.friends"
                :key="friend.id"
                class="px-0"
                :style="{ background: friend.status.color + '33' }"
                @click="userDetails(friend.id)"
            >
              <v-card width="100" color="transparent" class="py-2" flat>
                <v-img class="mx-auto rounded" :src="friend.currentAvatarThumbnailImageUrl" height="50" width="67">
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
              </v-card>

              <v-list-item-content>
                <v-row class="mx-0 align-center">
                  <v-col cols="12" class="d-flex align-center justify-center">
                    <h3 class="subtitle-1 d-inline-block">{{ friend.displayName }}</h3>
                    <v-tooltip v-if="instance.instance_creator === friend.id" bottom color="yellow darken-2">
                      <template v-slot:activator="{ on, attrs }">
                        <v-icon color="yellow darken-2" right v-bind="attrs" v-on="on">stars</v-icon>
                      </template>
                      <span class="black--text">Instance Owner</span>
                    </v-tooltip>
                  </v-col>
                </v-row>
              </v-list-item-content>
            </v-list-item>
          </div>
        </v-expand-transition>

        <div v-if="refresh_friends"/>
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
  data() {
    return {
      refresh_friends: true
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
              let instance_creator = friend.location.match(/(~hidden|~friends)\((.*?)\)/);
              instance_creator = instance_creator ? instance_creator[2] : '';

              if (!instances[friend.location] && friend.location !== 'private')
                instances[friend.location] = {
                  location: friend.location,
                  instance: world.instances.find(e => e[0] === splicedLocation[1]),
                  instance_type: this.getLocationType(friend.location),
                  instance_region: this.getLocationRegion(friend.location),
                  instance_creator: instance_creator,
                  world: world,
                  friends: [friend],
                  show_friends: true,
                };
              else
                instances[friend.location].friends.push(friend);
            } else {
              if (!instances['private'])
                instances['private'] = {
                  location: 'private',
                  world: {
                    name: 'Private',
                    thumbnailImageUrl: 'https://assets.vrchat.com/www/images/default_private_image.png',
                  },
                  friends: [friend],
                  show_friends: false,
                };
              else
                instances['private'].friends.push(friend);
            }
          });

      const instances_array = Object.values(instances).sort((a) => {
        return a.location === 'private' ? 1 : -1;
      });

      instances_array.forEach(instance => {
        instance.friends.sort((a, b) => {
          const index = b.status.power - a.status.power;
          if (index === 0)
            return a.displayName.localeCompare(b.displayName);
          else
            return index;
        });
      })

      return instances_array;
    }
  },
  methods: {
    changeShowFriendsState(instance) {
      instance.show_friends = !instance.show_friends;

      this.refreshFriends();
    },
    getLocationRegion(location) {
      const splicedLocation = location.split(':');

      if (splicedLocation[1].includes('~region(eu)'))
        return 'eu';
      else if (splicedLocation[1].includes('~region(jp)'))
        return 'jp';
      else
        return 'us';
    },
    getLocationType(location) {
      const splicedLocation = location.split(':');

      if (splicedLocation[1].includes('~hidden'))
        return 'friends+';
      else if (splicedLocation[1].includes('~friends'))
        return 'friends';
      else
        return 'public';
    },
    userDetails(friend_id) {
      this.$emit('user-details', friend_id)
    },
    refreshFriends() {
      this.refresh_friends = false;

      this.$nextTick(() => {
        this.refresh_friends = true;
      })
    }
  }
}
</script>

<style scoped>

</style>