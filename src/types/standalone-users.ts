// Display rows the standalone page (friends table, personal infos, user details) builds from API users.
import dayjs from 'dayjs';
import type {ProfileFields} from '../shared/vrchat-api';
import type {Rank, StatusBadge} from './view';
import type {CurrentUser, User, World} from './vrchat';

type DecoratedField = 'state' | 'status' | 'last_login' | 'last_platform' | 'bioLinks';

export type UserRow<T extends User | CurrentUser = User> = Omit<T & ProfileFields, DecoratedField> & {
    // Only returned for the current user.
    username?: string;
    rank: Rank;
    state: StatusBadge;
    status: StatusBadge;
    bioLinks: string[];
    languages: string[];
    // Formatted date, or "Unavailable".
    last_login: string;
    // Readable platform name.
    last_platform: string;
    // Filled once fetched, by the user details dialog.
    world?: World;
};

export type CurrentUserRow = UserRow<CurrentUser>;

export function userRank(tags: string[]): Rank {
    if (tags.includes('system_legend') && tags.includes('system_trust_legend') && tags.includes('system_trust_trusted'))
        return {color: '#FF69B4', name: 'Legend', power: 0};
    if (tags.includes('system_trust_legend') && tags.includes('system_trust_trusted'))
        return {color: '#5D88BB', name: 'Veteran', power: 1};
    if (tags.includes('system_trust_veteran') && tags.includes('system_trust_trusted'))
        return {color: '#8143E6', name: 'Trusted', power: 2};
    if (tags.includes('system_trust_trusted'))
        return {color: '#FF7B42', name: 'Known', power: 3};
    if (tags.includes('system_trust_known'))
        return {color: '#2BCF5C', name: 'User', power: 4};
    if (tags.includes('system_trust_basic'))
        return {color: '#1778FF', name: 'New User', power: 5};

    return {color: '#CCCCCC', name: 'Visitor', power: 6};
}

export function userState(state: string): StatusBadge {
    switch (state) {
        case 'online':
            return {color: '#60ad5e', name: 'Online', power: 0};
        case 'active':
            return {color: '#ebd23b', name: 'Active', power: 1};
        case 'offline':
            return {color: '#dddddd', name: 'Offline', power: 2, light: true};
        default:
            return {color: '#CCCCCC', name: state, power: 3, light: true};
    }
}

export function userStatus(status: string): StatusBadge {
    switch (status) {
        case 'join me':
            return {color: '#42caff', name: 'Join Me', power: 4};
        case 'active':
            return {color: '#60ad5e', name: 'Active', power: 3};
        case 'ask me':
            return {color: '#e88134', name: 'Ask Me', power: 2};
        case 'busy':
            return {color: '#5b0b0b', name: 'Busy', power: 1};
        default:
            return {color: '#CCCCCC', name: status, power: 0};
    }
}

export function readablePlatform(platform: string): string {
    switch (platform) {
        case 'standalonewindows':
            return 'PC/VR';
        case 'android':
            return 'Quest';
        default:
            return platform;
    }
}

export function languagesFromTags(tags: string[]): string[] {
    return tags.filter(tag => tag.startsWith('language_')).map(tag => tag.replace('language_', ''));
}

export function formatLastLogin(lastLogin: string | undefined): string {
    return lastLogin ? dayjs(lastLogin).format('YYYY-MM-DD HH:mm:ss') : 'Unavailable';
}

export function toUserRow<T extends User | CurrentUser>(user: T & ProfileFields): UserRow<T> {
    const tags = user.tags || [];

    return {
        ...user,
        rank: userRank(tags),
        state: userState(user.state),
        status: userStatus(user.status),
        bioLinks: (user.bioLinks || []).filter(link => link),
        languages: languagesFromTags(tags),
        last_login: formatLastLogin(user.last_login),
        last_platform: readablePlatform(user.last_platform)
    } as UserRow<T>;
}
