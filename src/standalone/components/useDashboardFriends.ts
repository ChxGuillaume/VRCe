import {computed, reactive, ref} from 'vue';
import {type Friend, useFriends} from '../../composables/useFriends';
import {useWorlds} from '../../composables/useWorlds';
import {
    isEarlyAdopter,
    isVRCPlus,
    languagesOf,
    type ParsedLocation,
    type Presence,
    presenceOf,
    parseLocation,
    type TrustRank,
    trustRankOf,
    worldIdOf
} from '../../lib/vrchat';
import {getUserWithProfile, type ProfileFields, userImageUrl} from '../../shared/vrchat-api';
import type {User} from '../../types/vrchat';

// The user endpoints dropped `username`, it's kept optional for when it's still returned.
export type FullUser = User & ProfileFields & {username?: string};

// A friend row of the dashboard: the friend list entry, completed by the full user once fetched.
export interface DashboardFriend {
    id: string;
    displayName: string;
    username?: string;
    image?: string;
    presence: Presence;
    statusDescription: string;
    // Unknown until the full user is fetched (friend list entries have no tags).
    rank: TrustRank | null;
    place: ParsedLocation;
    worldId: string | null;
    platform: string;
    languages: string[];
    lastLogin: string | null;
    dateJoined?: string;
    vrcPlus: boolean;
    earlyAdopter: boolean;
    favorite: boolean;
    // Whether the full user has been fetched.
    enriched: boolean;
}

// Full users fetched for the dashboard, by id. Shared with the details slideover.
const fullUsers = reactive(new Map<string, FullUser>());
const pending = new Map<string, Promise<FullUser | null>>();
const enriching = ref(false);

export function loadFullUser(userId: string, force = false): Promise<FullUser | null> {
    const known = fullUsers.get(userId);
    if (known && !force) return Promise.resolve(known);

    let request = pending.get(userId);

    if (!request) {
        request = getUserWithProfile(userId)
            .then(user => {
                fullUsers.set(userId, user);
                return user;
            })
            .catch(e => {
                console.warn(`Could not fetch user ${userId}`, e);
                return null;
            })
            .finally(() => pending.delete(userId));
        pending.set(userId, request);
    }

    return request;
}

function toRow(friend: Friend, user: FullUser | undefined): DashboardFriend {
    // The full user has a fresher location and a state, but friend list entries are updated more often by the
    // friends endpoint, keep the friend location unless the full user knows better.
    const location = user?.location || friend.location;

    return {
        id: friend.id,
        displayName: user?.displayName || friend.displayName,
        username: user?.username,
        image: userImageUrl(user || friend) || userImageUrl(friend),
        presence: user ? presenceOf(user) : friend.presence,
        statusDescription: user?.statusDescription ?? friend.statusDescription,
        rank: trustRankOf(user?.tags),
        place: user ? parseLocation(location) : friend.place,
        worldId: worldIdOf(location),
        platform: user?.last_platform || friend.last_platform,
        languages: languagesOf(user?.tags),
        lastLogin: user?.last_login || friend.last_login,
        dateJoined: user?.date_joined,
        vrcPlus: isVRCPlus(user?.tags),
        earlyAdopter: isEarlyAdopter(user?.tags),
        favorite: friend.favorite,
        enriched: !!user
    };
}

async function enrichAll(ids: string[]): Promise<void> {
    if (enriching.value) return;
    enriching.value = true;

    const {loadWorld} = useWorlds();

    // The API client limits the number of concurrent requests.
    await Promise.all(ids.map(async id => {
        const user = await loadFullUser(id);
        const worldId = worldIdOf(user?.location);
        if (worldId) loadWorld(worldId);
    }));

    enriching.value = false;
}

export function useDashboardFriends() {
    const {friends, loading, loaded, load: loadFriends} = useFriends();

    const rows = computed<DashboardFriend[]>(() => friends.value.map(friend => toRow(friend, fullUsers.get(friend.id))));
    const enrichedCount = computed(() => rows.value.filter(row => row.enriched).length);

    async function load(): Promise<void> {
        await loadFriends();
        await enrichAll(friends.value.map(friend => friend.id));
    }

    return {
        rows,
        loading,
        loaded,
        enriching,
        enrichedCount,
        load,
        fullUserOf: (id: string | null): FullUser | undefined => id ? fullUsers.get(id) : undefined
    };
}
