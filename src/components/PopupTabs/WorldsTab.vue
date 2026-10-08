<template>
  <v-card
      class="mx-auto pt-4 overflow-y-auto"
      color="transparent"
      max-width="100%"
      height="max(calc(100vh - 216px), 384px)"
      rounded="0"
      flat
  >
    <h1 v-if="!instances.length" class="mt-16 text-headline-small text-center">
      No friends Online
    </h1>

    <div
        v-for="[index, instance] of Object.entries(instances)"
        :key="instance.location"
        class="pa-0"
        :class="{ 'mb-6': instances.length !== (parseInt(index) + 1) }"
    >
      <v-card>
        <div class="d-flex justify-space-around">
          <v-img :src="instance.world.thumbnailImageUrl" max-width="100" width="100" height="75" cover>
            <template v-slot:placeholder>
              <v-row class="fill-height ma-0 align-center justify-center">
                <v-progress-circular
                    indeterminate
                    color="grey-lighten-5"
                />
              </v-row>
            </template>
          </v-img>

          <v-row class="mx-0 align-center">
            <v-col cols="12" class="pr-7 text-center" style="position: relative">
              <h3 class="text-body-large" style="width:240px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">
                {{ instance.world.name }}
              </h3>
              <h4 class="text-body-small">
                <span v-if="instance.location !== 'private'">Friends in instance:</span>
                <span v-else>Friends in private:</span>
                {{ instance.friends.length }}
                <span v-if="instance.instance_data"> / {{ instance.instance_data.n_users }}</span>
                <span v-if="instance.instance_type" class="text-grey font-italic">
                  ({{ instance.instance_type }})
                </span>
                <span v-if="instance.instance_region" class="text-grey font-italic">
                  ({{ instance.instance_region }})
                </span>
              </h4>

              <v-tooltip v-if="instance.location !== 'private'" content-class="bg-grey-darken-2" location="left">
                <template v-slot:activator="{ props }">
                  <v-btn
                      icon size="small" variant="text" position="absolute"
                      color="grey-darken-2" style="top:6px;right:6px;"
                      @click="sendInviteToInstance(instance)"
                      v-bind="props"
                  >
                    <v-icon size="small">add_location_alt</v-icon>
                  </v-btn>
                </template>
                <span>Send me invite to Instance</span>
              </v-tooltip>

              <v-tooltip content-class="bg-grey-darken-2" location="left">
                <template v-slot:activator="{ props }">
                  <v-btn
                      icon size="small" variant="text" position="absolute"
                      color="grey-darken-2" style="bottom:6px;right:6px;"
                      @click="changeShowFriendsState(instance)"
                      v-bind="props"
                  >
                    <v-icon size="small">{{ isShowingFriends(instance) ? 'remove' : 'add' }}</v-icon>
                  </v-btn>
                </template>
                <span>{{ isShowingFriends(instance) ? 'Reduce' : 'Expand' }} Friends list</span>
              </v-tooltip>
            </v-col>
          </v-row>
        </div>

        <v-expand-transition>
          <div v-if="isShowingFriends(instance)">
            <v-list-item
                v-for="friend of instance.friends"
                :key="friend.id"
                class="px-0"
                :style="{ background: friend.status.color + '33' }"
                @click="userDetails(friend.id)"
                @click.right.prevent="userMenu($event as MouseEvent, friend)"
            >
              <div class="d-flex align-center">
                <friend-picture :friend="friend" />

                <v-row class="mx-0 align-center">
                  <v-col cols="12" class="d-flex align-center justify-center">
                    <h3 class="text-body-large d-inline-block">{{ friend.displayName }}</h3>
                    <v-tooltip v-if="instance.instance_creator === friend.id" location="bottom" content-class="bg-yellow-darken-2">
                      <template v-slot:activator="{ props }">
                        <v-icon color="yellow-darken-2" end v-bind="props">stars</v-icon>
                      </template>
                      <span class="text-black">Instance Owner</span>
                    </v-tooltip>
                  </v-col>
                </v-row>
              </div>
            </v-list-item>
          </div>
        </v-expand-transition>
      </v-card>
    </div>

    <v-snackbar
        v-model="invite_sent"
        :timeout="3000"
        location="bottom" variant="text" color="primary"
        transition="slide-y-reverse-transition" style="bottom:56px;"
    >
      <v-icon color="primary" start>add_location_alt</v-icon>
      Invite Sent.
    </v-snackbar>
  </v-card>
</template>

