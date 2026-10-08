import {readFileSync} from 'node:fs';
import {fileURLToPath, URL} from 'node:url';
import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';
import devReload from './build/dev-reload-plugin.js';

const root = (path) => fileURLToPath(new URL(path, import.meta.url));

const DEV_RELOAD_PORT = Number(process.env.VRCE_DEV_RELOAD_PORT) || 35729;

// Emits manifest.json into the build, stamped with the package.json version.
function extensionManifest({devReloadPort}) {
    return {
        name: 'extension-manifest',
        buildStart() {
            this.addWatchFile(root('./manifest.json'));
        },
        generateBundle() {
            const pkg = JSON.parse(readFileSync(root('./package.json'), 'utf-8'));
            const manifest = JSON.parse(readFileSync(root('./manifest.json'), 'utf-8'));

            // Lets the dev build reach the local reload server.
            if (devReloadPort) manifest.host_permissions = [...manifest.host_permissions, 'http://127.0.0.1/*'];

            this.emitFile({
                type: 'asset',
                fileName: 'manifest.json',
                source: JSON.stringify({...manifest, version: pkg.version}, null, 2)
            });
        }
    };
}

export default defineConfig(({mode}) => {
    // Auto reload is only wired into `npm run serve` (development watch build).
    const devReloadPort = mode === 'development' && process.argv.includes('--watch') ? DEV_RELOAD_PORT : null;

    return {
        // Extension pages are loaded from chrome-extension://<id>/, keep asset URLs relative.
        base: '',
        plugins: [
            vue(),
            vuetify({autoImport: true}),
            extensionManifest({devReloadPort}),
            devReloadPort && devReload({port: devReloadPort})
        ],
        define: {
            __DEV_RELOAD_PORT__: JSON.stringify(devReloadPort)
        },
        resolve: {
            alias: {'@': root('./src')}
        },
        build: {
            outDir: 'dist',
            emptyOutDir: true,
            target: 'chrome116',
            // MV3 CSP forbids eval, so never use eval-based source maps.
            sourcemap: mode === 'development',
            minify: mode !== 'development',
            modulePreload: false,
            rollupOptions: {
                input: {
                    popup: root('./popup.html'),
                    index: root('./index.html'),
                    background: root('./src/background/index.js')
                },
                output: {
                    // The service worker path is referenced by manifest.json, it must be stable.
                    entryFileNames: (chunk) => chunk.name === 'background' ? 'background.js' : 'assets/[name]-[hash].js'
                }
            }
        }
    };
});
