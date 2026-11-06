// 合言葉ノート・学び方のしくみ・設定・あそびかた
import { useEffect, useRef, useState } from 'react'
import { CASES } from '../game/cases'
import { ALL_QUESTIONS, LESSONS } from '../game/course'
import { BADGES, type Progress } from '../game/learn'
import { PRINCIPLES } from '../game/science'
import type { Lang } from '../game/types'
import { getAI } from '../lib/ai'
import { sfx, type Settings } from '../lib/platform'
import { Art } from './Art'
import { BackButton, LangToggle, Sheet } from './Common'
import { useT } from './i18n'
import { BADGE_TEXT, S } from './strings'

/** AIが使えるか（claude.ai で開いた時だけ） */
function useHasAI() {
  const [ai, setAi] = useState(false)
  useEffect(() => {
    let alive = true
    void getAI().then((a) => alive && setAi(!!a))
    return () => {
      alive = false
    }
  }, [])
  return ai
}

const host = (u: string) => {
  try {
    return new URL(u).hostname.replace(/^www\./, '')
  } catch {
    return u
  }
}

function Page({ title, lead, lang, setLang, onBack, children }: { title: string; lead?: string; lang: Lang; setLang: (l: Lang) => void; onBack: () => void; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh px-4 pb-12 pt-3 sm:px-6">
      <header className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between gap-3">
          <BackButton onClick={onBack} />
          <LangToggle lang={lang} onChange={setLang} />
        </div>
        <h1 className="mt-3 text-3xl">{title}</h1>
        {lead && <p className="mt-1 text-base text-ink2">{lead}</p>}
      </header>
      <div className="mx-auto mt-5 grid max-w-2xl gap-6">{children}</div>
    </div>
  )
}

