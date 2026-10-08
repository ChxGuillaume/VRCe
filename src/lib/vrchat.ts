// VRChat domain helpers shared by every page: presence, trust rank, locations, platforms, dates.
// See https://vrchat.community for the meaning of the API values.
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

// -- Presence ---------------------------------------------------------------------------------------------------------

export type PresenceKey = 'join-me' | 'online' | 'ask-me' | 'busy' | 'active' | 'offline';

export interface Presence {
    key: PresenceKey;
    label: string;
    // Hex color, also available as the `presence-<key>` Tailwind color.
    color: string;
    // Higher is more available, used to sort and group friends.
    order: number;
}

export const PRESENCES: Record<PresenceKey, Presence> = {
    'join-me': {key: 'join-me', label: 'Join Me', color: '#42caff', order: 5},
    'online': {key: 'online', label: 'Online', color: '#4ade80', order: 4},
    'ask-me': {key: 'ask-me', label: 'Ask Me', color: '#fb923c', order: 3},
    'busy': {key: 'busy', label: 'Busy', color: '#f43f5e', order: 2},
    'active': {key: 'active', label: 'On website', color: '#facc15', order: 1},
    'offline': {key: 'offline', label: 'Offline', color: '#71717a', order: 0}
};

interface PresenceSource {
    status?: string;
    state?: string;
    location?: string;
}

// What a user is doing right now: offline, on the website (active) or in game with a status.
// Full users have a `state` (online / active / offline), friend list entries only have a location.
export function presenceOf(user: PresenceSource): Presence {
    if (user.state === 'offline') return PRESENCES.offline;
    if (user.state === 'active') return PRESENCES.active;

    if (user.state !== 'online') {
        if (user.location === 'offline') return PRESENCES.offline;
        // In game users always have a location, an empty one means they are on the website.
        if (!user.location) return PRESENCES.active;
    }

    switch (user.status) {
        case 'join me':
            return PRESENCES['join-me'];
        case 'ask me':
            return PRESENCES['ask-me'];
        case 'busy':
            return PRESENCES.busy;
        case 'offline':
            return PRESENCES.offline;
        default:
            return PRESENCES.online;
    }
}

// The status a user picked (Join Me, Online...), regardless of whether they are online.
export function chosenStatus(status: string | undefined): Presence {
    return presenceOf({status, location: 'wrld_'});
}

// -- Trust rank -------------------------------------------------------------------------------------------------------

export type RankKey = 'visitor' | 'new-user' | 'user' | 'known' | 'trusted' | 'veteran' | 'legend';

export interface TrustRank {
    key: RankKey;
    label: string;
    // Hex color, also available as the `rank-<key>` Tailwind color.
    color: string;
    // Higher is more trusted.
    order: number;
}

export const RANKS: Record<RankKey, TrustRank> = {
    'visitor': {key: 'visitor', label: 'Visitor', color: '#cccccc', order: 0},
    'new-user': {key: 'new-user', label: 'New User', color: '#1778ff', order: 1},
    'user': {key: 'user', label: 'User', color: '#2bcf5c', order: 2},
    'known': {key: 'known', label: 'Known', color: '#ff7b42', order: 3},
    'trusted': {key: 'trusted', label: 'Trusted', color: '#8143e6', order: 4},
    'veteran': {key: 'veteran', label: 'Veteran', color: '#5d88bb', order: 5},
    'legend': {key: 'legend', label: 'Legend', color: '#ff69b4', order: 6}
};

// Friend list entries always have empty tags, so their rank is unknown (null).
export function trustRankOf(tags: readonly string[] | undefined): TrustRank | null {
    if (!tags?.length) return null;

    if (tags.includes('system_legend') && tags.includes('system_trust_legend') && tags.includes('system_trust_trusted'))
        return RANKS.legend;
    if (tags.includes('system_trust_legend') && tags.includes('system_trust_trusted')) return RANKS.veteran;
    if (tags.includes('system_trust_veteran') && tags.includes('system_trust_trusted')) return RANKS.trusted;
    if (tags.includes('system_trust_trusted')) return RANKS.known;
    if (tags.includes('system_trust_known')) return RANKS.user;
    if (tags.includes('system_trust_basic')) return RANKS['new-user'];

    return RANKS.visitor;
}

