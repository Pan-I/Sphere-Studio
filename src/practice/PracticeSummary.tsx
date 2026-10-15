import { ToolThumbnail } from '../site/ToolThumbnail'
import { TOOLS } from '../tools/registry'
import { formatDuration, type PracticeStep } from './playlist'

interface PracticeSummaryProps {
    steps: readonly PracticeStep[]
    results: readonly (readonly number[])[]
    seconds: number
    complete: boolean
    onAgain: () => void
    onEdit: () => void
}

/** What you drew: each step's poses as small drawings that open the pose on its tool's page. */
export function PracticeSummary({
    steps,
    results,
    seconds,
    complete,
    onAgain,
    onEdit,
}: PracticeSummaryProps) {
    const poses = results.reduce((sum, r) => sum + r.length, 0)
    return (
        <div className="practice-summary">
            <p className="practice-summary-lead">
                {poses === 0
                    ? 'No poses finished this time.'
                    : `You drew ${poses} ${poses === 1 ? 'pose' : 'poses'} in ${formatDuration(seconds)}.`}
                {poses > 0 && ' Open one to see it again or star it.'}
            </p>
            {steps.map((step, i) => {
                const seeds = results[i] ?? []
                if (seeds.length === 0) return null
                const tool = TOOLS.find((t) => t.slug === step.tool)!
                return (
                    <section key={i} className="practice-summary-step">
                        <h2>
                            {tool.name}{' '}
                            <span className="practice-summary-count">
                                {seeds.length} of {step.poses} at {step.seconds}s
                            </span>
                        </h2>
                        <ul className="practice-poses">
                            {seeds.map((seed, j) => (
                                <li key={j}>
                                    <ToolThumbnail tool={tool} seed={seed} />
                                    <span className="practice-pose-seed">{seed}</span>
                                </li>
                            ))}
                        </ul>
                    </section>
                )
            })}
            <div className="practice-summary-actions">
                <button className="primary" onClick={onAgain}>
                    {complete ? 'Go again' : 'Start over'}
                </button>
                <button onClick={onEdit}>Change the session</button>
            </div>
        </div>
    )
}
