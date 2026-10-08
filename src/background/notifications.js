import {getFavoriteFriends, getSettings} from '../shared/storage';

export const LOGIN_NOTIFICATION_ID = 'openLoginPage';

const DEFAULT_ICON = chrome.runtime.getURL('icons/vrce-logo-128_x_128.png');
const IMAGE_PROXY_URL = 'http://nekotiki.fr:55555/';

export function notifyDisconnected() {
    return chrome.notifications.create(LOGIN_NOTIFICATION_ID, {
        type: 'basic',
        title: 'Disconnected',
        message: 'Click to open login page',
        iconUrl: DEFAULT_ICON
    });
}

export async function notifyForEvent(event) {
    const settings = await getSettings();

    if (event.type === 'friend-online' && event.content?.user) {
        const user = event.content.user;
        const isFavorite = settings.notify_online_favorited && (await getFavoriteFriends()).includes(user.id);

        if (settings.notify_online || isFavorite) await chrome.notifications.create({
            type: 'basic',
            title: 'Friend Online',
            message: user.displayName,
            iconUrl: DEFAULT_ICON
        });
    }

    if (settings.notify_notifications && event.type === 'notification')
        await chrome.notifications.create(await vrcNotificationOptions(event.content));
}

async function vrcNotificationOptions(content) {
    const details = content.details || {};
    const notification = {
        type: 'basic',
        title: 'Not set ?',
        message: 'Not set ?',
        contextMessage: '',
        iconUrl: DEFAULT_ICON
    };

    switch (content.type) {
        case 'invite':
            notification.title = 'Join Invite';
            notification.message = `${content.senderUsername} invite you to ${details.worldName}`;
            notification.iconUrl = chrome.runtime.getURL('icons/join-invite.png');
            notification.contextMessage = details.inviteMessage || '';
            break;
        case 'requestInvite':
            notification.title = 'Join Request';
            notification.message = `${content.senderUsername} wants to join you`;
            notification.iconUrl = chrome.runtime.getURL('icons/join-request.png');
            notification.contextMessage = details.requestMessage || '';
            break;
        case 'inviteResponse':
        case 'requestInviteResponse':
            notification.title = 'Reply';
            notification.message = `${content.senderUsername} replied to you`;
            notification.iconUrl = chrome.runtime.getURL('icons/reply.png');
            notification.contextMessage = details.responseMessage || details.requestMessage || '';
            break;
        case 'friendRequest':
            notification.title = 'Friend Invite';
            notification.message = `${content.senderUsername}`;
            notification.iconUrl = chrome.runtime.getURL('icons/friend-add.png');
            break;
        case 'boop':
            notification.title = 'Boop';
            notification.message = `${content.senderUsername} booped you`;
            break;
        case 'message':
            notification.title = 'Message';
            notification.message = `${content.senderUsername}: ${content.message}`;
            break;
    }

    if (details.imageUrl) {
        try {
            notification.iconUrl = await fetchAsDataUrl(`${IMAGE_PROXY_URL}${details.imageUrl}`);
        } catch (e) {
            console.warn('Could not fetch notification image', e);
        }
    }

    return notification;
}

// Service workers have no FileReader-friendly DOM helpers, build the data URL by hand.
async function fetchAsDataUrl(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const blob = await response.blob();
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let binary = '';

    for (let i = 0; i < bytes.length; i += 0x8000)
        binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));

    return `data:${blob.type || 'image/png'};base64,${btoa(binary)}`;
}
