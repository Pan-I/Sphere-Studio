import { describe, expect, it } from 'vitest'
import { parseOptions } from '../shared/options'
import { DEFAULT_OPTIONS, SUBTRACT_OPTIONS } from './displayOptions'

const parse = (raw: string | null) => parseOptions(SUBTRACT_OPTIONS.fields, raw)

describe('Subtract options', () => {
    it('defaults to one cut in color and perspective, with the rim highlighted and the cut-away part shown', () => {
        expect(DEFAULT_OPTIONS).toEqual({
            cuts: 'one',
            shading: 'color',
            lineWidth: 2,
            perspective: true,
            uniformSize: true,
            highlightMeet: true,
            showCutAway: true,
            showHiddenEdges: false,
            showSphereLines: true,
            showAxes: false,
            showEllipseAxes: true,
        })
    })

    it('reads back what it saves', () => {
        const opts = {
            cuts: 'two',
            shading: 'grayscale',
            lineWidth: 4,
            perspective: false,
            uniformSize: false,
            highlightMeet: false,
            showCutAway: false,
            showHiddenEdges: true,
            showSphereLines: false,
            showAxes: true,
            showEllipseAxes: false,
        } as const
        expect(parse(JSON.stringify(opts))).toEqual(opts)
    })

    it('falls back to one cut for an unknown choice', () => {
        expect(parse(JSON.stringify({ cuts: 'three' })).cuts).toBe('one')
    })
})
