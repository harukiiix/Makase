// いろいろな画面で使う部品：ことばの切り替え、丸いもどるボタン、画面の条件
import { useEffect, useRef, useState } from 'react'
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
    <div className={`flex shrink-0 overflow-hidden rounded-lg border-2 border-edge bg-surface ${className}`} role="radiogroup" aria-label="Language / ことば">
      {(
        [
          ['en', 'English', 'EN'],
          ['ja', '日本語', '日本語'],
        ] as const
      ).map(([id, name, short]) => (
        <button key={id} role="radio" aria-checked={lang === id} aria-label={name} lang={id} onClick={() => lang !== id && (sfx.ui(), onChange(id))} className={`min-h-11 px-2 text-sm font-bold sm:px-3 sm:text-base ${lang === id ? 'bg-ink text-surface' : 'text-ink2 hover:bg-surface2 hover:text-ink'}`}>
          {/* せまい画面では English を EN に（題名や進み具合の場所を空けるため） */}
          <span className="max-[399px]:hidden">{name}</span>
          <span className="min-[400px]:hidden">{short}</span>
        </button>
      ))}
    </div>
  )
}

/** 言葉の切りかえ（小さい1つのボタン）：今とちがう方の言葉だけを出す。ホームとノートで使う。設定の中は LangToggle のまま */
export function LangButton({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
  const other: Lang = lang === 'ja' ? 'en' : 'ja'
  return (
    <button data-lang={other} lang={other} onClick={() => (sfx.ui(), onChange(other))} aria-label={other === 'en' ? 'English' : '日本語'} className="btn-quiet min-h-11 shrink-0 border-2 border-hair px-2.5 text-sm text-ink2 hover:text-ink">
      {other === 'en' ? 'English' : '日本語'}
    </button>
  )
}

/** 左上の、丸い「もどる」 */
export function BackButton({ onClick, label }: { onClick: () => void; label?: string }) {
  const t = useT()
  return (
    <button data-back onClick={() => (sfx.ui(), onClick())} aria-label={label ?? t.attr(S.back)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-edge bg-surface text-xl font-bold text-ink hover:bg-surface2">
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

/**
 * 読むための板（実際にあった話・正解のわけ・AIの宮下さん）。
 * スマホでは画面の上のほうまで大きく開き、上に題と「閉じる」、下に「答えにもどる」か入力欄。PCでは画面のまん中に大きく。Esc でも閉じる
 */
export function Panel({ title, icon, onClose, children, footer, closeLabel, tall }: { title: string; icon?: React.ReactNode; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode; closeLabel: string; /** 会話のように、あとから中身が増える板 */ tall?: boolean }) {
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center lg:items-center lg:p-8" role="dialog" aria-modal aria-label={title}>
      <div className="absolute inset-0 bg-[#0b1017]/55" onClick={onClose} aria-hidden />
      <div className={`rise relative flex ${tall ? 'h-[88dvh]' : 'max-h-[88dvh] min-h-[55dvh]'} w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border-2 border-line bg-surface text-ink lg:h-auto lg:min-h-0 lg:max-h-[82vh] lg:rounded-2xl`}>
        <div className="flex items-center gap-3 border-b-2 border-hair px-5 py-3">
          {icon}
          <h2 className="min-w-0 flex-1 text-xl font-bold leading-snug">{title}</h2>
          <button ref={closeRef} data-panel-close className="btn min-h-12 shrink-0 px-4 text-base" onClick={() => (sfx.ui(), onClose())}>
            {closeLabel}
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-5 py-4">{children}</div>
        {footer && <div className="border-t-2 border-hair px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">{footer}</div>}
      </div>
    </div>
  )
}
