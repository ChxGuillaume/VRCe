// Display data the components attach to API objects.

// Trust rank computed from a user's `system_trust_*` tags.
export interface Rank {
    color: string;
    name: string;
    power: number;
    light?: boolean;
}

// Status / state chip, `power` is used to sort and group.
export interface StatusBadge {
    color: string;
    name: string;
    power: number;
    light?: boolean;
}
