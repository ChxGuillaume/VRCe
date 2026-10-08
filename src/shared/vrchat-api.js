// VRChat REST API, as documented by https://vrchat.community (community maintained OpenAPI spec).
//
// The documented host is https://api.vrchat.cloud/api/1, but the extension reuses the session of the
// vrchat.com website, whose `auth` cookie is only sent to vrchat.com. The website serves the same API
// under https://vrchat.com/api/1, so that's what is used here.
export const API_URL = 'https://vrchat.com/api/1';
export const PIPELINE_URL = 'wss://pipeline.vrchat.cloud/';

// Profile fields were moved out of the user endpoints to /profile/{userId}.
const PROFILE_FIELDS = ['bio', 'bioLinks', 'userIcon', 'currentAvatarImageUrl', 'currentAvatarThumbnailImageUrl', 'pronouns'];

// Pages like the friends table fetch one user per friend, keep the load on the API reasonable.
const MAX_CONCURRENT_REQUESTS = 4;

export class ApiError extends Error {
    constructor(status, data) {
        super(data?.error?.message || `VRChat API error ${status}`);
        this.status = status;
        this.data = data;
    }
}

let activeRequests = 0;
const pendingRequests = [];

async function acquireSlot() {
    if (activeRequests >= MAX_CONCURRENT_REQUESTS) await new Promise(resolve => pendingRequests.push(resolve));
    activeRequests++;
}

function releaseSlot() {
    activeRequests--;
    pendingRequests.shift()?.();
}

export async function apiFetch(path, {method = 'GET', query, body} = {}) {
    const url = new URL(API_URL + path);

    Object.entries(query || {}).forEach(([key, value]) => {
        if (value !== undefined) url.searchParams.set(key, value);
    });

    await acquireSlot();

    try {
        const response = await fetch(url, {
            method,
            credentials: 'include',
            headers: body ? {'Content-Type': 'application/json'} : undefined,
            body: body ? JSON.stringify(body) : undefined
        });
        const data = await response.json().catch(() => null);

        if (!response.ok) throw new ApiError(response.status, data);

        return data;
    } finally {
        releaseSlot();
    }
}

// 503 is what Cloudflare answers when it wants the user to pass a browser check on vrchat.com.
export const isCloudflareError = (e) => e instanceof ApiError && e.status === 503;
export const isUnauthorized = (e) => e instanceof ApiError && e.status === 401;

export const getCurrentUser = () => apiFetch('/auth/user');

export const logout = () => apiFetch('/logout', {method: 'PUT'});

export const getUser = (userId) => apiFetch(`/users/${userId}`);

export const getProfile = (userId) => apiFetch(`/profile/${userId}`);

export const updateProfile = (userId, profile) => apiFetch(`/profile/${userId}`, {method: 'PUT', body: profile});

// A user with the profile fields (bio, icon, avatar thumbnail...) the user endpoints no longer return.
export async function withProfile(user) {
    const profile = await getProfile(user.id).catch(e => {
        console.warn(`Could not fetch the profile of ${user.id}`, e);
        return null;
    });

    if (profile) PROFILE_FIELDS.forEach(field => {
        if (profile[field] !== undefined) user[field] = profile[field];
    });

    return user;
}

export const getUserWithProfile = async (userId) => withProfile(await getUser(userId));

// Friend entries only carry a partial user (no username, state and `tags` is always empty).
export const getFriends = ({offline = false, n = 100, offset = 0} = {}) =>
    apiFetch('/auth/user/friends', {query: {offline, n, offset}});

export const getWorld = (worldId) => apiFetch(`/worlds/${worldId}`);

// `location` is a full instance location, `wrld_...:12345~region(eu)`.
export const getInstance = (location) => apiFetch(`/instances/${location}`);

export const inviteMyselfTo = (location) => apiFetch(`/invite/myself/to/${location}`, {method: 'POST'});

export const getFiles = (tag, n = 100) => apiFetch('/files', {query: {tag, n}});

export const deleteFile = (fileId) => apiFetch(`/file/${fileId}`, {method: 'DELETE'});

export const getPlayerModerations = () => apiFetch('/auth/user/playermoderations');

// Best picture to represent a user, whatever kind of user object it is (friend, user, profile, event...).
export function userImageUrl(user) {
    return user.profilePicOverride
        || user.currentAvatarThumbnailImageUrl
        || user.currentAvatarImageUrl
        || user.userIcon
        || user.iconUrl;
}
