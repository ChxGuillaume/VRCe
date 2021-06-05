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

<style>
html {
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
