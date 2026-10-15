import { useContext, useEffect, useRef, useState } from 'react'
import { useTheme } from '../../site/theme'
import { CanvasExportContext } from './canvasExport'
import { bufferScale } from './canvasScale'

/**
 * Draws on a square canvas whose drawing buffer always matches its size on screen, so it stays
 * sharp whether it's 300px wide on a phone or filling a monitor in full screen. `draw` works in
 * logical units from 0 to `size`, whatever the real size. Wrap it in useCallback so the canvas
 * only redraws when what it draws changes. It also redraws when the theme changes, since drawings
 * take their paper and ink colours from it (see paper.ts).
 *
 * On a tool page it also offers the canvas to Download PNG, which calls `draw` again at print
 * size. `exportName` replaces the seed in the file name, e.g. with a photo's name.
 */
export function useSquareCanvas(
    size: number,
    draw: (ctx: CanvasRenderingContext2D) => void,
    exportName?: string,
) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const exportRef = useContext(CanvasExportContext)
    const [shownWidth, setShownWidth] = useState(size) // CSS pixels
    const theme = useTheme()

    // Watch the canvas's displayed size. jsdom (tests) has no ResizeObserver, so skip it there.
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas || typeof ResizeObserver === 'undefined') return
        const observer = new ResizeObserver(([entry]) => {
            const width = Math.round(entry.contentRect.width)
            if (width > 0) setShownWidth(width) // 0 while hidden; keep the last good size
        })
        observer.observe(canvas)
        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        const canvas = canvasRef.current
        const ctx = canvas?.getContext('2d')
        if (!canvas || !ctx) return
        // Size the drawing buffer for the screen, capped at 2x (see bufferScale).
        const pixels = Math.round(shownWidth * bufferScale(window.devicePixelRatio))
        canvas.width = pixels
        canvas.height = pixels
        const scale = pixels / size
        ctx.setTransform(scale, 0, 0, scale, 0, 0)
        draw(ctx)
    }, [shownWidth, size, draw, theme])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!exportRef || !canvas) return
        const source = { canvas, size, draw, name: exportName }
        exportRef.current = source
        return () => {
            if (exportRef.current === source) exportRef.current = null
        }
    }, [exportRef, size, draw, exportName])

    return canvasRef
}
