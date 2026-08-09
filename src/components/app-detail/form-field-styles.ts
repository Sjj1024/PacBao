export const formLabelClass =
    'text-sm font-medium text-zinc-800 dark:text-zinc-200'

export const formInputClass =
    'h-12 w-full rounded-xl border border-zinc-200 bg-white px-4 text-base text-zinc-950 outline-none ring-zinc-400 transition-[box-shadow,border-color] placeholder:text-zinc-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-500/30'

/** Number fields for window size (width × height); grow to fill the row. */
export const windowSizeInputClass =
    'h-12 min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-3 text-left text-base text-zinc-950 outline-none ring-zinc-400 transition-[box-shadow,border-color] focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-500/30 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'

export const formErrorClass = 'text-sm text-red-600 dark:text-red-400'

export function formRadioClass(isTauri: boolean) {
    return `${isTauri ? 'h-5 w-5' : 'h-4 w-4'} shrink-0 border-zinc-300 text-blue-600 focus:ring-blue-500/30 dark:border-zinc-600`
}
