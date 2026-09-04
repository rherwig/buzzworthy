import type { Meta, StoryObj } from '@storybook/vue3-vite'
import Modal from './modal.vue'

const meta = {
    title: 'UI/Modal',
    component: Modal,
    tags: ['autodocs'],
    argTypes: {
        open: { control: 'boolean' },
        title: { control: 'text' },
        size: {
            control: 'select',
            options: ['md', 'lg', 'xl'],
        },
        dismissible: { control: 'boolean' },
        default: { control: 'text' },
    },
    args: {
        open: true,
        title: 'The capital of France',
        size: 'md',
        dismissible: true,
        default: 'What is Paris?',
    },
    render: (args) => ({
        components: { Modal },
        setup() {
            return { args }
        },
        template: '<Modal v-bind="args">{{ args.default }}</Modal>',
    }),
} satisfies Meta<typeof Modal>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Large: Story = {
    args: { size: 'lg' },
}

export const ExtraLarge: Story = {
    args: { size: 'xl' },
}

export const WithoutTitle: Story = {
    args: { title: undefined },
}

/** A clue the host must resolve: neither Escape nor a backdrop click closes it. */
export const NotDismissible: Story = {
    args: { dismissible: false },
}
