import Dexie from 'dexie'
import moment from 'moment';
import {v4 as UUIDv4} from 'uuid';

const allPorts = [];

let events = [];
let socket, authToken, dontRetry = null;
let settings = localStorage.getItem('settings') ? JSON.parse(localStorage.getItem('settings')) : {
    notify_online: false,
    notify_online_favorited: false,
    notify_notifications: false
};

let favorite_friends = localStorage.getItem('favorite_friends') ? JSON.parse(localStorage.getItem('favorite_friends')) : [];

const events_db = new Dexie('events_db');
events_db.version(2).stores({
    events: "++id, uid, type, content, date"
});

events_db.events
    .where('date')
    .below(moment().subtract(24, 'hour').toDate())
    .delete()
    .then((amount) => {
        console.log(`%cDeleted ${amount} old events.`, 'color: #90c7ee; font-size: 20px;');
    });

events_db.events
    .where('date')
    .above(moment().subtract(24, 'hour').toDate())
    .toArray()
    .then(data => {
        data.forEach(event => {
            if (!event.uid) event.uid = UUIDv4();
        });

        events = events.concat(data);
    });

function init() {
    if (browser.cookies) {
        browser.cookies.get({
            name: 'auth', url: 'https://vrchat.com'
        }).then(useCookie);
    } else if (chrome.cookies) {
        chrome.cookies.get({
            name: 'auth', url: 'https://vrchat.com'
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
        createSocket(`wss://vrchat.com/?authToken=${cookie.value}`);
    }
}

chrome.notifications.onClicked.addListener(function (notificationId) {
    if (notificationId === 'openLoginPage') {
        chrome.tabs.create({url: 'https://vrchat.com/login'});
    }
});

function createSocket(url) {
    if (socket) socket.close(1000, 'known_close');
    socket = new WebSocket(url);
    socket.onmessage = handleVRCEvent;

    socket.onclose = (ev) => {
        console.log('%cSocket Closed!', 'color: #ee9090; font-size: 50px;');
        console.log(`Code: ${ev.code}, Reason: "${ev.reason}"`);

        fetch('https://vrchat.com/api/1/auth/user')
            .then(response => {
                if (response.status === 503)
                    console.log('%Cloudflare error?!', 'color: #eeba90; font-size: 50px;');
                else return response.json();
            })
            .then(data => {
                if (data.error && data.error.status_code === 401)
                    setExtensionStatus(false);
                else
                    console.log('Debug! Data', data);
            })
            .catch(err => {
                console.log('Debug! Err', err);
            });

        if (ev.reason !== 'known_close') setTimeout(() => {
            if (!dontRetry) createSocket(url);
            dontRetry = false;
        }, 2000);
    };

    socket.onerror = (ev) => console.error(ev);

    socket.onopen = () => {
        console.log('%cSocket Initiated!', 'color: #90ee90; font-size: 50px;');

        setExtensionStatus(true);
    }
}

function setExtensionStatus(online = true) {
    if (online) {
        chrome.action.setIcon({
            path: {'19': 'icons/vrce-logo-19_x_19.png', '38': 'icons/vrce-logo-38_x_38.png'}
        });

        chrome.action.setTitle({title: 'VRCe - Online'});
    } else {
        chrome.notifications.create('openLoginPage', {
            title: 'Disconnected',
            message: 'Click to open login page',
            type: 'basic',
            iconUrl: 'icons/vrce-logo-128_x_128.png'
        });

        chrome.action.setIcon({
            path: {'19': 'icons/vrce-logo-19_x_19-offline.png', '38': 'icons/vrce-logo-38_x_38-offline.png'}
        });

        chrome.action.setTitle({title: 'VRCe - Offline'});
    }
}

function handleVRCEvent(ev) {
    const event = JSON.parse(ev.data);

    if (event.err) {
        dontRetry = true;
        console.warn('Socket Error', event);
        return;
    }

    event.uid = UUIDv4();
    event.date = new Date();
    event.content = parseContent(event.content);

    events.push(event);
    events_db.events.add(event);

    if ((settings.notify_online && event.type === 'friend-online') || (settings.notify_online_favorited && event.type === 'friend-online' && favorite_friends.includes(event.content.user.id))) chrome.notifications.create({
        title: 'Friend Online',
        message: event.content.user.displayName,
        type: 'basic',
        iconUrl: 'icons/vrce-logo-128_x_128.png'
    });

    if (settings.notify_notifications && event.type === 'notification') notifyNotification(event).then();

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

function saveFavoriteFriends() {
    localStorage.setItem('favorite_friends', JSON.stringify(favorite_friends))
}

async function notifyNotification(event) {
    chrome.notifications.create(await notifyNotificationOptions(event));
}

async function notifyNotificationOptions(event) {
    let notification = {
        type: 'basic',
        title: 'Not set ?',
        message: 'Not set ?',
        contextMessage: '',
        iconUrl: 'icons/vrce-logo-128_x_128.png'
    };

    switch (event.content.type) {
        case 'invite':
            notification.title = 'Join Invite';
            notification.message = `${event.content.senderUsername} invite you to ${event.content.details.worldName}`;
            notification.iconUrl = 'icons/join-invite.png';
            break;
        case 'requestInvite':
            notification.title = 'Join Request';
            notification.message = `${event.content.senderUsername} wants to join you`;
            notification.iconUrl = 'icons/join-request.png';
            notification.contextMessage = event.content.details.inviteMessage;
            break;
        case 'inviteResponse':
        case 'requestInviteResponse':
            notification.title = 'Reply';
            notification.message = `${event.content.senderUsername} replied to you`;
            notification.iconUrl = 'icons/reply.png';
            notification.contextMessage = event.content.details.responseMessage;
            break;
        case 'friendRequest':
            notification.title = 'Friend Invite';
            notification.message = `${event.content.senderUsername}`;
            notification.iconUrl = 'icons/friend-add.png';
            break;
    }

    if (event.content.details.imageUrl) {
        const iconRequest = await fetch(`http://nekotiki.fr:55555/${event.content.details.imageUrl}`);
        notification.iconUrl = await blobToBase64(await iconRequest.blob());
    }

    return notification;
}

(browser.runtime || chrome.extension).onConnect.addListener((port) => {
    if (port.name === 'popup-event') {
        allPorts.push(port);

        port.onDisconnect.addListener(() => {
            allPorts.splice(allPorts.indexOf(port), 1)
        });

        port.postMessage({type: 'all_events', events});
    } else if (port.name === 'popup-settings') {
        port.postMessage({type: 'settings', settings});

        port.onMessage.addListener(msg => {
            if (msg.type === 'update_settings') {
                settings = msg.settings;
                saveSettings();
            } else if (msg.type === 'clear_events') {
                events = [];
                events_db.events.clear();
            }
        });
    } else if (port.name === 'popup-app') {
        init();

        port.postMessage({type: 'favorite_friends', favorite_friends});

        port.onMessage.addListener(msg => {
            if (msg.type === 'toggleFavoriteFriend') {
                const userId = msg.user_id;
                const index = favorite_friends.indexOf(userId);

                if (index === -1) favorite_friends.push(userId); else favorite_friends.splice(index, 1);

                saveFavoriteFriends();

                port.postMessage({type: 'favorite_friends', favorite_friends});
            } else if (msg.type === 'logout') {
                if (socket) socket.close(1000, 'known_close');
            }
        });
    }
});

init();

function blobToBase64(blob) {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    return new Promise(resolve => {
        reader.onloadend = () => {
            resolve(reader.result);
        };
    });
}
