import js from '@eslint/js';
import pluginVue from 'eslint-plugin-vue';
import globals from 'globals';

export default [
    {ignores: ['dist/**']},
    js.configs.recommended,
    ...pluginVue.configs['flat/essential'],
    {
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.browser,
                ...globals.webextensions,
                __DEV_RELOAD_PORT__: 'readonly'
            }
        },
        rules: {
            'vue/multi-word-component-names': 'off',
            // Vuetify data table slots are named like `item.state`.
            'vue/valid-v-slot': ['error', {allowModifiers: true}]
        }
    },
    {
        files: ['vite.config.js', 'eslint.config.js', 'build/**'],
        languageOptions: {globals: globals.node}
    }
];
