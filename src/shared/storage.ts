// Persistent extension data, shared by the service worker and the extension pages.

export interface Settings {
    notify_online: boolean;
    notify_online_favorited: boolean;
    notify_notifications: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
    notify_online: false,
    notify_online_favorited: false,
    notify_notifications: false
};

interface StoredData {
    settings?: Partial<Settings>;
    favorite_friends?: string[];
}

export async function getSettings(): Promise<Settings> {
    const {settings} = await chrome.storage.local.get<StoredData>('settings');

    return {...DEFAULT_SETTINGS, ...settings};
}

export function saveSettings(settings: Settings): Promise<void> {
    return chrome.storage.local.set<StoredData>({settings});
}

export async function getFavoriteFriends(): Promise<string[]> {
    const {favorite_friends} = await chrome.storage.local.get<StoredData>('favorite_friends');

    return favorite_friends || [];
}

export async function toggleFavoriteFriend(userId: string): Promise<string[]> {
    const favoriteFriends = await getFavoriteFriends();
    const index = favoriteFriends.indexOf(userId);

    if (index === -1) favoriteFriends.push(userId); else favoriteFriends.splice(index, 1);

    await chrome.storage.local.set<StoredData>({favorite_friends: favoriteFriends});

    return favoriteFriends;
}

// The MV2 background page kept these keys in localStorage, which a service worker can't read.
// Extension pages share that localStorage, so they move the data to chrome.storage once.
export async function migrateLegacyStorage(): Promise<void> {
    for (const key of ['settings', 'favorite_friends'] as const) {
        const legacyValue = localStorage.getItem(key);
        if (legacyValue === null) continue;

        const stored = await chrome.storage.local.get<StoredData>(key);

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
