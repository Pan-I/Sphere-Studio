import { useRef } from 'react'
import { useOpenShortcutHelp, useShortcuts } from '../shortcuts/useShortcuts'
import type { Shortcut } from '../shortcuts/shortcuts'
import type { Tool } from '../tools/registry'
import { ToolSlugContext } from '../tools/shared/toolSlug'
import { SITE_NAME } from './config'
import { useDocumentTitle } from './useDocumentTitle'
import { useFullscreen } from './useFullscreen'
import { useTouchOnly } from './useTouchOnly'

export function ToolPage({ tool }: { tool: Tool }) {
    useDocumentTitle(`${tool.name} · ${SITE_NAME}`)
    const ToolComponent = tool.component
    const frameRef = useRef<HTMLDivElement>(null)
    const fullscreen = useFullscreen(frameRef)
    const openHelp = useOpenShortcutHelp()
    const touchOnly = useTouchOnly()

    // Every tool gets full screen for free, except on phones and tablets (see useTouchOnly). In
    // the browser's own full screen, Esc is handled by the browser, so our own Esc is only needed
    // for the CSS-only fallback.
    const shortcuts: Shortcut[] = touchOnly
        ? []
        : [{ key: 'f', description: 'Full screen on or off', run: fullscreen.toggle }]
    if (fullscreen.active && !fullscreen.native) {
        shortcuts.push({ key: 'Escape', description: 'Leave full screen', run: fullscreen.exit })
    }
    useShortcuts(shortcuts)

    return (
        <>
            <div className="tool-heading">
                <h1>{tool.name}</h1>
                {!touchOnly && (
                    <div className="tool-heading-actions">
                        <button onClick={fullscreen.enter}>Full screen</button>
                        <button onClick={openHelp} aria-label="Keyboard shortcuts">
                            Shortcuts <kbd>?</kbd>
                        </button>
                    </div>
                )}
            </div>
            {/* In full screen, only children marked data-focus="show" stay visible (see index.css). */}
            <div
                ref={frameRef}
                className={fullscreen.active ? 'tool-frame focus-mode' : 'tool-frame'}
            >
                {/* Lets shared controls save per tool, e.g. each tool's favorites. */}
                <ToolSlugContext value={tool.slug}>
                    <ToolComponent />
                </ToolSlugContext>
                {fullscreen.active && (
                    <button className="focus-exit" onClick={fullscreen.exit}>
                        Exit full screen
                    </button>
                )}
            </div>
        </>
    )
}
