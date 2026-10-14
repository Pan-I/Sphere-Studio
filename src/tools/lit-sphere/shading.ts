import { CONTACT, VIEW, normalize, shadowEdgeAt } from '../../math/light'
import { dot, type Vec3 } from '../../math/quat'
import type { Shading } from './displayOptions'

/** The value zones artists use for a lit form, on the sphere and on the floor. */
export type Zone =
    'highlight' | 'light' | 'halftone' | 'core' | 'reflected' | 'floor' | 'cast' | 'occlusion'

/** How bright a point is (0 black to 1 white), how warm (1 lit, 0 in shadow), and its zone. */
export interface Shade {
    value: number
    warmth: number
    zone: Zone
}

/** Everything about the light that every pixel needs, worked out once. */
export interface Lighting {
    /** Toward the light. */
    light: Vec3
    /** Halfway between the light and the viewer: the highlight sits where the normal is this. */
    half: Vec3
    /** Where the reflected light comes from: low, from the side away from the light. */
    bounce: Vec3
    /** The value of the lit floor, which depends on how high the light is. */
    floor: number
}

// Lit side: from LIGHT_MIN at the terminator to LIGHT_MIN + LIGHT_RANGE facing the light.
const LIGHT_MIN = 0.45
const LIGHT_RANGE = 0.45
const SPECULAR = 0.35
const SHININESS = 90
// Shadow side: SHADOW_MIN in the core shadow, up to SHADOW_MIN + BOUNCE_RANGE in reflected light.
// The brightest reflected light stays darker than the darkest halftone, the rule that keeps the
// light and shadow families apart.
const SHADOW_MIN = 0.12
const BOUNCE_RANGE = 0.22
/** Half the width, in N·L, of the soft step from shadow to light at the terminator. */
const TERMINATOR_SOFTNESS = 0.05
const CAST_SHADOW = 0.22
const OCCLUSION_DARK = 0.06
/** How far (in radii) the occlusion shadow spreads from the contact point. */
const OCCLUSION_SPREAD = 0.35

/** Flat values for "Flat value zones". The lit floor keeps the light's own value. */
export const ZONE_VALUES: Record<Exclude<Zone, 'floor'>, number> = {
    highlight: 1,
    light: 0.86,
    halftone: 0.64,
    reflected: 0.3,
    cast: 0.22,
    core: 0.12,
    occlusion: 0.06,
}

// Zone boundaries.
const HIGHLIGHT_ZONE = 0.97 // N·H
const LIGHT_ZONE = 0.5 // N·L
const REFLECTED_ZONE = 0.55 // N·bounce

const smoothstep = (a: number, b: number, x: number) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)
}

export function makeLighting(light: Vec3): Lighting {
    const flat = Math.hypot(light[0], light[2])
    // Straight overhead has no "away" side; any low direction will do then.
    const away: Vec3 = flat > 1e-6 ? [-light[0] / flat, 0, -light[2] / flat] : [0, 0, -1]
    return {
        light,
        half: normalize([light[0] + VIEW[0], light[1] + VIEW[1], light[2] + VIEW[2]]),
        bounce: normalize([away[0], -0.6, away[2]]),
        floor: LIGHT_MIN + LIGHT_RANGE * light[1],
    }
}

/** The shade of the sphere where its outward normal is `n`. */
export function shadeSphere(n: Vec3, lighting: Lighting): Shade {
    const d = dot(n, lighting.light)
    const facing = Math.max(0, dot(n, lighting.half))
    const bounce = Math.max(0, dot(n, lighting.bounce))
    const lit = LIGHT_MIN + LIGHT_RANGE * Math.max(0, d) + SPECULAR * facing ** SHININESS
    const shadow = SHADOW_MIN + BOUNCE_RANGE * bounce ** 1.2
    const t = smoothstep(-TERMINATOR_SOFTNESS, TERMINATOR_SOFTNESS, d)
    const zone: Zone =
        d > 0
            ? facing > HIGHLIGHT_ZONE
                ? 'highlight'
                : d > LIGHT_ZONE
                  ? 'light'
                  : 'halftone'
            : bounce > REFLECTED_ZONE
              ? 'reflected'
              : 'core'
    return {
        value: Math.min(1, shadow + (lit - shadow) * t),
        // Reflected light picks up some warmth from the lit floor it bounces off.
        warmth: t + (1 - t) * 0.35 * bounce,
        zone,
    }
}

/** The shade of the floor at `g`: lit, in the cast shadow, or in the occlusion shadow. */
export function shadeFloor(g: Vec3, lighting: Lighting): Shade {
    const { edge, reach } = shadowEdgeAt(g, lighting.light)
    // The shadow's edge is crisp near the sphere and softens as the light has further to go.
    const softness = 0.02 + 0.05 * Math.max(0, reach)
    const cover = smoothstep(1 + softness, 1 - softness, edge)
    const dx = g[0] - CONTACT[0]
    const dz = g[2] - CONTACT[2]
    const occlusion = Math.exp(-(dx * dx + dz * dz) / (OCCLUSION_SPREAD * OCCLUSION_SPREAD))
    const base = lighting.floor + (CAST_SHADOW - lighting.floor) * cover
    const value = base + (OCCLUSION_DARK - base) * occlusion
    const zone: Zone = occlusion > 0.5 ? 'occlusion' : cover > 0.5 ? 'cast' : 'floor'
    return { value, warmth: 1 - Math.max(cover, occlusion), zone }
}

/** The value a zone gets with "Flat value zones" on. */
export const flatValue = (zone: Zone, lighting: Lighting): number =>
    zone === 'floor' ? lighting.floor : ZONE_VALUES[zone]

export type RGB = readonly [number, number, number]

// Warm light and cool shadow, a painter's habit that makes the two families easy to tell apart.
const WARM: RGB = [1, 0.95, 0.86]
const COOL: RGB = [0.8, 0.87, 1]
const luminance = ([r, g, b]: RGB) => 0.2126 * r + 0.7152 * g + 0.0722 * b

/**
 * A shade as 0–255 RGB. Grayscale shows the value alone. Color tints it warm in the light and
 * cool in shadow while keeping about the same value, and lets the brightest values go white.
 */
export function shadeColor({ value, warmth }: Shade, mode: Exclude<Shading, 'none'>): RGB {
    if (mode === 'grayscale') {
        const v = Math.round(value * 255)
        return [v, v, v]
    }
    const tint = COOL.map((c, i) => c + (WARM[i] - c) * warmth) as unknown as RGB
    const lum = luminance(tint)
    const white = value ** 6
    return tint.map((c) => {
        const tinted = (value * c) / lum
        return Math.round(Math.min(1, tinted + (value - tinted) * white) * 255)
    }) as unknown as RGB
}
