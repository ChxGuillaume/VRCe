import {createServer} from 'node:http';
import {createHash} from 'node:crypto';

const HOLD_REQUEST_MS = 20 * 1000;

// Dev only: serves the current build id over long polling, so the extension can reload itself after a rebuild.
// The service worker reloads the whole extension when its code (or the manifest) changed, otherwise only the pages.
export default function devReload({port}) {
    let server = null;
    let build = 0;
    let backgroundBuild = 0;
    let backgroundHash = null;
    const waiting = new Set();

    const flush = (pending) => {
        clearTimeout(pending.timer);
        waiting.delete(pending);
        reply(pending.res);
    };

    const reply = (res) => {
        res.writeHead(200, {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
            'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({build, backgroundBuild}));
    };

    return {
        name: 'extension-dev-reload',
        apply: 'build',
        buildStart() {
            if (server || !this.meta.watchMode) return;

            server = createServer((req, res) => {
                const since = new URL(req.url, 'http://127.0.0.1').searchParams.get('since');

                if (since === null || since === '' || Number(since) !== build) return reply(res);

                const pending = {res, timer: setTimeout(() => flush(pending), HOLD_REQUEST_MS)};
                waiting.add(pending);
                res.on('close', () => {
                    clearTimeout(pending.timer);
                    waiting.delete(pending);
                });
            });


            server.on('error', (e) => console.warn(`\n[dev-reload] server error, auto reload disabled: ${e.message}`));
            server.listen(port, '127.0.0.1', () => console.log(`\n[dev-reload] listening on http://127.0.0.1:${port}`));
        },
        writeBundle(options, bundle) {
            if (!server) return;

            const hash = createHash('sha1');
            const addChunk = (fileName, seen = new Set()) => {
                const chunk = bundle[fileName];
                if (!chunk || seen.has(fileName)) return;

                seen.add(fileName);
                hash.update(chunk.code);
                chunk.imports.forEach(name => addChunk(name, seen));
            };

            addChunk('background.js');
            hash.update(String(bundle['manifest.json']?.source));

            const newHash = hash.digest('hex');

            build++;
            if (newHash !== backgroundHash) backgroundBuild = build;
            backgroundHash = newHash;

            [...waiting].forEach(flush);
        }
    };
}
