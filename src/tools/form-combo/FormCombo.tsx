import { useCallback, useMemo } from 'react'
import { useShortcuts } from '../../shortcuts/useShortcuts'
import { OptionsPanel } from '../shared/OptionsPanel'
import { SessionControls } from '../shared/SessionControls'
import { useSeedSession } from '../shared/useSeedSession'
import { useStoredOptions } from '../shared/useStoredOptions'
import { useSquareCanvas } from '../shared/useSquareCanvas'
import { FORM_COMBO_OPTIONS, type FormComboOptions } from './displayOptions'
import { drawFormCombo } from './drawFormCombo'
import { comboFromSeed, describeForms, type FormsChoice } from './pose'
import '../shared/tool.css'

const SIZE = 480

/** Number keys for the Forms choice. */
const FORM_KEYS: readonly { key: string; forms: FormsChoice; description: string }[] = [
    { key: '2', forms: 'two', description: 'Two forms' },
    { key: '3', forms: 'three', description: 'Sphere, box and cylinder' },
    { key: '4', forms: 'four', description: 'Add a cone' },
]

export function FormCombo() {
    const session = useSeedSession()
    const { seed } = session
    // Display preferences, remembered between visits.
    const [options, setOptions] = useStoredOptions(FORM_COMBO_OPTIONS)
    // Placing the forms and tracing where they meet is the slow part, so it only happens when
    // the pose or the set of forms changes, not for every display option.
    const combo = useMemo(
        () => comboFromSeed(seed, options.forms, options.uniformSize),
        [seed, options.forms, options.uniformSize],
    )

    const toggle = (key: 'highlightMeet' | 'showHiddenEdges') =>
        setOptions((o: FormComboOptions) => ({ ...o, [key]: !o[key] }))
    useShortcuts([
        ...FORM_KEYS.map(({ key, forms, description }) => ({
            key,
            description,
            run: () => setOptions((o: FormComboOptions) => ({ ...o, forms })),
        })),
        {
            key: 'm',
            description: 'Highlight where forms meet, on or off',
            run: () => toggle('highlightMeet'),
        },
        { key: 'h', description: 'Hidden edges on or off', run: () => toggle('showHiddenEdges') },
    ])

    // Redraw whenever the pose or the display options change.
    const draw = useCallback(
        (ctx: CanvasRenderingContext2D) => drawFormCombo(ctx, SIZE, combo, options),
        [combo, options],
    )
    const canvasRef = useSquareCanvas(SIZE, draw)

    return (
        <div className="tool-layout">
            <canvas
                ref={canvasRef}
                className="tool-canvas"
                data-focus="show"
                role="img"
                aria-label={`${describeForms(combo.solids)} running into each other, pose ${seed}`}
            />
            <SessionControls session={session} />
            <OptionsPanel
                fields={FORM_COMBO_OPTIONS.fields}
                options={options}
                onChange={setOptions}
            />
        </div>
    )
}
