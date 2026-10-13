import { useContext, useEffect, useRef } from 'react'
import type { Shortcut } from './shortcuts'
import { ShortcutsContext } from './context'

/**
 * Registers keyboard shortcuts while the calling component is on screen, and removes them when
 * it goes away. Pass a new array every render if you like: `run` always calls the latest version,
 * and the list is only re-registered when a key or description changes.
 */
export function useShortcuts(shortcuts: readonly Shortcut[]) {
    const registry = useContext(ShortcutsContext)?.registry
    const latest = useRef(shortcuts)
    useEffect(() => {
        latest.current = shortcuts
    })

    const signature = shortcuts
        .map((s) => [s.key, s.label, s.description].join('\u0000'))
        .join('\n')
    useEffect(() => {
        if (!registry) return // no provider, e.g. a tool rendered on its own in a test
        const entries = latest.current.map((s, i) => ({ ...s, run: () => latest.current[i].run() }))
        return registry.add(entries)
    }, [registry, signature])
}

/** Opens the list of keyboard shortcuts, for a visible "Shortcuts" button. */
export function useOpenShortcutHelp(): () => void {
    return useContext(ShortcutsContext)?.openHelp ?? (() => {})
}
