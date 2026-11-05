// 合言葉ノート・学び方のわけ・設定・あそびかた
import { useEffect, useRef, useState } from 'react'
import { CASES } from '../game/cases'
import { ALL_QUESTIONS, LESSONS } from '../game/course'
import { BADGES, type Progress } from '../game/learn'
import { PRINCIPLES } from '../game/science'
import type { Lang } from '../game/types'
import { sfx, type Settings } from '../lib/platform'
import { Art } from './Art'
import { BackButton, LangToggle, Sheet } from './Common'
import { useT } from './i18n'
import { BADGE_TEXT, S } from './strings'

const host = (u: string) => {
  try {
    return new URL(u).hostname.replace(/^www\./, '')
  } catch {
    return u
  }
}

function Page({ title, lang, setLang, onBack, children }: { title: string; lang: Lang; setLang: (l: Lang) => void; onBack: () => void; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh px-4 pb-10 pt-3 sm:px-6">
      <header className="mx-auto flex max-w-2xl items-center gap-3">
        <BackButton onClick={onBack} />
        <h1 className="min-w-0 flex-1 truncate text-2xl text-safety">{title}</h1>
        <LangToggle lang={lang} onChange={setLang} />
      </header>
      <div className="mx-auto mt-4 grid max-w-2xl gap-4">{children}</div>
    </div>
  )
}

// ================= 合言葉ノート =================
export function Notebook({ progress, lang, setLang, onBack }: { progress: Progress; lang: Lang; setLang: (l: Lang) => void; onBack: () => void }) {
  const t = useT()
  // 答えたことのある問題につながる、実際の話
  const seen = new Set(Object.keys(progress.cards))
  const caseIds = [...new Set(ALL_QUESTIONS.filter((q) => q.real && seen.has(q.id)).map((q) => q.real!))]
  return (
    <Page title={t(S.notebook)} lang={lang} setLang={setLang} onBack={onBack}>
      <p className="text-center text-base text-onDark2">{t(S.stats(progress.answered, progress.correct))}</p>
      <section className="grid gap-2">
        <h2 className="text-lg text-onDark2">{t(S.mottos)}</h2>
        {LESSONS.map((l) => {
          const done = !!progress.lessons[l.id]?.done
          return (
            <div key={l.id} className="paper flex items-center gap-3 rounded-2xl p-3">
              <Art id={l.icon} scale={2} className={done ? '' : 'opacity-40 grayscale'} />
              <div className="min-w-0">
                <div className="text-sm text-ink2">{t(S.dayPlace(t(l.dayName), t(l.place)))}</div>
                <div className={`font-pixel text-lg leading-snug ${done ? '' : 'text-ink2'}`}>{done ? t(S.quote(t(l.motto))) : t(S.notYet)}</div>
              </div>
            </div>
          )
        })}
      </section>
      <section className="grid gap-2">
        <h2 className="text-lg text-onDark2">{t(S.badges)}</h2>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {BADGES.map((b) => {
            const got = progress.badges.includes(b)
            return (
              <li key={b} className={`paper rounded-2xl p-3 ${got ? '' : 'opacity-55'}`}>
                <Art id={got ? 'icon.star' : 'icon.lock'} scale={2} />
                <div className="mt-1 font-bold leading-snug">{t(BADGE_TEXT[b].name)}</div>
                <div className="text-sm leading-snug text-ink2">{t(BADGE_TEXT[b].how)}</div>
              </li>
            )
          })}
        </ul>
      </section>
      {caseIds.length > 0 && (
        <section className="grid gap-2">
          <h2 className="text-lg text-onDark2">{t(S.cases)}</h2>
          {caseIds.map((id) => {
            const c = CASES[id]
            return c ? (
              <div key={id} className="paper rounded-2xl p-3">
                <div className="text-lg font-bold leading-snug">{t(c.head)}</div>
                <div className="text-sm text-ink2">{t(S.list2(t(c.who), t(c.when)))}</div>
                <p className="mt-1 text-base leading-relaxed">{t(c.body)}</p>
                <a className="text-sm text-hint underline" href={c.url} target="_blank" rel="noreferrer">
                  {t(S.kv(t(S.source), c.source))} ({host(c.url)})
                </a>
              </div>
            ) : null
          })}
        </section>
      )}
    </Page>
  )
}

