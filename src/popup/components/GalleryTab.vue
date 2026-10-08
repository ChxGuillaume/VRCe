<script setup lang="ts">
import {computed, ref, watch} from 'vue';
import {useToast} from '@nuxt/ui/composables';
import {useSession} from '../../composables/useSession';
import {isVRCPlus} from '../../lib/vrchat';
import {deleteFile, getFiles, updateProfile} from '../../shared/vrchat-api';
import type {VRChatFile} from '../../types/vrchat';

interface GalleryFile {
  id: string;
  name: string;
  url: string;
}

type GalleryKind = 'icons' | 'photos';

// Image of the latest version of a file.
const toGalleryFile = (file: VRChatFile): GalleryFile => ({
  id: file.id,
  name: file.name,
  url: `https://api.vrchat.cloud/api/1/file/${file.id}/${file.versions?.at(-1)?.version ?? 1}`
});

const fileIdOf = (url: string | undefined) => url?.match(/(file_[^/]+)/)?.[1];

const {user, patchUser} = useSession();
const toast = useToast();

const tab = ref<GalleryKind>('icons');
const files = ref<Record<GalleryKind, GalleryFile[]>>({icons: [], photos: []});
const loading = ref(true);
const settingIcon = ref<string | null>(null);
const toDelete = ref<GalleryFile | null>(null);
const deleting = ref(false);

const supporter = computed(() => isVRCPlus(user.value?.tags));
const currentIconId = computed(() => fileIdOf(user.value?.userIcon));

const tabs = computed(() => [
  {label: 'Icons', value: 'icons', icon: 'i-lucide-circle-user-round', badge: files.value.icons.length || undefined},
  {label: 'Photos', value: 'photos', icon: 'i-lucide-images', badge: files.value.photos.length || undefined}
]);

const shown = computed(() => files.value[tab.value]);

async function load(): Promise<void> {
  loading.value = true;

  try {
    const [icons, photos] = await Promise.all([getFiles('icon'), getFiles('gallery')]);
    files.value = {icons: icons.map(toGalleryFile), photos: photos.map(toGalleryFile)};
  } catch (e) {
    console.error('Could not fetch the gallery', e);
    toast.add({title: 'Could not load your gallery', icon: 'i-lucide-circle-x', color: 'error'});
  } finally {
    loading.value = false;
  }
}

async function setIcon(file: GalleryFile): Promise<void> {
  if (!user.value) return;

  settingIcon.value = file.id;

  try {
    const profile = await updateProfile(user.value.id, {userIcon: file.url});
    patchUser({userIcon: profile.userIcon || file.url});
    toast.add({title: 'Icon updated', icon: 'i-lucide-check', color: 'success'});
  } catch (e) {
    console.error('Could not change the icon', e);
    toast.add({title: 'Could not change your icon', icon: 'i-lucide-circle-x', color: 'error'});
  } finally {
    settingIcon.value = null;
  }
}

async function confirmDelete(): Promise<void> {
  const file = toDelete.value;
  if (!file) return;

  deleting.value = true;

  try {
    await deleteFile(file.id);
    files.value = {
      icons: files.value.icons.filter(other => other.id !== file.id),
      photos: files.value.photos.filter(other => other.id !== file.id)
    };
    toast.add({title: 'Image deleted', icon: 'i-lucide-trash-2', color: 'neutral'});
  } catch (e) {
    console.error(`Could not delete file ${file.id}`, e);
    toast.add({title: 'Could not delete the image', icon: 'i-lucide-circle-x', color: 'error'});
  } finally {
    deleting.value = false;
    toDelete.value = null;
  }
}

// The session may still be loading when the tab is created.
watch(supporter, isSupporter => {
  if (isSupporter) load();
}, {immediate: true});
</script>

<template>
  <UEmpty
      v-if="!supporter"
      icon="i-lucide-gem"
      title="VRChat+ feature"
      description="Uploading icons and photos to your gallery requires a VRChat+ subscription."
      variant="naked"
      class="py-12"
  />

  <div v-else class="flex flex-col gap-3 p-3">
    <UTabs v-model="tab" :items="tabs" :content="false" size="sm" class="w-full"/>

    <div v-if="loading" class="grid grid-cols-3 gap-2">
      <USkeleton v-for="i in 9" :key="i" class="aspect-square rounded-xl"/>
    </div>

    <UEmpty
        v-else-if="!shown.length"
        :icon="tab === 'icons' ? 'i-lucide-circle-user-round' : 'i-lucide-images'"
        :title="tab === 'icons' ? 'No icons yet' : 'No photos yet'"
        description="Upload them from VRChat or the vrchat.com gallery."
        variant="naked"
        class="py-10"
    />

    <div v-else class="grid grid-cols-3 gap-2">
      <div
          v-for="file of shown"
          :key="file.id"
          class="group relative aspect-square overflow-hidden rounded-xl bg-muted ring-1 ring-default transition"
          :class="tab === 'icons' && currentIconId === file.id && 'ring-2 ring-primary'"
      >
        <img :src="file.url" :alt="file.name" loading="lazy" class="size-full object-cover transition duration-300 group-hover:scale-105">

        <UBadge
            v-if="tab === 'icons' && currentIconId === file.id"
            label="Current"
            icon="i-lucide-check"
            size="sm"
            class="absolute top-1.5 left-1.5"
        />

        <div class="absolute inset-0 flex items-end justify-end gap-1 bg-gradient-to-t from-black/70 via-transparent to-transparent p-1.5 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
          <UTooltip v-if="tab === 'icons' && currentIconId !== file.id" text="Use as icon">
            <UButton
                icon="i-lucide-user-round-check"
                size="xs"
                :loading="settingIcon === file.id"
                aria-label="Use as icon"
                @click="setIcon(file)"
            />
          </UTooltip>
          <UTooltip text="Delete">
            <UButton
                icon="i-lucide-trash-2"
                color="error"
                variant="solid"
                size="xs"
                aria-label="Delete"
                @click="toDelete = file"
            />
          </UTooltip>
        </div>
      </div>
    </div>

    <UModal
        :open="!!toDelete"
        title="Delete this image?"
        description="It will be removed from your VRChat gallery. This can't be undone."
        @update:open="(open: boolean) => { if (!open) toDelete = null }"
    >
      <template #body>
        <img v-if="toDelete" :src="toDelete.url" alt="" class="mx-auto max-h-48 rounded-lg ring-1 ring-default">
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton label="Cancel" color="neutral" variant="ghost" @click="toDelete = null"/>
          <UButton label="Delete" icon="i-lucide-trash-2" color="error" :loading="deleting" @click="confirmDelete"/>
        </div>
      </template>
    </UModal>
  </div>
</template>
