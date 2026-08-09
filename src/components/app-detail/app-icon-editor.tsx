'use client'

import {
    dialogBackdropClass,
    dialogOverlayClass,
} from '@/components/dialog-styles'
import { useEffect, useId, useRef, useState } from 'react'
import {
    DEFAULT_ICON_BORDER_RADIUS,
    getImageDrawRect,
    getDefaultIconTransform,
    ICON_VIEWPORT_SIZE,
    type IconTransform,
    renderAppIcon,
} from '@/lib/app-icon-render'
import { toIconSrc } from '@/lib/file-api'

const MIN_SCALE = 1
const MAX_SCALE = 3
/** Scale change per wheel notch (deltaY ≈ ±100). */
const WHEEL_ZOOM_FACTOR = 0.0012

export type AppIconEditorLabels = {
    title: string
    cropHint: string
    radiusLabel: string
    cancel: string
    confirm: string
}

export type AppIconEditorResult = {
    icon: string
    iconSource: string
    iconBorderRadius: number
    iconTransform: IconTransform
}

type AppIconEditorProps = {
    open: boolean
    source: string
    initialTransform?: IconTransform
    initialBorderRadius?: number
    labels: AppIconEditorLabels
    onClose: () => void
    onConfirm: (result: AppIconEditorResult) => void
}

function clampScale(scale: number) {
    return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale))
}

export function AppIconEditor({
    open,
    source,
    initialTransform,
    initialBorderRadius,
    labels,
    onClose,
    onConfirm,
}: AppIconEditorProps) {
    const titleId = useId()
    const radiusId = useId()
    const previewRef = useRef<HTMLDivElement>(null)
    const dragRef = useRef<{ x: number; y: number } | null>(null)
    const [transform, setTransform] = useState<IconTransform>(
        initialTransform ?? getDefaultIconTransform()
    )
    const [borderRadius, setBorderRadius] = useState(
        initialBorderRadius ?? DEFAULT_ICON_BORDER_RADIUS
    )
    const [imageSize, setImageSize] = useState<{ w: number; h: number } | null>(
        null
    )
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (!open) return
        setTransform(initialTransform ?? getDefaultIconTransform())
        setBorderRadius(initialBorderRadius ?? DEFAULT_ICON_BORDER_RADIUS)
    }, [open, initialTransform, initialBorderRadius, source])

    useEffect(() => {
        if (!open || !source) return
        const img = new Image()
        img.onload = () => {
            setImageSize({ w: img.naturalWidth, h: img.naturalHeight })
        }
        img.src = source
    }, [open, source])

    useEffect(() => {
        if (!open) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [open, onClose])

    // Non-passive wheel listener so we can prevent page scroll while zooming.
    useEffect(() => {
        if (!open) return
        const el = previewRef.current
        if (!el) return

        const onWheel = (e: WheelEvent) => {
            e.preventDefault()
            const delta = -e.deltaY * WHEEL_ZOOM_FACTOR
            setTransform((prev) => ({
                ...prev,
                scale: clampScale(prev.scale + delta),
            }))
        }

        el.addEventListener('wheel', onWheel, { passive: false })
        return () => el.removeEventListener('wheel', onWheel)
    }, [open])

    if (!open) return null

    const drawRect = imageSize
        ? getImageDrawRect(
              imageSize.w,
              imageSize.h,
              transform,
              ICON_VIEWPORT_SIZE
          )
        : null
    const previewRadius = `${borderRadius}%`

    function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
        e.currentTarget.setPointerCapture(e.pointerId)
        dragRef.current = { x: e.clientX, y: e.clientY }
    }

    function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
        if (!dragRef.current) return
        const dx = e.clientX - dragRef.current.x
        const dy = e.clientY - dragRef.current.y
        dragRef.current = { x: e.clientX, y: e.clientY }
        setTransform((prev) => ({
            ...prev,
            x: prev.x + dx,
            y: prev.y + dy,
        }))
    }

    function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
        dragRef.current = null
        e.currentTarget.releasePointerCapture(e.pointerId)
    }

    async function handleConfirm() {
        setSubmitting(true)
        try {
            const icon = await renderAppIcon(source, transform, borderRadius)
            onConfirm({
                icon,
                iconSource: source,
                iconBorderRadius: borderRadius,
                iconTransform: transform,
            })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div
            className={dialogOverlayClass}
            role="presentation"
            onClick={onClose}
        >
            <div className={dialogBackdropClass} aria-hidden />
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className="relative z-10 w-full max-w-md shrink-0 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
                onClick={(e) => e.stopPropagation()}
            >
                <h2
                    id={titleId}
                    className="text-center text-lg font-semibold text-zinc-900 dark:text-white"
                >
                    {labels.title}
                </h2>
                <p className="mt-2 text-center text-sm text-zinc-500 dark:text-zinc-400">
                    {labels.cropHint}
                </p>

                <div className="mt-5 flex justify-center">
                    <div
                        ref={previewRef}
                        className="relative touch-none overflow-hidden border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950"
                        style={{
                            width: ICON_VIEWPORT_SIZE,
                            height: ICON_VIEWPORT_SIZE,
                            borderRadius: previewRadius,
                        }}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerUp}
                    >
                        {drawRect && source ? (
                            <img
                                src={toIconSrc(source)}
                                alt=""
                                draggable={false}
                                className="pointer-events-none absolute max-w-none select-none"
                                style={{
                                    left: drawRect.x,
                                    top: drawRect.y,
                                    width: drawRect.width,
                                    height: drawRect.height,
                                }}
                            />
                        ) : null}
                        <div
                            className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-zinc-300/80 dark:ring-zinc-600/80"
                            style={{ borderRadius: previewRadius }}
                        />
                    </div>
                </div>

                <div className="mt-5 flex flex-col gap-2">
                    <label
                        htmlFor={radiusId}
                        className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
                    >
                        {labels.radiusLabel} ({borderRadius}%)
                    </label>
                    <input
                        id={radiusId}
                        type="range"
                        min={0}
                        max={50}
                        step={1}
                        value={borderRadius}
                        onChange={(e) =>
                            setBorderRadius(Number(e.target.value))
                        }
                        className="h-2 w-full cursor-pointer accent-zinc-900 dark:accent-zinc-100"
                    />
                </div>

                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
                    <button
                        type="button"
                        className="flex h-11 items-center justify-center rounded-xl border border-zinc-200 px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        onClick={onClose}
                        disabled={submitting}
                    >
                        {labels.cancel}
                    </button>
                    <button
                        type="button"
                        className="flex h-11 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                        onClick={handleConfirm}
                        disabled={submitting || !imageSize}
                    >
                        {labels.confirm}
                    </button>
                </div>
            </div>
        </div>
    )
}
