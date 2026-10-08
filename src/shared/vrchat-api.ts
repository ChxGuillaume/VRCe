// VRChat REST API, as documented by https://vrchat.community (community maintained OpenAPI spec).
//
// The documented host is https://api.vrchat.cloud/api/1, but the extension reuses the session of the
// vrchat.com website, whose `auth` cookie is only sent to vrchat.com. The website serves the same API
// under https://vrchat.com/api/1, so that's what is used here.
import type {
    ApiErrorResponse,
    CurrentUser,
    Instance,
    LimitedUserFriend,
    PlayerModeration,
    PublicProfile,
    UpdateProfileRequest,
    User,
    VRChatFile,
    World
} from '../types/vrchat';

export const API_URL = 'https://vrchat.com/api/1';
export const PIPELINE_URL = 'wss://pipeline.vrchat.cloud/';

// Profile fields were moved out of the user endpoints to /profile/{userId}.
const PROFILE_FIELDS = ['bio', 'bioLinks', 'userIcon', 'currentAvatarImageUrl', 'currentAvatarThumbnailImageUrl', 'pronouns'] as const;

export type ProfileFields = Partial<Pick<PublicProfile, typeof PROFILE_FIELDS[number]>>;

// Pages like the friends table fetch one user per friend, keep the load on the API reasonable.
const MAX_CONCURRENT_REQUESTS = 4;

export class ApiError extends Error {
    readonly status: number;
    readonly data: ApiErrorResponse | null;

    constructor(status: number, data: ApiErrorResponse | null) {
        super(data?.error?.message || `VRChat API error ${status}`);
        this.status = status;
        this.data = data;
    }
}

let activeRequests = 0;
const pendingRequests: (() => void)[] = [];

async function acquireSlot(): Promise<void> {
    if (activeRequests >= MAX_CONCURRENT_REQUESTS) await new Promise<void>(resolve => pendingRequests.push(resolve));
    activeRequests++;
}

function releaseSlot(): void {
    activeRequests--;
    pendingRequests.shift()?.();
}

interface RequestOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    query?: Record<string, string | number | boolean | undefined>;
    body?: unknown;
}

export async function apiFetch<T>(path: string, {method = 'GET', query, body}: RequestOptions = {}): Promise<T> {
    const url = new URL(API_URL + path);

    Object.entries(query || {}).forEach(([key, value]) => {
        if (value !== undefined) url.searchParams.set(key, String(value));
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

        if (!response.ok) throw new ApiError(response.status, data as ApiErrorResponse | null);

        return data as T;
    } finally {
        releaseSlot();
    }
}

// 503 is what Cloudflare answers when it wants the user to pass a browser check on vrchat.com.
export const isCloudflareError = (e: unknown): boolean => e instanceof ApiError && e.status === 503;
export const isUnauthorized = (e: unknown): boolean => e instanceof ApiError && e.status === 401;

export const getCurrentUser = () => apiFetch<CurrentUser>('/auth/user');

export const logout = () => apiFetch<unknown>('/logout', {method: 'PUT'});

export const getUser = (userId: string) => apiFetch<User>(`/users/${userId}`);

export const getProfile = (userId: string) => apiFetch<PublicProfile>(`/profile/${userId}`);

export const updateProfile = (userId: string, profile: UpdateProfileRequest) =>
    apiFetch<PublicProfile>(`/profile/${userId}`, {method: 'PUT', body: profile});

// A user with the profile fields (bio, icon, avatar thumbnail...) the user endpoints no longer return.
export async function withProfile<T extends {id: string}>(user: T): Promise<T & ProfileFields> {
    const profile = await getProfile(user.id).catch(e => {
        console.warn(`Could not fetch the profile of ${user.id}`, e);
        return null;
    });
    const result: T & ProfileFields = user;

    if (profile) PROFILE_FIELDS.forEach(field => {
        if (profile[field] !== undefined) Object.assign(result, {[field]: profile[field]});
    });

    return result;
}

export const getUserWithProfile = async (userId: string) => withProfile(await getUser(userId));

// Friend entries only carry a partial user (no username, state and `tags` is always empty).
export const getFriends = ({offline = false, n = 100, offset = 0} = {}) =>
    apiFetch<LimitedUserFriend[]>('/auth/user/friends', {query: {offline, n, offset}});

export const getWorld = (worldId: string) => apiFetch<World>(`/worlds/${worldId}`);

// `location` is a full instance location, `wrld_...:12345~region(eu)`.
export const getInstance = (location: string) => apiFetch<Instance>(`/instances/${location}`);

export const inviteMyselfTo = (location: string) => apiFetch<unknown>(`/invite/myself/to/${location}`, {method: 'POST'});

export const getFiles = (tag: string, n = 100) => apiFetch<VRChatFile[]>('/files', {query: {tag, n}});

export const deleteFile = (fileId: string) => apiFetch<unknown>(`/file/${fileId}`, {method: 'DELETE'});

export const getPlayerModerations = () => apiFetch<PlayerModeration[]>('/auth/user/playermoderations');

export interface UserImageSource {
    profilePicOverride?: string;
    currentAvatarThumbnailImageUrl?: string;
    currentAvatarImageUrl?: string;
    userIcon?: string;
    iconUrl?: string;
}

// Best picture to represent a user, whatever kind of user object it is (friend, user, profile, event...).
export function userImageUrl(user: UserImageSource): string | undefined {
    return user.profilePicOverride
        || user.currentAvatarThumbnailImageUrl
        || user.currentAvatarImageUrl
        || user.userIcon
        || user.iconUrl;
}
