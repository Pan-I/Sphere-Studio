import { useCallback, useMemo } from 'react'
import { useShortcuts } from '../../shortcuts/useShortcuts'
import { OptionsPanel } from '../shared/OptionsPanel'
import { SessionControls } from '../shared/SessionControls'
import { useSeedSession } from '../shared/useSeedSession'
import { useStoredOptions } from '../shared/useStoredOptions'
import { useSquareCanvas } from '../shared/useSquareCanvas'
import { PERSPECTIVE_GRID_OPTIONS, type PerspectiveGridOptions } from './displayOptions'
import { drawPerspectiveGrid } from './drawPerspectiveGrid'
import { fitSeed, poseFromSeed, type PointsChoice } from './pose'
import '../shared/tool.css'

const SIZE = 480

export function PerspectiveGrid() {
    // Display preferences, remembered between visits. Loaded first, so the first random grid
    // already has the number of points you picked last time.
    const [options, setOptions] = useStoredOptions(PERSPECTIVE_GRID_OPTIONS)
    // Randomize and the timer only pick seeds with the chosen number of points.
    const session = useSeedSession((seed) => fitSeed(seed, options.points))
    const { seed } = session
    const pose = useMemo(() => poseFromSeed(seed), [seed])

    // Picking a number of points switches to a grid that has it, unless this one already does.
    const changeOptions = (next: PerspectiveGridOptions) => {
        if (next.points !== options.points) session.showSeed(fitSeed(seed, next.points))
        setOptions(next)
    }
    const choosePoints = (points: PointsChoice) => changeOptions({ ...options, points })

    useShortcuts([
        ...(['1', '2', '3'] as const).map((n) => ({
            key: n,
            description: `${n} point grids only`,
            run: () => choosePoints(n),
        })),
        { key: '0', description: 'Any number of points', run: () => choosePoints('any') },
        {
            key: 'b',
            description: 'Sample box on or off',
            run: () => setOptions((o) => ({ ...o, showBox: !o.showBox })),
        },
    ])

    // Redraw whenever the grid or the display options change.
    const draw = useCallback(
        (ctx: CanvasRenderingContext2D) => drawPerspectiveGrid(ctx, SIZE, pose, options),
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
                aria-label={`${pose.points} point perspective grid, pose ${seed}`}
            />
            <SessionControls session={session} />
            <OptionsPanel
                fields={PERSPECTIVE_GRID_OPTIONS.fields}
                options={options}
                onChange={changeOptions}
            />
        </div>
    )
}
