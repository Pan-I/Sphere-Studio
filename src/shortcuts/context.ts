import { createContext } from 'react'
import type { ShortcutRegistry } from './shortcuts'

export interface ShortcutsContextValue {
    registry: ShortcutRegistry
    openHelp: () => void
}

/** Provided by ShortcutsProvider. Null outside it, where useShortcuts does nothing. */
export const ShortcutsContext = createContext<ShortcutsContextValue | null>(null)
