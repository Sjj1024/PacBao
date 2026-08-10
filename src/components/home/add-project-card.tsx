import {
    projectCardDescClass,
    projectCardIconAreaClass,
    projectCardOuterClass,
    projectCardTitleClass,
} from './project-card-styles'

type AddProjectCardProps = {
    label: string
    onClick: () => void
}

export function AddProjectCard({ label, onClick }: AddProjectCardProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={label}
            className={`${projectCardOuterClass} relative w-full border-dashed border-zinc-300 bg-zinc-50/80 transition-colors hover:border-zinc-400 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900/40 dark:hover:border-zinc-500 dark:hover:bg-zinc-800/30`}
        >
            {/* Invisible skeleton — same inner layout as ProjectCard for matching size */}
            <div
                className="pointer-events-none invisible flex min-h-0 w-full flex-1 flex-col"
                aria-hidden
            >
                <div className={projectCardIconAreaClass} />
                <h2 className={projectCardTitleClass}>{label}</h2>
                <p className={projectCardDescClass}>{'\u00a0\n\u00a0'}</p>
                <div className="min-h-0 flex-1" />
            </div>

            <span className="absolute inset-0 flex items-center justify-center text-4xl font-light leading-none text-zinc-400 sm:text-5xl dark:text-zinc-500">
                +
            </span>
        </button>
    )
}
