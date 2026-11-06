// ============================================================
// 会話の場面（はじまり・レッスンの前・終わり）
//   上：どこの話か／とばす、まん中：話している人を大きく、下：文（押すと次へ。Space / Enter でも）
//   問題の画面と同じく「人は上に大きく、文は下」
// ============================================================
import { useEffect, useRef, useState } from 'react'
import type { L10n, Line } from '../game/types'
import { sfx } from '../lib/platform'
import { Art, sceneURL } from './Art'
import { useMedia } from './Common'
import { useT, ZW } from './i18n'
import { FACE, S, SPEAKER } from './strings'

export function Talk({
  beats,
  speed,
  onDone,
  choices,
  header,
  bg,
  art,
}: {
  beats: Line[]
  speed: 'normal' | 'fast' | 'instant'
  onDone: (choice?: number) => void
  choices?: L10n[]
  header?: string
  /** 後ろに出す場面の絵 */
  bg?: string
  /** 語りの行（顔のない行）で、まん中に出す絵 */
  art?: React.ReactNode
}) {
  const t = useT()
  const [i, setI] = useState(0)
  const [n, setN] = useState(0)
  const b = beats[Math.min(i, beats.length - 1)] ?? { who: 'SYS', t: { ja: '', en: '' } }
  const text = t(b.t)
  const full = n >= text.length
  const last = i >= beats.length - 1
  const cps = speed === 'instant' ? 9999 : speed === 'fast' ? 90 : 40
  const doneRef = useRef(false)
  const skipRef = useRef(false)
  const pc = useMedia('(min-width: 1024px)')
  const low = useMedia('(max-height: 500px)')
  /** 選択肢が出た時刻。直後の押しすぎで選ばれないように */
  const choicesAt = useRef(0)

  useEffect(() => {
    setN(speed === 'instant' || skipRef.current ? text.length : 0)
    skipRef.current = false
  }, [i, text.length, speed])
  useEffect(() => {
    if (full) return
    const tm = window.setTimeout(() => {
      setN((v) => {
        let k = Math.min(text.length, v + (t.lang === 'en' ? 2 : 1))
        while (k < text.length && text[k - 1] === ZW) k++
        return k
      })
      if (n % 3 === 0) sfx.type()
    }, 1000 / cps)
    return () => clearTimeout(tm)
  }, [n, full, text, cps, t.lang])

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

  const showChoices = last && full && !!choices
  useEffect(() => {
    if (showChoices) choicesAt.current = performance.now()
  }, [showChoices])

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const act = e.code === 'Space' || e.key === 'Enter'
      if (!act) return
      if (e.target instanceof HTMLButtonElement) {
        if (e.target.dataset.choice !== undefined && (e.repeat || performance.now() - choicesAt.current < 700)) e.preventDefault()
        return
      }
      e.preventDefault()
      if (e.repeat) return
      advance()
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  })

  const name = t(SPEAKER[b.who])
  const face = FACE[b.who]
  return (
    <div className="no-select flex min-h-dvh cursor-pointer flex-col px-4 pb-4 pt-3 sm:px-6 sm:pb-8" onClick={advance}>
      <header className="mx-auto flex w-full max-w-3xl items-center gap-3">
        <span className="min-w-0 flex-1 truncate text-base font-bold text-ink2">{header}</span>
        <button
          data-skip
          className="btn-quiet text-base text-ink2"
          onClick={(e) => {
            e.stopPropagation()
            if (choices) {
              skipRef.current = true
              setI(beats.length - 1)
              setN(t(beats[beats.length - 1].t).length)
            } else onDone()
          }}
        >
          {t(S.skip)}
        </button>
      </header>

      {/* 話している人（大きく） */}
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-3 py-3">
        {bg && <img src={sceneURL(bg)} alt="" aria-hidden className="pixelated aspect-[4/3] max-h-[40dvh] w-auto max-w-full rounded-xl border-2 border-line object-contain" draggable={false} />}
        {!bg && !face && art && (
          <div className="overflow-hidden rounded-2xl border-2 border-line bg-surface2" aria-hidden>
            {art}
          </div>
        )}
        {!bg && face && (
          <figure key={b.who} className="pop grid justify-items-center gap-1.5" aria-hidden>
            <div className="overflow-hidden rounded-2xl border-2 border-line bg-surface2">
              <Art id={face} scale={low ? 3 : pc ? 6 : 5} />
            </div>
          </figure>
        )}
        {/* 話の中身を、小さな絵でも */}
        {b.pic && b.pic.length > 0 && (
          <div key={`pic-${i}`} className="pop flex max-w-full items-center gap-3 rounded-xl border-2 border-line bg-surface px-4 py-3" aria-hidden>
            {b.pic.map((p, k) => (
              <Art key={k} id={p} scale={3} />
            ))}
          </div>
        )}
      </div>

      <div className="mx-auto w-full max-w-3xl">
        {/* 選択肢は文の上に出す（文を押して読み進めていた指が、そのまま選ばないように） */}
        {showChoices && choices && (
          <div className="rise mb-3 grid gap-2" onClick={(e) => e.stopPropagation()}>
            <div className="text-base font-bold text-ink2">{t(S.yourChoice)}</div>
            {choices.map((c, ci) => (
              <button
                key={ci}
                data-choice={ci}
                className="btn justify-start text-left text-lg"
                onClick={() => {
                  if (performance.now() - choicesAt.current < 700) return
                  sfx.ui()
                  onDone(ci)
                }}
              >
                {t(c)}
              </button>
            ))}
          </div>
        )}
        <div className="panel min-h-[8rem] px-4 py-3 short:min-h-0 sm:px-5 sm:py-4">
          {name && <div className="mb-1 text-base font-bold text-ink2">{name}</div>}
          <p className={`text-lg leading-relaxed sm:text-xl sm:leading-relaxed ${b.who === 'SYS' ? 'text-ink2' : ''}`} aria-live="polite">
            {text.slice(0, n)}
            {!full && <span className="blink">▌</span>}
            {!full && (
              <span className="invisible" aria-hidden>
                {text.slice(n)}
              </span>
            )}
          </p>
          <div className="mt-1 flex h-5 justify-end text-sm text-ink2">
            {full && !(last && choices) && (
              <span className="blink">
                ▼ <span className="[@media(hover:none)]:hidden">{t(S.clickNext)}</span>
                <span className="hidden [@media(hover:none)]:inline">{t(S.tapNext)}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
