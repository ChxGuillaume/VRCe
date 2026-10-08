import type {Notification, User} from './vrchat';

// The user objects carried by pipeline events. They are User objects, plus a few extra fields on `user-update`.
export type EventUser = Partial<User> & {
    id: string;
    displayName: string;
    username?: string;
    bio?: string;
    userIcon?: string;
    profilePicOverride?: string;
    currentAvatarImageUrl?: string;
    currentAvatarThumbnailImageUrl?: string;
};

// The few world fields the service worker attaches to `friend-location` events, empty when private.
export interface EventWorld {
    id?: string;
    name?: string;
    thumbnailImageUrl?: string;
    imageUrl?: string;
}

// Parsed `content` of a pipeline event, see the vrchat.community websocket documentation.
// Notification events carry a Notification, whose `details` is already an object on the pipeline.
export interface PipelineEventContent extends Partial<Omit<Notification, 'details' | 'type'>> {
    userId?: string;
    userid?: string;
    user?: EventUser;
    location?: string;
    travelingToLocation?: string;
    worldId?: string;
    world?: EventWorld;
    platform?: string;
    canRequestInvite?: boolean;
    // Notification type, for `notification` events.
    type?: string;
    details?: Record<string, string | undefined>;
    // Events whose content isn't an object (`see-notification`...) keep it here.
    value?: unknown;
    // Set by the events tab on `friend-update` / `user-update` events: the previous version of the user,
    // and the previous value of each string field that changed.
    previous_user?: EventUser;
    previous_user_changes?: Record<string, string>;
}

export interface PipelineEvent {
    // Dexie primary key.
    id?: number;
    uid: string;
    type: string;
    // A Date in IndexedDB, an ISO string once sent through a port.
    date: Date | string;
    content: PipelineEventContent;
    err?: string;
}
