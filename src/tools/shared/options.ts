/**
 * Display options, described once as data. A tool lists its fields (a choice, a range or a
 * toggle each) and gets the defaults, parsing of stored values, saving, and the controls in
 * `OptionsPanel` from that one list.
 */

interface FieldBase<T> {
    label: string
    /** Greys the control out, e.g. opacity when there is no fill. */
    disabledWhen?: (options: T) => boolean
}

export interface ChoiceField<T, V extends string> extends FieldBase<T> {
    kind: 'choice'
    default: V
    choices: readonly { value: V; label: string }[]
}

export interface RangeField<T> extends FieldBase<T> {
    kind: 'range'
    default: number
    min: number
    max: number
    step: number
    /** Shown after the value, e.g. "px" or "%". */
    unit: string
}

export interface ToggleField<T> extends FieldBase<T> {
    kind: 'toggle'
    default: boolean
    /** While disabled, show the box ticked, for a setting that is forced on. */
    checkedWhenDisabled?: boolean
}

/** The field type that fits a value: booleans are toggles, numbers ranges, strings choices. */
type FieldFor<T, V> = [V] extends [boolean]
    ? ToggleField<T>
    : [V] extends [number]
      ? RangeField<T>
      : [V] extends [string]
        ? ChoiceField<T, V>
        : never

/** One field per option. The panel shows them in the order they are written. */
export type OptionFields<T> = { [K in keyof T]-?: FieldFor<T, T[K]> }

export type AnyField<T> = OptionFields<T>[keyof T]

// Presets for the options most tools share, so they look and behave the same everywhere.

export type ColorMode = 'color' | 'grayscale' | 'none'

export const COLOR_MODES: readonly ColorMode[] = ['color', 'grayscale', 'none']

/** Color, grayscale or none. `label` and `noneLabel` let each tool use its own words. */
export function colorModeField<T>(label: string, noneLabel: string): ChoiceField<T, ColorMode> {
    return {
        kind: 'choice',
        label,
        default: 'color',
        choices: [
            { value: 'color', label: 'Color' },
            { value: 'grayscale', label: 'Grayscale' },
            { value: 'none', label: noneLabel },
        ],
    }
}

export const LINE_WIDTH_MIN = 1
export const LINE_WIDTH_MAX = 8

export function lineWidthField<T>(): RangeField<T> {
    return {
        kind: 'range',
        label: 'Line thickness',
        default: 2,
        min: LINE_WIDTH_MIN,
        max: LINE_WIDTH_MAX,
        step: 1,
        unit: 'px',
    }
}

export function toggleField<T>(label: string, on: boolean): ToggleField<T> {
    return { kind: 'toggle', label, default: on }
}

/** Rounds to a whole number within the field's range, or returns its default for NaN and Infinity. */
export function clampToRange<T>(field: RangeField<T>, n: number): number {
    if (!Number.isFinite(n)) return field.default
    return Math.min(field.max, Math.max(field.min, Math.round(n)))
}

function entries<T>(fields: OptionFields<T>): [keyof T, AnyField<T>][] {
    return Object.entries(fields) as [keyof T, AnyField<T>][]
}

export function defaultsOf<T>(fields: OptionFields<T>): T {
    const out: Partial<Record<keyof T, unknown>> = {}
    for (const [key, field] of entries(fields)) out[key] = field.default
    return out as T
}

/** True when every field has the same value in both, e.g. to tell whether options are at their defaults. */
export function sameOptions<T>(fields: OptionFields<T>, a: T, b: T): boolean {
    return entries(fields).every(([key]) => a[key] === b[key])
}

/** Checks one stored value against its field, falling back to the field's default. */
function parseField<T>(field: AnyField<T>, value: unknown): unknown {
    switch (field.kind) {
        case 'choice':
            return field.choices.find((c) => c.value === value)?.value ?? field.default
        case 'range':
            return typeof value === 'number' ? clampToRange(field, value) : field.default
        case 'toggle':
            return typeof value === 'boolean' ? value : field.default
    }
}

/**
 * Turns stored JSON into valid options. Anything missing, malformed, or out of range falls
 * back to the default for that field, so bad data can't break the tool. Unknown keys are dropped.
 */
export function parseOptions<T>(fields: OptionFields<T>, raw: string | null): T {
    if (!raw) return defaultsOf(fields)
    try {
        const data: unknown = JSON.parse(raw)
        if (typeof data !== 'object' || data === null || Array.isArray(data)) {
            return defaultsOf(fields)
        }
        const d = data as Record<string, unknown>
        const out: Partial<Record<keyof T, unknown>> = {}
        for (const [key, field] of entries(fields)) out[key] = parseField(field, d[key as string])
        return out as T
    } catch {
        return defaultsOf(fields)
    }
}

/** A tool's options: its fields, defaults, and where they are saved in the browser. */
export interface OptionSet<T> {
    fields: OptionFields<T>
    defaults: Readonly<T>
    load: () => T
    save: (options: T) => void
}

/** `storageKey` is the localStorage key. Keep it unchanged so people's saved choices survive. */
export function defineOptions<T>(storageKey: string, fields: OptionFields<T>): OptionSet<T> {
    const defaults = Object.freeze(defaultsOf(fields))
    return {
        fields,
        defaults,
        load() {
            try {
                return parseOptions(fields, window.localStorage.getItem(storageKey))
            } catch {
                return defaultsOf(fields) // storage can be blocked, e.g. in some private modes
            }
        },
        save(options) {
            try {
                // Nothing is stored at the defaults, so a later change to a default reaches
                // everyone who hasn't picked something else.
                if (sameOptions(fields, options, defaults))
                    window.localStorage.removeItem(storageKey)
                else window.localStorage.setItem(storageKey, JSON.stringify(options))
            } catch {
                // Storage unavailable or full: the options just won't persist.
            }
        },
    }
}
