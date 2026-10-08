<template>
  <v-app>
    <Popup/>
  </v-app>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import Popup from "../components/Popup.vue";

export default defineComponent({
  name: 'App',
  components: {Popup}
})
</script>

<style lang="scss">
html {
  overflow: hidden;
}

body {
  margin: auto;
  width: max(100vw, 400px);
  min-height: 72px;
  max-height: max(100vh, 600px);
}
</style>
