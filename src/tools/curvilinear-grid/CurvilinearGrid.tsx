import { useCallback, useMemo } from 'react'
import { useShortcuts } from '../../shortcuts/useShortcuts'
import { OptionsPanel } from '../shared/OptionsPanel'
import { SessionControls } from '../shared/SessionControls'
import { useSeedSession } from '../shared/useSeedSession'
import { useStoredOptions } from '../shared/useStoredOptions'
import { useSquareCanvas } from '../shared/useSquareCanvas'
import { CURVILINEAR_GRID_OPTIONS, type CurvilinearGridOptions } from './displayOptions'
import { drawCurvilinearGrid } from './drawCurvilinearGrid'
import { fitSeed, poseFromSeed, type LensChoice } from './pose'
import '../shared/tool.css'

const SIZE = 480

const LENS_NAMES = { fisheye: 'Fish-eye', panoramic: 'Panoramic' } as const

export function CurvilinearGrid() {
    // Display preferences, remembered between visits. Loaded first, so the first random grid
    // already has the lens you picked last time.
    const [options, setOptions] = useStoredOptions(CURVILINEAR_GRID_OPTIONS)
    // Randomize and the timer only pick seeds with the chosen lens.
    const session = useSeedSession((seed) => fitSeed(seed, options.lens))
    const { seed } = session
    const pose = useMemo(() => poseFromSeed(seed), [seed])

    // Picking a lens switches to a grid that has it, unless this one already does.
    const changeOptions = (next: CurvilinearGridOptions) => {
        if (next.lens !== options.lens) session.showSeed(fitSeed(seed, next.lens))
        setOptions(next)
    }
    const chooseLens = (lens: LensChoice) => changeOptions({ ...options, lens })

    useShortcuts([
        { key: '1', description: 'Fish-eye grids only', run: () => chooseLens('fisheye') },
        { key: '2', description: 'Panoramic grids only', run: () => chooseLens('panoramic') },
        { key: '0', description: 'Any lens', run: () => chooseLens('any') },
        {
            key: 'b',
            description: 'Sample box on or off',
            run: () => setOptions((o) => ({ ...o, showBox: !o.showBox })),
        },
    ])

    // Redraw whenever the grid or the display options change.
    const draw = useCallback(
        (ctx: CanvasRenderingContext2D) => drawCurvilinearGrid(ctx, SIZE, pose, options),
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
                aria-label={`${LENS_NAMES[pose.camera.lens]} curvilinear grid, pose ${seed}`}
            />
            <div className="tool-controls">
                <SessionControls session={session} />
                <OptionsPanel
                    fields={CURVILINEAR_GRID_OPTIONS.fields}
                    options={options}
                    onChange={changeOptions}
                />
            </div>
        </div>
    )
}
