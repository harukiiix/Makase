// タイトル・設定・日をえらぶ・合言葉ノート・結末・あそびかた
import { useEffect, useRef, useState } from 'react'
import { bonusTotal, ENDINGS, missedTotal, type EndingId, type WeekResults } from '../game/story'
import { DAYS } from '../game/week'
import type { Lang } from '../game/types'
import { sfx, type SaveData, type Settings } from '../lib/platform'
import { Art, sceneURL } from './Art'
import { plain, useT } from './i18n'
import { host } from './Result'
import { FACE, S } from './strings'

// ================= ことばの切り替え =================
export function LangSwitch({ lang, onChange, className = '' }: { lang: Lang; onChange: (l: Lang) => void; className?: string }) {
  return (
    <div className={`flex bg-asphalt2 ${className}`} style={{ boxShadow: '0 0 0 2px #15171b' }} role="radiogroup" aria-label="Language / ことば">
      {(
        [
          ['ja', '日本語'],
          ['en', 'English'],
        ] as const
      ).map(([id, name]) => (
        <button key={id} role="radio" aria-checked={lang === id} lang={id} onClick={() => lang !== id && (sfx.ui(), onChange(id))} className={`min-h-11 px-3 text-base ${lang === id ? 'bg-safety font-bold text-ink' : 'text-onDark2 hover:text-onDark'}`}>
          {name}
        </button>
      ))}
    </div>
  )
}

// ================= タイトル =================
export function Title(p: { save: SaveData; settings: Settings; setSettings: (s: Settings) => void; onNew: () => void; onContinue: (() => void) | null; onPick: () => void; onNotebook: () => void; onHowto: () => void }) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const firstRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    firstRef.current?.focus({ preventScroll: true })
  }, [])
  const where = p.save.at < DAYS.length ? t(DAYS[p.save.at].dayName) : t(S.ending)
  const canPick = Object.keys(p.save.best).length > 0
  return (
    <div className="relative flex min-h-full flex-col items-center justify-center px-4 pb-6 pt-20 short:pb-3 short:pt-16">
      <div className="absolute left-3 top-3 z-20 flex gap-2 sm:left-4 sm:top-4">
        <button className="btn-dark text-base" onClick={() => (sfx.ui(), p.onHowto())}>
          ？<span className="max-[359px]:hidden">{t(S.howto)}</span>
        </button>
        <button className="btn-dark text-base" onClick={() => (sfx.ui(), setOpen((v) => !v))} aria-expanded={open} aria-label={t(S.settings)}>
          ⚙<span className="hidden sm:inline">{t(S.settings)}</span>
        </button>
      </div>
      <LangSwitch className="absolute right-3 top-3 z-20 sm:right-4 sm:top-4" lang={p.settings.lang} onChange={(lang) => p.setSettings({ ...p.settings, lang })} />
      {open && (
        <div className="absolute inset-x-3 top-16 z-30 sm:left-4 sm:right-auto sm:top-[4.5rem] sm:w-80">
          <SettingsPanel s={p.settings} set={p.setSettings} />
        </div>
      )}

      <div className="grid w-full max-w-4xl items-center gap-5 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:gap-8 short:grid-cols-2 short:gap-5">
        <div className="text-center md:text-left short:text-left">
          <div className="font-pixel text-sm tracking-widest text-onDark2">{t(S.series)}</div>
          <h1 className="mt-1 text-5xl leading-tight text-safety sm:text-6xl short:text-4xl" style={{ textShadow: '3px 3px 0 #15171b' }}>
            {t(S.title)}
          </h1>
          <p className="mt-1 font-pixel text-xl text-onDark short:text-lg">{t(S.subtitle)}</p>
          {/* 絵：現場の朝（事務所の絵を小さく） */}
          <img src={sceneURL('gate')} alt="" aria-hidden className="pixelated mx-auto mt-4 aspect-[4/3] w-full max-w-sm md:mx-0 short:hidden" style={{ boxShadow: '0 0 0 3px #15171b' }} draggable={false} />
        </div>
        <div className="grid gap-3">
          <p className="paper p-3 text-base leading-relaxed short:hidden">{t(S.pitch)}</p>
          <nav className="grid gap-3">
            {p.onContinue && (
              <button ref={firstRef} className="btn-main text-xl" onClick={() => (sfx.ui(), p.onContinue!())}>
                ▶ {t(S.cont(where))}
              </button>
            )}
            <button ref={p.onContinue ? undefined : firstRef} data-new className={p.onContinue ? 'btn text-lg' : 'btn-main text-xl'} onClick={() => (sfx.ui(), p.onNew())}>
              ▶ {t(p.onContinue || p.save.plays > 0 ? S.restart : S.start)}
            </button>
            <div className="grid grid-cols-2 gap-3">
              {canPick && (
                <button className="btn text-base" onClick={() => (sfx.ui(), p.onPick())}>
                  {t(S.pickDay)}
                </button>
              )}
              <button className={`btn text-base ${canPick ? '' : 'col-span-2'}`} onClick={() => (sfx.ui(), p.onNotebook())}>
                {t(S.notebook)}
              </button>
            </div>
          </nav>
          <p className="text-center text-sm text-onDark2">{t(S.fiction)}</p>
        </div>
      </div>
    </div>
  )
}

