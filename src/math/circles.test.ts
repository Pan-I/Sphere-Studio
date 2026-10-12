// src/math/circles.test.ts
import { describe, expect, it } from 'vitest'
import { bounds, distance, lerp, overlaps, type Circle } from './circles'

const circle = (x: number, y: number, radius: number): Circle => ({ center: [x, y], radius })

describe('distance', () => {
    it('measures a 3-4-5 triangle', () => {
        expect(distance([0, 0], [3, 4])).toBe(5)
    })

    it('is zero for the same point and the same in both directions', () => {
        expect(distance([1, 2], [1, 2])).toBe(0)
        expect(distance([1, 2], [-3, 5])).toBe(distance([-3, 5], [1, 2]))
    })
})

describe('overlaps', () => {
    it('is true when the circles share area', () => {
        expect(overlaps(circle(0, 0, 1), circle(1.5, 0, 1))).toBe(true)
    })

    it('is false when there is a gap', () => {
        expect(overlaps(circle(0, 0, 1), circle(3, 0, 1))).toBe(false)
    })

    it('is false when the circles only touch at one point', () => {
        expect(overlaps(circle(0, 0, 1), circle(2, 0, 1))).toBe(false)
    })

    it('is true when one circle sits entirely inside the other', () => {
        expect(overlaps(circle(0, 0, 2), circle(0.5, 0, 0.5))).toBe(true)
    })
})

describe('lerp', () => {
    it('returns the start, middle and end of the line', () => {
        expect(lerp([0, 0], [4, 2], 0)).toEqual([0, 0])
        expect(lerp([0, 0], [4, 2], 0.5)).toEqual([2, 1])
        expect(lerp([0, 0], [4, 2], 1)).toEqual([4, 2])
    })
})

describe('bounds', () => {
    it('wraps a single circle', () => {
        expect(bounds([circle(1, 2, 0.5)])).toEqual({ minX: 0.5, minY: 1.5, maxX: 1.5, maxY: 2.5 })
    })

    it('wraps several circles', () => {
        expect(bounds([circle(0, 0, 1), circle(3, 1, 0.5)])).toEqual({
            minX: -1,
            minY: -1,
            maxX: 3.5,
            maxY: 1.5,
        })
    })
})
