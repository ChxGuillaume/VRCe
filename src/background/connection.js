import {MessageType} from '../shared/messages';
import {addEvent, getRecentEvents} from './events-db';
import {notifyDisconnected, notifyForEvent} from './notifications';

const VRCHAT_URL = 'https://vrchat.com';
const KNOWN_CLOSE = 'known_close';
const RECONNECT_DELAY_MS = 2000;
// A service worker is stopped after 30s of inactivity, extension API calls reset that timer.
const KEEPALIVE_INTERVAL_MS = 20 * 1000;

const eventPorts = new Set();

let socket = null;
let authToken = null;
// Token the pipeline answered with an error, don't hammer it until the cookie changes.
let rejectedToken = null;
let keepAliveTimer = null;
let refreshQueue = Promise.resolve();

export function broadcast(message) {
    eventPorts.forEach(port => port.postMessage(message));
}

export async function addEventsPort(port) {
    eventPorts.add(port);
    port.onDisconnect.addListener(() => eventPorts.delete(port));

    // Wait for a pending refresh so a freshly woken worker knows whether the user is logged in.
    await refreshQueue;

    port.postMessage({type: MessageType.ALL_EVENTS, events: authToken ? await getRecentEvents() : []});
}

// Reads the VRChat auth cookie and (re)connects the pipeline socket when needed.
// Calls are queued so concurrent triggers (cookie change, alarm, popup) never open two sockets.
export function refreshConnection() {
    refreshQueue = refreshQueue
        .then(syncWithAuthCookie)
        .catch(e => console.error('Failed to refresh VRChat connection', e));

    return refreshQueue;
}

export function closeConnection() {
    closeSocket();
}

async function syncWithAuthCookie() {
    const cookie = await chrome.cookies.get({name: 'auth', url: VRCHAT_URL});

    if (!cookie) {
        authToken = null;
        closeSocket();
        broadcast({type: MessageType.ALL_EVENTS, events: []});
    } else if (cookie.value !== rejectedToken && (cookie.value !== authToken || !isSocketAlive())) {
        const tokenChanged = cookie.value !== authToken;
        authToken = cookie.value;

        if (tokenChanged) broadcast({type: MessageType.ALL_EVENTS, events: await getRecentEvents()});

        createSocket(cookie.value);
    }
}

function isSocketAlive() {
    return socket !== null && [WebSocket.CONNECTING, WebSocket.OPEN].includes(socket.readyState);
}

function closeSocket() {
    if (!socket) return;

    const closing = socket;
    socket = null;
    stopKeepAlive();
    closing.close(1000, KNOWN_CLOSE);
}

function createSocket(token) {
    closeSocket();

    const ws = new WebSocket(`wss://vrchat.com/?authToken=${token}`);
    socket = ws;

    ws.onopen = () => {
        console.log('Socket opened');

        startKeepAlive();
        setOnlineStatus(true);
    };

    ws.onmessage = (ev) => handleSocketMessage(ev, token);

    ws.onerror = (ev) => console.error('Socket error', ev);

    ws.onclose = (ev) => {
        console.log(`Socket closed, code: ${ev.code}, reason: "${ev.reason}"`);

        if (socket === ws) {
            socket = null;
            stopKeepAlive();
        }

        checkSession();

        if (ev.reason !== KNOWN_CLOSE && token !== rejectedToken)
            setTimeout(refreshConnection, RECONNECT_DELAY_MS);
    };
}

function handleSocketMessage(ev, token) {
    const event = JSON.parse(ev.data);

    if (event.err) {
        rejectedToken = token;
        console.warn('Socket Error', event);
        return;
    }

    event.uid = crypto.randomUUID();
    event.date = new Date();
    event.content = parseContent(event.content);

    addEvent(event).catch(e => console.error('Could not store event', e));
    notifyForEvent(event).catch(e => console.error('Could not notify event', e));

    broadcast({type: MessageType.NEW_EVENTS, event});
}

function parseContent(content) {
    try {
        return JSON.parse(content);
    } catch {
        return content;
    }
}

async function checkSession() {
    try {
        const response = await fetch(`${VRCHAT_URL}/api/1/auth/user`, {credentials: 'include'});

        if (response.status === 503) {
            console.warn('Cloudflare error?!');
            return;
        }

        const data = await response.json().catch(() => ({}));

        if (response.status === 401 || data.error?.status_code === 401) await setOnlineStatus(false);
    } catch (e) {
        console.warn('Could not check VRChat session', e);
    }
}

async function setOnlineStatus(online) {
    // Survives service worker restarts, so the user is only notified when the status changes.
    const {online: wasOnline} = await chrome.storage.session.get('online');
    await chrome.storage.session.set({online});

    const suffix = online ? '' : '-offline';

    await chrome.action.setIcon({
        path: {
            '19': `icons/vrce-logo-19_x_19${suffix}.png`,
            '38': `icons/vrce-logo-38_x_38${suffix}.png`
        }
    });
    await chrome.action.setTitle({title: online ? 'VRCe - Online' : 'VRCe - Offline'});

    if (!online && wasOnline !== false) await notifyDisconnected();
}

function startKeepAlive() {
    stopKeepAlive();
    keepAliveTimer = setInterval(() => chrome.runtime.getPlatformInfo(), KEEPALIVE_INTERVAL_MS);
}

function stopKeepAlive() {
    clearInterval(keepAliveTimer);
    keepAliveTimer = null;
}
