import {onScopeDispose, shallowRef} from 'vue';
import {MessageType, sendToBackground, subscribeToEvents} from '../shared/messages';
import type {PipelineEvent} from '../types/events';

const time = (event: PipelineEvent) => new Date(event.date).getTime();

// Live pipeline events streamed by the service worker, newest first.
export function useEvents() {
    const events = shallowRef<PipelineEvent[]>([]);
    const ready = shallowRef(false);

    const unsubscribe = subscribeToEvents((message) => {
        if (message.type === MessageType.ALL_EVENTS) {
            events.value = [...message.events].sort((a, b) => time(b) - time(a));
            ready.value = true;
        } else if (message.type === MessageType.NEW_EVENTS) {
            events.value = [message.event, ...events.value];
        }
    });

    onScopeDispose(unsubscribe);

    return {
        events,
        ready,
        clear: () => sendToBackground(MessageType.CLEAR_EVENTS)
    };
}
