/** One keyboard shortcut. Anything that registers these shows up in the shortcuts list. */
export interface Shortcut {
    /** The KeyboardEvent.key to listen for, e.g. 'p', ' ', '?' or 'Escape'. Letters match either case. */
    key: string
    /** What it does, shown in the shortcuts list, e.g. "New pose". */
    description: string
    run: () => void
    /** How to show the key when `key` isn't readable on its own, e.g. 'Space' for ' '. */
    label?: string
}

/** The parts of a KeyboardEvent the registry looks at, so tests can pass plain objects. */
export type KeyPress = Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'altKey' | 'repeat'> & {
    target: EventTarget | null
}

export interface ShortcutRegistry {
    /** Adds a group of shortcuts and returns a function that removes them again. */
    add(shortcuts: readonly Shortcut[]): () => void
    /** Runs the shortcut for this key press, if there is one. Returns whether it did. */
    handle(press: KeyPress): boolean
    /** The active shortcuts, one per key. Returns the same array until something changes. */
    list(): readonly Shortcut[]
    /** Calls `listener` whenever the list changes. Returns a function that unsubscribes. */
    subscribe(listener: () => void): () => void
}

const normalize = (key: string) => (key.length === 1 ? key.toLowerCase() : key)

/** Typing in a field should never trigger a shortcut. */
export function isTypingTarget(target: EventTarget | null): boolean {
    const el = target as Element | null
    if (typeof el?.closest !== 'function') return false
    return (
        el.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])') !==
        null
    )
}

export function createShortcutRegistry(): ShortcutRegistry {
    // Groups in the order they were added. When two groups use the same key, the newest wins,
    // so a tool can take over a key the site already uses.
    let groups: (readonly Shortcut[])[] = []
    let snapshot: readonly Shortcut[] = []
    const listeners = new Set<() => void>()

    const changed = () => {
        const byKey = new Map<string, Shortcut>()
        for (const group of groups) {
            for (const shortcut of group) byKey.set(normalize(shortcut.key), shortcut)
        }
        snapshot = [...byKey.values()]
        listeners.forEach((listener) => listener())
    }

    return {
        add(shortcuts) {
            groups = [...groups, shortcuts]
            changed()
            return () => {
                groups = groups.filter((g) => g !== shortcuts)
                changed()
            }
        },
        handle(press) {
            // Leave Ctrl+P, Cmd+F and friends to the browser, and don't fire again while a key is held.
            if (press.ctrlKey || press.metaKey || press.altKey || press.repeat) return false
            if (isTypingTarget(press.target)) return false
            const key = normalize(press.key)
            const shortcut = snapshot.find((s) => normalize(s.key) === key)
            if (!shortcut) return false
            shortcut.run()
            return true
        },
        list: () => snapshot,
        subscribe(listener) {
            listeners.add(listener)
            return () => listeners.delete(listener)
        },
    }
}

/** How a shortcut's key is written in the list. */
export function keyLabel(shortcut: Shortcut): string {
    if (shortcut.label) return shortcut.label
    if (shortcut.key === ' ') return 'Space'
    return shortcut.key.length === 1 ? shortcut.key.toUpperCase() : shortcut.key
}
