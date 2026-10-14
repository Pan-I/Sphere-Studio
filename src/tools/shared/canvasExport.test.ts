// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { EXPORT_PIXELS, exportFileName, renderForExport, type CanvasSource } from './canvasExport'

describe('exportFileName', () => {
    it('names the file after the tool and seed', () => {
        expect(exportFileName('box-randomizer', 48213)).toBe('box-randomizer-48213.png')
        expect(exportFileName('box-randomizer', 0)).toBe('box-randomizer-0.png')
    })

    it('leaves the seed off when there is none', () => {
        expect(exportFileName('box-randomizer', null)).toBe('box-randomizer.png')
    })

    it('uses a name instead of the seed, made safe for any system', () => {
        expect(exportFileName('value-study', 5, 'My Photo (2)')).toBe('value-study-my-photo-2.png')
        expect(exportFileName('value-study', 5, 'été/../..')).toBe('value-study-t.png')
    })
})

describe('renderForExport', () => {
    afterEach(() => {
        vi.restoreAllMocks()
        document.body.innerHTML = ''
    })

    // A 2D context that records what's done to it.
    const recorder = () => {
        const calls: string[] = []
        const ctx = {
            setTransform: (...args: number[]) => calls.push(`setTransform ${args.join(' ')}`),
            fillRect: (...args: number[]) =>
                calls.push(`fillRect ${args.join(' ')} ${ctx.globalCompositeOperation}`),
            globalAlpha: 1,
            globalCompositeOperation: 'source-over',
            fillStyle: '',
        }
        return { ctx, calls }
    }

    const setup = () => {
        const { ctx, calls } = recorder()
        vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
            ctx as unknown as CanvasRenderingContext2D,
        )
        const canvas = document.createElement('canvas')
        canvas.className = 'tool-canvas'
        document.body.append(canvas)
        // The export canvas sits in the page while it draws, so styles resolve as on screen.
        const draw = vi.fn(() => {
            calls.push(
                `draw with ${document.querySelectorAll('canvas.tool-canvas').length} canvases`,
            )
        })
        const source: CanvasSource = { canvas, size: 480, draw }
        return { source, calls, draw }
    }

    it('redraws at print size, then fills the background behind the drawing', () => {
        const { source, calls, draw } = setup()
        const out = renderForExport(source)
        expect(out.width).toBe(EXPORT_PIXELS)
        expect(out.height).toBe(EXPORT_PIXELS)
        expect(draw).toHaveBeenCalledOnce()
        const scale = EXPORT_PIXELS / 480
        expect(calls).toEqual([
            `setTransform ${scale} 0 0 ${scale} 0 0`,
            'draw with 2 canvases',
            'setTransform 1 0 0 1 0 0',
            `fillRect 0 0 ${EXPORT_PIXELS} ${EXPORT_PIXELS} destination-over`,
        ])
    })

    it('takes its temporary canvas back out of the page', () => {
        const { source } = setup()
        renderForExport(source, 100)
        expect(document.querySelectorAll('canvas')).toHaveLength(1)
    })
})
