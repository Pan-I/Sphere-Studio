import { useEffect, useRef, useState } from 'react'
import { bufferScale } from './canvasScale'

/**
 * Draws on a square canvas whose drawing buffer always matches its size on screen, so it stays
 * sharp whether it's 300px wide on a phone or filling a monitor in full screen. `draw` works in
 * logical units from 0 to `size`, whatever the real size. Wrap it in useCallback so the canvas
 * only redraws when what it draws changes.
 */
export function useSquareCanvas(size: number, draw: (ctx: CanvasRenderingContext2D) => void) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [shownWidth, setShownWidth] = useState(size) // CSS pixels

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
    }, [shownWidth, size, draw])

    return canvasRef
}
