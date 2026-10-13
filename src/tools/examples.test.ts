// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { TOOLS } from './registry'

const SIZE = 160

/**
 * A stand-in for a canvas 2D context that writes down every call and property set, so a test can
 * check what was drawn without a real canvas (jsdom has none).
 */
function recordingContext() {
    const canvas = document.createElement('canvas')
    canvas.width = SIZE
    canvas.height = SIZE
    const log: string[] = []
    const show = (v: unknown) => (typeof v === 'number' ? v.toFixed(2) : typeof v)
    const ctx = new Proxy(
        {},
        {
            get(_, name) {
                if (name === 'canvas') return canvas
                if (name === 'createImageData') {
                    return (w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4) })
                }
                return (...args: unknown[]) => log.push(`${String(name)}(${args.map(show)})`)
            },
            set(_, name, value) {
                log.push(`${String(name)}=${show(value)}`)
                return true
            },
        },
    ) as CanvasRenderingContext2D
    return { ctx, log }
}

const drawn = (draw: (typeof TOOLS)[number]['drawExample'], seed: number) => {
    const { ctx, log } = recordingContext()
    draw(ctx, SIZE, seed)
    return log
}

describe.each(TOOLS)('$name home-page example', ({ drawExample }) => {
    it('draws on its own, without the tool page around it', () => {
        const log = drawn(drawExample, 48213)
        expect(log.some((call) => call.startsWith('arc('))).toBe(true)
    })

    it('draws the same picture for the same seed', () => {
        expect(drawn(drawExample, 48213)).toEqual(drawn(drawExample, 48213))
    })

    it('draws a different picture for a different seed', () => {
        expect(drawn(drawExample, 48213)).not.toEqual(drawn(drawExample, 7))
    })
})
