// src/math/carve.ts
import type { Vec3 } from './quat'
import { inside, spanFinder, type Solid, type Span } from './solids'

/**
 * A form with others cut out of it: what is left of `main` once every one of `cuts` is taken
 * away, the way you'd carve a block.
 */
export interface Carved {
    main: Solid
    cuts: readonly Solid[]
}

/**
 * A stretch of a ray inside what's left of a carved form, from t0 to t1. `cut` says whose
 * surface it starts on: -1 for the main form's own outside, or the number of the cut whose
 * hollow it starts at. `face` is the face it starts on, numbered as in Span: the main form's
 * face it goes in through, or the face of the cut it comes out of.
 */
export interface Piece {
    t0: number
    t1: number
    cut: number
    face: number
}

/**
 * The stretches of a ray inside a carved form, nearest first, given where it meets the main
 * form and each cut. Each cut takes its span out of whatever pieces it overlaps, so a ray can
 * end up with none, one or several pieces.
 */
export function carvedPieces(main: Span | null, cuts: readonly (Span | null)[]): Piece[] {
    if (!main) return []
    let pieces: Piece[] = [{ t0: main.t0, t1: main.t1, cut: -1, face: main.face }]
    cuts.forEach((c, i) => {
        if (!c) return
        const next: Piece[] = []
        for (const p of pieces) {
            if (c.t1 <= p.t0 || c.t0 >= p.t1) {
                next.push(p)
                continue
            }
            if (c.t0 > p.t0) next.push({ ...p, t1: c.t0 })
            if (c.t1 < p.t1) next.push({ t0: c.t1, t1: p.t1, cut: i, face: c.exit })
        }
        pieces = next
    })
    return pieces
}

/** Where rays meet a carved form, as carvedPieces of the ray o + t·d. Quick for many rays. */
export function carvedFinder(carved: Carved): (o: Vec3, d: Vec3) => Piece[] {
    const main = spanFinder(carved.main)
    const cuts = carved.cuts.map(spanFinder)
    return (o, d) => {
        const m = main(o, d)
        return m
            ? carvedPieces(
                  m,
                  cuts.map((c) => c(o, d)),
              )
            : []
    }
}

/**
 * Negative inside what is left of the carved form, positive outside and zero on its surface,
 * like `inside` for a single solid: inside the main form and outside every cut.
 */
export function insideCarved(carved: Carved, p: Vec3): number {
    let value = inside(carved.main, p)
    for (const c of carved.cuts) value = Math.max(value, -inside(c, p))
    return value
}
