<script setup lang="ts">
import { computed } from 'vue'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/vue'
import { modalPanelVariants } from './modal.constants'
import type { ModalEmits, ModalProps } from './modal.types'

const props = withDefaults(defineProps<ModalProps>(), {
    title: undefined,
    size: 'md',
    dismissible: true,
})

const emit = defineEmits<ModalEmits>()

const panelClasses = computed(() => modalPanelVariants({ size: props.size }))

// Headless UI closes on backdrop click and Escape; a non-dismissible dialog
// swallows that request so only an explicit action can close it.
function onClose() {
    if (!props.dismissible) {
        return
    }
    emit('close')
}
</script>

<template>
    <Dialog :open="open" class="relative z-50" @close="onClose">
        <div class="fixed inset-0 bg-foreground/40" aria-hidden="true" />
        <div class="fixed inset-0 flex items-center justify-center p-4">
            <DialogPanel :class="panelClasses">
                <DialogTitle v-if="title || $slots.title" class="text-xl font-semibold">
                    <slot name="title">{{ title }}</slot>
                </DialogTitle>
                <div :class="title || $slots.title ? 'mt-4' : undefined">
                    <slot />
                </div>
                <div v-if="$slots.footer" class="mt-6 flex flex-wrap justify-end gap-2">
                    <slot name="footer" />
                </div>
            </DialogPanel>
        </div>
    </Dialog>
</template>
