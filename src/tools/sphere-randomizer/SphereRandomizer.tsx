import { useCallback, useEffect, useMemo, useState } from 'react'
import { pickMarker } from '../../math/sphere'
import { SessionControls } from '../shared/SessionControls'
import { useSeedSession } from '../shared/useSeedSession'
import { useSquareCanvas } from '../shared/useSquareCanvas'
import { drawSphere } from './drawSphere'
import { DisplayControls } from './DisplayControls'
import { loadOptions, saveOptions } from './displayOptions'
import { poseFromSeed } from './pose'
import '../shared/tool.css'

const SIZE = 480

export function SphereRandomizer() {
    const session = useSeedSession()
    const { seed } = session
    const pose = useMemo(() => {
        const { q, markerPick } = poseFromSeed(seed)
        return { q, marker: pickMarker(q, markerPick) }
    }, [seed])
    const [options, setOptions] = useState(loadOptions)

    // Redraw whenever the orientation or the display options change.
    const draw = useCallback(
        (ctx: CanvasRenderingContext2D) => drawSphere(ctx, SIZE, pose.q, options, pose.marker),
        [pose, options],
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
                aria-label={`Sphere divided into eight sectors, pose ${seed}`}
            />
            <SessionControls session={session} />
            <DisplayControls options={options} onChange={setOptions} />
        </div>
    )
}
