// Messaging between the extension pages and the service worker.

export const EVENTS_PORT = 'popup-event';

export const MessageType = {
    ALL_EVENTS: 'all_events',
    NEW_EVENTS: 'new_events',
    REFRESH_CONNECTION: 'refresh_connection',
    CLEAR_EVENTS: 'clear_events',
    LOGOUT: 'logout',
    DEV_RELOAD: 'dev_reload'
};

export function sendToBackground(type, payload = {}) {
    return chrome.runtime.sendMessage({type, ...payload}).catch(e => console.warn(`Message "${type}" failed`, e));
}

// Streams events from the service worker, reconnecting if the worker gets restarted.
export function subscribeToEvents(onMessage) {
    let port, closed = false;

    const connect = () => {
        port = chrome.runtime.connect({name: EVENTS_PORT});
        port.onMessage.addListener(onMessage);
        port.onDisconnect.addListener(() => {
            if (!closed) setTimeout(connect, 500);
        });
    };

    connect();

    return () => {
        closed = true;
        port.disconnect();
    };
}

// Dev only (`npm run serve`): the service worker asks open pages to reload after a UI rebuild.
export function listenForDevReload() {
    if (!__DEV_RELOAD_PORT__) return;

    chrome.runtime.onMessage.addListener((message) => {
        if (message.type === MessageType.DEV_RELOAD) location.reload();
    });
}
