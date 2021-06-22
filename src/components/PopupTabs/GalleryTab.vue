<template>
  <v-card
      class="mx-auto pt-4 overflow-y-auto"
      color="transparent"
      max-width="400"
      height="384"
      tile
  >
    <v-row class="mx-0">
      <v-col cols="12" class="d-flex justify-center align-center">
        <h3 class="mr-5 text-center">Icons ({{ Icons.length }} / 64)</h3>
        <v-btn color="primary" small href="https://vrchat.com/home/gallery" target="_blank">
          Upload
        </v-btn>
      </v-col>
      <v-col
          v-for="icon of Icons"
          :key="icon.id"
          cols="3"
          style="position: relative; cursor: pointer"
      >
        <div
            class="pa-1 rounded-circle darken-2"
            :class="{ 'green': icon.current, 'grey': !icon.current }"
            style="position: relative; cursor: pointer"
            @click="changeIcon($event, icon.url)"
        >
          <v-btn fab absolute x-small class="deleteBtn" color="red" @click="deleteIcon" disabled>
            <v-icon small>delete</v-icon>
          </v-btn>
          <v-img class="rounded-circle" :src="icon.url" width="68" height="68"/>
        </div>
      </v-col>
      <v-col cols="12" class="d-flex justify-center align-center">
        <h3 class="mr-5 text-center">Pictures ({{ Pictures.length }} / 64)</h3>
        <v-btn color="primary" small href="https://vrchat.com/home/gallery" target="_blank">
          Upload
        </v-btn>
      </v-col>
      <v-col
          v-for="picture of Pictures"
          :key="picture.id"
          cols="6"
          style="position: relative; cursor: pointer"
      >
        <div
            class="pa-1 rounded darken-2"
            :class="{ 'green': picture.current, 'grey': !picture.current }"
            style="position: relative; cursor: pointer"
            @click="changePicture($event, picture.url)"
        >
          <v-btn fab absolute x-small class="deleteBtn" color="red" @click="deleteIcon" disabled>
            <v-icon small>delete</v-icon>
          </v-btn>
          <v-img class="rounded" :src="picture.url" height="91"/>
        </div>
      </v-col>
    </v-row>
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
      pictures: []
    }
  },
  computed: {
    Icons() {
      const icons = this.icons.slice();

      icons.forEach(e => e.current = e.url === this.user_data.userIcon);

      return icons;
    },
    Pictures() {
      const pictures = this.pictures.slice();

      pictures.forEach(e => e.current = e.url === this.user_data.profilePicOverride);

      return pictures;
    }
  },
  mounted() {
    this.fetchIcons();
    this.fetchPictures();
  },
  methods: {
    fetchIcons() {
      fetch('https://vrchat.com/api/1/files?tag=icon')
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
      fetch('https://vrchat.com/api/1/files?tag=gallery')
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
        console.log('change icon', ev)

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
        console.log('change icon', ev)

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
    deleteIcon() {
      console.log('delete icon')
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