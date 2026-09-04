/**
 * Barrel export for the shared UI library.
 *
 * Components are exported with a `Ui` prefix so call sites read clearly, e.g.:
 *
 *   import { UiButton } from '~/ui'
 *
 * Lives at the project root rather than under `shared/`: Nuxt scans `shared/` for
 * isomorphic TypeScript and feeds it to the Nitro build, which cannot parse `.vue`.
 */
export { default as UiButton } from './button/button.vue'
export { buttonVariants } from './button/button.constants'
export type { ButtonProps, ButtonEmits, ButtonVariant, ButtonSize } from './button/button.types'

export { default as UiModal } from './modal/modal.vue'
export { modalPanelVariants } from './modal/modal.constants'
export type { ModalProps, ModalEmits, ModalSize } from './modal/modal.types'
