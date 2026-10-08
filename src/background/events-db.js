import Dexie from 'dexie';

const EVENT_RETENTION_MS = 24 * 60 * 60 * 1000;

// Same schema as the MV2 background page, so events recorded before the update are kept.
const db = new Dexie('events_db');
db.version(2).stores({
    events: '++id, uid, type, content, date'
});

const retentionStart = () => new Date(Date.now() - EVENT_RETENTION_MS);

export async function pruneOldEvents() {
    const amount = await db.events.where('date').below(retentionStart()).delete();

    if (amount) console.log(`Deleted ${amount} old events.`);
}

export async function getRecentEvents() {
    const events = await db.events.where('date').above(retentionStart()).toArray();

    events.forEach(event => {
        if (!event.uid) event.uid = crypto.randomUUID();
    });

    return events;
}

export function addEvent(event) {
    return db.events.add(event);
}

export function clearEvents() {
    return db.events.clear();
}
