import { useCallback, useMemo } from 'react'
import { useShortcuts } from '../../shortcuts/useShortcuts'
import { OptionsPanel } from '../shared/OptionsPanel'
import { SessionControls } from '../shared/SessionControls'
import { useSeedSession } from '../shared/useSeedSession'
import { useStoredOptions } from '../shared/useStoredOptions'
import { useSquareCanvas } from '../shared/useSquareCanvas'
import { SUBTRACT_OPTIONS, type SubtractOptions } from './displayOptions'
import { drawSubtract } from './drawSubtract'
import { cutoutFromSeed, describeCutout, type CutsChoice } from './pose'
import '../shared/tool.css'

const SIZE = 480

/** Number keys for the Cuts choice. */
const CUT_KEYS: readonly { key: string; cuts: CutsChoice; description: string }[] = [
    { key: '1', cuts: 'one', description: 'One cut' },
    { key: '2', cuts: 'two', description: 'Two cuts' },
]

export function Subtract() {
    const session = useSeedSession()
    const { seed } = session
    // Display preferences, remembered between visits.
    const [options, setOptions] = useStoredOptions(SUBTRACT_OPTIONS)
    // Placing the cuts and tracing their rims is the slow part, so it only happens when the
    // pose or the number of cuts changes, not for every display option.
    const cutout = useMemo(
        () => cutoutFromSeed(seed, options.cuts, options.uniformSize),
        [seed, options.cuts, options.uniformSize],
    )

    const toggle = (key: 'highlightMeet' | 'showHiddenEdges' | 'showCutAway') =>
        setOptions((o: SubtractOptions) => ({ ...o, [key]: !o[key] }))
    useShortcuts([
        ...CUT_KEYS.map(({ key, cuts, description }) => ({
            key,
            description,
            run: () => setOptions((o: SubtractOptions) => ({ ...o, cuts })),
        })),
        {
            key: 'm',
            description: 'Highlight where the cut meets the form, on or off',
            run: () => toggle('highlightMeet'),
        },
        { key: 'h', description: 'Hidden edges on or off', run: () => toggle('showHiddenEdges') },
        {
            key: 'g',
            description: 'What was cut away (the ghost), on or off',
            run: () => toggle('showCutAway'),
        },
    ])

    const draw = useCallback(
        (ctx: CanvasRenderingContext2D) => drawSubtract(ctx, SIZE, cutout, options),
        [cutout, options],
    )
    const canvasRef = useSquareCanvas(SIZE, draw)

    return (
        <div className="tool-layout">
            <canvas
                ref={canvasRef}
                className="tool-canvas"
                data-focus="show"
                role="img"
                aria-label={`${describeCutout(cutout)}, pose ${seed}`}
            />
            <div className="tool-controls">
                <SessionControls session={session} />
                <OptionsPanel
                    fields={SUBTRACT_OPTIONS.fields}
                    options={options}
                    onChange={setOptions}
                />
            </div>
        </div>
    )
}
