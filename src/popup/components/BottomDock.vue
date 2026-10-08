<script setup lang="ts">
import type {PopupTab, PopupTabItem} from './navigation';

defineProps<{tabs: PopupTabItem[]}>();

const active = defineModel<PopupTab>({required: true});
</script>

<template>
  <nav class="shrink-0 border-t border-default bg-default/90 px-2 pt-1.5 pb-2 backdrop-blur">
    <ul class="flex items-stretch justify-around gap-1">
      <li v-for="tab of tabs" :key="tab.value" class="flex-1">
        <button
            type="button"
            class="group relative flex w-full flex-col items-center gap-0.5 rounded-lg py-1.5 text-[11px] font-medium transition-colors"
            :class="active === tab.value ? 'text-primary' : 'text-dimmed hover:text-default hover:bg-elevated/60'"
            :aria-current="active === tab.value ? 'page' : undefined"
            @click="active = tab.value"
        >
          <span
              class="absolute -top-1.5 h-0.5 w-6 rounded-full bg-primary transition-opacity shadow-[0_0_12px] shadow-primary"
              :class="active === tab.value ? 'opacity-100' : 'opacity-0'"
          />
          <UIcon :name="tab.icon" class="size-5 transition-transform group-active:scale-90"/>
          {{ tab.label }}
        </button>
      </li>
    </ul>
  </nav>
</template>
