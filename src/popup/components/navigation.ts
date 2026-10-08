export type PopupTab = 'friends' | 'worlds' | 'events' | 'gallery' | 'settings';

export interface PopupTabItem {
    value: PopupTab;
    label: string;
    icon: string;
}

export const POPUP_TABS: PopupTabItem[] = [
    {value: 'friends', label: 'Friends', icon: 'i-lucide-users'},
    {value: 'worlds', label: 'Worlds', icon: 'i-lucide-earth'},
    {value: 'events', label: 'Events', icon: 'i-lucide-history'},
    {value: 'gallery', label: 'Gallery', icon: 'i-lucide-images'},
    {value: 'settings', label: 'Settings', icon: 'i-lucide-settings'}
];

const DEFAULT_TAB_KEY = 'default_tab';

export function defaultTab(): PopupTab {
    try {
        const stored = localStorage.getItem(DEFAULT_TAB_KEY);
        if (POPUP_TABS.some(tab => tab.value === stored)) return stored as PopupTab;
    } catch {
        // Storage unavailable, use the friends tab.
    }

    return 'friends';
}
