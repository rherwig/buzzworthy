import type { Meta, StoryObj } from '@storybook/vue3-vite'
import Button from './button.vue'

const meta = {
    title: 'UI/Button',
    component: Button,
    tags: ['autodocs'],
    argTypes: {
        variant: {
            control: 'select',
            options: ['primary', 'secondary', 'ghost'],
        },
        size: {
            control: 'select',
            options: ['sm', 'md', 'lg'],
        },
        type: {
            control: 'select',
            options: ['button', 'submit', 'reset'],
        },
        disabled: { control: 'boolean' },
        default: { control: 'text' },
    },
    args: {
        variant: 'primary',
        size: 'md',
        type: 'button',
        disabled: false,
        default: 'Button',
    },
    render: (args) => ({
        components: { Button },
        setup() {
            return { args }
        },
        template: '<Button v-bind="args">{{ args.default }}</Button>',
    }),
} satisfies Meta<typeof Button>

export default meta

type Story = StoryObj<typeof meta>

export const Primary: Story = {}

export const Secondary: Story = {
    args: { variant: 'secondary' },
}

export const Ghost: Story = {
    args: { variant: 'ghost' },
}

export const Small: Story = {
    args: { size: 'sm' },
}

export const Large: Story = {
    args: { size: 'lg' },
}

export const Disabled: Story = {
    args: { disabled: true },
}
