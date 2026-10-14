import { useCallback, useMemo, useRef, useState, type DragEvent } from 'react'
import { useShortcuts } from '../../shortcuts/useShortcuts'
import { OptionsPanel } from '../shared/OptionsPanel'
import { SessionControls } from '../shared/SessionControls'
import { useSeedSession } from '../shared/useSeedSession'
import { useStoredOptions } from '../shared/useStoredOptions'
import { useSquareCanvas } from '../shared/useSquareCanvas'
import { VALUE_COUNTS, VALUE_STUDY_OPTIONS, nextView } from './displayOptions'
import { drawValueStudy } from './drawValueStudy'
import { samplePicture } from './picture'
import { usePhoto } from './usePhoto'
import '../shared/tool.css'
import './valueStudy.css'

const SIZE = 480

const hasFiles = (e: DragEvent) => e.dataTransfer.types.includes('Files')

export function ValueStudy() {
    // Until you open a photo, each seed gives a sample to try it on, with the usual Randomize,
    // timer and seed controls.
    const session = useSeedSession()
    const { seed } = session
    const sample = useMemo(() => samplePicture(seed), [seed])
    const { photo, error, open, clear } = usePhoto()
    const picture = photo?.picture ?? sample
    // Display preferences, remembered between visits.
    const [options, setOptions] = useStoredOptions(VALUE_STUDY_OPTIONS)

    const draw = useCallback(
        (ctx: CanvasRenderingContext2D) => drawValueStudy(ctx, SIZE, picture, options),
        [picture, options],
    )
    const canvasRef = useSquareCanvas(SIZE, draw)

    const fileRef = useRef<HTMLInputElement>(null)
    const chooseFile = () => fileRef.current?.click()
    const [dragging, setDragging] = useState(false)

    useShortcuts([
        { key: 'o', description: 'Open a photo', run: chooseFile },
        {
            key: 'v',
            description: 'Next view (values, grayscale, original)',
            run: () => setOptions((o) => ({ ...o, view: nextView(o.view) })),
        },
        ...VALUE_COUNTS.map((n) => ({
            key: n,
            description: `${n} values`,
            run: () => setOptions((o) => ({ ...o, valueCount: n })),
        })),
    ])

    const what = photo ? photo.name : `a sample sphere, pose ${seed}`

    return (
        <div
            className={dragging ? 'tool-layout value-dropping' : 'tool-layout'}
            onDragOver={(e) => {
                if (!hasFiles(e)) return
                e.preventDefault()
                setDragging(true)
            }}
            onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false)
            }}
            onDrop={(e) => {
                if (!hasFiles(e)) return
                e.preventDefault()
                setDragging(false)
                const file = e.dataTransfer.files[0]
                if (file) void open(file)
            }}
        >
            <canvas
                ref={canvasRef}
                className="tool-canvas"
                data-focus="show"
                role="img"
                aria-label={`Value study of ${what}`}
            />
            <div className="value-photo">
                <div className="session-actions">
                    <button className={photo ? undefined : 'primary'} onClick={chooseFile}>
                        {photo ? 'Open another photo' : 'Open a photo'}
                    </button>
                    {photo && <button onClick={clear}>Back to samples</button>}
                </div>
                <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    hidden
                    aria-label="Photo to study"
                    onChange={(e) => {
                        const file = e.target.files?.[0]
                        e.target.value = '' // so choosing the same file again still opens it
                        if (file) void open(file)
                    }}
                />
                <p className="tool-hint" role="status" aria-live="polite">
                    {error ??
                        (photo
                            ? `Studying ${photo.name}.`
                            : 'Showing a sample. Open a photo, or drop or paste one here. Uploading a photo will wide the randomizer options.')}{' '}
                    Your photo stays in this tab and is never uploaded.
                </p>
            </div>
            {!photo && <SessionControls session={session} />}
            <OptionsPanel
                fields={VALUE_STUDY_OPTIONS.fields}
                options={options}
                onChange={setOptions}
            />
        </div>
    )
}
