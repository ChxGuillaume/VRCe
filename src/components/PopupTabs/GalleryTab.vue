<template>
  <v-card
      class="mx-auto pt-4 overflow-y-auto"
      color="transparent"
      max-width="100%"
      height="max(calc(100vh - 216px), 384px)"
      rounded="0"
      flat
  >
    <v-row class="mx-0">
      <v-col cols="12" class="d-flex justify-center align-center">
        <v-btn icon size="small" variant="text" color="grey-darken-1" class="mr-1" @click="show_icons = !show_icons">
          <v-icon>{{ show_icons ? 'remove' : 'add' }}</v-icon>
        </v-btn>
        <h3 class="mr-5 text-center">Icons ({{ Icons.length }} / 64)</h3>
        <v-btn color="primary" size="small" href="https://vrchat.com/home/gallery" target="_blank">
          Upload
        </v-btn>
      </v-col>
    </v-row>
    <v-expand-transition>
      <v-row v-if="show_icons" class="mx-0">
        <v-col
            v-for="icon of Icons"
            :key="icon.id"
            cols="3"
            sm="2"
            class="text-center"
            style="position: relative; cursor: pointer"
        >
          <div
              class="d-inline-block pa-1 rounded-circle"
              :class="{ 'bg-green-darken-2': icon.current, 'bg-grey-darken-2': !icon.current }"
              style="position: relative; cursor: pointer"
              @click="changeIcon($event, icon.url)"
          >
            <v-btn icon size="x-small" position="absolute" class="deleteBtn" color="red" @click.stop="delete_file_id = icon.id">
              <v-icon size="small">delete</v-icon>
            </v-btn>
            <v-img class="rounded-circle" :src="icon.url" width="68" height="68" cover>
              <template v-slot:placeholder>
                <v-row class="fill-height ma-0 align-center justify-center">
                  <v-progress-circular
                      indeterminate
                      color="grey-lighten-5"
                  />
                </v-row>
              </template>
            </v-img>
          </div>
        </v-col>
      </v-row>
    </v-expand-transition>
    <v-row class="mx-0">
      <v-col cols="12" class="d-flex justify-center align-center">
        <v-btn icon size="small" variant="text" color="grey-darken-1" class="mr-1" @click="show_pictures = !show_pictures">
          <v-icon>{{ show_pictures ? 'remove' : 'add' }}</v-icon>
        </v-btn>
        <h3 class="mr-5 text-center">Pictures ({{ Pictures.length }} / 64)</h3>
        <v-btn color="primary" size="small" href="https://vrchat.com/home/gallery" target="_blank">
          Upload
        </v-btn>
      </v-col>
    </v-row>
    <v-expand-transition>
      <v-row v-if="show_pictures" class="mx-0">
        <v-col
            v-for="picture of Pictures"
            :key="picture.id"
            cols="6"
            sm="4"
            md="3"
            class="text-center"
            style="position: relative"
        >
          <div
              class="d-inline-block pa-1 rounded bg-grey-darken-2"
              style="position: relative"
          >
            <v-btn icon size="x-small" position="absolute" class="deleteBtn" color="red" @click.stop="delete_file_id = picture.id">
              <v-icon size="small">delete</v-icon>
            </v-btn>
            <v-img class="rounded" :src="picture.url" width="162" height="91" cover>
              <template v-slot:placeholder>
                <v-row class="fill-height ma-0 align-center justify-center">
                  <v-progress-circular
                      indeterminate
                      color="grey-lighten-5"
                  />
                </v-row>
              </template>
            </v-img>
          </div>
        </v-col>
      </v-row>
    </v-expand-transition>

    <v-dialog
        max-width="220"
        :model-value="!!delete_file_id"
        @update:model-value="value => { if (!value) delete_file_id = '' }"
    >
      <v-card>
        <v-card-title class="text-headline-small">
          Are you sure ?
        </v-card-title>
        <v-card-actions>
          <v-spacer/>
          <v-btn
              color="red-darken-1"
              variant="text"
              @click="delete_file_id = ''"
          >
            No
          </v-btn>
          <v-btn
              color="green-darken-1"
              variant="text"
              @click="deleteFile"
          >
            Yes
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script lang="ts">
import {defineComponent, type PropType} from 'vue';
import {deleteFile, getFiles, getProfile, updateProfile} from '../../shared/vrchat-api';
import type {VRChatFile} from '../../types/vrchat';

// Only the fields of the popup's current user the tab reads.
interface GalleryUser {
  id: string;
}

type GalleryFile = VRChatFile & {url: string};

type GalleryIcon = GalleryFile & {current: boolean};

const fileId = (url: string | undefined) => url?.match(/(file_[^/]+)/)?.[1];

// Image of the latest version of a file.
const fileUrl = (file: VRChatFile) => `https://api.vrchat.cloud/api/1/file/${file.id}/${file.versions?.at(-1)?.version ?? 1}`;

const withUrl = (file: VRChatFile): GalleryFile => ({...file, url: fileUrl(file)});

export default defineComponent({
  name: 'GalleryTab',
  emits: {
    'new-user-data': (user: GalleryUser & {userIcon: string}) => !!user.id
  },
  props: {
    user_data: {
      type: Object as PropType<GalleryUser>,
      required: true
    }
  },
  data() {
    return {
      icons: [] as GalleryFile[],
      pictures: [] as GalleryFile[],
      // The current user no longer carries its icon, it comes from its profile.
      current_icon: '',
      show_icons: true,
      show_pictures: true,
      delete_file_id: ''
    }
  },
  computed: {
    Icons(): GalleryIcon[] {
      const currentIconId = fileId(this.current_icon);

      return this.icons.map(icon => ({...icon, current: !!currentIconId && fileId(icon.url) === currentIconId}));
    },
    Pictures(): GalleryFile[] {
      return this.pictures;
    }
  },
  mounted() {
    this.fetchCurrentIcon();
    this.fetchIcons();
    this.fetchPictures();
  },
  methods: {
    fetchCurrentIcon(): void {
      getProfile(this.user_data.id)
          .then(profile => this.current_icon = profile.userIcon || '')
          .catch(e => console.error('Could not fetch the current icon', e));
    },
    fetchIcons(): void {
      getFiles('icon')
          .then(data => this.icons = data.map(withUrl))
          .catch(e => console.error('Could not fetch icons', e));
    },
    fetchPictures(): void {
      getFiles('gallery')
          .then(data => this.pictures = data.map(withUrl))
          .catch(e => console.error('Could not fetch gallery pictures', e));
    },
    changeIcon(ev: MouseEvent, url: string): void {
      const target = ev.target as Element;

      if (target.classList.contains('v-icon')
          || target.classList.contains('v-btn')
          || target.classList.contains('v-btn__content'))
        return;

      // Icons are profile fields now, the response is the public profile, not the user.
      updateProfile(this.user_data.id, {userIcon: url})
          .then(profile => {
            this.current_icon = profile.userIcon || url;
            this.$emit('new-user-data', {...this.user_data, userIcon: this.current_icon});
          })
          .catch(e => console.error('Could not change the icon', e));
    },
    deleteFile(): void {
      const fileId = this.delete_file_id;

      deleteFile(fileId)
          .then(() => {
            this.icons = this.icons.filter(e => e.id !== fileId);
            this.pictures = this.pictures.filter(e => e.id !== fileId);
          })
          .catch(e => console.error(`Could not delete file ${fileId}`, e));

      this.delete_file_id = '';
    }
  }
})
</script>

<style scoped>
.deleteBtn {
  top: -8px;
  right: -8px;
}
</style>
