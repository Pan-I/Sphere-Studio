import { useCallback, useMemo } from 'react'
import { pickMarker } from '../../math/sphere'
import { OptionsPanel } from '../shared/OptionsPanel'
import { SessionControls } from '../shared/SessionControls'
import { useSeedSession } from '../shared/useSeedSession'
import { useStoredOptions } from '../shared/useStoredOptions'
import { useSquareCanvas } from '../shared/useSquareCanvas'
import { drawSphere } from './drawSphere'
import { SPHERE_OPTIONS } from './displayOptions'
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
    // Display preferences, remembered between visits.
    const [options, setOptions] = useStoredOptions(SPHERE_OPTIONS)

    // Redraw whenever the orientation or the display options change.
    const draw = useCallback(
        (ctx: CanvasRenderingContext2D) => drawSphere(ctx, SIZE, pose.q, options, pose.marker),
        [pose, options],
    )
    const canvasRef = useSquareCanvas(SIZE, draw)

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
            <OptionsPanel fields={SPHERE_OPTIONS.fields} options={options} onChange={setOptions} />
        </div>
    )
}
