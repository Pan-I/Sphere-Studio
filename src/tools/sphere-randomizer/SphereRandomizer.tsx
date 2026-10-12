import { useEffect, useMemo, useRef, useState } from 'react'
import { pickMarker } from '../../math/sphere'
import { bufferScale } from '../shared/canvasScale'
import { SessionControls } from '../shared/SessionControls'
import { useSeedSession } from '../shared/useSeedSession'
import { drawSphere } from './drawSphere'
import { DisplayControls } from './DisplayControls'
import { loadOptions, saveOptions } from './displayOptions'
import { poseFromSeed } from './pose'
import '../shared/tool.css'

const SIZE = 480

export function SphereRandomizer() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const session = useSeedSession()
    const { seed } = session
    const pose = useMemo(() => {
        const { q, markerPick } = poseFromSeed(seed)
        return { q, marker: pickMarker(q, markerPick) }
    }, [seed])
    const [options, setOptions] = useState(loadOptions)

    // Draw whenever the orientation changes.
    useEffect(() => {
        const canvas = canvasRef.current
        const ctx = canvas?.getContext('2d')
        if (!canvas || !ctx) return
        // Size the drawing buffer for the screen, capped at 2x (see bufferScale).
        const pixels = Math.round(SIZE * bufferScale(window.devicePixelRatio))
        canvas.width = pixels
        canvas.height = pixels
        const scale = pixels / SIZE
        ctx.setTransform(scale, 0, 0, scale, 0, 0)
        drawSphere(ctx, SIZE, pose.q, options, pose.marker)
    }, [pose, options])

    // Remember display preferences between visits.
    useEffect(() => {
        saveOptions(options)
    }, [options])

    return (
        <div className="tool-layout">
            <canvas
                ref={canvasRef}
                className="tool-canvas"
                role="img"
                aria-label={`Sphere divided into eight sectors, pose ${seed}`}
            />
            <SessionControls session={session} />
            <DisplayControls options={options} onChange={setOptions} />
        </div>
    )
}
