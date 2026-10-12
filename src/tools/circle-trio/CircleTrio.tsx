import { useEffect, useMemo, useRef, useState } from 'react'
import { bufferScale } from '../shared/canvasScale'
import { SessionControls } from '../shared/SessionControls'
import { useSeedSession } from '../shared/useSeedSession'
import { CircleControls } from './CircleControls'
import { loadOptions, saveOptions } from './displayOptions'
import { drawCircles } from './drawCircles'
import { layoutFromSeed } from './layout'
import '../shared/tool.css'

const SIZE = 480

export function CircleTrio() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const session = useSeedSession()
    const { seed } = session
    const circles = useMemo(() => layoutFromSeed(seed), [seed])
    const [options, setOptions] = useState(loadOptions)

    // Draw whenever the layout or the display options change.
    useEffect(() => {
        const canvas = canvasRef.current
        const ctx = canvas?.getContext('2d')
        if (!canvas || !ctx) return
        const pixels = Math.round(SIZE * bufferScale(window.devicePixelRatio))
        canvas.width = pixels
        canvas.height = pixels
        const scale = pixels / SIZE
        ctx.setTransform(scale, 0, 0, scale, 0, 0)
        drawCircles(ctx, SIZE, circles, options)
    }, [circles, options])

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
                aria-label={`Two large circles and a small one, layout ${seed}`}
            />
            <SessionControls session={session} />
            <CircleControls options={options} onChange={setOptions} />
        </div>
    )
}