export function SettingsPanel({ s, set }: { s: Settings; set: (s: Settings) => void }) {
  const t = useT()
  const row = (label: Parameters<typeof t>[0], value: Parameters<typeof t>[0], onClick: () => void) => (
    <button className="flex min-h-11 w-full items-center justify-between bg-paper2 px-3 py-2 text-base text-ink" onClick={() => (sfx.ui(), onClick())}>
      <span>{t(label)}</span>
      <span className="font-pixel text-hint">{t(value)}</span>
    </button>
  )
  return (
    <div className="rise paper grid gap-2 p-2 text-left">
      <div className="flex items-center justify-between bg-paper2 px-3 py-1.5 text-ink">
        <span className="text-base">{t(S.language)}</span>
        <LangSwitch lang={s.lang} onChange={(lang) => set({ ...s, lang })} />
      </div>
      {row(S.sound, s.sound ? S.on : S.off, () => set({ ...s, sound: !s.sound }))}
      {row(S.music, s.music ? S.on : S.off, () => set({ ...s, music: !s.music }))}
      {row(S.textSpeed, S.speeds[s.textSpeed], () => set({ ...s, textSpeed: s.textSpeed === 'normal' ? 'fast' : s.textSpeed === 'fast' ? 'instant' : 'normal' }))}
    </div>
  )
}

// ================= あそびかた（3枚の絵） =================
export function HowtoOverlay({ onClose }: { onClose: () => void }) {
  const t = useT()
  const btn = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    btn.current?.focus({ preventScroll: true })
  }, [])
  const cards: [string, string][] = [
    ['howto.tap', t(S.howto1)],
    ['howto.choose', t(S.howto2)],
    ['howto.after', t(S.howto3)],
  ]
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-3" role="dialog" aria-modal aria-label={t(S.howto)} onClick={onClose}>
      <div className="paper rise w-full max-w-2xl p-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl text-ink">{t(S.howto)}</h2>
        <ol className="mt-3 grid gap-3 sm:grid-cols-3">
          {cards.map(([pic, text], i) => (
            <li key={i} className="flex items-center gap-3 bg-paper2 p-3 sm:flex-col sm:text-center">
              <span className="font-pixel text-2xl text-ink2">{i + 1}</span>
              <Art id={pic} scale={3} />
              <p className="text-lg font-bold leading-snug">{text}</p>
            </li>
          ))}
        </ol>
        <button ref={btn} className="btn-main mt-4 w-full text-lg" onClick={() => (sfx.ui(), onClose())}>
          {t(S.gotIt)}
        </button>
      </div>
    </div>
  )
}

