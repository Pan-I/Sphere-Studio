import { MAX_SEED, parseSeed } from '../tools/shared/seed'

/** How many poses fit on a sheet. */
export const POSE_COUNTS = [6, 12] as const
export type PoseCount = (typeof POSE_COUNTS)[number]

/** What a worksheet shows: one tool, `poses` poses from `seed` on, and whether each gets a box to draw in. */
export interface WorksheetSettings {
    tool: string
    seed: number
    poses: PoseCount
    /** True frames each pose in a box with room beside it to draw. */
    room: boolean
}

/**
 * The printed sheet, in millimetres. It fits inside both A4 (210 × 297) and US Letter
 * (216 × 279) with 12 mm margins, so it prints on one page either way.
 */
export const SHEET_WIDTH_MM = 186
export const SHEET_HEIGHT_MM = 250
export const PAGE_MARGIN_MM = 12
/** The line at the top with the tool's name and the seeds. */
const HEADER_MM = 10
const GAP_MM = 6
/** The seed under each pose. */
const CAPTION_MM = 5
/** With room to draw, the pose takes at most this share of its box's width. */
const ROOM_POSE_SHARE = 0.45
/** With room to draw, the space between a box's frame and the pose. */
export const ROOM_PADDING_MM = 2

/** Pixels per inch the poses are drawn at, so they print sharp. */
export const PRINT_DPI = 300

export interface WorksheetLayout {
    columns: number
    rows: number
    /** Each pose's square, in millimetres. */
    poseMm: number
    /** Each pose's drawing buffer, in pixels, for PRINT_DPI. */
    pixels: number
}

/**
 * How the poses sit on the sheet. Without room to draw they're as big as the grid allows. With
 * room, each pose sits at the left of a framed box, and the rest of the box is for drawing:
 * 6 poses in 2 columns of 3, or 12 in 2 columns of 6 wide strips.
 */
export function worksheetLayout(poses: PoseCount, room: boolean): WorksheetLayout {
    const [columns, rows] = room ? [2, poses / 2] : poses === 6 ? [2, 3] : [3, 4]
    const cellWidth = (SHEET_WIDTH_MM - GAP_MM * (columns - 1)) / columns
    const cellHeight = (SHEET_HEIGHT_MM - HEADER_MM - GAP_MM * rows) / rows
    const fitHeight = cellHeight - CAPTION_MM - (room ? 2 * ROOM_PADDING_MM : 0)
    const poseMm = Math.floor(
        room ? Math.min(fitHeight, cellWidth * ROOM_POSE_SHARE) : Math.min(fitHeight, cellWidth),
    )
    return { columns, rows, poseMm, pixels: Math.round((poseMm / 25.4) * PRINT_DPI) }
}

/** `count` consecutive seeds from `first`, wrapping past MAX_SEED back to 0. */
export function sheetSeeds(first: number, count: number): number[] {
    return Array.from({ length: count }, (_, i) => (first + i) % (MAX_SEED + 1))
}

/**
 * Reads a sheet from the address bar, e.g. `?tool=box-randomizer&seed=48213&poses=12&room=0`.
 * Anything missing or not understood comes from `fallback`.
 */
export function readSettings(
    search: string,
    tools: readonly string[],
    fallback: WorksheetSettings,
): WorksheetSettings {
    const params = new URLSearchParams(search)
    const tool = params.get('tool')
    const seed = parseSeed(params.get('seed') ?? '')
    const poses = Number(params.get('poses'))
    const room = params.get('room')
    return {
        tool: tool !== null && tools.includes(tool) ? tool : fallback.tool,
        seed: seed ?? fallback.seed,
        poses: POSE_COUNTS.includes(poses as PoseCount) ? (poses as PoseCount) : fallback.poses,
        room: room === '1' ? true : room === '0' ? false : fallback.room,
    }
}

/** The address bar's query for a sheet, so a link or a reload brings back the same sheet. */
export function settingsSearch(settings: WorksheetSettings): string {
    const params = new URLSearchParams({
        tool: settings.tool,
        seed: String(settings.seed),
        poses: String(settings.poses),
        room: settings.room ? '1' : '0',
    })
    return `?${params}`
}

/** Where the last sheet's tool, pose count and room setting are kept, for next time. */
export const WORKSHEET_KEY = 'sphere-studio:worksheet'

type Saved = Pick<WorksheetSettings, 'tool' | 'poses' | 'room'>

/** The last sheet's choices, checked against `tools`. Defaults for anything missing. */
export function loadChoices(tools: readonly string[]): Saved {
    const defaults: Saved = { tool: tools[0], poses: 6, room: true }
    try {
        const raw = JSON.parse(window.localStorage.getItem(WORKSHEET_KEY) ?? 'null') as unknown
        if (!raw || typeof raw !== 'object') return defaults
        const saved = raw as Partial<Record<keyof Saved, unknown>>
        return {
            tool:
                typeof saved.tool === 'string' && tools.includes(saved.tool)
                    ? saved.tool
                    : defaults.tool,
            poses: POSE_COUNTS.includes(saved.poses as PoseCount)
                ? (saved.poses as PoseCount)
                : defaults.poses,
            room: typeof saved.room === 'boolean' ? saved.room : defaults.room,
        }
    } catch {
        return defaults
    }
}

export function saveChoices({ tool, poses, room }: WorksheetSettings) {
    try {
        window.localStorage.setItem(WORKSHEET_KEY, JSON.stringify({ tool, poses, room }))
    } catch {
        // Storage unavailable: the sheet still works, it just isn't remembered.
    }
}
