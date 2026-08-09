'use client'

import { create } from 'zustand'

type PackState = {
    packing: boolean
    message: string
    percent: number
    lastError: string
    lastOutputPath: string
    lastFileName: string
    setProgress: (message: string, percent: number) => void
    setPacking: (packing: boolean) => void
    setError: (error: string) => void
    setSuccess: (outputPath: string, fileName: string) => void
    reset: () => void
}

export const selectPacking = (s: PackState) => s.packing
export const selectPackMessage = (s: PackState) => s.message
export const selectPackPercent = (s: PackState) => s.percent
export const selectPackError = (s: PackState) => s.lastError
export const selectLastOutputPath = (s: PackState) => s.lastOutputPath
export const selectLastFileName = (s: PackState) => s.lastFileName

export const usePackStore = create<PackState>((set) => ({
    packing: false,
    message: '',
    percent: 0,
    lastError: '',
    lastOutputPath: '',
    lastFileName: '',
    setProgress: (message, percent) => set({ message, percent }),
    setPacking: (packing) => set({ packing }),
    setError: (lastError) =>
        set({ lastError, packing: false, message: '', percent: 0 }),
    setSuccess: (lastOutputPath, lastFileName) =>
        set({
            lastOutputPath,
            lastFileName,
            packing: false,
            message: '',
            percent: 100,
            lastError: '',
        }),
    reset: () =>
        set({
            packing: false,
            message: '',
            percent: 0,
            lastError: '',
            lastOutputPath: '',
            lastFileName: '',
        }),
}))
