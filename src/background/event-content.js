import {getWorld} from '../shared/vrchat-api';

const MAX_CACHED_WORLDS = 200;

// worldId -> Promise of the few world fields the events need.
const worldCache = new Map();

function worldSummary(worldId) {
    if (!worldId?.startsWith('wrld_')) return Promise.resolve({});

    if (!worldCache.has(worldId)) {
        if (worldCache.size >= MAX_CACHED_WORLDS) worldCache.delete(worldCache.keys().next().value);

        worldCache.set(worldId, getWorld(worldId).then(
            ({id, name, thumbnailImageUrl, imageUrl}) => ({id, name, thumbnailImageUrl, imageUrl}),
            (e) => {
                worldCache.delete(worldId);
                console.warn(`Could not fetch world ${worldId}`, e);
                return {};
            }
        ));
    }

    return worldCache.get(worldId);
}

function parseJson(value) {
    try {
        return JSON.parse(value);
    } catch {
        return value;
    }
}

// Pipeline messages double encode their content, and a few events differ from what the UI expects.
// See https://vrchat.community websocket documentation.
export async function parseEventContent(type, rawContent) {
    const content = parseJson(rawContent);
    if (!content || typeof content !== 'object') return content;

    // `friend-active` events spell it `userid`.
    if (content.userid && !content.userId) content.userId = content.userid;

    if (type === 'notification' && typeof content.details === 'string') content.details = parseJson(content.details);

    // `friend-location` events no longer embed the world, only its id.
    if (type === 'friend-location' && !content.world)
        content.world = await worldSummary(content.worldId || content.location?.split(':')[0]);

    return content;
}
