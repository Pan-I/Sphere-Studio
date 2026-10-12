import {
    FILLS,
    LINE_WIDTH_MAX,
    LINE_WIDTH_MIN,
    OPACITY_MAX,
    OPACITY_MIN,
    clampLineWidth,
    clampOpacity,
    type CircleOptions,
    type Fill,
} from './displayOptions'

const FILL_LABELS: Record<Fill, string> = {
    color: 'Color',
    grayscale: 'Grayscale',
    none: 'None (outlines only)',
}

interface Props {
    options: CircleOptions
    onChange: (next: CircleOptions) => void
}

export function CircleControls({ options, onChange }: Props) {
    const set = (patch: Partial<CircleOptions>) => onChange({ ...options, ...patch })
    const noFill = options.fill === 'none'

    return (
        <fieldset className="tool-options">
            <legend>Display</legend>
            <label className="tool-option">
                <span>Fill</span>
                <select
                    value={options.fill}
                    onChange={(e) => {
                        const next = FILLS.find((f) => f === e.target.value)
                        if (next) set({ fill: next })
                    }}
                >
                    {FILLS.map((f) => (
                        <option key={f} value={f}>
                            {FILL_LABELS[f]}
                        </option>
                    ))}
                </select>
            </label>
            <label className="tool-option">
                <span>Opacity</span>
                <span className="tool-range">
                    <input
                        type="range"
                        min={OPACITY_MIN}
                        max={OPACITY_MAX}
                        step={5}
                        value={options.opacity}
                        disabled={noFill}
                        onChange={(e) => set({ opacity: clampOpacity(Number(e.target.value)) })}
                    />
                    <output>{options.opacity}%</output>
                </span>
            </label>
            <label className="tool-option">
                <span>Line thickness</span>
                <span className="tool-range">
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
            <label className="tool-option">
                <span>Show outlines</span>
                <input
                    type="checkbox"
                    checked={options.showOutlines || noFill}
                    disabled={noFill}
                    onChange={(e) => set({ showOutlines: e.target.checked })}
                />
            </label>
            <label className="tool-option">
                <span>Show centers</span>
                <input
                    type="checkbox"
                    checked={options.showCenters}
                    onChange={(e) => set({ showCenters: e.target.checked })}
                />
            </label>
        </fieldset>
    )
}
