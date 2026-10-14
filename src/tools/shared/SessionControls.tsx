import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useShortcuts } from '../../shortcuts/useShortcuts'
import { playChime, unlockAudio } from './chime'
import { CountdownRing } from './CountdownRing'
import { MAX_SECONDS, MIN_SECONDS } from './countdown'
import { MAX_SEED, buildShareUrl, parseSeed } from './seed'
import { useChime } from './useChime'
import { useFavorites } from './useFavorites'
import type { SeedSession } from './useSeedSession'

type CopyState = 'idle' | 'copied' | 'failed'

/**
 * Randomize, pose history, the timer with its ring and chime, the seed rows and favorites,
 * shared by every seeded tool.
 */
export function SessionControls({ session }: { session: SeedSession }) {
    const { seed, running, countdown, intervalText, seconds, historyPosition } = session
    const [seedText, setSeedText] = useState('')
    const [copyState, setCopyState] = useState<CopyState>('idle')
    const parsedSeed = parseSeed(seedText)
    const favorites = useFavorites()
    const starred = favorites.isFavorite(seed)
    const chime = useChime()

    // Starting is a click or a key press, the moment the browser lets a page turn sound on, so
    // the chime can play later when the time runs out with nobody touching the page.
    const toggleTimer = () => {
        if (!running) unlockAudio()
        session.toggle()
    }

    useShortcuts([
        { key: ' ', description: 'New pose', run: session.randomize },
        { key: 'p', description: 'Start or pause the timer', run: toggleTimer },
        { key: 'ArrowLeft', label: '←', description: 'Previous pose', run: session.back },
        {
            key: 'ArrowRight',
            label: '→',
            description: 'Next pose in history',
            run: session.forward,
        },
        { key: 's', description: 'Star or unstar this pose', run: () => favorites.toggle(seed) },
        { key: 'c', description: 'Chime on or off', run: chime.toggle },
    ])
    const seedInvalid = seedText.trim() !== '' && parsedSeed === null

    // Chime when the timer runs out and brings a new pose. Only the tick that fires has `fired`
    // set, and every tick makes a new countdown, so this runs once per new pose.
    const chimeOn = useRef(chime.on)
    useEffect(() => {
        chimeOn.current = chime.on
    })
    useEffect(() => {
        if (countdown?.fired && chimeOn.current) playChime()
    }, [countdown])

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
                <button onClick={toggleTimer} disabled={!running && seconds === null}>
                    {running ? 'Pause' : startLabel}
                </button>
            </div>
            <div className="session-history">
                <button onClick={session.back} disabled={!session.canGoBack}>
                    ← Back
                </button>
                <span className="session-history-position">
                    Pose {historyPosition.current} of {historyPosition.total}
                </span>
                <button onClick={session.forward} disabled={!session.canGoForward}>
                    Forward →
                </button>
            </div>
            {/* The timer and its ring stay in view in full screen; the interval and chime don't. */}
            <div className="session-timer-row" data-focus="show">
                <div className="session-timer-settings" data-focus="hide">
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
                    <label className="session-chime">
                        <input type="checkbox" checked={chime.on} onChange={chime.toggle} />
                        Chime on new pose
                    </label>
                </div>
                {/* Only shown in full screen, where the Favorite button is hidden. */}
                {starred && (
                    <span className="session-starred" title="Favorite">
                        ★
                    </span>
                )}
                <div className="session-clock">
                    <CountdownRing countdown={countdown} interval={seconds} running={running} />
                    <span role="timer" className="session-timer">
                        {shown === null ? '–' : `${shown}s`}
                    </span>
                </div>
            </div>
            {seconds === null && (
                <p className="tool-hint">
                    Enter a whole number of seconds from {MIN_SECONDS} to {MAX_SECONDS}.
                </p>
            )}
            {/* Copy link sits on its own row under the seed, so a longer or shorter seed can't
                push it around. Favorite sits at the far end of the seed's row for the same reason. */}
            <div className="session-seed-row">
                <p className="session-seed">
                    Seed: <strong>{seed}</strong>
                </p>
                <button aria-pressed={starred} onClick={() => favorites.toggle(seed)}>
                    {starred ? '★ Favorite' : '☆ Favorite'}
                </button>
            </div>
            <div className="session-copy-row">
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
            <fieldset className="tool-display session-favorites">
                <legend>Favorites</legend>
                {favorites.favorites.length === 0 ? (
                    <p className="tool-hint">
                        Press ☆ Favorite (or <kbd>S</kbd>) to keep a pose here for next time.
                    </p>
                ) : (
                    <ul className="session-favorite-list">
                        {favorites.favorites.map((s) => (
                            <li key={s}>
                                <button
                                    className="session-favorite-seed"
                                    aria-current={s === seed ? 'true' : undefined}
                                    aria-label={`Show favorite pose ${s}`}
                                    onClick={() => session.showSeed(s)}
                                >
                                    ★ {s}
                                </button>
                                <button
                                    className="session-favorite-remove"
                                    aria-label={`Remove favorite ${s}`}
                                    onClick={() => favorites.remove(s)}
                                >
                                    ×
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </fieldset>
        </>
    )
}
