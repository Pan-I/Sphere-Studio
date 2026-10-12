import { useEffect, useMemo, useReducer, useRef, useState, type FormEvent } from 'react'
import { pickMarker } from '../../math/sphere'
import { bufferScale } from '../shared/canvasScale.ts'
import { drawSphere } from './drawSphere'
import { DisplayControls } from './DisplayControls'
import { loadOptions, saveOptions } from './displayOptions'
import { MAX_SECONDS, MIN_SECONDS, parseInterval } from '../shared/countdown.ts'
import { poseFromSeed } from './pose.ts'
import {
    MAX_SEED,
    buildShareUrl,
    parseSeed,
    randomSeed,
    readSeedFromUrl
} from '../shared/seed.ts'

import { initialTimerState, timerReducer } from '../shared/timerState.ts'
import './SphereRandomizer.css'

const SIZE = 480

type CopyState = 'idle' | 'copied' | 'failed'

export function SphereRandomizer() {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    // The seed is the single source of truth for the pose. A ?seed= link wins on first load.
    // It lives with the timer so a tick that runs out can swap the pose in the same update.
    const [{ seed, running, countdown }, dispatch] = useReducer(timerReducer, undefined, () =>
        initialTimerState(readSeedFromUrl(window.location.search) ?? randomSeed()),
    )
    const pose = useMemo(() => {
        const { q, markerPick } = poseFromSeed(seed)
        return { q, marker: pickMarker(q, markerPick) }
    }, [seed])

    const [seedText, setSeedText] = useState('')
    const [copyState, setCopyState] = useState<CopyState>('idle')
    const [intervalText, setIntervalText] = useState('30')
    const [options, setOptions] = useState(loadOptions)

    const seconds = parseInterval(intervalText)
    const parsedSeed = parseSeed(seedText)
    const seedInvalid = seedText.trim() !== '' && parsedSeed === null

    // Draw whenever the orientation changes.
    useEffect(() => {
        const canvas = canvasRef.current
        const ctx = canvas?.getContext('2d')
        if (!canvas || !ctx) return
        // Size the drawing buffer for the screen, capped at 2x (see bufferScale).
        const pixels = Math.round(SIZE * bufferScale(window.devicePixelRatio))
        canvas.width = pixels
        canvas.height = pixels
        const scale = pixels / SIZE
        ctx.setTransform(scale, 0, 0, scale, 0, 0)
        drawSphere(ctx, SIZE, pose.q, options, pose.marker)
    }, [pose, options])

    // Remember display preferences between visits.
    useEffect(() => {
        saveOptions(options)
    }, [options])

    // Keep the address bar in sync, so the current URL is always a shareable link.
    useEffect(() => {
        window.history.replaceState(
            window.history.state,
            '',
            buildShareUrl(window.location.href, seed),
        )
    }, [seed])

    // Tick once per second while running. Each tick carries the pose to show if time is up.
    useEffect(() => {
        if (!running || seconds === null) return
        const id = window.setInterval(() => {
            dispatch({ type: 'tick', interval: seconds, nextSeed: randomSeed() })
        }, 1000)
        return () => window.clearInterval(id)
    }, [running, seconds])

    // Clear the "Copied!" message after a moment.
    useEffect(() => {
        if (copyState === 'idle') return
        const id = window.setTimeout(() => setCopyState('idle'), 2000)
        return () => window.clearTimeout(id)
    }, [copyState])

    // Any manual pose change restarts the countdown while the timer is running.
    const showSeed = (next: number) => dispatch({ type: 'showSeed', seed: next, interval: seconds })

    const randomize = () => showSeed(randomSeed())

    const loadSeed = (e: FormEvent) => {
        e.preventDefault()
        if (parsedSeed === null) return
        showSeed(parsedSeed)
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

    const toggle = () => {
        if (running) {
            dispatch({ type: 'pause' })
            return
        }
        if (seconds === null) return
        dispatch({ type: 'start', interval: seconds })
    }

    const onIntervalChange = (text: string) => {
        setIntervalText(text)
        dispatch({ type: 'intervalChanged' }) // a new interval means a fresh countdown
    }

    const shown = countdown ? countdown.remaining : seconds
    const startLabel = countdown ? 'Resume' : 'Start'

    return (
        <div className="sphere-tool">
            <canvas
                ref={canvasRef}
                className="sphere-canvas"
                role="img"
                aria-label={`Sphere divided into eight sectors, pose ${seed}`}
            />

            <div className="sphere-actions">
                <button className="primary" onClick={randomize}>
                    Randomize
                </button>
                <button onClick={toggle} disabled={!running && seconds === null}>
                    {running ? 'Pause' : startLabel}
                </button>
            </div>

            <div className="sphere-timer-row">
                <label className="sphere-field">
                    Interval (seconds)
                    <input
                        type="number"
                        min={MIN_SECONDS}
                        max={MAX_SECONDS}
                        step={1}
                        value={intervalText}
                        disabled={running}
                        onChange={(e) => onIntervalChange(e.target.value)}
                    />
                </label>
                <span role="timer" className="sphere-timer">
                    {shown === null ? '–' : `${shown}s`}
                </span>
            </div>
            {seconds === null && (
                <p className="sphere-hint">
                    Enter a whole number of seconds from {MIN_SECONDS} to {MAX_SECONDS}.
                </p>
            )}

            <div className="sphere-seed-row">
                <span>
                    Seed: <strong>{seed}</strong>
                </span>
                <button onClick={copyLink}>Copy link</button>
                <span className="sphere-status" role="status" aria-live="polite">
                    {copyState === 'copied' && 'Link copied!'}
                    {copyState === 'failed' && 'Could not copy. Copy the address bar instead.'}
                </span>
            </div>

            <form className="sphere-seed-form" onSubmit={loadSeed}>
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
                <p className="sphere-hint">Seeds are whole numbers from 0 to {MAX_SEED}.</p>
            )}

            <DisplayControls options={options} onChange={setOptions} />
        </div>
    )
}
