import { describe, expect, it } from 'vitest'
import {
    CONTACT,
    FLOOR_Y,
    lightDirection,
    pointFromLight,
    shadowOutline,
    sphereNormalAt,
} from '../../math/light'
import { dot, type Vec3 } from '../../math/quat'
import { MAX_SEED } from '../shared/seed'
import { lightFromSeed } from './pose'
import {
    ZONE_VALUES,
    flatValue,
    makeLighting,
    shadeColor,
    shadeFloor,
    shadeSphere,
    type Shade,
} from './shading'

const DEG = Math.PI / 180

/** Every visible point of the sphere on a grid, with its shade. */
function sphereShades(light: Vec3) {
    const lighting = makeLighting(light)
    const out: { n: Vec3; shade: Shade }[] = []
    for (let i = -30; i <= 30; i++) {
        for (let j = -30; j <= 30; j++) {
            const n = sphereNormalAt(i / 30, j / 30)
            if (n) out.push({ n, shade: shadeSphere(n, lighting) })
        }
    }
    return out
}

const LIGHTS = [0, 1, 2, 48213, 99_999, MAX_SEED].map(lightFromSeed)

describe('shadeSphere', () => {
    it('keeps everything in light lighter than everything in shadow', () => {
        for (const light of LIGHTS) {
            const shades = sphereShades(light)
            const inLight = shades.filter(({ n }) => dot(n, light) > 0.05)
            const inShadow = shades.filter(({ n }) => dot(n, light) < -0.05)
            const darkestLight = Math.min(...inLight.map((s) => s.shade.value))
            const lightestShadow = Math.max(...inShadow.map((s) => s.shade.value))
            expect(darkestLight).toBeGreaterThan(lightestShadow)
        }
    })

    it('puts the brightest point in the highlight', () => {
        const light = lightDirection(-60 * DEG, 45 * DEG)
        const shades = sphereShades(light)
        const brightest = shades.reduce((a, b) => (b.shade.value > a.shade.value ? b : a))
        expect(brightest.shade.zone).toBe('highlight')
        expect(brightest.shade.value).toBeCloseTo(1, 1)
    })

    it('makes the core shadow darker than the reflected light', () => {
        const lighting = makeLighting(lightDirection(70 * DEG, 40 * DEG))
        // Just past the terminator, on the side facing the viewer.
        const core = shadeSphere(pointFromLight(lighting.light, -0.1), lighting)
        expect(core.zone).toBe('core')
        // Straight into the bounce light, which is in shadow.
        const reflected = shadeSphere(lighting.bounce, lighting)
        expect(reflected.zone).toBe('reflected')
        expect(dot(lighting.bounce, lighting.light)).toBeLessThan(0)
        expect(reflected.value).toBeGreaterThan(core.value)
    })

    it('finds every sphere zone for a light from the side', () => {
        const light = lightDirection(100 * DEG, 40 * DEG)
        const zones = new Set(sphereShades(light).map((s) => s.shade.zone))
        for (const z of ['highlight', 'light', 'halftone', 'core', 'reflected']) {
            expect(zones).toContain(z)
        }
    })
})

describe('shadeFloor', () => {
    const light = lightDirection(-80 * DEG, 40 * DEG)
    const lighting = makeLighting(light)

    it('is darkest at the contact point, in the occlusion shadow', () => {
        const contact = shadeFloor(CONTACT, lighting)
        expect(contact.zone).toBe('occlusion')
        expect(contact.value).toBeLessThan(ZONE_VALUES.cast)
    })

    it('puts the middle of the shadow in the cast shadow, and the far side in the light', () => {
        const outline = shadowOutline(light, 64)
        const far = outline.reduce((a, p) => (p[0] > a[0] ? p : a)) // light from the left
        const mid: Vec3 = [far[0] * 0.75, FLOOR_Y, far[2] * 0.75]
        expect(shadeFloor(mid, lighting).zone).toBe('cast')
        const lit: Vec3 = [-3, FLOOR_Y, 0]
        expect(shadeFloor(lit, lighting)).toEqual({
            value: lighting.floor,
            warmth: 1,
            zone: 'floor',
        })
    })

    it('gets the floor lighter as the light rises', () => {
        const low = makeLighting(lightDirection(0.5, 30 * DEG)).floor
        const high = makeLighting(lightDirection(0.5, 65 * DEG)).floor
        expect(high).toBeGreaterThan(low)
    })
})

describe('flat values', () => {
    it('step down from highlight to occlusion, with reflected light below the halftone', () => {
        const v = ZONE_VALUES
        expect(v.highlight).toBeGreaterThan(v.light)
        expect(v.light).toBeGreaterThan(v.halftone)
        expect(v.halftone).toBeGreaterThan(v.reflected)
        expect(v.reflected).toBeGreaterThan(v.core)
        expect(v.cast).toBeGreaterThan(v.occlusion)
    })

    it('gives the lit floor the light’s own value', () => {
        const lighting = makeLighting(LIGHTS[0])
        expect(flatValue('floor', lighting)).toBe(lighting.floor)
        expect(flatValue('core', lighting)).toBe(ZONE_VALUES.core)
    })
})

describe('shadeColor', () => {
    it('shows the value as a gray in grayscale', () => {
        expect(shadeColor({ value: 0.5, warmth: 1, zone: 'light' }, 'grayscale')).toEqual([
            128, 128, 128,
        ])
    })

    it('tints light warm and shadow cool, at about the same value', () => {
        const [r1, , b1] = shadeColor({ value: 0.6, warmth: 1, zone: 'halftone' }, 'color')
        const [r2, , b2] = shadeColor({ value: 0.6, warmth: 0, zone: 'core' }, 'color')
        expect(r1).toBeGreaterThan(b1)
        expect(b2).toBeGreaterThan(r2)
        for (const warmth of [0, 1]) {
            const [r, g, b] = shadeColor({ value: 0.6, warmth, zone: 'core' }, 'color')
            expect((0.2126 * r + 0.7152 * g + 0.0722 * b) / 255).toBeCloseTo(0.6, 1)
        }
    })

    it('goes white at full brightness', () => {
        expect(shadeColor({ value: 1, warmth: 1, zone: 'highlight' }, 'color')).toEqual([
            255, 255, 255,
        ])
    })
})
