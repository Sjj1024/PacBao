import { create } from 'zustand'

type LoadingState = {
    pendingCount: number
    start: () => void
    stop: () => void
}

export const selectIsGlobalLoading = (s: LoadingState) => s.pendingCount > 0

export const useLoadingStore = create<LoadingState>((set, get) => ({
    pendingCount: 0,
    start: () => set({ pendingCount: get().pendingCount + 1 }),
    stop: () =>
        set({ pendingCount: Math.max(0, get().pendingCount - 1) }),
}))
