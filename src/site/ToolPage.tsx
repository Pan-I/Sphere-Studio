import { useRef } from 'react'
import { useOpenShortcutHelp, useShortcuts } from '../shortcuts/useShortcuts'
import type { Shortcut } from '../shortcuts/shortcuts'
import type { Tool } from '../tools/registry'
import {
    CanvasExportContext,
    downloadCanvas,
    exportFileName,
    renderForExport,
    type CanvasSource,
} from '../tools/shared/canvasExport'
import { readSeedFromUrl } from '../tools/shared/seed'
import { ToolSlugContext } from '../tools/shared/toolSlug'
import { SITE_NAME } from './config'
import { useDocumentTitle } from './useDocumentTitle'
import { useFullscreen } from './useFullscreen'
import { useTouchOnly } from './useTouchOnly'

export function ToolPage({ tool }: { tool: Tool }) {
    useDocumentTitle(`${tool.name} · ${SITE_NAME}`)
    const ToolComponent = tool.component
    const frameRef = useRef<HTMLDivElement>(null)
    const exportRef = useRef<CanvasSource | null>(null)
    const fullscreen = useFullscreen(frameRef)
    const openHelp = useOpenShortcutHelp()
    const touchOnly = useTouchOnly()

    // Saves the drawing on screen, redrawn at print size. The address bar always holds the seed
    // on screen, so the file is named after the pose you see.
    const downloadPng = () => {
        const source = exportRef.current
        if (!source) return
        const seed = readSeedFromUrl(window.location.search)
        downloadCanvas(renderForExport(source), exportFileName(tool.slug, seed, source.name))
    }

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
    useShortcuts([{ key: 'd', description: 'Download the drawing as a PNG', run: downloadPng }])

    return (
        <>
            <div className="tool-heading">
                <h1>{tool.name}</h1>
                <div className="tool-heading-actions">
                    <button onClick={downloadPng}>Download PNG</button>
                    {!touchOnly && (
                        <>
                            <button onClick={fullscreen.enter}>Full screen</button>
                            <button onClick={openHelp} aria-label="Keyboard shortcuts">
                                Shortcuts <kbd>?</kbd>
                            </button>
                        </>
                    )}
                </div>
            </div>
            {/* In full screen, only children marked data-focus="show" stay visible (see index.css). */}
            <div
                ref={frameRef}
                className={fullscreen.active ? 'tool-frame focus-mode' : 'tool-frame'}
            >
                {/* Lets shared controls save per tool, e.g. each tool's favorites, and lets the
                    tool's canvas offer itself to Download PNG. */}
                <ToolSlugContext value={tool.slug}>
                    <CanvasExportContext value={exportRef}>
                        <ToolComponent />
                    </CanvasExportContext>
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
