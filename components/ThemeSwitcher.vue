<script setup lang="ts">
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/vue'

// Accessible color-scheme picker. Business logic lives in the useTheme composable.
const { theme, themes, setTheme } = useTheme()

const activeLabel = computed(
    () => themes.find((option) => option.id === theme.value)?.label ?? theme.value,
)
</script>

<template>
    <Listbox :model-value="theme" as="div" class="relative" @update:model-value="setTheme">
        <ListboxButton
            class="flex items-center gap-2 rounded border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground hover:bg-background"
        >
            <span class="h-3 w-3 rounded-full bg-primary" aria-hidden="true" />
            {{ activeLabel }}
        </ListboxButton>
        <ListboxOptions
            class="absolute right-0 z-10 mt-1 w-40 overflow-hidden rounded border border-border bg-surface py-1 shadow-lg focus:outline-none"
        >
            <ListboxOption
                v-for="option in themes"
                :key="option.id"
                v-slot="{ active, selected }"
                :value="option.id"
                as="template"
            >
                <li
                    class="flex cursor-pointer items-center justify-between px-3 py-2 text-sm text-foreground"
                    :class="active ? 'bg-background' : ''"
                >
                    <span>{{ option.label }}</span>
                    <span v-if="selected" class="text-primary" aria-hidden="true">✓</span>
                </li>
            </ListboxOption>
        </ListboxOptions>
    </Listbox>
</template>
