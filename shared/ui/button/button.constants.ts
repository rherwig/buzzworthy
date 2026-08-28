import { cva } from 'class-variance-authority'

export const buttonVariants = cva(
    'inline-flex items-center justify-center rounded font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50',
    {
        variants: {
            variant: {
                primary: 'bg-primary text-primary-foreground hover:bg-primary-hover',
                secondary: 'border border-border bg-surface hover:bg-background',
                ghost: 'hover:bg-background',
            },
            size: {
                sm: 'h-8 px-3 text-sm',
                md: 'h-10 px-4 text-sm',
                lg: 'h-12 px-6 text-base',
            },
        },
        defaultVariants: {
            variant: 'primary',
            size: 'md',
        },
    },
)
