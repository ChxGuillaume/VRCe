import {reactive} from 'vue';
import {getWorld} from '../shared/vrchat-api';
import type {World} from '../types/vrchat';

// Worlds fetched by this page, by id. Shared so a world is only fetched once.
const worlds = reactive(new Map<string, World>());
const pending = new Map<string, Promise<World | null>>();

function loadWorld(worldId: string): Promise<World | null> {
    const known = worlds.get(worldId);
    if (known) return Promise.resolve(known);

    let request = pending.get(worldId);

    if (!request) {
        request = getWorld(worldId)
            .then(world => {
                worlds.set(worldId, world);
                return world;
            })
            .catch(e => {
                console.warn(`Could not fetch world ${worldId}`, e);
                return null;
            })
            .finally(() => pending.delete(worldId));
        pending.set(worldId, request);
    }

    return request;
}

export function useWorlds() {
    return {
        worlds,
        loadWorld,
        worldOf: (worldId: string | null | undefined): World | undefined => worldId ? worlds.get(worldId) : undefined
    };
}
