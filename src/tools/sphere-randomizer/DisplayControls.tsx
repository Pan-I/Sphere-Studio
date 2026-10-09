import {
    LINE_WIDTH_MAX,
    LINE_WIDTH_MIN,
    SHADINGS,
    clampLineWidth,
    type DisplayOptions,
    type Shading,
} from './displayOptions'

const SHADING_LABELS: Record<Shading, string> = {
    color: 'Color',
    grayscale: 'Grayscale',
    none: 'None (lines only)',
}

interface Props {
    options: DisplayOptions
    onChange: (next: DisplayOptions) => void
}

export function DisplayControls({ options, onChange }: Props) {
    const set = (patch: Partial<DisplayOptions>) => onChange({ ...options, ...patch })

    return (
        <fieldset style={{ marginTop: '1rem', display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <legend>Display</legend>

            <label>
                Shading{' '}
                <select
                    value={options.shading}
                    onChange={(e) => {
                        const next = SHADINGS.find((s) => s === e.target.value)
                        if (next) set({ shading: next })
                    }}
                >
                    {SHADINGS.map((s) => (
                        <option key={s} value={s}>{SHADING_LABELS[s]}</option>
                    ))}
                </select>
            </label>

            <label>
                Line thickness{' '}
                <input
                    type="range"
                    min={LINE_WIDTH_MIN}
                    max={LINE_WIDTH_MAX}
                    step={1}
                    value={options.lineWidth}
                    onChange={(e) => set({ lineWidth: clampLineWidth(Number(e.target.value)) })}
                />{' '}
                {options.lineWidth}px
            </label>

            <label>
                <input
                    type="checkbox"
                    checked={options.showFarSide}
                    onChange={(e) => set({ showFarSide: e.target.checked })}
                />{' '}
                Show far-side lines
            </label>

            <label>
            <input
                type="checkbox"
                checked={options.showMarker}
                onChange={(e) => set({ showMarker: e.target.checked })}
            />{' '}
            Show center marker
            </label>
        </fieldset>
    )
}