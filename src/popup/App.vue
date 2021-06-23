<template>
  <v-app>
    <Popup/>
  </v-app>
</template>

<script>
import Popup from "../components/Popup";

export default {
  name: 'App',
  components: {Popup}
}
</script>

<style lang="scss">
html {
  overflow: hidden;
}

body {
  margin: auto;
  width: 400px;
  min-height: 72px;
  max-height: 600px;
}

* {
  overflow-y: unset;
}
</style>
