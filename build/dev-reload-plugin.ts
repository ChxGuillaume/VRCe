import {createServer, type Server, type ServerResponse} from 'node:http';
import {createHash} from 'node:crypto';
import type {Plugin} from 'vite';

const HOLD_REQUEST_MS = 20 * 1000;

// Dev only: serves the current build id over long polling, so the extension can reload itself after a rebuild.
// The service worker reloads the whole extension when its code (or the manifest) changed, otherwise only the pages.
interface PendingRequest {
    res: ServerResponse;
    timer: ReturnType<typeof setTimeout>;
}

export default function devReload({port}: {port: number}): Plugin {
    let server: Server | null = null;
    let build = 0;
    let backgroundBuild = 0;
    let backgroundHash: string | null = null;
    const waiting = new Set<PendingRequest>();

    const flush = (pending: PendingRequest) => {
        clearTimeout(pending.timer);
        waiting.delete(pending);
        reply(pending.res);
    };

    const reply = (res: ServerResponse) => {
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
                const since = new URL(req.url ?? '/', 'http://127.0.0.1').searchParams.get('since');

                if (since === null || since === '' || Number(since) !== build) return reply(res);

                const pending: PendingRequest = {res, timer: setTimeout(() => flush(pending), HOLD_REQUEST_MS)};
                waiting.add(pending);
                res.on('close', () => {
                    clearTimeout(pending.timer);
                    waiting.delete(pending);
                });
            });


            server.on('error', (e) => console.warn(`\n[dev-reload] server error, auto reload disabled: ${e.message}`));
            server.listen(port, '127.0.0.1', () => console.log(`\n[dev-reload] listening on http://127.0.0.1:${port}`));
        },
        writeBundle(_options, bundle) {
            if (!server) return;

            const hash = createHash('sha1');
            const addChunk = (fileName: string, seen = new Set<string>()) => {
                const chunk = bundle[fileName];
                if (!chunk || chunk.type !== 'chunk' || seen.has(fileName)) return;

                seen.add(fileName);
                hash.update(chunk.code);
                chunk.imports.forEach(name => addChunk(name, seen));
            };

            addChunk('background.js');
            const manifest = bundle['manifest.json'];
            hash.update(manifest?.type === 'asset' ? String(manifest.source) : '');

            const newHash = hash.digest('hex');

            build++;
            if (newHash !== backgroundHash) backgroundBuild = build;
            backgroundHash = newHash;

            [...waiting].forEach(flush);
        }
    };
}