/** 守ること（青い指示の印つき） */
function Rule({ text, dim }: { text: string; dim?: boolean }) {
  return (
    <span className="flex items-start gap-2.5">
      <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-base font-bold text-surface ${dim ? 'bg-hair' : 'bg-rule'}`} aria-hidden>
        !
      </span>
      <span className={`phrase text-lg font-bold leading-snug ${dim ? 'text-ink2' : ''}`}>{text}</span>
    </span>
  )
}

// ================= 見回りノート =================
export function Notebook({ progress, lang, setLang, onBack }: { progress: Progress; lang: Lang; setLang: (l: Lang) => void; onBack: () => void }) {
  const t = useT()
  const ai = useHasAI()
  // 答えたことのある問題
  const seen = new Set(Object.keys(progress.cards))
  const caseIds = [...new Set(ALL_QUESTIONS.filter((q) => q.real && seen.has(q.id)).map((q) => q.real!))]
  return (
    <Page title={t(S.notebook)} lead={t(S.stats(progress.answered, progress.correct))} lang={lang} setLang={setLang} onBack={onBack}>
      <section className="grid gap-2">
        <h2 className="text-lg">{t(S.mottos)}</h2>
        <ol className="panel divide-y-2 divide-hair p-0">
          {LESSONS.map((l) => {
            const done = !!progress.lessons[l.id]?.done
            const tips = l.questions.filter((q) => seen.has(q.id))
            return (
              <li key={l.id} className="grid gap-2 px-4 py-3">
                <span className="text-sm text-ink2">{t(S.dayPlace(t(l.dayName), t(l.title)))}</span>
                <Rule text={done ? t(l.motto) : t(S.notYet)} dim={!done} />
                {tips.length > 0 ? (
                  <ul className="grid gap-1 pl-[2.375rem]">
                    {tips.map((q) => (
                      <li key={q.id} className="phrase flex gap-2 text-base leading-snug">
                        <span aria-hidden className="text-ink2">
                          ・
                        </span>
                        <span>{t(q.tip)}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            )
          })}
        </ol>
      </section>
      <section className="grid gap-2">
        <h2 className="text-lg">{t(S.badges)}</h2>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {BADGES.filter((b) => b !== 'askAI' || ai || progress.badges.includes(b)).map((b) => {
            const got = progress.badges.includes(b)
            return (
              <li key={b} className={`panel p-3 ${got ? '' : 'border-hair'}`}>
                <Art id={got ? 'icon.star' : 'icon.lock'} scale={2} className={got ? '' : 'opacity-50'} />
                <div className={`mt-1 font-bold leading-snug ${got ? '' : 'text-ink2'}`}>{t(BADGE_TEXT[b].name)}</div>
                <div className="text-sm leading-snug text-ink2">{t(BADGE_TEXT[b].how)}</div>
              </li>
            )
          })}
        </ul>
      </section>
      {caseIds.length > 0 && (
        <section className="grid gap-2">
          <h2 className="text-lg">{t(S.cases)}</h2>
          {caseIds.map((id) => {
            const c = CASES[id]
            return c ? (
              <article key={id} className="panel p-4">
                <h3 className="text-lg leading-snug">{t(c.head)}</h3>
                <div className="text-sm text-ink2">{t(S.list2(t(c.who), t(c.when)))}</div>
                <p className="mt-1 text-base leading-relaxed">{t(c.body)}</p>
                <a className="mt-1 inline-flex min-h-11 items-center text-sm text-rule underline" href={c.url} target="_blank" rel="noreferrer">
                  {t(S.kv(t(S.source), c.source))} ({host(c.url)})
                </a>
              </article>
            ) : null
          })}
        </section>
      )}
    </Page>
  )
}

// ================= 学び方のしくみ =================
export function Science({ lang, setLang, onBack }: { lang: Lang; setLang: (l: Lang) => void; onBack: () => void }) {
  const t = useT()
  const ai = useHasAI()
  return (
    <Page title={t(S.science)} lead={t(S.scienceIntro)} lang={lang} setLang={setLang} onBack={onBack}>
      <div className="grid gap-3">
        {PRINCIPLES.filter((pr) => ai || !pr.needsAI).map((pr) => (
          <article key={pr.id} className="panel p-4 sm:p-5">
            <h2 className="text-xl">{t(pr.name)}</h2>
            <p className="mt-1 text-lg leading-relaxed">{t(pr.what)}</p>
            <div className="mt-3 rounded-lg bg-surface2 px-3 py-2">
              <div className="text-sm font-bold text-ink2">{t(S.scienceHere)}</div>
              <p className="text-base leading-relaxed">
                {t(pr.here)}
                {ai && pr.hereAI ? t(pr.hereAI) : null}
              </p>
            </div>
            {pr.refs.length > 0 && (
              <details className="mt-2 text-sm text-ink2">
                <summary className="flex min-h-11 cursor-pointer items-center font-bold">{t(S.sourcesN(pr.refs.length))}</summary>
                <ul className="grid gap-1 pb-1">
                  {pr.refs.map((r, k) => (
                    <li key={k} lang="en" className="break-words">
                      <a className="inline-flex min-h-11 items-center py-1 text-rule underline" href={r.url} target="_blank" rel="noreferrer">
                        {r.cite}
                      </a>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </article>
        ))}
      </div>
    </Page>
  )
}

// ================= 設定 =================
export function SettingsSheet({ s, set, onReset, onAbout, onClose }: { s: Settings; set: (s: Settings) => void; onReset: () => void; onAbout: () => void; onClose: () => void }) {
  const t = useT()
  const [confirm, setConfirm] = useState(false)
  const row = (label: Parameters<typeof t>[0], value: Parameters<typeof t>[0], onClick: () => void) => (
    <button className="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-2 text-left text-lg hover:bg-surface2" onClick={() => (sfx.ui(), onClick())}>
      <span>{t(label)}</span>
      <span className="rounded-md border-2 border-edge px-2.5 py-0.5 text-base font-bold">{t(value)}</span>
    </button>
  )
  if (confirm)
    return (
      <Sheet label={t.attr(S.resetSure)} onClose={() => setConfirm(false)}>
        <div className="grid gap-4 p-5">
          <div>
            <h2 className="text-2xl">{t(S.resetSure)}</h2>
            <p className="mt-1 text-base text-ink2">{t(S.resetWhy)}</p>
          </div>
          {/* 消すボタンは上に。もとの「記録を消す」と同じ場所には「やめる」を置き、続けて押しても消えないように */}
          <button data-reset-go className="min-h-12 rounded-lg border-2 border-ng bg-ng px-4 text-lg font-bold text-surface" onClick={() => (onReset(), setConfirm(false))}>
            {t(S.resetGo)}
          </button>
          <button className="btn-main w-full text-lg" autoFocus onClick={() => (sfx.ui(), setConfirm(false))}>
            {t(S.cancel)}
          </button>
        </div>
      </Sheet>
    )
  return (
    <Sheet label={t.attr(S.settings)} onClose={onClose}>
      <div className="grid gap-4 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl">{t(S.settings)}</h2>
          <button className="btn min-h-11 px-3 text-base" onClick={onClose}>
            {t(S.close)}
          </button>
        </div>
        <div className="rows divide-y-2 divide-hair overflow-hidden rounded-xl border-2 border-line">
          <div className="flex min-h-14 items-center justify-between gap-3 px-4 py-2 text-lg">
            <span>{t(S.language)}</span>
            <LangToggle lang={s.lang} onChange={(lang) => set({ ...s, lang })} />
          </div>
          {row(S.sound, s.sound ? S.on : S.off, () => set({ ...s, sound: !s.sound }))}
          {row(S.music, s.music ? S.on : S.off, () => set({ ...s, music: !s.music }))}
          {row(S.textSpeed, S.speeds[s.textSpeed], () => set({ ...s, textSpeed: s.textSpeed === 'normal' ? 'fast' : s.textSpeed === 'fast' ? 'instant' : 'normal' }))}
          <div>
            <button data-about className="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-2 text-left text-lg hover:bg-surface2" onClick={() => (sfx.ui(), onAbout())}>
              <span>{t(S.aboutLearning)}</span>
              <span aria-hidden className="text-ink2">
                →
              </span>
            </button>
          </div>
        </div>
        <button data-reset className="min-h-12 rounded-lg border-2 border-ng bg-surface px-4 text-lg font-bold text-ng" onClick={() => (sfx.ui(), setConfirm(true))}>
          {t(S.reset)}
        </button>
      </div>
    </Sheet>
  )
}

// ================= あそびかた =================
export function HowtoSheet({ onAbout, onClose }: { onAbout: () => void; onClose: () => void }) {
  const t = useT()
  const btn = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    btn.current?.focus({ preventScroll: true })
  }, [])
  const step = 'flex items-center gap-3 px-3 py-3'
  const tile = 'flex h-11 shrink-0 items-center justify-center rounded-lg border-2 border-line bg-surface'
  return (
    <Sheet label={t.attr(S.howto)} onClose={onClose}>
      <div className="flex max-h-[88dvh] flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto p-5 pb-3">
          <h2 className="text-2xl">{t(S.howto)}</h2>
          <ol className="mt-3 divide-y-2 divide-hair overflow-hidden rounded-xl border-2 border-line">
            <li className={step}>
              <span className="flex w-[5.5rem] shrink-0 justify-center gap-1" aria-hidden>
                <span className={`${tile} w-10 text-2xl text-ink`}>○</span>
                <span className={`${tile} w-10 text-2xl text-ink`}>✕</span>
              </span>
              <p className="text-lg font-bold leading-snug">{t(S.howto1)}</p>
            </li>
            <li className={step}>
              <span className={`${tile} w-[5.5rem] gap-1 border-ok bg-okBg text-base font-bold text-ok`} aria-hidden>
                {t(S.right)}
              </span>
              <p className="text-lg font-bold leading-snug">{t(S.howto2)}</p>
            </li>
            <li className={step}>
              <span className={`${tile} w-[5.5rem]`} aria-hidden>
                <Art id="icon.review" scale={2.5} />
              </span>
              <p className="text-lg font-bold leading-snug">{t(S.howto3)}</p>
            </li>
            <li className={step}>
              <span className={`${tile} w-[5.5rem] font-pixel text-base`} aria-hidden>
                {t.lang === 'ja' ? '1・3・7日' : '1, 3, 7'}
              </span>
              <p className="text-lg font-bold leading-snug">{t(S.howto4)}</p>
            </li>
          </ol>
          <button data-about className="btn-quiet mt-2 px-1 text-base text-rule underline" onClick={() => (sfx.ui(), onAbout())}>
            {t(S.aboutLearning)}
          </button>
        </div>
        <div className="border-t-2 border-hair p-5 pt-3">
          <button ref={btn} className="btn-main w-full text-xl" onClick={() => (sfx.ui(), onClose())}>
            {t(S.gotIt)}
          </button>
        </div>
      </div>
    </Sheet>
  )
}
