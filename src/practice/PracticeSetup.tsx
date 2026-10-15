import { PRACTICE_TOOLS } from '../tools/registry'
import {
    MAX_POSES,
    MAX_SECONDS,
    MAX_STEPS,
    MIN_POSES,
    MIN_SECONDS,
    PRESETS,
    formatDuration,
    parseSession,
    parseStep,
    totalPoses,
    toDraft,
    totalSeconds,
    type StepDraft,
} from './playlist'

const SLUGS = PRACTICE_TOOLS.map((t) => t.slug)

interface PracticeSetupProps {
    drafts: readonly StepDraft[]
    onChange: (drafts: StepDraft[]) => void
    onStart: () => void
}

/** The list of steps you put a session together from, with presets and the Start button. */
export function PracticeSetup({ drafts, onChange, onStart }: PracticeSetupProps) {
    const session = parseSession(drafts, SLUGS)

    const update = (i: number, change: Partial<StepDraft>) =>
        onChange(drafts.map((d, j) => (j === i ? { ...d, ...change } : d)))
    const move = (i: number, step: -1 | 1) => {
        const next = [...drafts]
        ;[next[i], next[i + step]] = [next[i + step], next[i]]
        onChange(next)
    }
    const remove = (i: number) => onChange(drafts.filter((_, j) => j !== i))
    // A new step copies the last one's numbers, which is usually what you want next.
    const add = () => {
        const last = drafts.at(-1)
        const used = new Set(drafts.map((d) => d.tool))
        const tool = SLUGS.find((s) => !used.has(s)) ?? SLUGS[0]
        onChange([...drafts, { tool, poses: last?.poses ?? '5', seconds: last?.seconds ?? '60' }])
    }

    return (
        <div className="practice-setup">
            <div className="practice-presets">
                <span>Start from</span>
                {PRESETS.map((preset) => (
                    <button key={preset.name} onClick={() => onChange(preset.steps.map(toDraft))}>
                        {preset.name}{' '}
                        <span className="practice-preset-time">
                            {formatDuration(totalSeconds(preset.steps))}
                        </span>
                    </button>
                ))}
            </div>

            <ol className="practice-steps">
                {drafts.map((draft, i) => {
                    const n = i + 1
                    const invalid = parseStep(draft, SLUGS) === null
                    return (
                        // The index is the key on purpose: a step is its position in the list.
                        <li key={i} className="practice-step" aria-invalid={invalid || undefined}>
                            <span className="practice-step-number" aria-hidden="true">
                                {n}
                            </span>
                            <label className="practice-field practice-field-tool">
                                Tool
                                <select
                                    value={draft.tool}
                                    aria-label={`Step ${n} tool`}
                                    onChange={(e) => update(i, { tool: e.target.value })}
                                >
                                    {PRACTICE_TOOLS.map((t) => (
                                        <option key={t.slug} value={t.slug}>
                                            {t.name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="practice-field">
                                Poses
                                <input
                                    type="number"
                                    min={MIN_POSES}
                                    max={MAX_POSES}
                                    step={1}
                                    value={draft.poses}
                                    aria-label={`Step ${n} poses`}
                                    onChange={(e) => update(i, { poses: e.target.value })}
                                />
                            </label>
                            <label className="practice-field">
                                Seconds each
                                <input
                                    type="number"
                                    min={MIN_SECONDS}
                                    max={MAX_SECONDS}
                                    step={1}
                                    value={draft.seconds}
                                    aria-label={`Step ${n} seconds each`}
                                    onChange={(e) => update(i, { seconds: e.target.value })}
                                />
                            </label>
                            <div className="practice-step-actions">
                                <button
                                    aria-label={`Move step ${n} up`}
                                    disabled={i === 0}
                                    onClick={() => move(i, -1)}
                                >
                                    ↑
                                </button>
                                <button
                                    aria-label={`Move step ${n} down`}
                                    disabled={i === drafts.length - 1}
                                    onClick={() => move(i, 1)}
                                >
                                    ↓
                                </button>
                                <button
                                    aria-label={`Remove step ${n}`}
                                    disabled={drafts.length === 1}
                                    onClick={() => remove(i)}
                                >
                                    ×
                                </button>
                            </div>
                            {invalid && (
                                <p className="tool-hint practice-step-error">
                                    Poses are whole numbers from {MIN_POSES} to {MAX_POSES}, and
                                    seconds from {MIN_SECONDS} to {MAX_SECONDS}.
                                </p>
                            )}
                        </li>
                    )
                })}
            </ol>

            <div className="practice-start-row">
                <button onClick={add} disabled={drafts.length >= MAX_STEPS}>
                    + Add a step
                </button>
                <p className="practice-total" role="status">
                    {session
                        ? `${totalPoses(session)} poses, ${formatDuration(totalSeconds(session))}`
                        : 'Fix the step marked above to start.'}
                </p>
                <button className="primary" onClick={onStart} disabled={!session}>
                    Start session
                </button>
            </div>
        </div>
    )
}
