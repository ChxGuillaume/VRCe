import {MessageType} from '../shared/messages';

const RETRY_DELAY_MS = 2000;

// Dev only (`npm run serve`): long polls the watch build and reloads the extension after each rebuild.
// A background change needs a full extension reload, a UI only change just reloads the open pages.
export async function startDevReload() {
    if (!__DEV_RELOAD_PORT__) return;

    let {devBuild: since} = await chrome.storage.session.get('devBuild');

    for (;;) {
        // Extension API calls keep the dev service worker alive while it waits.
        chrome.runtime.getPlatformInfo();

        try {
            const response = await fetch(`http://127.0.0.1:${__DEV_RELOAD_PORT__}/?since=${since ?? ''}`);
            const {build, backgroundBuild} = await response.json();
            const previous = since;

            since = build;
            await chrome.storage.session.set({devBuild: build});

            if (previous === undefined || build === previous) continue;

            // A lower build id means the watcher was restarted.
            if (backgroundBuild > previous || build < previous) {
                console.log('[dev-reload] background changed, reloading extension');
                chrome.runtime.reload();
                return;
            }

            console.log('[dev-reload] UI changed, reloading pages');
            chrome.runtime.sendMessage({type: MessageType.DEV_RELOAD}).catch(() => {});
        } catch {
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        }
    }
}
