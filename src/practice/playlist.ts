import { MAX_SECONDS, MIN_SECONDS, parseInterval } from '../tools/shared/countdown'

/** One step of a practice session: so many poses of one tool, each on the timer for so long. */
export interface PracticeStep {
    tool: string // the tool's slug
    poses: number
    seconds: number
}

/**
 * A step as it is in the editor, with the numbers as typed so a half-typed value isn't thrown
 * away. It's saved like this too, so the editor comes back as you left it.
 */
export interface StepDraft {
    tool: string
    poses: string
    seconds: string
}

export const MIN_POSES = 1
export const MAX_POSES = 50
/** How many steps a session can have. */
export const MAX_STEPS = 12
export { MAX_SECONDS, MIN_SECONDS }

/** The localStorage key for the session you're putting together. */
export const PRACTICE_KEY = 'sphere-studio:practice'

/** Whole poses from MIN to MAX, or null if the text isn't valid. */
export function parsePoses(text: string): number | null {
    const trimmed = text.trim()
    if (!/^\d+$/.test(trimmed)) return null
    const n = Number(trimmed)
    return n >= MIN_POSES && n <= MAX_POSES ? n : null
}

/** The step a draft describes, or null if a number is out of range or the tool isn't offered. */
export function parseStep(draft: StepDraft, tools: readonly string[]): PracticeStep | null {
    const poses = parsePoses(draft.poses)
    const seconds = parseInterval(draft.seconds)
    if (poses === null || seconds === null || !tools.includes(draft.tool)) return null
    return { tool: draft.tool, poses, seconds }
}

/** Every step, ready to run, or null if there are none or any of them isn't valid. */
export function parseSession(
    drafts: readonly StepDraft[],
    tools: readonly string[],
): PracticeStep[] | null {
    const steps = drafts.map((d) => parseStep(d, tools))
    if (steps.length === 0 || steps.some((s) => s === null)) return null
    return steps as PracticeStep[]
}

export const toDraft = (step: PracticeStep): StepDraft => ({
    tool: step.tool,
    poses: String(step.poses),
    seconds: String(step.seconds),
})

export const totalPoses = (steps: readonly PracticeStep[]) =>
    steps.reduce((sum, s) => sum + s.poses, 0)

/** How long the session takes if no pose is skipped or paused, in seconds. */
export const totalSeconds = (steps: readonly PracticeStep[]) =>
    steps.reduce((sum, s) => sum + s.poses * s.seconds, 0)

/** "45 s", "12 min 30 s", "1 h 5 min": short enough for a button or a phone. */
export function formatDuration(seconds: number): string {
    const s = Math.max(0, Math.round(seconds))
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const rest = s % 60
    if (h > 0) return m > 0 ? `${h} h ${m} min` : `${h} h`
    if (m > 0) return rest > 0 ? `${m} min ${rest} s` : `${m} min`
    return `${rest} s`
}

/** Ready-made sessions to start from. The first is the example from the idea list. */
export const PRESETS: readonly { name: string; steps: readonly PracticeStep[] }[] = [
    {
        name: 'Warm-up',
        steps: [
            { tool: 'sphere-randomizer', poses: 5, seconds: 60 },
            { tool: 'circle-trio-1', poses: 5, seconds: 90 },
        ],
    },
    {
        name: 'Quick sketches',
        steps: [
            { tool: 'sphere-randomizer', poses: 10, seconds: 30 },
            { tool: 'box-randomizer', poses: 10, seconds: 30 },
        ],
    },
    {
        name: 'Forms',
        steps: [
            { tool: 'box-randomizer', poses: 4, seconds: 90 },
            { tool: 'cylinder-randomizer', poses: 4, seconds: 90 },
            { tool: 'cone-randomizer', poses: 4, seconds: 90 },
            { tool: 'form-combo', poses: 2, seconds: 180 },
        ],
    },
]

export const DEFAULT_SESSION: readonly StepDraft[] = PRESETS[0].steps.map(toDraft)

/**
 * Turns stored JSON back into drafts. Steps for a tool that's no longer offered are dropped,
 * and anything unreadable gives the default session, so bad data can't break the page.
 */
export function parseDrafts(raw: string | null, tools: readonly string[]): StepDraft[] {
    if (!raw) return [...DEFAULT_SESSION]
    try {
        const data: unknown = JSON.parse(raw)
        if (!Array.isArray(data)) return [...DEFAULT_SESSION]
        const drafts = data
            .filter((d): d is Record<string, unknown> => typeof d === 'object' && d !== null)
            .map((d) => ({
                tool: String(d.tool ?? ''),
                poses: String(d.poses ?? ''),
                seconds: String(d.seconds ?? ''),
            }))
            .filter((d) => tools.includes(d.tool))
            .slice(0, MAX_STEPS)
        return drafts.length > 0 ? drafts : [...DEFAULT_SESSION]
    } catch {
        return [...DEFAULT_SESSION]
    }
}

/** Reads the saved session from the browser, or the default one. */
export function loadDrafts(tools: readonly string[]): StepDraft[] {
    try {
        return parseDrafts(window.localStorage.getItem(PRACTICE_KEY), tools)
    } catch {
        return [...DEFAULT_SESSION]
    }
}

export function saveDrafts(drafts: readonly StepDraft[]) {
    try {
        window.localStorage.setItem(PRACTICE_KEY, JSON.stringify(drafts))
    } catch {
        // Storage unavailable or full: the session just won't be remembered.
    }
}