// ================= 日をえらぶ =================
export function PickDay({ save, onPick, onBack }: { save: SaveData; onPick: (i: number) => void; onBack: () => void }) {
  const t = useT()
  return (
    <div className="min-h-full px-4 py-6">
      <div className="mx-auto max-w-2xl">
        <button className="btn-dark text-base" onClick={onBack}>
          ◀ {t(S.back)}
        </button>
        <h1 className="mt-4 text-3xl text-safety">{t(S.pickDay)}</h1>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {DAYS.map((d, i) => {
            const b = save.best[d.id]
            const open = i === 0 || !!b || !!save.best[DAYS[i - 1].id]
            return (
              <button key={d.id} disabled={!open} className="paper flex items-center gap-3 p-2 text-left disabled:opacity-50" onClick={() => (sfx.ui(), onPick(i))}>
                <img src={sceneURL(d.scene)} alt="" aria-hidden className="pixelated w-28 shrink-0" style={{ boxShadow: '0 0 0 2px #1d1f24' }} draggable={false} />
                <span className="min-w-0">
                  <span className="block text-sm text-ink2">{t(d.dayName)}</span>
                  <span className="block text-lg font-bold leading-snug">{open ? t(d.place) : t(S.locked)}</span>
                  {b && <span className={`block font-pixel text-sm ${b.missed.length ? 'text-risk' : 'text-right'}`}>{t(b.missed.length ? S.missedN(b.missed.length) : S.noMiss)}</span>}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ================= 合言葉ノート =================
export function Notebook({ save, onBack }: { save: SaveData; onBack: () => void }) {
  const t = useT()
  return (
    <div className="min-h-full px-4 py-6">
      <div className="mx-auto max-w-2xl">
        <button className="btn-dark text-base" onClick={onBack}>
          ◀ {t(S.back)}
        </button>
        <h1 className="mt-4 text-3xl text-safety">{t(S.notebook)}</h1>
        <div className="mt-4 grid gap-3">
          {DAYS.map((d) => {
            const b = save.best[d.id]
            return (
              <div key={d.id} className="paper p-3">
                <div className="text-sm text-ink2">{t(S.dayPlace(t(d.dayName), b ? t(d.place) : '？'))}</div>
                {b ? (
                  <>
                    <div className="mt-1 font-pixel text-xl leading-snug">{t(S.quote(t(d.motto)))}</div>
                    <p className="mt-1 text-base leading-relaxed text-ink2">{t(d.idea)}</p>
                    {d.real.url && (
                      <div className="mt-2 border-t-2 border-dashed border-paperLine pt-2">
                        <div className="font-pixel text-sm text-hint">{t(S.real)}</div>
                        <div className="text-base font-bold leading-snug">{t(d.real.head)}</div>
                        <p className="text-base leading-relaxed">{t(d.real.body)}</p>
                        <a className="text-sm text-hint underline" href={d.real.url} target="_blank" rel="noreferrer">
                          {t(S.kv(t(S.source), d.real.source))} ({host(d.real.url)})
                        </a>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="mt-1 text-lg text-ink2">{t(S.locked)}</div>
                )}
              </div>
            )
          })}
        </div>
        <p className="mt-4 text-center text-sm text-onDark2">{t(S.endingsSeen(save.endings.length))}</p>
      </div>
    </div>
  )
}

// ================= 結末 =================
export function EndingView({ id, week, save, onTitle }: { id: EndingId; week: WeekResults; save: SaveData; onTitle: () => void }) {
  const t = useT()
  const e = ENDINGS[id]
  const [n, setN] = useState(0)
  useEffect(() => {
    if (n > e.lines.length) return
    const tm = window.setTimeout(() => setN((v) => v + 1), n === 0 ? 700 : 1500)
    return () => clearTimeout(tm)
  }, [n, e.lines.length])
  useEffect(() => {
    if (id === 'bad') sfx.lose()
    else sfx.win()
  }, [id])
  const done = n > e.lines.length
  return (
    <div className="min-h-full px-4 pb-10 pt-6" onClick={() => !done && setN(e.lines.length + 1)}>
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center gap-2">
          <span className="stripes h-3 w-8" aria-hidden />
          <span className="font-pixel text-base text-safety">{t(S.ending)}</span>
        </div>
        <h1 className="mt-2 text-4xl leading-tight sm:text-5xl">{t(e.title)}</h1>
        <div className="paper mt-5 grid gap-4 p-4">
          {e.lines.slice(0, n).map((l, i) => (
            <div key={i} className="rise flex items-start gap-3">
              {FACE[l.who] && <Art id={FACE[l.who]} scale={1.5} className="mt-1" />}
              <p className={`text-lg leading-relaxed ${l.who === 'SYS' ? 'text-ink2' : ''}`}>{t(l.t)}</p>
            </div>
          ))}
          {!done && <p className="blink text-sm text-ink2">▼</p>}
        </div>
        {done && (
          <div className="rise mt-5 grid gap-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="paper p-3">
                <div className="text-sm text-ink2">{t(S.week)}</div>
                <div className="font-pixel text-xl">{t(S.missedTotal(missedTotal(week)))}</div>
              </div>
              <div className="paper p-3">
                <div className="text-sm text-ink2">{t(S.bonusMark)}</div>
                <div className="font-pixel text-xl">{plain(t(S.bonusTotal(bonusTotal(week))))}</div>
              </div>
            </div>
            <ol className="grid gap-1">
              {DAYS.map((d) => {
                const r = week[d.id]
                return (
                  <li key={d.id} className="flex justify-between bg-asphalt2 px-3 py-1.5 text-base">
                    <span>{t(d.dayName)}</span>
                    <span className={r && r.missed.length ? 'text-[#ff8a7a]' : 'text-[#7ee0a1]'}>{r ? t(r.missed.length ? S.missedN(r.missed.length) : S.noMiss) : '—'}</span>
                  </li>
                )
              })}
            </ol>
            {id !== 'best' && <p className="text-base text-onDark2">{t(S.endingRule)}</p>}
            <p className="text-center text-sm text-onDark2">{t(S.endingsSeen(save.endings.length))}</p>
            <button data-to-title className="btn-main w-full text-lg" onClick={onTitle}>
              {t(S.toTitle)}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
