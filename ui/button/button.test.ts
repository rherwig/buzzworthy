import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Button from './button.vue'
import { buttonVariants } from './button.constants'

describe('UiButton', () => {
    it('renders slot content', () => {
        const wrapper = mount(Button, { slots: { default: 'Click me' } })
        expect(wrapper.text()).toBe('Click me')
    })

    it('defaults to a native button of type "button"', () => {
        const wrapper = mount(Button)
        expect(wrapper.element.tagName).toBe('BUTTON')
        expect(wrapper.attributes('type')).toBe('button')
    })

    it('applies the default (primary/md) variant classes', () => {
        const wrapper = mount(Button)
        expect(wrapper.attributes('class')).toBe(buttonVariants({ variant: 'primary', size: 'md' }))
    })

    it('applies the requested variant and size classes', () => {
        const wrapper = mount(Button, { props: { variant: 'secondary', size: 'lg' } })
        expect(wrapper.attributes('class')).toBe(
            buttonVariants({ variant: 'secondary', size: 'lg' }),
        )
    })

    it('emits a click event when enabled', async () => {
        const wrapper = mount(Button)
        await wrapper.trigger('click')
        expect(wrapper.emitted('click')).toHaveLength(1)
    })

    it('does not emit a click event when disabled', async () => {
        const wrapper = mount(Button, { props: { disabled: true } })
        await wrapper.trigger('click')
        expect(wrapper.emitted('click')).toBeUndefined()
        expect(wrapper.attributes('disabled')).toBeDefined()
    })
})
