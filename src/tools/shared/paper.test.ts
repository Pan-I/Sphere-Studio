// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { makePaper, mix, paperFor, parseColor, WHITE_PAPER } from './paper'

const lightness = (color: string) => {
    const [r, g, b] = parseColor(color)!
    return 0.299 * r + 0.587 * g + 0.114 * b
}

describe('parseColor', () => {
    it('reads short and long hex, and rgb()', () => {
        expect(parseColor('#fff')).toEqual([255, 255, 255])
        expect(parseColor('#1d4e89')).toEqual([29, 78, 137])
        expect(parseColor(' rgb(12, 34, 56) ')).toEqual([12, 34, 56])
        expect(parseColor('rgb(12 34 56)')).toEqual([12, 34, 56])
    })

    it('gives up on anything else', () => {
        expect(parseColor('')).toBeNull()
        expect(parseColor('Canvas')).toBeNull()
    })
})

describe('mix', () => {
    it('moves part of the way from one colour to the other', () => {
        expect(mix([0, 0, 0], [200, 100, 50], 0)).toEqual([0, 0, 0])
        expect(mix([0, 0, 0], [200, 100, 50], 0.5)).toEqual([100, 50, 25])
        expect(mix([0, 0, 0], [200, 100, 50], 1)).toEqual([200, 100, 50])
    })
})

describe('white paper', () => {
    it('leaves every colour exactly as the tool wrote it', () => {
        expect(WHITE_PAPER.dark).toBe(false)
        expect(WHITE_PAPER.fill('#bde0fe')).toBe('#bde0fe')
        expect(WHITE_PAPER.line('#d62828')).toBe('#d62828')
        expect(WHITE_PAPER.fillRGB([240, 240, 240])).toEqual([240, 240, 240])
    })
})

describe('dark paper', () => {
    const dark = makePaper([29, 30, 35], [222, 222, 227])

    it('is dark, with light ink', () => {
        expect(dark.dark).toBe(true)
        expect(lightness(dark.ink)).toBeGreaterThan(lightness(dark.paper))
    })

    it('dims fills, but keeps lighter values lighter', () => {
        const grays = ['#e6e6e6', '#b4b4b4', '#828282'] // the Box Randomizer's faces
        const dimmed = grays.map(dark.fill).map(lightness)
        expect(dimmed[0]).toBeLessThan(lightness('#e6e6e6'))
        expect(dimmed[0]).toBeGreaterThan(dimmed[1])
        expect(dimmed[1]).toBeGreaterThan(dimmed[2])
        expect(dimmed[2]).toBeGreaterThan(lightness(dark.paper))
    })

    it('keeps the ink readable on the lightest fill', () => {
        expect(lightness(dark.ink) - lightness(dark.fill('#ffffff'))).toBeGreaterThan(80)
    })

    it('lifts a dark coloured line, so it shows on the paper', () => {
        const minorAxis = '#1d4e89'
        expect(lightness(dark.line(minorAxis))).toBeGreaterThan(lightness(minorAxis) + 40)
    })

    it('spreads values from the paper up to the ink, so highlights stay bright', () => {
        expect(dark.valueRGB([0, 0, 0])).toEqual([29, 30, 35])
        expect(dark.valueRGB([255, 255, 255])).toEqual([222, 222, 227])
        const steps = [0, 64, 128, 192, 255].map((v) => dark.valueRGB([v, v, v])[0])
        const gaps = steps.slice(1).map((s, i) => s - steps[i])
        expect(Math.max(...gaps) - Math.min(...gaps)).toBeLessThanOrEqual(1)
    })

    it('leaves values alone on white paper', () => {
        expect(WHITE_PAPER.valueRGB([10, 128, 250])).toEqual([10, 128, 250])
    })

    it('dims pixels the same way as fills', () => {
        expect(dark.fillRGB([255, 255, 255])).toEqual(parseColor(dark.fill('#ffffff')))
    })
})

describe('paperFor', () => {
    const contextOn = (canvas: HTMLCanvasElement) => ({ canvas }) as CanvasRenderingContext2D

    it('is white paper when the CSS sets no colours, as in tests', () => {
        expect(paperFor(contextOn(document.createElement('canvas')))).toBe(WHITE_PAPER)
    })

    it('is white paper for a context without a canvas element', () => {
        expect(paperFor({} as CanvasRenderingContext2D)).toBe(WHITE_PAPER)
    })

    it('reads --paper and --ink from the CSS', () => {
        const canvas = document.createElement('canvas')
        canvas.style.setProperty('--paper', '#1d1e23')
        canvas.style.setProperty('--ink', '#dedee3')
        document.body.append(canvas)
        const paper = paperFor(contextOn(canvas))
        canvas.remove()
        expect(paper.dark).toBe(true)
        expect(paper.paper).toBe('rgb(29, 30, 35)')
        expect(paper.ink).toBe('rgb(222, 222, 227)')
    })
})
