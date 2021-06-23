import 'material-design-icons-iconfont/dist/material-design-icons.css';
import Vue from 'vue';/**/
import Vuetify from 'vuetify/lib/framework';
import '../assets/font.scss'

Vue.use(Vuetify);

export default new Vuetify({
    theme: { dark: true },
    icons: {
        iconfont: 'md',
    },
});
