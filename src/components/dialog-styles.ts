/** 弹窗遮罩：靠上显示，不居中、不贴底，移动端与桌面一致 */
export const dialogOverlayClass =
    'fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 pb-4 pt-[20vh]'

/** 打包发布等较高弹窗：更靠上（距顶部约 10vh） */
export const dialogOverlayPublishClass =
    'fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 pb-4 pt-[10vh]'

export const dialogBackdropClass =
    'absolute inset-0 bg-black/50 backdrop-blur-[2px]'

/** 较高弹窗的最大高度，避免超出视口底部 */
export const dialogPanelTallMaxHeightClass =
    'max-h-[min(calc(88vh-2rem),720px)]'
