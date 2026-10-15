import { createContext } from 'react'

/**
 * Set while a tool runs as one step of a practice session (see src/practice/). Its timer then
 * starts by itself at the step's interval, the address bar is left alone, and each pose whose
 * time runs out is reported back. Null on a tool's own page.
 */
export interface PracticeTimer {
    /** The tool's slug, for links to a pose on its own page. */
    slug: string
    /** Seconds per pose, fixed for the step. */
    seconds: number
    /** Poses still to draw in this step, counting the one on screen. */
    posesLeft: number
    /** A pose's time ran out. `last` is true when it was the step's final pose. */
    onPoseDone: (seed: number, last: boolean) => void
    /** The pose on screen changed, for Download PNG's file name. */
    onShow: (seed: number) => void
}

export const PracticeContext = createContext<PracticeTimer | null>(null)
