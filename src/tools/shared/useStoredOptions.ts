import { useEffect, useState } from 'react'
import type { OptionSet } from './options'

/** A tool's display options, loaded from the browser on first render and saved on every change. */
export function useStoredOptions<T>(set: OptionSet<T>) {
    const [options, setOptions] = useState(set.load)

    useEffect(() => {
        set.save(options)
    }, [set, options])

    return [options, setOptions] as const
}
