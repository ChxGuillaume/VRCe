import 'material-design-icons-iconfont/dist/material-design-icons.css';
import 'vuetify/styles';
import '../assets/font.scss';
import '../assets/legacy-reset.css';
import {createVuetify} from 'vuetify';
import {aliases, md} from 'vuetify/iconsets/md';

export default createVuetify({
    theme: {defaultTheme: 'dark'},
    icons: {
        defaultSet: 'md',
        aliases,
        sets: {md}
    },
    defaults: {
        // Vuetify 4 no longer uppercases buttons, keep the original look.
        VBtn: {class: 'text-uppercase'}
    }
});
