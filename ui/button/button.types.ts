import type { VariantProps } from 'class-variance-authority'
import type { buttonVariants } from './button.constants'

/**
 * Variant/size unions are derived from the `cva` recipe so the props stay in
 * sync with the actual styles — the recipe is the single source of truth.
 */
export type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>['variant']>
export type ButtonSize = NonNullable<VariantProps<typeof buttonVariants>['size']>

export interface ButtonProps {
    /** Visual style of the button. */
    variant?: ButtonVariant
    /** Size of the button. */
    size?: ButtonSize
    /** Native button `type` attribute. */
    type?: 'button' | 'submit' | 'reset'
    /** Whether the button is disabled. */
    disabled?: boolean
}

export interface ButtonEmits {
    /** Emitted on click when the button is not disabled. */
    click: [MouseEvent]
}
