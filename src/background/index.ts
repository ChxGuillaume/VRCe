import {type BackgroundMessage, type BackgroundResponse, EVENTS_PORT, MessageType} from '../shared/messages';
import {clearEvents, pruneOldEvents} from './events-db';
import {addEventsPort, broadcast, closeConnection, refreshConnection} from './connection';
import {LOGIN_NOTIFICATION_ID} from './notifications';
import {startDevReload} from './dev-reload';

// Wakes the service worker up to reconnect the pipeline if Chrome stopped it.
const HEARTBEAT_ALARM = 'vrce-heartbeat';

// Listeners are registered synchronously at the top level, so Chrome can wake the worker for them.

chrome.runtime.onConnect.addListener((port) => {
    if (port.name === EVENTS_PORT) addEventsPort(port);
});

chrome.runtime.onMessage.addListener((message: BackgroundMessage, _sender, sendResponse: (response: BackgroundResponse) => void) => {
    handleMessage(message).then(
        () => sendResponse({ok: true}),
        (e) => {
            console.error(`Failed to handle "${message.type}"`, e);
            sendResponse({ok: false, error: String(e)});
        }
    );

    return true;
});

chrome.notifications.onClicked.addListener((notificationId) => {
    if (notificationId === LOGIN_NOTIFICATION_ID) {
        chrome.tabs.create({url: 'https://vrchat.com/home/login'});
        chrome.notifications.clear(notificationId);
    }
});

chrome.cookies.onChanged.addListener(({cookie}) => {
    if (cookie.name === 'auth' && cookie.domain.replace(/^\./, '') === 'vrchat.com') refreshConnection();
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name !== HEARTBEAT_ALARM) return;

    refreshConnection();
    pruneOldEvents();
});

async function handleMessage(message: BackgroundMessage): Promise<void> {
    switch (message.type) {
        case MessageType.REFRESH_CONNECTION:
            await refreshConnection();
            break;
        case MessageType.CLEAR_EVENTS:
            await clearEvents();
            broadcast({type: MessageType.ALL_EVENTS, events: []});
            break;
        case MessageType.LOGOUT:
            closeConnection();
            break;
        default:
            throw new Error(`Unknown message type "${message.type}"`);
    }
}

async function ensureHeartbeat(): Promise<void> {
    if (!await chrome.alarms.get(HEARTBEAT_ALARM))
        await chrome.alarms.create(HEARTBEAT_ALARM, {periodInMinutes: 0.5});
}

ensureHeartbeat();
pruneOldEvents();
refreshConnection();
startDevReload();
