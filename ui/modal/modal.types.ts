import type { VariantProps } from 'class-variance-authority'
import type { modalPanelVariants } from './modal.constants'

/** Panel width union derived from the `cva` recipe — the recipe stays the source of truth. */
export type ModalSize = NonNullable<VariantProps<typeof modalPanelVariants>['size']>

export interface ModalProps {
    /** Whether the dialog is visible. */
    open: boolean
    /** Accessible title; rendered as the dialog heading when the `title` slot is unused. */
    title?: string
    /** Panel width. */
    size?: ModalSize
    /**
     * Whether clicking the backdrop or pressing Escape closes the dialog.
     * Set to `false` for dialogs the user must resolve, e.g. an open clue.
     */
    dismissible?: boolean
}

export interface ModalEmits {
    /** Emitted when the dialog requests to be closed. */
    close: []
}
