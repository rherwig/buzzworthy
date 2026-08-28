/**
 * Barrel export for the shared UI library.
 *
 * Components are exported with a `Ui` prefix so call sites read clearly, e.g.:
 *
 *   import { UiButton } from '~/shared/ui'
 */
export { default as UiButton } from './button/button.vue'
export { buttonVariants } from './button/button.constants'
export type { ButtonProps, ButtonEmits, ButtonVariant, ButtonSize } from './button/button.types'
