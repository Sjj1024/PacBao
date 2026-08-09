'use client'

import { useSyncExternalStore } from 'react'
import { isTauri } from '@tauri-apps/api/core'

function subscribe() {
    return () => {}
}

function getSnapshot() {
    return isTauri()
}

function getServerSnapshot() {
    return false
}

/** Whether the client is running inside the Tauri desktop shell. */
export function useTauriDesktop() {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
