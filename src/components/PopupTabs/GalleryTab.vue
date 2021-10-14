<template>
  <v-card
      class="mx-auto pt-4 overflow-y-auto"
      color="transparent"
      max-width="100%"
      height="max(calc(100vh - 216px), 384px)"
      tile
  >
    <v-row class="mx-0">
      <v-col cols="12" class="d-flex justify-center align-center">
        <v-btn icon small color="grey darken-1" class="mr-1" @click="show_icons = !show_icons">
          <v-icon>{{ show_icons ? 'remove' : 'add' }}</v-icon>
        </v-btn>
        <h3 class="mr-5 text-center">Icons ({{ Icons.length }} / 64)</h3>
        <v-btn color="primary" small href="https://vrchat.com/home/gallery" target="_blank">
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
              class="d-inline-block pa-1 rounded-circle darken-2"
              :class="{ 'green': icon.current, 'grey': !icon.current }"
              style="position: relative; cursor: pointer"
              @click="changeIcon($event, icon.url)"
          >
            <v-btn fab absolute x-small class="deleteBtn" color="red" @click="delete_file_id = icon.id">
              <v-icon small>delete</v-icon>
            </v-btn>
            <v-img class="rounded-circle" :src="icon.url" width="68" height="68">
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
          </div>
        </v-col>
      </v-row>
    </v-expand-transition>
    <v-row class="mx-0">
      <v-col cols="12" class="d-flex justify-center align-center">
        <v-btn icon small color="grey darken-1" class="mr-1" @click="show_pictures = !show_pictures">
          <v-icon>{{ show_pictures ? 'remove' : 'add' }}</v-icon>
        </v-btn>
        <h3 class="mr-5 text-center">Pictures ({{ Pictures.length }} / 64)</h3>
        <v-btn color="primary" small href="https://vrchat.com/home/gallery" target="_blank">
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
            style="position: relative; cursor: pointer"
        >
          <div
              class="d-inline-block pa-1 rounded darken-2"
              :class="{ 'green': picture.current, 'grey': !picture.current }"
              style="position: relative; cursor: pointer"
              @click="changePicture($event, picture.url)"
          >
            <v-btn fab absolute x-small class="deleteBtn" color="red" @click="delete_file_id = picture.id">
              <v-icon small>delete</v-icon>
            </v-btn>
            <v-img class="rounded" :src="picture.url" width="162" height="91">
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
          </div>
        </v-col>
      </v-row>
    </v-expand-transition>

    <v-dialog
        max-width="220"
        :value="delete_file_id"
    >
      <v-card>
        <v-card-title class="text-h5">
          Are you sure ?
        </v-card-title>
        <v-card-actions>
          <v-spacer/>
          <v-btn
              color="red darken-1"
              text
              @click="delete_file_id = ''"
          >
            No
          </v-btn>
          <v-btn
              color="green darken-1"
              text
              @click="deleteFile"
          >
            Yes
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script>
export default {
  name: 'GalleryTab',
  props: {
    user_data: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      icons: [],
      pictures: [],
      show_icons: true,
      show_pictures: true,
      delete_file_id: ''
    }
  },
  computed: {
    Icons() {
      const icons = this.icons.slice();

      icons.forEach(e => e.current = e.url.match(/(file_.*?)\//)[1] === this.user_data.userIcon.match(/(file_.*?)\//)[1]);

      return icons;
    },
    Pictures() {
      const pictures = this.pictures.slice();

      pictures.forEach(e => e.current = e.url.match(/(file_.*?)\//)[1] === this.user_data.profilePicOverride.match(/(file_.*?)\//)[1]);

      return pictures;
    }
  },
  mounted() {
    this.fetchIcons();
    this.fetchPictures();
  },
  methods: {
    fetchIcons() {
      fetch('https://vrchat.com/api/1/files?tag=icon&n=100')
          .then(res => res.json())
          .then((data) => {
            data.forEach(e => {
              e.current = false;
              e.url = `https://api.vrchat.cloud/api/1/file/${e.id}/1`;
            });

            this.icons = data;
          })
    },
    fetchPictures() {
      fetch('https://vrchat.com/api/1/files?tag=gallery&n=100')
          .then(res => res.json())
          .then((data) => {
            data.forEach(e => {
              e.current = false;
              e.url = `https://api.vrchat.cloud/api/1/file/${e.id}/1`;
            });

            this.pictures = data;
          })
    },
    changeIcon(ev, url) {
      if (!ev.target.classList.contains('v-icon')
          && !ev.target.classList.contains('v-btn')
          && !ev.target.classList.contains('v-btn__content'))
        fetch(`https://vrchat.com/api/1/users/${this.user_data.id}`, {
          'headers': {'content-type': 'application/json;charset=UTF-8'},
          'body': JSON.stringify({'userIcon': url}),
          'method': 'PUT'
        })
            .then(res => res.json())
            .then(data => {
              this.$emit('new-user-data', data);
            });
    },
    changePicture(ev, url) {
      if (!ev.target.classList.contains('v-icon')
          && !ev.target.classList.contains('v-btn')
          && !ev.target.classList.contains('v-btn__content'))
        fetch(`https://vrchat.com/api/1/users/${this.user_data.id}`, {
          'headers': {'content-type': 'application/json;charset=UTF-8'},
          'body': JSON.stringify({'profilePicOverride': url}),
          'method': 'PUT'
        })
            .then(res => res.json())
            .then(data => {
              this.$emit('new-user-data', data);
            });
    },
    deleteFile() {
      const iconIndex = this.icons.findIndex(e => e.id === this.delete_file_id);
      const pictureIndex = this.pictures.findIndex(e => e.id === this.delete_file_id);

      fetch(`https://vrchat.com/api/1/file/${this.delete_file_id}`, {
        method: 'DELETE'
      }).then(() => {
        if (iconIndex >= 0) this.icons.splice(iconIndex, 1);
        if (pictureIndex >= 0) this.pictures.splice(pictureIndex, 1);
      })

      this.delete_file_id = '';
    }
  }
}
</script>

<style scoped>
.deleteBtn {
  top: -8px;
  right: -8px;
}
</style>
