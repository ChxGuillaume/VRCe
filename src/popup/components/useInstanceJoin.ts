import {useToast} from '@nuxt/ui/composables';
import {ref} from 'vue';
import {launchUrl} from '../../lib/vrchat';
import {inviteMyselfTo} from '../../shared/vrchat-api';

// Sends the current user an invite to an instance (to accept in game), with toasts.
export function useInstanceJoin() {
    const toast = useToast();
    const joining = ref<string | null>(null);

    async function join(location: string, worldName?: string): Promise<void> {
        joining.value = location;

        try {
            await inviteMyselfTo(location);
            toast.add({
                title: 'Invite sent',
                description: worldName ? `Check your VRChat notifications to join ${worldName}.` : 'Check your VRChat notifications.',
                icon: 'i-lucide-mail-check',
                color: 'success'
            });
        } catch (e) {
            console.error('Could not send the invite', e);
            toast.add({
                title: 'Couldn\'t send the invite',
                description: 'You may not have access to this instance.',
                icon: 'i-lucide-triangle-alert',
                color: 'error'
            });
        } finally {
            joining.value = null;
        }
    }

    // Opens the VRChat client directly in the instance.
    function launch(location?: string): void {
        chrome.tabs.create({url: launchUrl(location)});
    }

    return {joining, join, launch};
}
