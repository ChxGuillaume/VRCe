// Users and worlds as displayed by the popup.
import type {ProfileFields} from '../shared/vrchat-api';
import type {CurrentUser, LimitedUserFriend, User, World} from './vrchat';
import type {Rank, StatusBadge} from './view';

// The minimal user shape the popup knows how to decorate (friend list entries and full users).
export interface DecoratableUser {
    id: string;
    location?: string;
    status: string;
    state?: string;
    tags?: string[];
    bioLinks?: string[];
    last_login: string | null;
    last_platform: string;
}

// Display fields computed from (or replacing) the API fields.
export interface UserDecorations {
    rank: Rank;
    status: StatusBadge;
    bioLinks: string[];
    location: string;
    // Formatted `YYYY-MM-DD HH:mm:ss`.
    last_login: string;
    // `PC/VR`, `Quest` or the raw platform.
    last_platform: string;
    world_icon: string;
    world_link?: string;
    favorited: boolean;
    location_type: string;
    location_region: string | null;
}

export type Decorated<T> = Omit<T, keyof UserDecorations> & UserDecorations;

export type FriendView = Decorated<LimitedUserFriend> & {
    // Not returned by the friend list anymore, kept for the search.
    username?: string;
};

export interface FriendGroup {
    power: number;
    color: string;
    name: string;
    friends: FriendView[];
}

// World with its dates formatted and its `author_tag_*` tags extracted.
export interface PopupWorld extends World {
    author_tags: string[];
}

// The drawer world, either a fetched world or the private world placeholder.
export type DrawerWorld = Partial<PopupWorld> & Pick<World, 'name' | 'thumbnailImageUrl'>;

export type UserDetailsView = Decorated<User & ProfileFields> & {
    username?: string;
    profilePicOverride?: string;
    world?: DrawerWorld;
};

export type PopupUser = CurrentUser & ProfileFields;
