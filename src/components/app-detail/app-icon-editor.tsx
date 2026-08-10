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
/** Multiplicative zoom for ctrl+wheel (Windows trackpad pinch). */
const CTRL_WHEEL_ZOOM_FACTOR = 0.01

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

type Point = { x: number; y: number }

type PinchSession = {
    startDistance: number
    startScale: number
    startMid: Point
    startOffset: Point
}

function clampScale(scale: number) {
    return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale))
}

function pointerDistance(a: Point, b: Point) {
    const dx = a.x - b.x
    const dy = a.y - b.y
    return Math.hypot(dx, dy)
}

function pointerMidpoint(a: Point, b: Point): Point {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
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
    const previewRef = useRef<HTMLDivElement>(null)
    const dragRef = useRef<Point | null>(null)
    const pointersRef = useRef<Map<number, Point>>(new Map())
    const pinchRef = useRef<PinchSession | null>(null)
    const transformRef = useRef<IconTransform>(
        initialTransform ?? getDefaultIconTransform()
    )
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

    transformRef.current = transform

    useEffect(() => {
        if (!open) return
        const next = initialTransform ?? getDefaultIconTransform()
        setTransform(next)
        transformRef.current = next
        setBorderRadius(initialBorderRadius ?? DEFAULT_ICON_BORDER_RADIUS)
        pointersRef.current.clear()
        pinchRef.current = null
        dragRef.current = null
    }, [open, initialTransform, initialBorderRadius, source])

    useEffect(() => {
        if (!open || !source) {
            setImageSize(null)
            return
        }
        setImageSize(null)
        const img = new Image()
        img.onload = () => {
            setImageSize({ w: img.naturalWidth, h: img.naturalHeight })
        }
        img.onerror = () => {
            setImageSize(null)
        }
        // Must use convertFileSrc for on-disk project icons (same as <img>).
        img.src = toIconSrc(source)
    }, [open, source])

    useEffect(() => {
        if (!open) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [open, onClose])

    // Non-passive wheel listener so we can prevent page scroll / browser zoom.
    // Windows Precision Touchpad pinch is often delivered as ctrl+wheel.
    useEffect(() => {
        if (!open) return
        const el = previewRef.current
        if (!el) return

        const onWheel = (e: WheelEvent) => {
            const overPreview = el.contains(e.target as Node)
            // Always block browser page-zoom while the editor is open.
            if (e.ctrlKey) {
                e.preventDefault()
                if (!overPreview) return
                const zoom = Math.exp(-e.deltaY * CTRL_WHEEL_ZOOM_FACTOR)
                setTransform((prev) => ({
                    ...prev,
                    scale: clampScale(prev.scale * zoom),
                }))
                return
            }
            if (!overPreview) return
            e.preventDefault()
            const delta = -e.deltaY * WHEEL_ZOOM_FACTOR
            setTransform((prev) => ({
                ...prev,
                scale: clampScale(prev.scale + delta),
            }))
        }

        document.addEventListener('wheel', onWheel, { passive: false })
        return () => document.removeEventListener('wheel', onWheel)
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

    function beginPinch() {
        const pts = [...pointersRef.current.values()]
        if (pts.length < 2) return
        const current = transformRef.current
        pinchRef.current = {
            startDistance: Math.max(pointerDistance(pts[0], pts[1]), 1),
            startScale: current.scale,
            startMid: pointerMidpoint(pts[0], pts[1]),
            startOffset: { x: current.x, y: current.y },
        }
        dragRef.current = null
    }

    function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
        e.preventDefault()
        e.currentTarget.setPointerCapture(e.pointerId)
        pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

        if (pointersRef.current.size >= 2) {
            beginPinch()
            return
        }

        pinchRef.current = null
        dragRef.current = { x: e.clientX, y: e.clientY }
    }

    function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
        if (!pointersRef.current.has(e.pointerId)) return
        pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

        if (pointersRef.current.size >= 2) {
            if (!pinchRef.current) beginPinch()
            const pinch = pinchRef.current
            if (!pinch) return

            const pts = [...pointersRef.current.values()]
            const distance = Math.max(pointerDistance(pts[0], pts[1]), 1)
            const mid = pointerMidpoint(pts[0], pts[1])
            const nextScale = clampScale(
                pinch.startScale * (distance / pinch.startDistance)
            )
            // Keep the pinch midpoint anchored relative to the image.
            const scaleRatio = nextScale / pinch.startScale
            setTransform({
                scale: nextScale,
                x:
                    pinch.startOffset.x * scaleRatio +
                    (mid.x - pinch.startMid.x),
                y:
                    pinch.startOffset.y * scaleRatio +
                    (mid.y - pinch.startMid.y),
            })
            return
        }

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
        pointersRef.current.delete(e.pointerId)
        try {
            e.currentTarget.releasePointerCapture(e.pointerId)
        } catch {
            /* already released */
        }

        if (pointersRef.current.size >= 2) {
            beginPinch()
            return
        }

        pinchRef.current = null
        if (pointersRef.current.size === 1) {
            const remaining = [...pointersRef.current.values()][0]
            dragRef.current = { x: remaining.x, y: remaining.y }
        } else {
            dragRef.current = null
        }
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
                            touchAction: 'none',
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
