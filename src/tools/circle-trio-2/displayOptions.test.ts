// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { CIRCLE_OPTIONS } from '../circle-trio/displayOptions'
import { CIRCLE_TRIO_2_OPTIONS } from './displayOptions'

describe('Circle Trio 2 options', () => {
    it('shows the same panel, with the same defaults, as Circle Trio 1', () => {
        expect(CIRCLE_TRIO_2_OPTIONS.fields).toBe(CIRCLE_OPTIONS.fields)
        expect(CIRCLE_TRIO_2_OPTIONS.defaults).toEqual(CIRCLE_OPTIONS.defaults)
    })

    it('saves its choices separately from Circle Trio 1', () => {
        window.localStorage.clear()
        CIRCLE_TRIO_2_OPTIONS.save({ ...CIRCLE_TRIO_2_OPTIONS.defaults, fill: 'grayscale' })
        expect(CIRCLE_TRIO_2_OPTIONS.load().fill).toBe('grayscale')
        expect(CIRCLE_OPTIONS.load().fill).toBe('color')
    })
})
