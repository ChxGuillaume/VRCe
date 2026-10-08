import {createApp} from 'vue';
import App from './App.vue';
import vuetify from '../plugins/vuetify';
import {migrateLegacyStorage} from '../shared/storage';
import {listenForDevReload} from '../shared/messages';

listenForDevReload();

migrateLegacyStorage()
    .catch(e => console.warn('Legacy storage migration failed', e))
    .finally(() => createApp(App).use(vuetify).mount('#app'));
