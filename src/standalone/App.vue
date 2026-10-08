<template>
  <v-app>
    <Standalone />
  </v-app>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import Standalone from '../components/Standalone.vue';

export default defineComponent({
  name: 'App',
  components: {Standalone}
});
</script>
