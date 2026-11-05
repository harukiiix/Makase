// 言語の切り替え。画面に出す文字は必ず t() を通す
import { createContext, useContext } from 'react'
import type { L10n, Lang } from '../game/types'

export const LangContext = createContext<Lang>('ja')

export function tr(x: L10n | string | undefined | null, lang: Lang): string {
  if (!x) return ''
  return typeof x === 'string' ? x : x[lang]
}

/** const t = useT(); t(card.title) */
export function useT() {
  const lang = useContext(LangContext)
  const t = (x: L10n | string | undefined | null) => tr(x, lang)
  return Object.assign(t, { lang })
}

export function defaultLang(): Lang {
  try {
    const l = (navigator.languages?.[0] ?? navigator.language ?? 'ja').toLowerCase()
    return l.startsWith('ja') ? 'ja' : 'en'
  } catch {
    return 'ja'
  }
}
