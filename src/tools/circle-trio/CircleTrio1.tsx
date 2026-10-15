import { useCallback, useMemo } from 'react'
import { OptionsPanel } from '../shared/OptionsPanel'
import { SessionControls } from '../shared/SessionControls'
import { useSeedSession } from '../shared/useSeedSession'
import { useStoredOptions } from '../shared/useStoredOptions'
import { useSquareCanvas } from '../shared/useSquareCanvas'
import { CIRCLE_OPTIONS } from './displayOptions'
import { drawCircles } from './drawCircles'
import { layoutFromSeed } from './layout'
import '../shared/tool.css'

const SIZE = 480

export function CircleTrio1() {
    const session = useSeedSession()
    const { seed } = session
    const circles = useMemo(() => layoutFromSeed(seed), [seed])
    // Display preferences, remembered between visits.
    const [options, setOptions] = useStoredOptions(CIRCLE_OPTIONS)

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
                aria-label={`Two large circles and a small one, layout ${seed}`}
            />
            <div className="tool-controls">
                <SessionControls session={session} />
                <OptionsPanel
                    fields={CIRCLE_OPTIONS.fields}
                    options={options}
                    onChange={setOptions}
                />
            </div>
        </div>
    )
}
