// Messaging between the extension pages and the service worker.
import type {PipelineEvent} from '../types/events';

export const EVENTS_PORT = 'popup-event';

export const MessageType = {
    ALL_EVENTS: 'all_events',
    NEW_EVENTS: 'new_events',
    REFRESH_CONNECTION: 'refresh_connection',
    CLEAR_EVENTS: 'clear_events',
    LOGOUT: 'logout',
    DEV_RELOAD: 'dev_reload'
} as const;

// One shot messages sent with chrome.runtime.sendMessage.
export type BackgroundMessage =
    | {type: typeof MessageType.REFRESH_CONNECTION}
    | {type: typeof MessageType.CLEAR_EVENTS}
    | {type: typeof MessageType.LOGOUT}
    | {type: typeof MessageType.DEV_RELOAD};

export interface BackgroundResponse {
    ok: boolean;
    error?: string;
}

// Messages streamed to the pages on the events port.
export type EventsPortMessage =
    | {type: typeof MessageType.ALL_EVENTS; events: PipelineEvent[]}
    | {type: typeof MessageType.NEW_EVENTS; event: PipelineEvent};

export function sendToBackground(type: BackgroundMessage['type']): Promise<BackgroundResponse | void> {
    const message: BackgroundMessage = {type};

    return chrome.runtime.sendMessage<BackgroundMessage, BackgroundResponse>(message)
        .catch(e => console.warn(`Message "${type}" failed`, e));
}

// Streams events from the service worker, reconnecting if the worker gets restarted.
export function subscribeToEvents(onMessage: (message: EventsPortMessage) => void): () => void {
    let port: chrome.runtime.Port;
    let closed = false;

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
export function listenForDevReload(): void {
    if (!__DEV_RELOAD_PORT__) return;

    chrome.runtime.onMessage.addListener((message: BackgroundMessage) => {
        if (message.type === MessageType.DEV_RELOAD) location.reload();
    });
}
