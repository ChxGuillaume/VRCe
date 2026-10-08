import {getWorld} from '../shared/vrchat-api';
import type {EventWorld, PipelineEventContent} from '../types/events';

const MAX_CACHED_WORLDS = 200;

// worldId -> the few world fields the events need.
const worldCache = new Map<string, Promise<EventWorld>>();

function worldSummary(worldId: string | undefined): Promise<EventWorld> {
    if (!worldId?.startsWith('wrld_')) return Promise.resolve({});

    let world = worldCache.get(worldId);

    if (!world) {
        if (worldCache.size >= MAX_CACHED_WORLDS) worldCache.delete(worldCache.keys().next().value!);

        world = getWorld(worldId).then(
            ({id, name, thumbnailImageUrl, imageUrl}) => ({id, name, thumbnailImageUrl, imageUrl}),
            (e) => {
                worldCache.delete(worldId);
                console.warn(`Could not fetch world ${worldId}`, e);
                return {};
            }
        );
        worldCache.set(worldId, world);
    }

    return world;
}

function parseJson(value: unknown): unknown {
    if (typeof value !== 'string') return value;

    try {
        return JSON.parse(value);
    } catch {
        return value;
    }
}

// Pipeline messages double encode their content, and a few events differ from what the UI expects.
// See https://vrchat.community websocket documentation.
export async function parseEventContent(type: string, rawContent: unknown): Promise<PipelineEventContent> {
    const parsed = parseJson(rawContent);

    // `see-notification`, `hide-notification`... only carry an id.
    if (!parsed || typeof parsed !== 'object') return {value: parsed};

    const content = parsed as PipelineEventContent;

    // `friend-active` events spell it `userid`.
    if (content.userid && !content.userId) content.userId = content.userid;

    if (type === 'notification' && typeof content.details === 'string')
        content.details = parseJson(content.details) as PipelineEventContent['details'];

    // `friend-location` events no longer embed the world, only its id.
    if (type === 'friend-location' && !content.world)
        content.world = await worldSummary(content.worldId || content.location?.split(':')[0]);

    return content;
}
