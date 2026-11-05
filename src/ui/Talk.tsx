// 会話シーン：ドット絵の顔＋タイプライター。クリック/Space/Enterで進む
import { useEffect, useRef, useState } from 'react'
import type { Beat } from '../game/types'
import { sfx } from '../lib/platform'
import { CityBG, Face, Nova } from './pixel'

const NAME: Record<Beat['who'], { n: string; c: string }> = {
  NOVA: { n: 'NOVA', c: 'var(--color-cy)' },
  REI: { n: 'REI ／ セキュリティ', c: 'var(--color-am)' },
  KAI: { n: 'KAI ／ CEO', c: 'var(--color-rd)' },
  MIRAGE: { n: '─ 前の席より', c: 'var(--color-mg)' },
  TOKI: { n: '留守電 ／ 小野寺トキ（87）', c: 'var(--color-am)' },
  SYS: { n: '', c: 'var(--color-dim)' },
  YOU: { n: 'ミナト（あなた）', c: 'var(--color-fg)' },
}

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
  choices?: string[]
  header?: string
}) {
  const [i, setI] = useState(0)
  const [n, setN] = useState(0)
  const b = beats[Math.min(i, beats.length - 1)]
  const full = n >= b.t.length
  const last = i >= beats.length - 1
  const cps = speed === 'instant' ? 9999 : speed === 'fast' ? 90 : 40
  const doneRef = useRef(false)

  useEffect(() => {
    setN(speed === 'instant' ? b.t.length : 0)
  }, [i, b.t.length, speed])
  useEffect(() => {
    if (full) return
    const t = window.setTimeout(() => {
      setN((v) => Math.min(b.t.length, v + 1))
      if (n % 3 === 0) sfx.type()
    }, 1000 / cps)
    return () => clearTimeout(t)
  }, [n, full, b.t.length, cps])

  const advance = () => {
    if (!full) return setN(b.t.length)
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

  const nm = NAME[b.who]
  return (
    <div className="crt relative flex min-h-full cursor-pointer flex-col justify-end p-4 sm:p-8" onClick={advance}>
      <CityBG intensity={b.who === 'MIRAGE' ? 1 : 0} />
      {header && <div className="absolute left-4 top-4 text-xs tracking-widest text-cy sm:left-8 sm:top-8">{header}</div>}
      <div className="mx-auto w-full max-w-3xl">
        <div className="flex items-end gap-4">
          {b.who !== 'SYS' && b.who !== 'YOU' && b.who !== 'TOKI' && (
            <div key={i} className="pop shrink-0 bg-panel p-2" style={{ boxShadow: `0 0 0 2px ${nm.c}` }}>
              {b.who === 'NOVA' ? <Nova size={6} mood="idle" /> : <Face who={b.who} size={6} />}
            </div>
          )}
        </div>
        <div className="mt-3 min-h-[8.5rem] bg-panel/95 p-4 sm:p-5" style={{ boxShadow: `0 0 0 2px ${nm.c}, 0 6px 0 0 rgba(0,0,0,.5)` }}>
          {nm.n && (
            <div className="mb-2 text-sm" style={{ color: nm.c }}>
              {nm.n}
            </div>
          )}
          <p className={`text-base leading-loose sm:text-lg ${b.who === 'SYS' ? 'text-fg/85' : ''} ${b.who === 'MIRAGE' ? 'glitch' : ''}`} aria-live="polite">
            {b.t.slice(0, n)}
            {!full && <span className="blink">▌</span>}
          </p>
          <div className="mt-2 flex justify-end text-xs text-dim">
            {full && !(last && choices) && (
              <span className="blink">
                ▼ <span className="[@media(hover:none)]:hidden">クリック／Space</span>
                <span className="hidden [@media(hover:none)]:inline">タップで次へ</span>
              </span>
            )}
          </div>
        </div>
        {last && full && choices && (
          <div className="rise mt-4 grid gap-3" onClick={(e) => e.stopPropagation()}>
            {choices.map((c, ci) => (
              <button
                key={c}
                autoFocus={ci === 0}
                className="px-btn bg-panel2 px-4 py-3 text-left text-fg"
                onClick={() => {
                  sfx.ui()
                  onDone(ci)
                }}
              >
                ▶ {c}
              </button>
            ))}
          </div>
        )}
        <button
          className="hud-btn mt-3 ml-auto flex w-fit"
          onClick={(e) => {
            e.stopPropagation()
            if (choices) {
              setI(beats.length - 1)
              setN(beats[beats.length - 1].t.length)
            } else onDone()
          }}
        >
          スキップ ▶▶
        </button>
      </div>
    </div>
  )
}
