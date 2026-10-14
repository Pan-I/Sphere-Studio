import { ringFraction, type Countdown } from './countdown'

// A radius that makes the circumference 100, so the dash length reads as a percentage.
const R = 100 / (2 * Math.PI)

/**
 * A ring that drains as the timer counts down, so you can tell how long is left out of the
 * corner of your eye. The number beside it says the same thing for screen readers.
 */
export function CountdownRing({
    countdown,
    interval,
    running,
}: {
    countdown: Countdown | null
    interval: number | null
    running: boolean
}) {
    const percent = ringFraction(countdown, interval, running) * 100
    return (
        <svg
            className={running ? 'session-ring running' : 'session-ring'}
            viewBox="0 0 36 36"
            aria-hidden="true"
        >
            <circle className="session-ring-track" cx="18" cy="18" r={R} />
            {/* Starts at 12 o'clock and runs clockwise, like a clock face. */}
            <circle
                className="session-ring-fill"
                cx="18"
                cy="18"
                r={R}
                strokeDasharray={`${percent.toFixed(2)} 100`}
                transform="rotate(-90 18 18)"
            />
        </svg>
    )
}
