// 言語の切り替え。画面に出す文字は必ず t() を通す
// 日本語は、文節（意味のまとまり）の間にだけ折り返しの目印（ゼロ幅スペース）を入れる。
// 「ミナ／ト」「入っ／ている」のような単語の途中での改行を、スマホ（iPhone の Safari も）で防ぐため
import { createContext, useContext } from 'react'
import { Parser, jaModel } from 'budoux'
import type { L10n, Lang } from '../game/types'

export const LangContext = createContext<Lang>('ja')

/** 折り返しの目印（目には見えない） */
export const ZW = '​'
const JA_CHAR = /[぀-ヿ㐀-鿿！-｠]/
let parser: Parser | null = null
const cache = new Map<string, string>()
/** 文節の区切りが入ってしまうが、1語として読みたい言葉 */
const GLUE = ['手順書', 'おばあちゃん', 'おばあさん', 'あて先'].map((w) => [new RegExp(w.split('').join(`${ZW}?`), 'g'), w] as const)

/** 日本語の文を、文節の間でだけ折り返せるようにする */
export function phrase(s: string): string {
  if (!s || !JA_CHAR.test(s)) return s
  const hit = cache.get(s)
  if (hit !== undefined) return hit
  parser ??= new Parser(jaModel)
  // すでにある目印（文字列に手で入れたもの）は残し、そのあいだを文節に分ける
  const p = parser
  const out = s
    .split(ZW)
    .map((part) => GLUE.reduce((x, [re, w]) => x.replace(re, w), p.parse(part).join(ZW)))
    .join(ZW)
  if (cache.size > 4000) cache.clear()
  cache.set(s, out)
  return out
}

/** 目印を取りのぞいた文（比べる・数えるとき用） */
export const plain = (s: string) => s.replaceAll(ZW, '')

export function tr(x: L10n | string | undefined | null, lang: Lang): string {
  if (!x) return ''
  const s = typeof x === 'string' ? x : x[lang]
  return lang === 'ja' ? phrase(s) : s
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
