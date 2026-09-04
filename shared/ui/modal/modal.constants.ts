import { cva } from 'class-variance-authority'

export const modalPanelVariants = cva(
    // `max-h`/`overflow-y` keep a tall dialog usable on a phone in landscape, where the
    // panel would otherwise run past both edges of the viewport with no way to scroll.
    'max-h-[90vh] w-full overflow-y-auto rounded-lg border border-border bg-surface p-4 shadow-lg sm:p-6',
    {
        variants: {
            size: {
                md: 'max-w-md',
                lg: 'max-w-2xl',
                xl: 'max-w-4xl',
            },
        },
        defaultVariants: {
            size: 'md',
        },
    },
)
