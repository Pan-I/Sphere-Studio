import { useRef, useState } from 'react'
import { useShortcuts } from '../shortcuts/useShortcuts'
import { ToolPage } from '../site/ToolPage'
import { TOOLS } from '../tools/registry'
import { PracticeContext, type PracticeTimer } from '../tools/shared/practice'
import { totalPoses, type PracticeStep } from './playlist'

const toolFor = (slug: string) => TOOLS.find((t) => t.slug === slug)!

interface PracticeRunnerProps {
    steps: readonly PracticeStep[]
    /** The seeds drawn in each step, and whether every step was finished. */
    onFinish: (results: number[][], complete: boolean) => void
}

/**
 * Runs a session: each step's tool on its own tool page, with the timer running at the step's
 * interval. When a step's last pose is up, the next step's tool takes its place, in full screen
 * too, and after the last one the session ends.
 */
export function PracticeRunner({ steps, onFinish }: PracticeRunnerProps) {
    const [stepIndex, setStepIndex] = useState(0)
    // The poses whose time ran out, per step.
    const [results, setResults] = useState<number[][]>(() => steps.map(() => []))
    const shownSeed = useRef<number | null>(null)

    const step = steps[stepIndex]
    const tool = toolFor(step.tool)
    const next = steps[stepIndex + 1] as PracticeStep | undefined
    const done = results[stepIndex].length
    const allDone = results.reduce((sum, r) => sum + r.length, 0)

    const advance = (latest: number[][]) => {
        if (next) setStepIndex(stepIndex + 1)
        else onFinish(latest, true)
    }

    const practice: PracticeTimer = {
        slug: tool.slug,
        seconds: step.seconds,
        posesLeft: step.poses - done,
        onPoseDone: (seed, last) => {
            const latest = results.map((r, i) => (i === stepIndex ? [...r, seed] : r))
            setResults(latest)
            if (last) advance(latest)
        },
        onShow: (seed) => {
            shownSeed.current = seed
        },
    }

    const skip = () => advance(results)
    const end = () => onFinish(results, false)

    useShortcuts([{ key: 'n', description: 'Next step of the practice session', run: skip }])

    const banner = (
        <div className="practice-bar" data-focus="show">
            <div className="practice-bar-text">
                <p className="practice-bar-now" role="status">
                    Step {stepIndex + 1} of {steps.length}: <strong>{tool.name}</strong>,{' '}
                    <span>
                        pose {Math.min(done + 1, step.poses)} of {step.poses}
                    </span>
                </p>
                <p className="practice-bar-next">
                    {next
                        ? `Next: ${toolFor(next.tool).name}, ${next.poses} × ${next.seconds}s`
                        : 'Last step'}
                </p>
            </div>
            <div className="practice-bar-actions" data-focus="hide">
                <button onClick={skip}>{next ? 'Next step' : 'Finish'}</button>
                <button onClick={end}>End session</button>
            </div>
            <div className="practice-meter" aria-hidden="true">
                <span style={{ width: `${(allDone / totalPoses(steps)) * 100}%` }} />
            </div>
        </div>
    )

    // One tool page for the whole session, so full screen carries on from step to step. The key
    // starts each step's tool afresh, even when two steps in a row use the same tool.
    return (
        <PracticeContext value={practice}>
            <ToolPage
                tool={tool}
                banner={banner}
                toolKey={stepIndex}
                currentSeed={() => shownSeed.current}
            />
        </PracticeContext>
    )
}
