import '../assets/main.css';
import {createApp} from 'vue';
import ui from '@nuxt/ui/vue-plugin';
import App from './App.vue';
import {listenForDevReload} from '../shared/messages';
import {migrateLegacyStorage} from '../shared/storage';

listenForDevReload();

migrateLegacyStorage()
    .catch(e => console.warn('Legacy storage migration failed', e))
    .finally(() => createApp(App).use(ui).mount('#app'));