<script lang="ts">
import {defineComponent, type PropType} from 'vue';
import FriendPicture from '../PopupComponents/FriendPicture.vue';
import {getInstance, inviteMyselfTo, type UserImageSource} from '../../shared/vrchat-api';
import type {Instance} from '../../types/vrchat';
import type {StatusBadge} from '../../types/view';

// Only the fields of the popup's friends the tab reads.
interface WorldsFriend extends UserImageSource {
  id: string;
  displayName: string;
  location: string;
  status: StatusBadge;
  favorited?: boolean;
}

// Only the fields of the popup's worlds the tab reads.
interface WorldsWorld {
  id: string;
  name: string;
  thumbnailImageUrl?: string;
}

interface WorldInstance {
  location: string;
  instance_data?: Instance;
  instance_type?: string;
  instance_region?: string;
  instance_creator?: string;
  world: Omit<WorldsWorld, 'id'>;
  friends: WorldsFriend[];
  show_friends: boolean;
}

export default defineComponent({
  name: 'WorldsTab',
  emits: {
    'user-details': (friendId: string) => !!friendId,
    'user-menu': (payload: {$event: MouseEvent; friend: WorldsFriend}) => !!payload.friend
  },
  components: {FriendPicture},
  props: {
    friends: {
      type: Array as PropType<WorldsFriend[]>,
      required: true
    },
    worlds: {
      type: Array as PropType<WorldsWorld[]>,
      required: true
    }
  },
  data() {
    return {
      instances_data: [] as Instance[],
      instances_data_fetched: [] as string[],
      // Friends list visibility toggled by the user, by instance location.
      toggled_instances: {} as Record<string, boolean>,
      invite_sent: false
    }
  },
  computed: {
    instances(): WorldInstance[] {
      const instances: Record<string, WorldInstance> = {};

      this.friends
          .filter(e => !['', 'offline'].includes(e.location))
          .forEach(friend => {
            const splicedLocation = friend.location.split(':');

            const world = this.worlds.find(e => e.id === splicedLocation[0]);

            if (world) {
              const instance_creator = friend.location.match(/(~hidden|~friends)\((.*?)\)/)?.[2] ?? '';
              const instance = instances[friend.location];

              if (!instance && friend.location !== 'private') {
                this.fetchInstance(friend.location);

                instances[friend.location] = {
                  location: friend.location,
                  instance_data: this.instances_data.find(e => e.id === friend.location),
                  instance_type: this.getLocationType(friend.location),
                  instance_region: this.getLocationRegion(friend.location),
                  instance_creator: instance_creator,
                  world: world,
                  friends: [friend],
                  show_friends: true,
                };
              } else instance?.friends.push(friend);
            } else {
              const privateInstance = instances['private'];

              if (!privateInstance)
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
                privateInstance.friends.push(friend);
            }
          });

      const instances_values = Object.values(instances);

      if (instances_values.length === 1)
        instances_values[0]!.show_friends = true;

      const instances_array = instances_values.sort((a) => {
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
    fetchInstance(location: string): void {
      if (!this.instances_data_fetched.find(e => e === location)) {
        this.instances_data_fetched.push(location);

        getInstance(location)
            .then(data => {
              this.instances_data.push(data);
            })
            .catch(e => console.error(`Could not fetch instance ${location}`, e));
      }
    },
    sendInviteToInstance(instance: WorldInstance): void {
      inviteMyselfTo(instance.location)
          .then(() => this.invite_sent = true)
          .catch(e => console.error(`Could not invite myself to ${instance.location}`, e));
    },
    isShowingFriends(instance: WorldInstance): boolean {
      return this.toggled_instances[instance.location] ?? instance.show_friends;
    },
    changeShowFriendsState(instance: WorldInstance): void {
      this.toggled_instances[instance.location] = !this.isShowingFriends(instance);
    },
    getLocationRegion(location: string): string {
      const instanceId = location.split(':')[1] ?? '';

      if (instanceId.includes('~region(eu)'))
        return 'eu';
      else if (instanceId.includes('~region(jp)'))
        return 'jp';
      else
        return 'us';
    },
    getLocationType(location: string): string {
      const instanceId = location.split(':')[1] ?? '';

      if (instanceId.includes('~hidden'))
        return 'friends+';
      else if (instanceId.includes('~friends'))
        return 'friends';
      else
        return 'public';
    },
    userDetails(friend_id: string): void {
      this.$emit('user-details', friend_id)
    },
    userMenu($event: MouseEvent, friend: WorldsFriend): void {
      this.$emit('user-menu', {$event, friend})
    }
  }
})
</script>

<style scoped>

</style>
