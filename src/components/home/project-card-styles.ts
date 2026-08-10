/** Shared layout tokens so project cards and the add card stay the same size. */
export const projectCardOuterClass =
    'flex aspect-[3/4] flex-col overflow-hidden rounded-2xl border p-3 shadow-sm sm:p-4'

/** Full-width square icon slot (width drives height via aspect-square). */
export const projectCardIconAreaClass =
    'mb-1.5 aspect-square w-full shrink-0 overflow-hidden rounded-xl'

export const projectCardTitleClass =
    'shrink-0 truncate text-base font-semibold text-zinc-900 sm:text-lg dark:text-white'

export const projectCardDescClass =
    'line-clamp-2 shrink-0 text-sm leading-tight text-zinc-600 dark:text-zinc-400'
