import type { Preview } from '@storybook/vue3-vite'

// Load Tailwind so stories are styled exactly like the app.
import '../assets/css/tailwind.css'

const preview: Preview = {
    parameters: {
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/i,
            },
        },
    },
}

export default preview
