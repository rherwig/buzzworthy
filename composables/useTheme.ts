/**
 * Color-scheme (theme) management.
 *
 * Themes are defined as CSS-variable sets in `assets/css/tailwind.css` and
 * selected via the `data-theme` attribute on <html>. The active choice is
 * stored in a cookie so SSR renders the correct scheme with no flash.
 *
 * Keep presentation logic here (SOLID/DRY) instead of inside components.
 */
export const THEMES = [
    { id: 'light', label: 'Light' },
    { id: 'dark', label: 'Dark' },
    { id: 'midnight', label: 'Midnight (Green)' },
    { id: 'ocean', label: 'Ocean' },
    { id: 'forest', label: 'Forest' },
    { id: 'sunset', label: 'Sunset' },
    { id: 'grape', label: 'Grape' },
] as const

export type ThemeId = (typeof THEMES)[number]['id']

export const DEFAULT_THEME: ThemeId = 'light'

function isThemeId(value: unknown): value is ThemeId {
    return THEMES.some((theme) => theme.id === value)
}

export function useTheme() {
    const cookie = useCookie<ThemeId>('theme', {
        default: () => DEFAULT_THEME,
        maxAge: 60 * 60 * 24 * 365,
        sameSite: 'lax',
    })

    const theme = computed<ThemeId>(() => (isThemeId(cookie.value) ? cookie.value : DEFAULT_THEME))

    // Keep <html data-theme> in sync (SSR + client) so CSS variables apply.
    useHead({
        htmlAttrs: {
            'data-theme': theme,
        },
    })

    function setTheme(id: ThemeId): void {
        if (isThemeId(id)) {
            cookie.value = id
        }
    }

    return { theme, themes: THEMES, setTheme }
}
