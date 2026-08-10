import logoWebp from '@/assets/logo.webp'
import { resolveIconForCanvas } from '@/lib/file-api'

export type IconTransform = {
    scale: number
    x: number
    y: number
}

export const ICON_VIEWPORT_SIZE = 280
export const ICON_OUTPUT_SIZE = 512
export const DEFAULT_ICON_BORDER_RADIUS = 10

/** UI placeholder when a project has no custom app icon. */
export const APP_ICON_PLACEHOLDER_SRC =
    typeof logoWebp === 'string' ? logoWebp : logoWebp.src

export function getDefaultIconTransform(): IconTransform {
    return { scale: 1, x: 0, y: 0 }
}

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = src
    })
}

export function getCoverScale(
    imgWidth: number,
    imgHeight: number,
    viewportSize: number
) {
    return Math.max(viewportSize / imgWidth, viewportSize / imgHeight)
}

export function getImageDrawRect(
    imgWidth: number,
    imgHeight: number,
    transform: IconTransform,
    viewportSize: number
) {
    const coverScale = getCoverScale(imgWidth, imgHeight, viewportSize)
    const drawScale = coverScale * transform.scale
    const drawWidth = imgWidth * drawScale
    const drawHeight = imgHeight * drawScale
    const centerX = viewportSize / 2 + transform.x
    const centerY = viewportSize / 2 + transform.y

    return {
        x: centerX - drawWidth / 2,
        y: centerY - drawHeight / 2,
        width: drawWidth,
        height: drawHeight,
    }
}

function clipRoundedRect(
    ctx: CanvasRenderingContext2D,
    size: number,
    borderRadiusPercent: number
) {
    const radius = (borderRadiusPercent / 100) * (size / 2)
    ctx.beginPath()
    if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(0, 0, size, size, radius)
    } else {
        ctx.moveTo(radius, 0)
        ctx.lineTo(size - radius, 0)
        ctx.quadraticCurveTo(size, 0, size, radius)
        ctx.lineTo(size, size - radius)
        ctx.quadraticCurveTo(size, size, size - radius, size)
        ctx.lineTo(radius, size)
        ctx.quadraticCurveTo(0, size, 0, size - radius)
        ctx.lineTo(0, radius)
        ctx.quadraticCurveTo(0, 0, radius, 0)
        ctx.closePath()
    }
    ctx.clip()
}

export async function renderAppIcon(
    source: string,
    transform: IconTransform,
    borderRadiusPercent: number,
    viewportSize = ICON_VIEWPORT_SIZE,
    outputSize = ICON_OUTPUT_SIZE
): Promise<string> {
    // Filesystem icons must be data URLs; asset:// images taint the canvas.
    const canvasSrc = await resolveIconForCanvas(source)
    const img = await loadImage(canvasSrc)
    const canvas = document.createElement('canvas')
    canvas.width = outputSize
    canvas.height = outputSize
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas not supported')

    const ratio = outputSize / viewportSize
    const rect = getImageDrawRect(
        img.naturalWidth,
        img.naturalHeight,
        transform,
        viewportSize
    )

    ctx.save()
    clipRoundedRect(ctx, outputSize, borderRadiusPercent)
    ctx.drawImage(
        img,
        rect.x * ratio,
        rect.y * ratio,
        rect.width * ratio,
        rect.height * ratio
    )
    ctx.restore()

    return canvas.toDataURL('image/png')
}

export async function rerenderAppIconFromProject(project: {
    iconSource: string
    iconTransform: IconTransform
    iconBorderRadius: number
}) {
    if (!project.iconSource) return ''
    return renderAppIcon(
        project.iconSource,
        project.iconTransform,
        project.iconBorderRadius
    )
}
