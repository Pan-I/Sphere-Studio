import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { SITE_NAME } from '../site/config'
import { useDocumentTitle } from '../site/useDocumentTitle'
import { useShortcuts } from '../shortcuts/useShortcuts'
import { PRACTICE_TOOLS, type Tool } from '../tools/registry'
import { MAX_SEED, parseSeed, randomSeed } from '../tools/shared/seed'
import {
    POSE_COUNTS,
    loadChoices,
    readSettings,
    saveChoices,
    settingsSearch,
    sheetSeeds,
    worksheetLayout,
    type PoseCount,
    type WorksheetSettings,
} from './worksheet'
import './worksheet.css'

// The same tools as practice sessions: Value Study works on your own photo, so it has no poses.
const SLUGS = PRACTICE_TOOLS.map((t) => t.slug)

/**
 * Drawing units across each pose. Smaller than a tool page's 480, so the lines come out a little
 * bolder on paper, where the poses are smaller than on screen.
 */
const UNITS = 320

/** One pose, drawn at print resolution whatever its size on screen. */
function WorksheetPose({ tool, seed, pixels }: { tool: Tool; seed: number; pixels: number }) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    useEffect(() => {
        const canvas = canvasRef.current
        const ctx = canvas?.getContext('2d')
        if (!canvas || !ctx) return
        canvas.width = pixels
        canvas.height = pixels
        const scale = pixels / UNITS
        ctx.setTransform(scale, 0, 0, scale, 0, 0)
        // The sheet sets white paper and a dark pencil for its canvases (see worksheet.css), so
        // this draws for paper in any theme and needs no redraw when the theme changes.
        tool.drawExample(ctx, UNITS, seed)
    }, [tool, seed, pixels])
    return <canvas ref={canvasRef} role="img" aria-label={`${tool.name}, seed ${seed}`} />
}

/**
 * A printable page of poses from consecutive seeds, to draw from on paper. The address bar holds
 * the sheet, so a link or a reload brings it back exactly.
 */
export function WorksheetPage() {
    const location = useLocation()
    const navigate = useNavigate()
    // Without a link, start from the last sheet's choices and a fresh seed.
    const [fallback] = useState<WorksheetSettings>(() => ({
        ...loadChoices(SLUGS),
        seed: randomSeed(),
    }))
    const settings = readSettings(location.search, SLUGS, fallback)
    const tool = PRACTICE_TOOLS.find((t) => t.slug === settings.tool)!
    const layout = worksheetLayout(settings.poses, settings.room)
    const seeds = sheetSeeds(settings.seed, settings.poses)
    const [seedText, setSeedText] = useState('')
    const parsedSeed = parseSeed(seedText)

    useDocumentTitle(`Worksheet · ${SITE_NAME}`)

    const search = settingsSearch(settings)
    // Keep the address bar on the sheet you see, including a seed picked for you.
    useEffect(() => {
        if (location.search !== search) navigate({ search }, { replace: true })
    }, [location.search, search, navigate])

    const change = (next: Partial<WorksheetSettings>) => {
        const merged = { ...settings, ...next }
        saveChoices(merged)
        navigate({ search: settingsSearch(merged) }, { replace: true })
    }
    const newSheet = () => change({ seed: randomSeed() })
    const loadSeed = (e: FormEvent) => {
        e.preventDefault()
        if (parsedSeed === null) return
        change({ seed: parsedSeed })
        setSeedText('')
    }

    useShortcuts([{ key: ' ', description: 'New sheet', run: newSheet }])

    const first = seeds[0]
    const last = seeds[seeds.length - 1]
    const sheetStyle = {
        '--columns': layout.columns,
        '--rows': layout.rows,
        '--pose': layout.poseMm,
    } as CSSProperties

    return (
        <>
            <div className="worksheet-screen-only">
                <h1>Worksheet</h1>
                <p className="worksheet-intro">
                    A page of poses from one tool, from consecutive seeds, to print and draw from on
                    paper. It always prints on white paper, in light or dark mode.
                </p>
                <div className="worksheet-controls">
                    <label className="worksheet-field">
                        Tool
                        <select
                            value={settings.tool}
                            onChange={(e) => change({ tool: e.target.value })}
                        >
                            {PRACTICE_TOOLS.map((t) => (
                                <option key={t.slug} value={t.slug}>
                                    {t.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <fieldset className="worksheet-field worksheet-poses">
                        <legend>Poses</legend>
                        {POSE_COUNTS.map((n) => (
                            <label key={n}>
                                <input
                                    type="radio"
                                    name="worksheet-poses"
                                    checked={settings.poses === n}
                                    onChange={() => change({ poses: n as PoseCount })}
                                />
                                {n}
                            </label>
                        ))}
                    </fieldset>
                    <label className="worksheet-room">
                        <input
                            type="checkbox"
                            checked={settings.room}
                            onChange={(e) => change({ room: e.target.checked })}
                        />
                        Room to draw beside each pose
                    </label>
                </div>
                <div className="worksheet-controls">
                    <button onClick={newSheet}>New sheet</button>
                    <form className="worksheet-seed-form" onSubmit={loadSeed}>
                        <input
                            type="text"
                            inputMode="numeric"
                            placeholder={`First seed (0–${MAX_SEED})`}
                            aria-label="First seed"
                            value={seedText}
                            onChange={(e) => setSeedText(e.target.value)}
                        />
                        <button type="submit" disabled={parsedSeed === null}>
                            Load
                        </button>
                    </form>
                    <button className="primary" onClick={() => window.print()}>
                        Print
                    </button>
                </div>
                {seedText.trim() !== '' && parsedSeed === null && (
                    <p className="tool-hint">Seeds are whole numbers from 0 to {MAX_SEED}.</p>
                )}
            </div>

            <div className="worksheet-paper">
                <section
                    className={settings.room ? 'worksheet-sheet with-room' : 'worksheet-sheet'}
                    style={sheetStyle}
                    aria-label="Worksheet"
                >
                    <header className="worksheet-header">
                        <span className="worksheet-title">{tool.name}</span>
                        <span>
                            Seeds {first}–{last} · {SITE_NAME}
                        </span>
                    </header>
                    <ol className="worksheet-grid">
                        {seeds.map((seed, i) => (
                            <li key={i} className="worksheet-cell">
                                <figure className="worksheet-pose">
                                    <WorksheetPose tool={tool} seed={seed} pixels={layout.pixels} />
                                    <figcaption>
                                        {i + 1} · seed {seed}
                                    </figcaption>
                                </figure>
                            </li>
                        ))}
                    </ol>
                </section>
            </div>
        </>
    )
}
