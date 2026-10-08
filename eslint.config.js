import js from '@eslint/js';
import pluginVue from 'eslint-plugin-vue';
import {defineConfigWithVueTs, vueTsConfigs} from '@vue/eslint-config-typescript';
import globals from 'globals';

export default defineConfigWithVueTs(
    {ignores: ['dist/**', 'src/types/vrchat-api.generated.d.ts']},
    js.configs.recommended,
    pluginVue.configs['flat/essential'],
    vueTsConfigs.recommended,
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.webextensions
            }
        },
        rules: {
            'vue/multi-word-component-names': 'off',
            // Vuetify data table slots are named like `item.state`.
            'vue/valid-v-slot': ['error', {allowModifiers: true}]
        }
    },
    {
        files: ['vite.config.ts', 'eslint.config.js', 'build/**'],
        languageOptions: {globals: globals.node}
    }
);