export const isVRCPlus = (tags: readonly string[] | undefined): boolean => !!tags?.includes('system_supporter');
export const isEarlyAdopter = (tags: readonly string[] | undefined): boolean => !!tags?.includes('system_early_adopter');

export function languagesOf(tags: readonly string[] | undefined): string[] {
    return (tags || []).filter(tag => tag.startsWith('language_')).map(tag => tag.replace('language_', ''));
}

// -- Locations --------------------------------------------------------------------------------------------------------

export type InstanceAccess = 'public' | 'friends+' | 'friends' | 'invite+' | 'invite' | 'group' | 'group+' | 'group public';

export type Region = 'us' | 'use' | 'eu' | 'jp';

export type ParsedLocation =
    | {kind: 'offline' | 'private' | 'traveling' | 'website'}
    | {kind: 'instance'; location: string; worldId: string; instanceId: string; access: InstanceAccess; region: Region};

export const REGION_LABELS: Record<Region, string> = {us: 'US West', use: 'US East', eu: 'Europe', jp: 'Japan'};

// Parses `wrld_...:12345~hidden(usr_...)~region(eu)~nonce(...)` and the special location values.
export function parseLocation(location: string | undefined | null): ParsedLocation {
    if (!location) return {kind: 'website'};
    if (location === 'offline') return {kind: 'offline'};
    if (location === 'private') return {kind: 'private'};
    if (location.startsWith('traveling')) return {kind: 'traveling'};

    const [worldId, instanceId = ''] = location.split(':');
    if (!worldId?.startsWith('wrld_')) return {kind: 'private'};

    const region = (/~region\((\w+)\)/.exec(instanceId)?.[1] || 'us') as Region;
    let access: InstanceAccess = 'public';

    if (instanceId.includes('~private(')) access = instanceId.includes('~canRequestInvite') ? 'invite+' : 'invite';
    else if (instanceId.includes('~hidden(')) access = 'friends+';
    else if (instanceId.includes('~friends(')) access = 'friends';
    else if (instanceId.includes('~group(')) {
        const groupAccess = /~groupAccessType\((\w+)\)/.exec(instanceId)?.[1];
        access = groupAccess === 'public' ? 'group public' : groupAccess === 'plus' ? 'group+' : 'group';
    }

    return {kind: 'instance', location, worldId, instanceId, access, region};
}

export const worldIdOf = (location: string | undefined | null): string | null => {
    const parsed = parseLocation(location);
    return parsed.kind === 'instance' ? parsed.worldId : null;
};

// Opens the VRChat client in the instance (or just launches it).
export const launchUrl = (location?: string): string =>
    location ? `vrchat://launch?ref=vrchat.com&id=${location}` : 'vrchat://launch?ref=vrchat.com';

// -- Platforms & dates ------------------------------------------------------------------------------------------------

export function platformLabel(platform: string | undefined): string {
    switch (platform) {
        case 'standalonewindows':
            return 'PC';
        case 'android':
            return 'Android / Quest';
        case 'ios':
            return 'iOS';
        case 'web':
            return 'Website';
        case undefined:
        case '':
            return 'Unknown';
        default:
            return platform;
    }
}

// API dates can be an empty string when unknown.
export function formatDate(date: string | Date | null | undefined, format = 'YYYY-MM-DD HH:mm'): string {
    return date ? dayjs(date).format(format) : 'Unknown';
}

export function fromNow(date: string | Date | null | undefined): string {
    return date ? dayjs(date).fromNow() : 'Unknown';
}

export function formatNumber(value: number | undefined): string {
    return value === undefined ? '' : new Intl.NumberFormat().format(value);
}

// `author_tag_*` tags of a world, without their prefix.
export function authorTagsOf(tags: readonly string[] | undefined): string[] {
    return (tags || []).filter(tag => tag.startsWith('author_tag_')).map(tag => tag.replace('author_tag_', ''));
}
