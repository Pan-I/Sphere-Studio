import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useTouchOnly } from '../site/useTouchOnly'
import { ShortcutsContext, type ShortcutsContextValue } from './context'
import { createShortcutRegistry, keyLabel, type ShortcutRegistry } from './shortcuts'
import './shortcuts.css'

const HELP_KEY = '?'

/**
 * Listens for key presses once for the whole site and runs whatever shortcut is registered for
 * that key. Components add their own with useShortcuts. Press ? to see them all.
 */
export function ShortcutsProvider({ children }: { children: ReactNode }) {
    const [registry] = useState(createShortcutRegistry)
    const [helpOpen, setHelpOpen] = useState(false)
    const [value] = useState<ShortcutsContextValue>(() => ({
        registry,
        openHelp: () => setHelpOpen(true),
    }))

    const touchOnly = useTouchOnly()

    // The ? shortcut goes through the registry like any other, so it's listed with the rest.
    // Phones and tablets get no shortcut list, as they have no Shortcuts button (see ToolPage).
    useEffect(() => {
        if (touchOnly) return
        return registry.add([
            {
                key: HELP_KEY,
                description: 'Show keyboard shortcuts',
                run: () => setHelpOpen(true),
            },
        ])
    }, [registry, touchOnly])

    useEffect(() => {
        let handledKey: string | null = null
        const onKeyDown = (e: KeyboardEvent) => {
            // While the list is open, the only keys that do anything are the ones that close it.
            if (helpOpen) {
                if (e.key === 'Escape' || e.key === HELP_KEY) {
                    e.preventDefault()
                    setHelpOpen(false)
                }
                return
            }
            if (!registry.handle(e)) return
            e.preventDefault() // e.g. stop Space from scrolling the page
            handledKey = e.key
        }
        // A focused button "clicks" itself when Space or Enter is released. If a shortcut already
        // used that key press, cancel the click so it doesn't act twice.
        const onKeyUp = (e: KeyboardEvent) => {
            if (e.key !== handledKey) return
            handledKey = null
            e.preventDefault()
        }
        window.addEventListener('keydown', onKeyDown)
        window.addEventListener('keyup', onKeyUp)
        return () => {
            window.removeEventListener('keydown', onKeyDown)
            window.removeEventListener('keyup', onKeyUp)
        }
    }, [registry, helpOpen])

    return (
        <ShortcutsContext.Provider value={value}>
            {children}
            {helpOpen && <ShortcutHelp registry={registry} onClose={() => setHelpOpen(false)} />}
        </ShortcutsContext.Provider>
    )
}

function ShortcutHelp({ registry, onClose }: { registry: ShortcutRegistry; onClose: () => void }) {
    const shortcuts = useSyncExternalStore(registry.subscribe, registry.list)
    const dialog = (
        <div className="shortcut-help-backdrop" onClick={onClose}>
            <div
                className="shortcut-help"
                role="dialog"
                aria-modal="true"
                aria-labelledby="shortcut-help-title"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 id="shortcut-help-title">Keyboard shortcuts</h2>
                <dl>
                    {shortcuts.map((s) => (
                        <div key={s.key}>
                            <dt>
                                <kbd>{keyLabel(s)}</kbd>
                            </dt>
                            <dd>{s.description}</dd>
                        </div>
                    ))}
                </dl>
                <button onClick={onClose} autoFocus>
                    Close
                </button>
            </div>
        </div>
    )
    // In full screen only the full-screen element is visible, so the list has to go inside it.
    return createPortal(dialog, document.fullscreenElement ?? document.body)
}
