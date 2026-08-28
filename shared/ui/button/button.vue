<script setup lang="ts">
import { computed } from 'vue'
import { buttonVariants } from './button.constants'
import type { ButtonEmits, ButtonProps } from './button.types'

const props = withDefaults(defineProps<ButtonProps>(), {
    variant: 'primary',
    size: 'md',
    type: 'button',
    disabled: false,
})

const emit = defineEmits<ButtonEmits>()

const classes = computed(() => buttonVariants({ variant: props.variant, size: props.size }))

function onClick(event: MouseEvent) {
    if (props.disabled) {
        return
    }
    emit('click', event)
}
</script>

<template>
    <button :class="classes" :type="type" :disabled="disabled" @click="onClick">
        <slot />
    </button>
</template>
