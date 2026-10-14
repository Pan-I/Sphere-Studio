import { useMemo } from 'react'
import { clampToRange, defaultsOf, sameOptions, type AnyField, type OptionFields } from './options'

interface Props<T> {
    fields: OptionFields<T>
    options: T
    onChange: (next: T) => void
}

/** The "Display" box under every tool, built from the tool's option fields. */
export function OptionsPanel<T>({ fields, options, onChange }: Props<T>) {
    const keys = Object.keys(fields) as (keyof T)[]
    const defaults = useMemo(() => defaultsOf(fields), [fields])
    const atDefaults = sameOptions(fields, options, defaults)
    return (
        <fieldset className="tool-display">
            <legend>Display</legend>
            {keys.map((key) => (
                <OptionControl
                    key={String(key)}
                    field={fields[key] as AnyField<T>}
                    value={options[key]}
                    disabled={fields[key].disabledWhen?.(options) ?? false}
                    onChange={(value) => onChange({ ...options, [key]: value })}
                />
            ))}
            <div className="tool-display-actions">
                <button type="button" disabled={atDefaults} onClick={() => onChange(defaults)}>
                    Reset to defaults
                </button>
            </div>
        </fieldset>
    )
}

interface ControlProps<T> {
    field: AnyField<T>
    value: unknown
    disabled: boolean
    onChange: (value: unknown) => void
}

function OptionControl<T>({ field, value, disabled, onChange }: ControlProps<T>) {
    switch (field.kind) {
        case 'choice':
            return (
                <label className="tool-option">
                    <span>{field.label}</span>
                    <select
                        value={String(value)}
                        disabled={disabled}
                        onChange={(e) => {
                            const next = field.choices.find((c) => c.value === e.target.value)
                            if (next) onChange(next.value)
                        }}
                    >
                        {field.choices.map((c) => (
                            <option key={c.value} value={c.value}>
                                {c.label}
                            </option>
                        ))}
                    </select>
                </label>
            )
        case 'range':
            return (
                <label className="tool-option">
                    <span>{field.label}</span>
                    <span className="tool-range">
                        <input
                            type="range"
                            min={field.min}
                            max={field.max}
                            step={field.step}
                            value={Number(value)}
                            disabled={disabled}
                            onChange={(e) => onChange(clampToRange(field, Number(e.target.value)))}
                        />
                        <output>
                            {String(value)}
                            {field.unit}
                        </output>
                    </span>
                </label>
            )
        case 'toggle':
            return (
                <label className="tool-option">
                    <span>{field.label}</span>
                    <input
                        type="checkbox"
                        checked={value === true || (disabled && field.checkedWhenDisabled === true)}
                        disabled={disabled}
                        onChange={(e) => onChange(e.target.checked)}
                    />
                </label>
            )
    }
}
