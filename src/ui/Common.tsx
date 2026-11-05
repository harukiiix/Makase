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

/** 右上の English / 日本語 */
export function LangToggle({ lang, onChange, className = '' }: { lang: Lang; onChange: (l: Lang) => void; className?: string }) {
  return (
    <div className={`flex shrink-0 overflow-hidden rounded-lg bg-asphalt2 ${className}`} style={{ boxShadow: '0 0 0 2px #15171b' }} role="radiogroup" aria-label="Language / ことば">
      {(
        [
          ['en', 'English'],
          ['ja', '日本語'],
        ] as const
      ).map(([id, name]) => (
        <button key={id} role="radio" aria-checked={lang === id} lang={id} onClick={() => lang !== id && (sfx.ui(), onChange(id))} className={`min-h-11 px-3 text-sm font-bold sm:text-base ${lang === id ? 'bg-safety text-ink' : 'text-onDark2 hover:text-onDark'}`}>
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
    <button data-back onClick={() => (sfx.ui(), onClick())} aria-label={label ?? t(S.back)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-asphalt2 text-xl text-onDark hover:bg-asphalt3" style={{ boxShadow: '0 0 0 2px #15171b' }}>
      ←
    </button>
  )
}

/** 下から出る紙のパネル（説明・AI・確認） */
export function Sheet({ children, onClose, label, tone = 'paper' }: { children: React.ReactNode; onClose?: () => void; label: string; tone?: 'paper' | 'right' | 'wrong' }) {
  const edge = tone === 'right' ? 'var(--color-right)' : tone === 'wrong' ? 'var(--color-risk)' : '#1d1f24'
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center" role="dialog" aria-modal aria-label={label}>
      <div className="absolute inset-0 bg-black/45" onClick={onClose} aria-hidden />
      <div className="rise relative max-h-[88dvh] w-full max-w-2xl overflow-y-auto overflow-x-hidden rounded-t-2xl bg-paper text-ink" style={{ boxShadow: `0 -4px 0 0 ${edge}, 0 0 0 2px #1d1f24` }}>
        {children}
      </div>
    </div>
  )
}
