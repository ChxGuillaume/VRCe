const allPorts = [];

let events = [];
let socket, authToken = null;
let settings = localStorage.getItem('settings')
    ? JSON.parse(localStorage.getItem('settings'))
    : {notify_online: false};

function init() {
    chrome.cookies.get({
        name: 'auth',
        url: 'https://vrchat.com'
    }, cookie => {
        if (!cookie) {
            events.splice(0, events.length);
            if (socket) socket.close(1000, 'known_close');

            sendMessageToPorts({type: 'all_events', events});
        } else if (authToken !== cookie.value) {
            events = [];
            authToken = cookie.value;

            sendMessageToPorts({type: 'all_events', events});
            createSocket(`wss://pipeline.vrchat.cloud/?authToken=${cookie.value}`);
        }
    })
}

function createSocket(url) {
    if (socket) socket.close(1000, 'known_close');
    socket = new WebSocket(url);
    socket.onmessage = handleVRCEvent;

    socket.onclose = (ev) => {
        if (ev.reason !== 'known_close') createSocket(url)
    };

    socket.onerror = (ev) => console.error(ev);

    console.log(socket)
}

function handleVRCEvent(ev) {
    const event = JSON.parse(ev.data);
    event.content = parseContent(event.content);
    event.date = new Date();

    console.log(event);
    events.push(event);

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

chrome.extension.onConnect.addListener((port) => {
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