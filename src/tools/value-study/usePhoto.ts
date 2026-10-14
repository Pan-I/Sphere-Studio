import { useCallback, useEffect, useRef, useState } from 'react'
import { photoPicture, type Picture } from './picture'

export interface LoadedPhoto {
    picture: Picture
    name: string
}

/**
 * The photo being studied, if any. A photo is decoded in the browser and kept in memory for this
 * tab only: it isn't uploaded or saved, so it's gone after a reload. Pasting an image anywhere on
 * the page opens it too.
 */
export function usePhoto() {
    const [photo, setPhoto] = useState<LoadedPhoto | null>(null)
    const [error, setError] = useState<string | null>(null)
    const latest = useRef(0) // so a slow file can't replace one opened after it

    const open = useCallback(async (file: File) => {
        const attempt = ++latest.current
        if (!file.type.startsWith('image/')) {
            setError(`${file.name || 'That file'} isn't an image.`)
            return
        }
        try {
            // Turned upright from the photo's own orientation (EXIF), the browser's default.
            const bitmap = await createImageBitmap(file)
            if (attempt !== latest.current) return bitmap.close()
            setPhoto({
                picture: photoPicture(bitmap, bitmap.width, bitmap.height),
                name: file.name || 'Pasted image',
            })
            setError(null)
        } catch {
            if (attempt === latest.current) {
                setError(`Couldn't open ${file.name || 'that image'}. Try a JPEG, PNG or WebP.`)
            }
        }
    }, [])

    const clear = useCallback(() => {
        latest.current++
        setPhoto(null)
        setError(null)
    }, [])

    useEffect(() => {
        const onPaste = (e: ClipboardEvent) => {
            const file = [...(e.clipboardData?.files ?? [])].find((f) =>
                f.type.startsWith('image/'),
            )
            if (!file) return
            e.preventDefault()
            void open(file)
        }
        window.addEventListener('paste', onPaste)
        return () => window.removeEventListener('paste', onPaste)
    }, [open])

    return { photo, error, open, clear }
}
