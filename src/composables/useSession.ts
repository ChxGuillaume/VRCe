import {readonly, ref} from 'vue';
import {MessageType, sendToBackground} from '../shared/messages';
import {getCurrentUser, isCloudflareError, isUnauthorized, logout as apiLogout, type ProfileFields, withProfile} from '../shared/vrchat-api';
import type {CurrentUser} from '../types/vrchat';

export type SessionUser = CurrentUser & ProfileFields;

// `logged-out` also covers a login waiting for its two factor step.
export type SessionStatus = 'loading' | 'ready' | 'logged-out' | 'cloudflare' | 'error';

// One session per page, shared by every component.
const user = ref<SessionUser | null>(null);
const status = ref<SessionStatus>('loading');

async function load(): Promise<void> {
    status.value = 'loading';

    try {
        const currentUser = await getCurrentUser();

        // A pending two factor authentication answers `{requiresTwoFactorAuth: [...]}` instead of a user.
        if (!currentUser?.id) {
            user.value = null;
            status.value = 'logged-out';
            return;
        }

        user.value = await withProfile(currentUser);
        status.value = 'ready';
    } catch (e) {
        user.value = null;

        if (isUnauthorized(e)) status.value = 'logged-out';
        else if (isCloudflareError(e)) status.value = 'cloudflare';
        else {
            console.error('Could not load the current user', e);
            status.value = 'error';
        }
    }
}

async function logout(): Promise<void> {
    await apiLogout().catch(e => console.warn('Logout failed', e));
    await sendToBackground(MessageType.LOGOUT);

    user.value = null;
    status.value = 'logged-out';
}

// Merges fields changed elsewhere (e.g. a new user icon) into the session user.
function patchUser(patch: Partial<SessionUser>): void {
    if (user.value) user.value = {...user.value, ...patch};
}

export function useSession() {
    return {
        user: readonly(user),
        status: readonly(status),
        load,
        logout,
        patchUser
    };
}
