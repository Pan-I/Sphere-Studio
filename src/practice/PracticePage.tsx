import { useState } from 'react'
import { SITE_NAME } from '../site/config'
import { useDocumentTitle } from '../site/useDocumentTitle'
import { PRACTICE_TOOLS } from '../tools/registry'
import { unlockAudio } from '../tools/shared/chime'
import { PracticeRunner } from './PracticeRunner'
import { PracticeSetup } from './PracticeSetup'
import { PracticeSummary } from './PracticeSummary'
import { loadDrafts, parseSession, saveDrafts, type PracticeStep, type StepDraft } from './playlist'
import '../tools/shared/tool.css'
import './practice.css'

const SLUGS = PRACTICE_TOOLS.map((t) => t.slug)

type Phase =
    | { name: 'setup' }
    // `run` counts the runs, so Go again starts the runner afresh.
    | { name: 'running'; steps: PracticeStep[]; startedAt: number; run: number }
    | {
          name: 'done'
          steps: PracticeStep[]
          results: number[][]
          seconds: number
          complete: boolean
          run: number
      }

/**
 * A practice session: a list of tools, each for a number of poses at so many seconds a pose,
 * run one after another on the timer, like "5 spheres at 60s, then 5 trios at 90s".
 */
export function PracticePage() {
    const [drafts, setDrafts] = useState<StepDraft[]>(() => loadDrafts(SLUGS))
    const [phase, setPhase] = useState<Phase>({ name: 'setup' })

    useDocumentTitle(
        phase.name === 'done' ? `Session done · ${SITE_NAME}` : `Practice session · ${SITE_NAME}`,
    )

    const changeDrafts = (next: StepDraft[]) => {
        setDrafts(next)
        saveDrafts(next)
    }

    const start = (steps: PracticeStep[], run: number) => {
        // Starting is a click, the moment the browser lets a page turn sound on, so the chime
        // can play later with nobody touching the page.
        unlockAudio()
        window.scrollTo(0, 0)
        setPhase({ name: 'running', steps, startedAt: Date.now(), run })
    }

    if (phase.name === 'running') {
        return (
            <PracticeRunner
                key={phase.run}
                steps={phase.steps}
                onFinish={(results, complete) =>
                    setPhase({
                        name: 'done',
                        steps: phase.steps,
                        results,
                        seconds: (Date.now() - phase.startedAt) / 1000,
                        complete,
                        run: phase.run,
                    })
                }
            />
        )
    }

    if (phase.name === 'done') {
        return (
            <>
                <h1>{phase.complete ? 'Session complete' : 'Session ended'}</h1>
                <PracticeSummary
                    steps={phase.steps}
                    results={phase.results}
                    seconds={phase.seconds}
                    complete={phase.complete}
                    onAgain={() => start(phase.steps, phase.run + 1)}
                    onEdit={() => setPhase({ name: 'setup' })}
                />
            </>
        )
    }

    const session = parseSession(drafts, SLUGS)
    return (
        <>
            <h1>Practice session</h1>
            <p className="practice-intro">
                Line up a few tools, each for a number of poses at so many seconds a pose. Press
                Start and draw: each pose gets its time on the timer, with the chime if it's on, and
                the next tool follows by itself. Your list is saved in this browser.
            </p>
            <PracticeSetup
                drafts={drafts}
                onChange={changeDrafts}
                onStart={() => session && start(session, 0)}
            />
        </>
    )
}
