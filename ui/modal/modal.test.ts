import { describe, it, expect, afterEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import Modal from './modal.vue'
import { modalPanelVariants } from './modal.constants'

/**
 * Headless UI portals the dialog out of the component tree — assertions read
 * `document.body` rather than the wrapper's markup, and the portal only exists
 * after the mount has flushed.
 */
async function open(props: Partial<InstanceType<typeof Modal>['$props']> = {}, slots = {}) {
    const wrapper = mount(Modal, {
        props: { open: true, ...props },
        slots,
        attachTo: document.body,
    })
    await flushPromises()

    return wrapper
}

async function pressEscape() {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await new Promise((resolve) => setTimeout(resolve, 0))
}

afterEach(() => {
    document.body.innerHTML = ''
})

describe('UiModal', () => {
    it('renders nothing while closed', () => {
        mount(Modal, {
            props: { open: false },
            slots: { default: 'Body' },
            attachTo: document.body,
        })

        expect(document.body.textContent).not.toContain('Body')
    })

    it('renders the title, body and footer slots when open', async () => {
        await open({ title: 'A clue' }, { default: 'The prompt', footer: 'Actions' })

        expect(document.body.textContent).toContain('A clue')
        expect(document.body.textContent).toContain('The prompt')
        expect(document.body.textContent).toContain('Actions')
    })

    it('applies the default size classes', async () => {
        await open()

        expect(document.body.innerHTML).toContain(modalPanelVariants({ size: 'md' }))
    })

    it('applies the requested size classes', async () => {
        await open({ size: 'xl' })

        expect(document.body.innerHTML).toContain(modalPanelVariants({ size: 'xl' }))
    })

    it('emits close when dismissed with Escape', async () => {
        const wrapper = await open()

        await pressEscape()

        expect(wrapper.emitted('close')).toHaveLength(1)
    })

    it('does not emit close when it is not dismissible', async () => {
        const wrapper = await open({ dismissible: false })

        await pressEscape()

        expect(wrapper.emitted('close')).toBeUndefined()
    })
})
