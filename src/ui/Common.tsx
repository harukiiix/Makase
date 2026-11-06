// いろいろな画面で使う部品：ことばの切り替え、丸いもどるボタン、画面の条件
import { useEffect, useState } from 'react'
import type { Lang } from '../game/types'
import { sfx } from '../lib/platform'
import { useT } from './i18n'
import { S } from './strings'

export function useMedia(query: string) {
  const [m, setM] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setM(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [query])
  return m
}

/** 右上の English / 日本語（いま選んでいる方を、紺の地に白で） */
export function LangToggle({ lang, onChange, className = '' }: { lang: Lang; onChange: (l: Lang) => void; className?: string }) {
  return (
    <div className={`flex shrink-0 overflow-hidden rounded-lg border-2 border-line bg-surface ${className}`} role="radiogroup" aria-label="Language / ことば">
      {(
        [
          ['en', 'English'],
          ['ja', '日本語'],
        ] as const
      ).map(([id, name]) => (
        <button key={id} role="radio" aria-checked={lang === id} lang={id} onClick={() => lang !== id && (sfx.ui(), onChange(id))} className={`min-h-10 px-2 text-sm font-bold sm:px-3 sm:text-base ${lang === id ? 'bg-ink text-surface' : 'text-ink2 hover:bg-surface2 hover:text-ink'}`}>
          {name}
        </button>
      ))}
    </div>
  )
}

/** 左上の、丸い「もどる」 */
export function BackButton({ onClick, label }: { onClick: () => void; label?: string }) {
  const t = useT()
  return (
    <button data-back onClick={() => (sfx.ui(), onClick())} aria-label={label ?? t(S.back)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-line bg-surface text-xl font-bold text-ink hover:bg-surface2">
      ←
    </button>
  )
}

/** 下から出るパネル（AI・確認など） */
export function Sheet({ children, onClose, label }: { children: React.ReactNode; onClose?: () => void; label: string }) {
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal aria-label={label}>
      <div className="absolute inset-0 bg-[#0b1017]/55" onClick={onClose} aria-hidden />
      <div className="rise relative max-h-[88dvh] w-full max-w-2xl overflow-y-auto overflow-x-hidden rounded-t-2xl border-2 border-line bg-surface text-ink sm:rounded-2xl">{children}</div>
    </div>
  )
}
