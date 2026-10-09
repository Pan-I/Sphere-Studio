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
        <fieldset className="sphere-display">
            <legend>Display</legend>

            <label className="sphere-option">
                <span>Shading</span>
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

            <label className="sphere-option">
                <span>Line thickness</span>
                <span className="sphere-range">
          <input
              type="range"
              min={LINE_WIDTH_MIN}
              max={LINE_WIDTH_MAX}
              step={1}
              value={options.lineWidth}
              onChange={(e) => set({ lineWidth: clampLineWidth(Number(e.target.value)) })}
          />
          <output>{options.lineWidth}px</output>
        </span>
            </label>

            <label className="sphere-option">
                <span>Show far-side lines</span>
                <input
                    type="checkbox"
                    checked={options.showFarSide}
                    onChange={(e) => set({ showFarSide: e.target.checked })}
                />
            </label>

            <label className="sphere-option">
                <span>Show center marker</span>
                <input
                    type="checkbox"
                    checked={options.showMarker}
                    onChange={(e) => set({ showMarker: e.target.checked })}
                />
            </label>
        </fieldset>
    )
}