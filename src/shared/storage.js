// Persistent extension data, shared by the service worker and the extension pages.

export const DEFAULT_SETTINGS = {
    notify_online: false,
    notify_online_favorited: false,
    notify_notifications: false
};

export async function getSettings() {
    const {settings} = await chrome.storage.local.get('settings');

    return {...DEFAULT_SETTINGS, ...settings};
}

export function saveSettings(settings) {
    return chrome.storage.local.set({settings});
}

export async function getFavoriteFriends() {
    const {favorite_friends} = await chrome.storage.local.get('favorite_friends');

    return favorite_friends || [];
}

export async function toggleFavoriteFriend(userId) {
    const favoriteFriends = await getFavoriteFriends();
    const index = favoriteFriends.indexOf(userId);

    if (index === -1) favoriteFriends.push(userId); else favoriteFriends.splice(index, 1);

    await chrome.storage.local.set({favorite_friends: favoriteFriends});

    return favoriteFriends;
}

// The MV2 background page kept these keys in localStorage, which a service worker can't read.
// Extension pages share that localStorage, so they move the data to chrome.storage once.
export async function migrateLegacyStorage() {
    for (const key of ['settings', 'favorite_friends']) {
        const legacyValue = localStorage.getItem(key);
        if (legacyValue === null) continue;

        const stored = await chrome.storage.local.get(key);

        if (stored[key] === undefined) {
            try {
                await chrome.storage.local.set({[key]: JSON.parse(legacyValue)});
            } catch (e) {
                console.warn(`Could not migrate legacy "${key}"`, e);
            }
        }

        localStorage.removeItem(key);
    }
}
