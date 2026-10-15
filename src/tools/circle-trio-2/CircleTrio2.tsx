import { useCallback, useMemo } from 'react'
import { OptionsPanel } from '../shared/OptionsPanel'
import { SessionControls } from '../shared/SessionControls'
import { useSeedSession } from '../shared/useSeedSession'
import { useStoredOptions } from '../shared/useStoredOptions'
import { useSquareCanvas } from '../shared/useSquareCanvas'
import { drawCircles } from '../circle-trio/drawCircles'
import { CIRCLE_TRIO_2_OPTIONS } from './displayOptions'
import { layoutFromSeed } from './layout'
import '../shared/tool.css'

const SIZE = 480

export function CircleTrio2() {
    const session = useSeedSession()
    const { seed } = session
    const circles = useMemo(() => layoutFromSeed(seed), [seed])
    // Display preferences, remembered between visits.
    const [options, setOptions] = useStoredOptions(CIRCLE_TRIO_2_OPTIONS)

    // Redraw whenever the layout or the display options change.
    const draw = useCallback(
        (ctx: CanvasRenderingContext2D) => drawCircles(ctx, SIZE, circles, options),
        [circles, options],
    )
    const canvasRef = useSquareCanvas(SIZE, draw)

    return (
        <div className="tool-layout">
            <canvas
                ref={canvasRef}
                className="tool-canvas"
                data-focus="show"
                role="img"
                aria-label={`A large circle and two small ones on its edge, layout ${seed}`}
            />
            <div className="tool-controls">
                <SessionControls session={session} />
                <OptionsPanel
                    fields={CIRCLE_TRIO_2_OPTIONS.fields}
                    options={options}
                    onChange={setOptions}
                />
            </div>
        </div>
    )
}
