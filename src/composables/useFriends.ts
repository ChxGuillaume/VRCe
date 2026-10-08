import {computed, ref, shallowRef} from 'vue';
import {type Presence, presenceOf, parseLocation, type ParsedLocation, worldIdOf} from '../lib/vrchat';
import {getFavoriteFriends, toggleFavoriteFriend} from '../shared/storage';
import {getFriends} from '../shared/vrchat-api';
import type {LimitedUserFriend} from '../types/vrchat';
import {useWorlds} from './useWorlds';

export interface Friend extends LimitedUserFriend {
    presence: Presence;
    place: ParsedLocation;
    favorite: boolean;
}

const PAGE_SIZE = 100;

// One friend list per page, shared by every component.
const rawFriends = shallowRef<LimitedUserFriend[]>([]);
const favoriteIds = ref<string[]>([]);
const loading = ref(false);
const loaded = ref(false);

const friends = computed<Friend[]>(() => rawFriends.value.map(friend => ({
    ...friend,
    presence: presenceOf(friend),
    place: parseLocation(friend.location),
    favorite: favoriteIds.value.includes(friend.id)
})));

// Most available first, then by name.
const sortedFriends = computed(() => [...friends.value].sort((a, b) =>
    b.presence.order - a.presence.order || a.displayName.localeCompare(b.displayName)));

async function fetchAllPages(offline: boolean): Promise<LimitedUserFriend[]> {
    const all: LimitedUserFriend[] = [];

    for (let offset = 0; ; offset += PAGE_SIZE) {
        const page = await getFriends({offline, n: PAGE_SIZE, offset});
        all.push(...page);

        if (page.length < PAGE_SIZE) return all;
    }
}

async function load(): Promise<void> {
    loading.value = true;

    try {
        favoriteIds.value = await getFavoriteFriends();

        // Online friends first so the list shows up quickly, offline ones are appended afterwards.
        rawFriends.value = await fetchAllPages(false);
        loaded.value = true;

        const offline = await fetchAllPages(true);
        const known = new Set(rawFriends.value.map(friend => friend.id));
        rawFriends.value = [...rawFriends.value, ...offline.filter(friend => !known.has(friend.id))];
    } catch (e) {
        console.error('Could not load friends', e);
    } finally {
        loading.value = false;
        loaded.value = true;
    }

    // Prefetch the worlds friends are in, for the locations and the worlds tab.
    const {loadWorld} = useWorlds();
    new Set(rawFriends.value.map(friend => worldIdOf(friend.location)).filter(id => id !== null))
        .forEach(worldId => loadWorld(worldId));
}

async function toggleFavorite(userId: string): Promise<void> {
    favoriteIds.value = await toggleFavoriteFriend(userId);
}

export function useFriends() {
    return {
        friends: sortedFriends,
        favoriteIds,
        loading,
        loaded,
        load,
        toggleFavorite,
        friendById: (id: string): Friend | undefined => friends.value.find(friend => friend.id === id)
    };
}
