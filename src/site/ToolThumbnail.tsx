import { useCallback, useState } from 'react'
import { Link } from 'react-router'
import type { Tool } from '../tools/registry'
import { randomSeed } from '../tools/shared/seed'
import { useSquareCanvas } from '../tools/shared/useSquareCanvas'

/** Drawing units across the thumbnail. Close to its size on screen, so line widths look the same as in the tool. */
const SIZE = 160

/**
 * A small example of a tool, linking to the tool on that same seed. Without a `seed` it's a
 * random one, as on the home page.
 */
export function ToolThumbnail({ tool, seed: givenSeed }: { tool: Tool; seed?: number }) {
    // Picked once per visit to the home page, so the picture doesn't change while you look at it.
    const [randomPick] = useState(randomSeed)
    const seed = givenSeed ?? randomPick
    const draw = useCallback(
        (ctx: CanvasRenderingContext2D) => tool.drawExample(ctx, SIZE, seed),
        [tool, seed],
    )
    const canvasRef = useSquareCanvas(SIZE, draw)

    return (
        <Link
            to={`/${tool.slug}?seed=${seed}`}
            className="tool-thumbnail"
            aria-label={`Open ${tool.name} on this example (seed ${seed})`}
        >
            <canvas ref={canvasRef} />
        </Link>
    )
}
