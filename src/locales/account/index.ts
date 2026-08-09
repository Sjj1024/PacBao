import { enAccountStrings } from './en'
import { jaAccountStrings } from './ja'
import { koAccountStrings } from './ko'
import type { AccountStrings } from './types'
import { zhCNAccountStrings } from './zh-CN'
import { zhTWAccountStrings } from './zh-TW'
import type { HomeLocale } from '@/locales/home'

export type { AccountStrings } from './types'

export const ACCOUNT_STRINGS: Record<HomeLocale, AccountStrings> = {
    'zh-CN': zhCNAccountStrings,
    'zh-TW': zhTWAccountStrings,
    en: enAccountStrings,
    ja: jaAccountStrings,
    ko: koAccountStrings,
}

export function formatAccountTemplate(
    template: string,
    vars: Record<string, string | number>,
) {
    return Object.entries(vars).reduce(
        (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
        template,
    )
}
