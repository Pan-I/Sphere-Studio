import { useCallback, useMemo } from 'react'
import { OptionsPanel } from '../shared/OptionsPanel'
import { SessionControls } from '../shared/SessionControls'
import { useSeedSession } from '../shared/useSeedSession'
import { useStoredOptions } from '../shared/useStoredOptions'
import { useSquareCanvas } from '../shared/useSquareCanvas'
import { LIT_SPHERE_OPTIONS } from './displayOptions'
import { drawLitSphere } from './drawLitSphere'
import { describeLight, lightFromSeed } from './pose'
import '../shared/tool.css'

const SIZE = 480

export function LitSphere() {
    const session = useSeedSession()
    const { seed } = session
    const light = useMemo(() => lightFromSeed(seed), [seed])
    // Display preferences, remembered between visits.
    const [options, setOptions] = useStoredOptions(LIT_SPHERE_OPTIONS)

    // Redraw whenever the light or the display options change.
    const draw = useCallback(
        (ctx: CanvasRenderingContext2D) => drawLitSphere(ctx, SIZE, light, options),
        [light, options],
    )
    const canvasRef = useSquareCanvas(SIZE, draw)

    return (
        <div className="tool-layout">
            <canvas
                ref={canvasRef}
                className="tool-canvas"
                data-focus="show"
                role="img"
                aria-label={`Sphere on a floor, lit from ${describeLight(light)}, pose ${seed}`}
            />
            <div className="tool-controls">
                <SessionControls session={session} />
                <OptionsPanel
                    fields={LIT_SPHERE_OPTIONS.fields}
                    options={options}
                    onChange={setOptions}
                />
            </div>
        </div>
    )
}
