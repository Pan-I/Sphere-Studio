import { useSyncExternalStore } from 'react'

/**
 * The localStorage key for the theme. index.html reads it too, before the page draws, so a dark
 * page never flashes white on load. Keep the two in step.
 */
export const THEME_KEY = 'sphere-studio:theme'

/** Auto follows the device's light or dark setting; Light and Dark override it on this site. */
export type ThemeChoice = 'auto' | 'light' | 'dark'
export type Theme = 'light' | 'dark'

/** The order the theme button steps through. */
export const THEME_CHOICES: readonly ThemeChoice[] = ['auto', 'light', 'dark']

/** The saved choice. Anything unexpected counts as Auto. */
export function parseTheme(raw: string | null): ThemeChoice {
    return raw === 'light' || raw === 'dark' ? raw : 'auto'
}

/** The choice after `choice`, for the theme button and the T key. */
export function nextTheme(choice: ThemeChoice): ThemeChoice {
    return THEME_CHOICES[(THEME_CHOICES.indexOf(choice) + 1) % THEME_CHOICES.length]
}

/** What the page shows for a choice, given whether the device is set to dark. */
export function resolveTheme(choice: ThemeChoice, deviceDark: boolean): Theme {
    return choice === 'auto' ? (deviceDark ? 'dark' : 'light') : choice
}

function loadTheme(): ThemeChoice {
    try {
        return parseTheme(window.localStorage.getItem(THEME_KEY))
    } catch {
        return 'auto'
    }
}

function saveTheme(choice: ThemeChoice) {
    try {
        if (choice === 'auto') window.localStorage.removeItem(THEME_KEY)
        else window.localStorage.setItem(THEME_KEY, choice)
    } catch {
        // Storage unavailable: the choice lasts until the page reloads.
    }
}

/**
 * Light and Dark set `data-theme` on <html>, which index.css reads to pick its colours. Auto
 * removes it, so the CSS follows the device through prefers-color-scheme.
 */
function applyTheme(choice: ThemeChoice) {
    const root = document.documentElement
    if (choice === 'auto') delete root.dataset.theme
    else root.dataset.theme = choice
}

// One store for the whole page: the choice, and everyone who wants to hear when it changes.
let current: ThemeChoice | null = null
const listeners = new Set<() => void>()

const deviceQuery = () =>
    typeof window !== 'undefined' && window.matchMedia
        ? window.matchMedia('(prefers-color-scheme: dark)')
        : null

function subscribe(onChange: () => void) {
    listeners.add(onChange)
    const media = deviceQuery()
    media?.addEventListener('change', onChange)
    return () => {
        listeners.delete(onChange)
        media?.removeEventListener('change', onChange)
    }
}

function getChoice(): ThemeChoice {
    current ??= loadTheme()
    return current
}

export function setThemeChoice(choice: ThemeChoice) {
    current = choice
    saveTheme(choice)
    applyTheme(choice)
    for (const listener of listeners) listener()
}

/** The theme choice, and a setter that saves it and recolours the page. */
export function useThemeChoice(): [ThemeChoice, (choice: ThemeChoice) => void] {
    const choice = useSyncExternalStore(subscribe, getChoice, () => 'auto' as const)
    return [choice, setThemeChoice]
}

/**
 * Light or dark, as the page is showing it now. Canvases redraw when it changes, since they read
 * their paper and ink colours from the CSS.
 */
export function useTheme(): Theme {
    const choice = useSyncExternalStore(subscribe, getChoice, () => 'auto' as const)
    const deviceDark = useSyncExternalStore(
        subscribe,
        () => deviceQuery()?.matches ?? false,
        () => false,
    )
    return resolveTheme(choice, deviceDark)
}

/** For tests: forget the cached choice and clear the page's theme. */
export function resetThemeForTests() {
    current = null
    delete document.documentElement.dataset.theme
}
