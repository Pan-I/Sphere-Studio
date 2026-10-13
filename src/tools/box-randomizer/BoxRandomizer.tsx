import { useCallback, useMemo } from 'react'
import { OptionsPanel } from '../shared/OptionsPanel'
import { SessionControls } from '../shared/SessionControls'
import { useSeedSession } from '../shared/useSeedSession'
import { useStoredOptions } from '../shared/useStoredOptions'
import { useSquareCanvas } from '../shared/useSquareCanvas'
import { BOX_OPTIONS } from './displayOptions'
import { drawBox } from './drawBox'
import { quatFromSeed } from './pose'
import '../shared/tool.css'

const SIZE = 480

export function BoxRandomizer() {
    const session = useSeedSession()
    const { seed } = session
    const q = useMemo(() => quatFromSeed(seed), [seed])
    // Display preferences, remembered between visits.
    const [options, setOptions] = useStoredOptions(BOX_OPTIONS)

    // Redraw whenever the orientation or the display options change.
    const draw = useCallback(
        (ctx: CanvasRenderingContext2D) => drawBox(ctx, SIZE, q, options),
        [q, options],
    )
    const canvasRef = useSquareCanvas(SIZE, draw)

    return (
        <div className="tool-layout">
            <canvas
                ref={canvasRef}
                className="tool-canvas"
                data-focus="show"
                role="img"
                aria-label={`Cube in a random orientation, pose ${seed}`}
            />
            <SessionControls session={session} />
            <OptionsPanel fields={BOX_OPTIONS.fields} options={options} onChange={setOptions} />
        </div>
    )
}
