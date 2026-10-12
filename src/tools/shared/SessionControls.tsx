import { useEffect, useState, type FormEvent } from 'react'
import { MAX_SECONDS, MIN_SECONDS } from './countdown'
import { MAX_SEED, buildShareUrl, parseSeed } from './seed'
import type { SeedSession } from './useSeedSession'

type CopyState = 'idle' | 'copied' | 'failed'

/** Randomize, the timer, and the seed rows, shared by every seeded tool. */
export function SessionControls({ session }: { session: SeedSession }) {
    const { seed, running, countdown, intervalText, seconds } = session
    const [seedText, setSeedText] = useState('')
    const [copyState, setCopyState] = useState<CopyState>('idle')
    const parsedSeed = parseSeed(seedText)
    const seedInvalid = seedText.trim() !== '' && parsedSeed === null

    // Clear the "Copied!" message after a moment.
    useEffect(() => {
        if (copyState === 'idle') return
        const id = window.setTimeout(() => setCopyState('idle'), 2000)
        return () => window.clearTimeout(id)
    }, [copyState])

    const loadSeed = (e: FormEvent) => {
        e.preventDefault()
        if (parsedSeed === null) return
        session.showSeed(parsedSeed)
        setSeedText('')
    }

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(buildShareUrl(window.location.href, seed))
            setCopyState('copied')
        } catch {
            setCopyState('failed')
        }
    }

    const shown = countdown ? countdown.remaining : seconds
    const startLabel = countdown ? 'Resume' : 'Start'

    return (
        <>
            <div className="session-actions">
                <button className="primary" onClick={session.randomize}>
                    Randomize
                </button>
                <button onClick={session.toggle} disabled={!running && seconds === null}>
                    {running ? 'Pause' : startLabel}
                </button>
            </div>
            <div className="session-timer-row">
                <label className="session-field">
                    Interval (seconds)
                    <input
                        type="number"
                        min={MIN_SECONDS}
                        max={MAX_SECONDS}
                        step={1}
                        value={intervalText}
                        disabled={running}
                        onChange={(e) => session.changeInterval(e.target.value)}
                    />
                </label>
                <span role="timer" className="session-timer">
                    {shown === null ? '–' : `${shown}s`}
                </span>
            </div>
            {seconds === null && (
                <p className="tool-hint">
                    Enter a whole number of seconds from {MIN_SECONDS} to {MAX_SECONDS}.
                </p>
            )}
            <div className="session-seed-row">
                <span>
                    Seed: <strong>{seed}</strong>
                </span>
                <button onClick={copyLink}>Copy link</button>
                <span className="session-status" role="status" aria-live="polite">
                    {copyState === 'copied' && 'Link copied!'}
                    {copyState === 'failed' && 'Could not copy. Copy the address bar instead.'}
                </span>
            </div>
            <form className="session-seed-form" onSubmit={loadSeed}>
                <input
                    type="text"
                    inputMode="numeric"
                    placeholder={`Load seed (0–${MAX_SEED})`}
                    aria-label="Seed to load"
                    value={seedText}
                    onChange={(e) => setSeedText(e.target.value)}
                />
                <button type="submit" disabled={parsedSeed === null}>
                    Load
                </button>
            </form>
            {seedInvalid && (
                <p className="tool-hint">Seeds are whole numbers from 0 to {MAX_SEED}.</p>
            )}
        </>
    )
}
