import { enHomeStrings } from './en'
import { jaHomeStrings } from './ja'
import { koHomeStrings } from './ko'
import type { HomeStrings } from './types'
import { zhCNHomeStrings } from './zh-CN'
import { zhTWHomeStrings } from './zh-TW'

export const HOME_LOCALES = ['zh-CN', 'zh-TW', 'en', 'ja', 'ko'] as const

export type HomeLocale = (typeof HOME_LOCALES)[number]

export const HOME_LOCALE_LABELS: Record<HomeLocale, string> = {
    'zh-CN': '简体中文',
    'zh-TW': '繁體中文',
    en: 'English',
    ja: '日本語',
    ko: '한국어',
}

export type { HomeStrings } from './types'

export const HOME_STRINGS: Record<HomeLocale, HomeStrings> = {
    'zh-CN': zhCNHomeStrings,
    'zh-TW': zhTWHomeStrings,
    en: enHomeStrings,
    ja: jaHomeStrings,
    ko: koHomeStrings,
}

export function isHomeLocale(v: string): v is HomeLocale {
    return (HOME_LOCALES as readonly string[]).includes(v)
}

export const HOME_LOCALE_STORAGE_KEY = 'taurihub-home-locale'
