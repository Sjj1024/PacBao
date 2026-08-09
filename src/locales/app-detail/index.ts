import { enAppDetailStrings } from './en'
import { jaAppDetailStrings } from './ja'
import { koAppDetailStrings } from './ko'
import type { AppDetailStrings } from './types'
import { zhCNAppDetailStrings } from './zh-CN'
import { zhTWAppDetailStrings } from './zh-TW'
import type { HomeLocale } from '@/locales/home'

export type { AppDetailStrings } from './types'

export const APP_DETAIL_STRINGS: Record<HomeLocale, AppDetailStrings> = {
    'zh-CN': zhCNAppDetailStrings,
    'zh-TW': zhTWAppDetailStrings,
    en: enAppDetailStrings,
    ja: jaAppDetailStrings,
    ko: koAppDetailStrings,
}
