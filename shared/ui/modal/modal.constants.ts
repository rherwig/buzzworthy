import { cva } from 'class-variance-authority'

export const modalPanelVariants = cva(
    'w-full rounded-lg border border-border bg-surface p-6 shadow-lg',
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
