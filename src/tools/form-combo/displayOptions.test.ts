import { describe, expect, it } from 'vitest'
import { parseOptions } from '../shared/options'
import { DEFAULT_OPTIONS, FORM_COMBO_OPTIONS } from './displayOptions'

const parse = (raw: string | null) => parseOptions(FORM_COMBO_OPTIONS.fields, raw)

describe('Form Combo options', () => {
    it('defaults to a sphere, box and cylinder in color and perspective, with where they meet highlighted', () => {
        expect(DEFAULT_OPTIONS).toEqual({
            forms: 'three',
            shading: 'color',
            lineWidth: 2,
            perspective: true,
            uniformSize: false,
            highlightMeet: true,
            showHiddenEdges: true,
            showSphereLines: true,
            showAxes: false,
            showEllipseAxes: false,
        })
    })

    it('reads back what it saves', () => {
        const opts = {
            forms: 'four',
            shading: 'grayscale',
            lineWidth: 5,
            perspective: false,
            uniformSize: true,
            highlightMeet: false,
            showHiddenEdges: false,
            showSphereLines: false,
            showAxes: true,
            showEllipseAxes: true,
        } as const
        expect(parse(JSON.stringify(opts))).toEqual(opts)
    })

    it('falls back to three forms for an unknown choice', () => {
        expect(parse(JSON.stringify({ forms: 'five' })).forms).toBe('three')
    })
})
