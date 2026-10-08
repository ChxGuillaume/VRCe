import Dexie, {type EntityTable} from 'dexie';
import type {PipelineEvent} from '../types/events';

const EVENT_RETENTION_MS = 24 * 60 * 60 * 1000;

// Same schema as the MV2 background page, so events recorded before the update are kept.
const db = new Dexie('events_db') as Dexie & {events: EntityTable<PipelineEvent, 'id'>};
db.version(2).stores({
    events: '++id, uid, type, content, date'
});

const retentionStart = () => new Date(Date.now() - EVENT_RETENTION_MS);

export async function pruneOldEvents(): Promise<void> {
    const amount = await db.events.where('date').below(retentionStart()).delete();

    if (amount) console.log(`Deleted ${amount} old events.`);
}

export async function getRecentEvents(): Promise<PipelineEvent[]> {
    const events = await db.events.where('date').above(retentionStart()).toArray();

    events.forEach(event => {
        if (!event.uid) event.uid = crypto.randomUUID();
    });

    return events;
}

export function addEvent(event: PipelineEvent): Promise<number | undefined> {
    return db.events.add(event);
}

export function clearEvents(): Promise<void> {
    return db.events.clear();
}
