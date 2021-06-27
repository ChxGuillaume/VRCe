import Dexie from 'dexie'
import moment from 'moment';

const allPorts = [];

let events = [];
let socket, authToken, dontRetry = null;
let settings = localStorage.getItem('settings')
    ? JSON.parse(localStorage.getItem('settings'))
    : {notify_online: false};

const events_db = new Dexie('events_db');
events_db.version(1).stores({
    events: "++id, type, content, date"
});

events_db.events
    .where('date')
    .below(moment().subtract(24, 'hour').toDate())
    .toArray()
    .then(data => {
        events_db.events.bulkDelete(data.map(e => e.id))
    });

events_db.events
    .where('date')
    .above(moment().subtract(24, 'hour').toDate())
    .toArray()
    .then(data => {
        events = events.concat(data)
    });

function init() {
    if (browser.cookies) {
        browser.cookies.get({
            name: 'auth',
            url: 'https://vrchat.com'
        }).then(useCookie);
    } else if (chrome.cookies) {
        chrome.cookies.get({
            name: 'auth',
            url: 'https://vrchat.com'
        }, useCookie);
    }
}

function useCookie(cookie) {
    if (!cookie) {
        events.splice(0, events.length);
        if (socket) socket.close(1000, 'known_close');

        sendMessageToPorts({type: 'all_events', events});
    } else if (authToken !== cookie.value) {
        authToken = cookie.value;

        sendMessageToPorts({type: 'all_events', events});
        createSocket(`wss://pipeline.vrchat.cloud/?authToken=${cookie.value}`);
    }
}

function createSocket(url) {
    if (socket) socket.close(1000, 'known_close');
    socket = new WebSocket(url);
    socket.onmessage = handleVRCEvent;

    socket.onclose = (ev) => {
        if (ev.reason !== 'known_close')
            setTimeout(() => {
                if (!dontRetry)
                    createSocket(url);
                dontRetry = false;
            }, 2000);
    };

    socket.onerror = (ev) => console.error(ev);

    socket.onopen = () => {
        console.log('%cSocket Initiated!', 'color: #90ee90; font-size: 50px;');
    }
}

function handleVRCEvent(ev) {
    const event = JSON.parse(ev.data);

    if (event.err) {
        dontRetry = true;
        console.warn('Socket Error', event);
        return;
    }

    event.content = parseContent(event.content);
    event.date = new Date();

    events.push(event);
    events_db.events.add(event);

    if (settings.notify_online && event.type === 'friend-online')
        chrome.notifications.create({
            title: 'Friend Online',
            message: event.content.user.displayName,
            type: 'basic',
            iconUrl: 'icons/vrc_logo-128_x_128.png'
        });

    sendMessageToPorts({type: 'new_events', event});
}

function sendMessageToPorts(message) {
    allPorts.forEach(port => port.postMessage(message))
}

function parseContent(content) {
    try {
        return JSON.parse(content);
    } catch (e) {
        return content;
    }
}

function saveSettings() {
    localStorage.setItem('settings', JSON.stringify(settings))
}

(browser.runtime || chrome.extension).onConnect.addListener((port) => {
    if (port.name === 'popup-event') {
        allPorts.push(port);

        port.onDisconnect.addListener(() => {
            allPorts.splice(allPorts.indexOf(port), 1)
        })

        port.postMessage({type: 'all_events', events});
    } else if (port.name === 'popup-settings') {
        port.postMessage({type: 'settings', settings});

        port.onMessage.addListener(settingsMsg => {
            settings = settingsMsg;
            saveSettings();
        })
    } else if (port.name === 'popup-app') {
        init();
    }
});

init();