// ================= 学び方のわけ =================
export function Science({ lang, setLang, onBack }: { lang: Lang; setLang: (l: Lang) => void; onBack: () => void }) {
  const t = useT()
  return (
    <Page title={t(S.science)} lang={lang} setLang={setLang} onBack={onBack}>
      <p className="paper rounded-2xl p-3 text-lg leading-relaxed">{t(S.scienceIntro)}</p>
      {PRINCIPLES.map((pr, i) => (
        <div key={pr.id} className="paper rounded-2xl p-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink font-pixel text-paper">{i + 1}</span>
            <h2 className="text-xl text-ink">{t(pr.name)}</h2>
          </div>
          <p className="mt-2 text-lg leading-relaxed">{t(pr.what)}</p>
          <p className="mt-2 rounded-xl bg-paper2 px-3 py-2 text-base leading-relaxed">
            <b>{t(S.scienceHere)}</b>　{t(pr.here)}
          </p>
          {pr.refs.length > 0 && (
            <ul className="mt-2 grid gap-1 text-sm text-ink2">
              {pr.refs.map((r, k) => (
                <li key={k}>
                  <a className="text-hint underline" href={r.url} target="_blank" rel="noreferrer">
                    {r.cite}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </Page>
  )
}

// ================= 設定 =================
export function SettingsSheet({ s, set, onReset, onClose }: { s: Settings; set: (s: Settings) => void; onReset: () => void; onClose: () => void }) {
  const t = useT()
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    if (!armed) return
    const tm = window.setTimeout(() => setArmed(false), 3000)
    return () => clearTimeout(tm)
  }, [armed])
  const row = (label: Parameters<typeof t>[0], value: Parameters<typeof t>[0], onClick: () => void) => (
    <button className="flex min-h-12 w-full items-center justify-between rounded-xl bg-paper2 px-4 py-2 text-lg" onClick={() => (sfx.ui(), onClick())}>
      <span>{t(label)}</span>
      <span className="font-bold text-hint">{t(value)}</span>
    </button>
  )
  return (
    <Sheet label={t(S.settings)} onClose={onClose}>
      <div className="grid gap-2 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl text-ink">{t(S.settings)}</h2>
          <button className="btn min-h-11 px-3 text-base" onClick={onClose}>
            {t(S.close)}
          </button>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-paper2 px-4 py-2 text-lg">
          <span>{t(S.language)}</span>
          <LangToggle lang={s.lang} onChange={(lang) => set({ ...s, lang })} />
        </div>
        {row(S.sound, s.sound ? S.on : S.off, () => set({ ...s, sound: !s.sound }))}
        {row(S.music, s.music ? S.on : S.off, () => set({ ...s, music: !s.music }))}
        {row(S.textSpeed, S.speeds[s.textSpeed], () => set({ ...s, textSpeed: s.textSpeed === 'normal' ? 'fast' : s.textSpeed === 'fast' ? 'instant' : 'normal' }))}
        <button className={`mt-2 min-h-12 rounded-xl px-4 text-lg ${armed ? 'bg-risk text-white' : 'bg-paper2 text-risk'}`} onClick={() => (armed ? (onReset(), setArmed(false)) : setArmed(true))}>
          {t(armed ? S.resetSure : S.reset)}
        </button>
      </div>
    </Sheet>
  )
}

// ================= あそびかた =================
export function HowtoSheet({ onClose }: { onClose: () => void }) {
  const t = useT()
  const btn = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    btn.current?.focus({ preventScroll: true })
  }, [])
  return (
    <Sheet label={t(S.howto)} onClose={onClose}>
      <div className="grid gap-3 p-5">
        <h2 className="text-2xl text-ink">{t(S.howto)}</h2>
        <ol className="grid gap-2">
          <li className="flex items-center gap-3 rounded-xl bg-paper2 p-3">
            <span className="flex shrink-0 gap-1">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-paper text-3xl text-[#1f7a46]" style={{ boxShadow: '0 0 0 2px #1d1f24' }}>○</span>
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-paper text-3xl text-[#b52a2a]" style={{ boxShadow: '0 0 0 2px #1d1f24' }}>✕</span>
            </span>
            <p className="text-lg font-bold leading-snug">{t(S.howto1)}</p>
          </li>
          <li className="flex items-center gap-3 rounded-xl bg-paper2 p-3">
            <span className="flex h-12 w-24 shrink-0 items-center justify-center rounded-xl bg-[#c9f0d6] font-pixel text-xl text-[#1f7a46]" style={{ boxShadow: '0 0 0 2px #1d1f24' }}>
              ○ !
            </span>
            <p className="text-lg font-bold leading-snug">{t(S.howto2)}</p>
          </li>
          <li className="flex items-center gap-3 rounded-xl bg-paper2 p-3">
            <span className="flex h-12 w-24 shrink-0 items-center justify-center rounded-xl bg-paper" style={{ boxShadow: '0 0 0 2px #1d1f24' }}>
              <Art id="icon.review" scale={3} />
            </span>
            <p className="text-lg font-bold leading-snug">{t(S.howto3)}</p>
          </li>
        </ol>
        <button ref={btn} className="btn-main w-full text-xl" onClick={() => (sfx.ui(), onClose())}>
          {t(S.gotIt)}
        </button>
      </div>
    </Sheet>
  )
}
