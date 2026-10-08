import {readonly, ref} from 'vue';

// The user whose details panel is open, so any tab (friends, worlds, events...) can open it.
const userId = ref<string | null>(null);

export function useFriendDetails() {
    return {
        userId: readonly(userId),
        open: (id: string) => userId.value = id,
        close: () => userId.value = null
    };
}
