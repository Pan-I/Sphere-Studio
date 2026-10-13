import { useCallback, useEffect, useMemo, useState } from 'react'
import { SessionControls } from '../shared/SessionControls'
import { useSeedSession } from '../shared/useSeedSession'
import { useSquareCanvas } from '../shared/useSquareCanvas'
import { CircleControls } from './CircleControls'
import { loadOptions, saveOptions } from './displayOptions'
import { drawCircles } from './drawCircles'
import { layoutFromSeed } from './layout'
import '../shared/tool.css'

const SIZE = 480

export function CircleTrio() {
    const session = useSeedSession()
    const { seed } = session
    const circles = useMemo(() => layoutFromSeed(seed), [seed])
    const [options, setOptions] = useState(loadOptions)

    // Redraw whenever the layout or the display options change.
    const draw = useCallback(
        (ctx: CanvasRenderingContext2D) => drawCircles(ctx, SIZE, circles, options),
        [circles, options],
    )
    const canvasRef = useSquareCanvas(SIZE, draw)

    // Remember display preferences between visits.
    useEffect(() => {
        saveOptions(options)
    }, [options])

    return (
        <div className="tool-layout">
            <canvas
                ref={canvasRef}
                className="tool-canvas"
                data-focus="show"
                role="img"
                aria-label={`Two large circles and a small one, layout ${seed}`}
            />
            <SessionControls session={session} />
            <CircleControls options={options} onChange={setOptions} />
        </div>
    )
}
