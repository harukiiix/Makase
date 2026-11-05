// 会話の場面：上にいる場所の絵、下に顔と文。押すと次へ（Space / Enter でも）
import { useEffect, useRef, useState } from 'react'
import type { L10n, Line } from '../game/types'
import { sfx } from '../lib/platform'
import { Art, sceneURL } from './Art'
import { useT, ZW } from './i18n'
import { FACE, S, SPEAKER } from './strings'

/** 名前の札の色 */
const TAG: Record<string, string> = {
  BOSS: 'bg-safety text-ink',
  YOU: 'bg-hint text-white',
  GUARD: 'bg-[#25324f] text-white',
  KIMURA: 'bg-[#c25a1c] text-white',
  SAWA: 'bg-right text-white',
  STRANGER: 'bg-[#666a7a] text-white',
  CLIENT: 'bg-ink text-white',
}

export function Talk({
  beats,
  speed,
  onDone,
  choices,
  header,
  bg,
}: {
  beats: Line[]
  speed: 'normal' | 'fast' | 'instant'
  onDone: (choice?: number) => void
  choices?: L10n[]
  header?: string
  /** 後ろに出す場面の絵 */
  bg?: string
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
    <div className="relative flex min-h-full cursor-pointer flex-col items-center justify-end gap-3 px-3 pb-4 pt-3 sm:px-6 sm:pb-8" onClick={advance}>
      {header && (
        <div className="flex w-full max-w-3xl items-center gap-2">
          <span className="stripes h-3 w-8 shrink-0" aria-hidden />
          <span className="font-pixel text-lg text-safety">{header}</span>
        </div>
      )}
      {bg && (
        <div className="flex w-full max-w-3xl flex-1 items-center justify-center">
          <img src={sceneURL(bg)} alt="" aria-hidden className="pixelated aspect-[4/3] max-h-[44dvh] w-auto max-w-full object-contain short:max-h-[38dvh]" style={{ boxShadow: '0 0 0 3px #15171b' }} draggable={false} />
        </div>
      )}
      <div className="mx-auto w-full max-w-3xl">
        {/* 小さな絵を並べる（話の中身を絵でも） */}
        {b.pic && b.pic.length > 0 && (
          <div key={`pic-${i}`} className="pop mx-auto mb-3 flex w-fit max-w-full items-center gap-3 bg-paper px-4 py-3" style={{ boxShadow: '0 0 0 2px #1d1f24' }} aria-hidden>
            {b.pic.map((p, k) => (
              <Art key={k} id={p} scale={3} />
            ))}
          </div>
        )}
        <div className="flex items-end gap-3">
          {face && (
            <div key={i} aria-hidden className="pop shrink-0 bg-paper2 p-1" style={{ boxShadow: '0 0 0 2px #1d1f24' }}>
              <Art id={face} scale={2} className="sm:hidden" />
              <Art id={face} scale={3} className="hidden sm:inline-block" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            {/* 選択肢は文の上に出す（文を押して読み進めていた指が、そのまま選ばないように） */}
            {showChoices && choices && (
              <div className="rise mb-3 grid gap-2" onClick={(e) => e.stopPropagation()}>
                <div className="font-pixel text-base text-safety">{t(S.yourChoice)}</div>
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
                    ▶ {t(c)}
                  </button>
                ))}
              </div>
            )}
            <div className="paper min-h-[7.5rem] px-4 py-3 short:min-h-0 sm:px-5 sm:py-4">
              {name && <div className={`mb-1.5 inline-block px-2 py-0.5 font-pixel text-base ${TAG[b.who] ?? 'bg-ink text-white'}`}>{name}</div>}
              <p className={`text-lg leading-relaxed sm:text-xl ${b.who === 'SYS' ? 'text-ink2' : ''}`} aria-live="polite">
                {text.slice(0, n)}
                {!full && <span className="blink">▌</span>}
              </p>
              <div className="mt-1 flex justify-end text-sm text-ink2">
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
        <button
          data-skip
          className="btn-dark ml-auto mt-3 flex w-fit text-sm"
          onClick={(e) => {
            e.stopPropagation()
            if (choices) {
              skipRef.current = true
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
