import {ref, shallowRef} from 'vue';
import {getPlayerModerations} from '../../shared/vrchat-api';
import type {PlayerModeration, PlayerModerationType} from '../../types/vrchat';

export interface ModerationKind {
    label: string;
    icon: string;
    color: 'error' | 'warning' | 'success' | 'info' | 'neutral' | 'secondary';
}

// Static map so the icon names stay literal (icons are bundled by scanning the sources).
export const MODERATION_KINDS: Record<PlayerModerationType, ModerationKind> = {
    block: {label: 'Blocked', icon: 'i-lucide-ban', color: 'error'},
    mute: {label: 'Muted', icon: 'i-lucide-mic-off', color: 'warning'},
    unmute: {label: 'Unmuted', icon: 'i-lucide-mic', color: 'success'},
    muteChat: {label: 'Chat muted', icon: 'i-lucide-message-square-off', color: 'warning'},
    unmuteChat: {label: 'Chat unmuted', icon: 'i-lucide-message-square', color: 'success'},
    hideAvatar: {label: 'Avatar hidden', icon: 'i-lucide-eye-off', color: 'info'},
    showAvatar: {label: 'Avatar shown', icon: 'i-lucide-eye', color: 'secondary'},
    interactOff: {label: 'Interactions off', icon: 'i-lucide-hand-metal', color: 'neutral'},
    interactOn: {label: 'Interactions on', icon: 'i-lucide-hand', color: 'neutral'}
};

const UNKNOWN_KIND: ModerationKind = {label: 'Other', icon: 'i-lucide-circle-help', color: 'neutral'};

export const moderationKindOf = (type: string): ModerationKind =>
    MODERATION_KINDS[type as PlayerModerationType] ?? {...UNKNOWN_KIND, label: type};

const moderations = shallowRef<PlayerModeration[]>([]);
const loading = ref(false);
const loaded = ref(false);

async function load(): Promise<void> {
    loading.value = true;

    try {
        moderations.value = await getPlayerModerations();
    } catch (e) {
        console.error('Could not load player moderations', e);
    } finally {
        loading.value = false;
        loaded.value = true;
    }
}

export function useModerations() {
    return {moderations, loading, loaded, load};
}
