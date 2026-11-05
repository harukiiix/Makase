// 会話シーン：ドット絵の顔＋大きめの文字。絵物語（pic）があれば文の上に並べる
// クリック／Space／Enter で進む
import { useEffect, useRef, useState } from 'react'
import type { Beat, IconId, L10n } from '../game/types'
import { sfx } from '../lib/platform'
import { useT } from './i18n'
import { Icon } from './icons'
import { CityBG, Face, Nova } from './pixel'
import { S, SPEAKER } from './strings'

const COLOR: Record<Beat['who'], string> = {
  NOVA: 'var(--color-cy)',
  REI: 'var(--color-am)',
  KAI: 'var(--color-rd)',
  MIRAGE: 'var(--color-mg)',
  TOKI: 'var(--color-am)',
  SYS: 'var(--color-line)',
  YOU: 'var(--color-fg)',
}
const AVATAR: Partial<Record<Beat['who'], IconId>> = { TOKI: 'av_toki', YOU: 'av_minato' }

export function Talk({
  beats,
  speed,
  onDone,
  choices,
  header,
}: {
  beats: Beat[]
  speed: 'normal' | 'fast' | 'instant'
  onDone: (choice?: number) => void
  choices?: L10n[]
  header?: string
}) {
  const t = useT()
  const [i, setI] = useState(0)
  const [n, setN] = useState(0)
  const b = beats[Math.min(i, beats.length - 1)]
  const text = t(b.t)
  const full = n >= text.length
  const last = i >= beats.length - 1
  const cps = speed === 'instant' ? 9999 : speed === 'fast' ? 90 : 40
  const doneRef = useRef(false)

  useEffect(() => {
    setN(speed === 'instant' ? text.length : 0)
  }, [i, text.length, speed])
  useEffect(() => {
    if (full) return
    const tm = window.setTimeout(() => {
      setN((v) => Math.min(text.length, v + (t.lang === 'en' ? 2 : 1)))
      if (n % 3 === 0) sfx.type()
    }, 1000 / cps)
    return () => clearTimeout(tm)
  }, [n, full, text.length, cps, t.lang])

  const advance = () => {
    if (!full) return setN(text.length)
    if (last) {
      if (choices) return
      if (!doneRef.current) {
        doneRef.current = true
        onDone()
      }
      return
    }
    sfx.ui()
    setI((v) => v + 1)
  }

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLButtonElement) return
      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault()
        advance()
      }
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  })

  const color = COLOR[b.who]
  const name = t(SPEAKER[b.who])
  const av = AVATAR[b.who]
  return (
    <div className="crt relative flex min-h-full cursor-pointer flex-col justify-end p-4 sm:p-8" onClick={advance}>
      <CityBG intensity={b.who === 'MIRAGE' ? 1 : 0} />
      {header && <div className="absolute left-4 top-4 font-pixel text-base tracking-wider text-cy sm:left-8 sm:top-8">{header}</div>}
      <div className="mx-auto w-full max-w-3xl">
        {/* 絵物語：アイコンを左から順に並べる */}
        {b.pic && b.pic.length > 0 && (
          <div key={`pic-${i}`} className="pop mx-auto mb-5 flex w-fit max-w-full items-center gap-2 border-2 border-line bg-panel/95 px-3 py-4 sm:gap-5 sm:px-5" aria-hidden>
            {b.pic.map((ic, k) => (
              <span key={k} className="flex items-center gap-2 sm:gap-5">
                {k > 0 && <Icon id="arrow" size={2} muted className="h-4 w-4 sm:h-6 sm:w-6" />}
                <Icon id={ic} size={6} className="h-12 w-12 sm:h-[72px] sm:w-[72px]" />
              </span>
            ))}
          </div>
        )}
        <div className="flex items-end gap-4">
          {b.who !== 'SYS' && (
            <div key={i} className="pop shrink-0 bg-panel p-2" style={{ boxShadow: `0 0 0 2px ${color}` }}>
              {b.who === 'NOVA' ? <Nova size={6} mood="idle" /> : av ? <Icon id={av} size={8} /> : <Face who={b.who} size={6} />}
            </div>
          )}
        </div>
        <div className="mt-3 min-h-[8.5rem] bg-panel/95 p-4 sm:p-5" style={{ boxShadow: `0 0 0 2px ${color}, 0 6px 0 0 rgba(0,0,0,.5)` }}>
          {name && (
            <div className="mb-2 font-pixel text-base" style={{ color }}>
              {name}
            </div>
          )}
          <p className={`text-lg leading-loose sm:text-xl ${b.who === 'SYS' ? 'text-fg/90' : ''} ${b.who === 'MIRAGE' ? 'glitch' : ''}`} aria-live="polite">
            {text.slice(0, n)}
            {!full && <span className="blink">▌</span>}
          </p>
          <div className="mt-2 flex justify-end text-sm text-dim">
            {full && !(last && choices) && (
              <span className="blink">
                ▼ <span className="[@media(hover:none)]:hidden">{t(S.clickNext)}</span>
                <span className="hidden [@media(hover:none)]:inline">{t(S.tapNext)}</span>
              </span>
            )}
          </div>
        </div>
        {last && full && choices && (
          <div className="rise mt-4 grid gap-3" onClick={(e) => e.stopPropagation()}>
            {choices.map((c, ci) => (
              <button
                key={ci}
                data-choice={ci}
                autoFocus={ci === 0}
                className="px-btn bg-panel2 px-4 py-3 text-left text-lg text-fg"
                onClick={() => {
                  sfx.ui()
                  onDone(ci)
                }}
              >
                ▶ {t(c)}
              </button>
            ))}
          </div>
        )}
        <button
          data-skip
          className="hud-btn ml-auto mt-3 flex w-fit text-sm"
          onClick={(e) => {
            e.stopPropagation()
            if (choices) {
              setI(beats.length - 1)
              setN(t(beats[beats.length - 1].t).length)
            } else onDone()
          }}
        >
          {t(S.skip)} ▶▶
        </button>
      </div>
    </div>
  )
}
