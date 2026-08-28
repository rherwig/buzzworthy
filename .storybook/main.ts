import type { StorybookConfig } from '@storybook-vue/nuxt'

const config: StorybookConfig = {
    stories: ['../shared/ui/**/*.stories.@(js|ts)'],
    addons: ['@storybook/addon-docs'],
    framework: {
        name: '@storybook-vue/nuxt',
        options: {},
    },
}

export default config
