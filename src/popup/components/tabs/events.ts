// Presentation of pipeline events for the popup events tab.
import dayjs from 'dayjs';
import type {EventUser, PipelineEvent} from '../../../types/events';

export interface EventTypeOption {
    label: string;
    value: string;
}

export const EVENT_TYPES: EventTypeOption[] = [
    {label: 'Friend online', value: 'friend-online'},
    {label: 'Friend on website', value: 'friend-active'},
    {label: 'Friend offline', value: 'friend-offline'},
    {label: 'Friend location', value: 'friend-location'},
    {label: 'Friend profile update', value: 'friend-update'},
    {label: 'Friend added', value: 'friend-add'},
    {label: 'Friend removed', value: 'friend-delete'},
    {label: 'Your profile update', value: 'user-update'},
    {label: 'Notifications', value: 'notification'}
];

// Same storage key and defaults as the previous UI, so users keep their filter.
export const TYPES_STORAGE_KEY = 'popup-events-types-shown';
export const DEFAULT_TYPES = ['friend-online', 'friend-active', 'friend-offline', 'friend-location', 'friend-update', 'notification'];

export const UPDATE_TYPES = ['friend-update', 'user-update'];

interface EventStyle {
    icon: string;
    color: string;
}

const EVENT_STYLES: Record<string, EventStyle> = {
    'friend-online': {icon: 'i-lucide-zap', color: '#4ade80'},
    'friend-active': {icon: 'i-lucide-monitor', color: '#facc15'},
    'friend-offline': {icon: 'i-lucide-power', color: '#71717a'},
    'friend-location': {icon: 'i-lucide-map-pin', color: '#a78bfa'},
    'friend-update': {icon: 'i-lucide-pencil', color: '#38bdf8'},
    'user-update': {icon: 'i-lucide-user-pen', color: '#38bdf8'},
    'friend-add': {icon: 'i-lucide-user-plus', color: '#22d3ee'},
    'friend-delete': {icon: 'i-lucide-user-minus', color: '#f43f5e'}
};

const NOTIFICATION_STYLES: Record<string, EventStyle> = {
    invite: {icon: 'i-lucide-mail', color: '#42caff'},
    requestInvite: {icon: 'i-lucide-hand', color: '#fb923c'},
    inviteResponse: {icon: 'i-lucide-reply', color: '#f472b6'},
    requestInviteResponse: {icon: 'i-lucide-reply', color: '#f472b6'},
    friendRequest: {icon: 'i-lucide-user-plus', color: '#4ade80'},
    boop: {icon: 'i-lucide-hand-heart', color: '#f472b6'},
    message: {icon: 'i-lucide-message-circle', color: '#38bdf8'}
};

const FALLBACK_STYLE: EventStyle = {icon: 'i-lucide-bell', color: '#a1a1aa'};

export function eventStyle(event: PipelineEvent): EventStyle {
    if (event.type === 'notification') return NOTIFICATION_STYLES[event.content.type ?? ''] ?? FALLBACK_STYLE;

    return EVENT_STYLES[event.type] ?? FALLBACK_STYLE;
}

// What happened, after the user's name ("Alice <came online>").
export function eventSentence(event: PipelineEvent): string {
    const content = event.content;

    switch (event.type) {
        case 'friend-online':
            return 'came online';
        case 'friend-active':
            return 'is active on the website';
        case 'friend-offline':
            return 'went offline';
        case 'friend-add':
            return 'is now your friend';
        case 'friend-delete':
            return 'is no longer your friend';
        case 'friend-location':
            if (content.location === 'private') return 'went to a private world';
            if (content.location?.startsWith('traveling')) return 'is traveling';
            return content.world?.name ? `joined ${content.world.name}` : 'changed instance';
        case 'friend-update':
            return 'updated their profile';
        case 'user-update':
            return 'updated your profile';
        case 'notification':
            switch (content.type) {
                case 'invite':
                    return content.details?.worldName ? `invited you to ${content.details.worldName}` : 'invited you';
                case 'requestInvite':
                    return 'requested an invite';
                case 'inviteResponse':
                case 'requestInviteResponse':
                    return 'replied to you';
                case 'friendRequest':
                    return 'sent you a friend request';
                case 'boop':
                    return 'booped you';
                case 'message':
                    return 'sent you a message';
                default:
                    return 'sent you a notification';
            }
        default:
            return event.type;
    }
}

// Extra line under the sentence: the notification message, if any.
export function eventMessage(event: PipelineEvent): string | undefined {
    if (event.type !== 'notification') return undefined;

    const details = event.content.details;

    return details?.inviteMessage || details?.requestMessage || details?.responseMessage || event.content.message || undefined;
}

export function dayLabel(date: Date | string): string {
    const day = dayjs(date);

    if (day.isSame(dayjs(), 'day')) return 'Today';
    if (day.isSame(dayjs().subtract(1, 'day'), 'day')) return 'Yesterday';

    return day.format('dddd D MMMM');
}

// -- Profile changes --------------------------------------------------------------------------------------------------

export type ChangeKind = 'text' | 'image' | 'status';

export interface UserChange {
    key: string;
    label: string;
    kind: ChangeKind;
    previous: string;
    current: string;
}

// The fields worth showing when a profile changes, in display order.
const CHANGE_FIELDS: {key: keyof EventUser; label: string; kind: ChangeKind}[] = [
    {key: 'displayName', label: 'Name', kind: 'text'},
    {key: 'status', label: 'Status', kind: 'status'},
    {key: 'statusDescription', label: 'Status text', kind: 'text'},
    {key: 'bio', label: 'Bio', kind: 'text'},
    {key: 'pronouns', label: 'Pronouns', kind: 'text'},
    {key: 'currentAvatarThumbnailImageUrl', label: 'Avatar', kind: 'image'},
    {key: 'userIcon', label: 'Icon', kind: 'image'},
    {key: 'profilePicOverride', label: 'Picture', kind: 'image'}
];

export function userChanges(previous: EventUser, current: EventUser): UserChange[] {
    return CHANGE_FIELDS.flatMap(({key, label, kind}) => {
        const before = previous[key];
        const after = current[key];

        if (typeof before !== 'string' || typeof after !== 'string' || before === after) return [];

        return [{key, label, kind, previous: before, current: after}];
    });
}
