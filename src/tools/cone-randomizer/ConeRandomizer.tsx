import { useCallback, useMemo } from 'react'
import { OptionsPanel } from '../shared/OptionsPanel'
import { SessionControls } from '../shared/SessionControls'
import { useSeedSession } from '../shared/useSeedSession'
import { useStoredOptions } from '../shared/useStoredOptions'
import { useSquareCanvas } from '../shared/useSquareCanvas'
import { CONE_OPTIONS } from './displayOptions'
import { drawCone } from './drawCone'
import { poseFromSeed } from './pose'
import '../shared/tool.css'

const SIZE = 480

export function ConeRandomizer() {
    const session = useSeedSession()
    const { seed } = session
    const { q, proportion } = useMemo(() => poseFromSeed(seed), [seed])
    // Display preferences, remembered between visits.
    const [options, setOptions] = useStoredOptions(CONE_OPTIONS)

    // Redraw whenever the orientation or the display options change.
    const draw = useCallback(
        (ctx: CanvasRenderingContext2D) => drawCone(ctx, SIZE, q, proportion, options),
        [q, proportion, options],
    )
    const canvasRef = useSquareCanvas(SIZE, draw)

    return (
        <div className="tool-layout">
            <canvas
                ref={canvasRef}
                className="tool-canvas"
                data-focus="show"
                role="img"
                aria-label={`Cone in a random orientation, pose ${seed}`}
            />
            <SessionControls session={session} />
            <OptionsPanel fields={CONE_OPTIONS.fields} options={options} onChange={setOptions} />
        </div>
    )
}
