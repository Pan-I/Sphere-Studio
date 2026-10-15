import type { ReactNode } from 'react'
import { useShortcuts } from '../shortcuts/useShortcuts'
import { nextTheme, useThemeChoice, type ThemeChoice } from './theme'

/** Small line icons in the text colour: a half-filled circle, a sun and a moon. */
const ICONS: Record<ThemeChoice, ReactNode> = {
    auto: (
        <>
            <circle cx="12" cy="12" r="8" fill="none" />
            <path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" stroke="none" />
        </>
    ),
    light: (
        <>
            <circle cx="12" cy="12" r="4" fill="none" />
            <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
        </>
    ),
    dark: <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" fill="none" />,
}

const LABELS: Record<ThemeChoice, { name: string; detail: string }> = {
    auto: { name: 'Auto', detail: 'Auto, following your device' },
    light: { name: 'Light', detail: 'Light' },
    dark: { name: 'Dark', detail: 'Dark' },
}

/** One button that steps through Auto, Light and Dark. T does the same from the keyboard. */
export function ThemeToggle() {
    const [choice, setChoice] = useThemeChoice()
    const next = nextTheme(choice)
    const step = () => setChoice(next)
    useShortcuts([{ key: 't', description: 'Theme: auto, light or dark', run: step }])

    const { name, detail } = LABELS[choice]
    const label = `Theme: ${detail}. Switch to ${LABELS[next].name}.`
    return (
        <button className="theme-toggle" onClick={step} aria-label={label} title={label}>
            <svg
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
            >
                {ICONS[choice]}
            </svg>
            {name}
        </button>
    )
}
