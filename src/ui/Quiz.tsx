// ============================================================
// 問題の画面（持ち主の下書きのとおり）
//   左上：もどる、右上：English / 日本語
//   上：話す人と場面の絵 → 工事黒板に場面の文 →「？」の問い → ○✕ か 1・2・3
//   答えると、選んだ答えを残したまま、その下に「なぜ」が出る。次へは画面の下にいつも
//   まちがえた問題は、最後にもう一度
// ============================================================
import { useEffect, useMemo, useRef, useState } from 'react'
import { CASES } from '../game/cases'
import { lessonOf } from '../game/course'
import { answer, finished, isRight, next, startSession, type Session, type SessionKind } from '../game/learn'
import type { Lang, Question, TopicId } from '../game/types'
import { errorKind, getAI, tutorRules, type SampleFn } from '../lib/ai'
import { FAST, sfx } from '../lib/platform'
import { Art } from './Art'
import { BackButton, LangToggle, Sheet, useMedia } from './Common'
import { useT } from './i18n'
import { FACE, S, SPEAKER } from './strings'

type Mark = 'idle' | 'right' | 'wrong' | 'dim'

export function Quiz(p: {
  kind: SessionKind
  lesson?: TopicId
  title: string
  questions: Question[]
  lang: Lang
  setLang: (l: Lang) => void
  /** AIが作った問題の時は true（上に注意書きを出す） */
  aiMade?: boolean
  onDone: (s: Session) => void
  onQuit: () => void
  onAsked: () => void
}) {
  const t = useT()
  const byId = useMemo(() => new Map(p.questions.map((q) => [q.id, q])), [p.questions])
  const [s, setS] = useState<Session>(() => startSession(p.kind, p.questions.map((q) => q.id), p.lesson))
  const [quit, setQuit] = useState(false)
  const [chat, setChat] = useState(false)
  const [fb, setFb] = useState(false)
  const [combo, setCombo] = useState(0)
  const [gain, setGain] = useState(0)
  const doneRef = useRef(false)
  const mainRef = useRef<HTMLElement>(null)
  const fbRef = useRef<HTMLElement>(null)
  const ai = useAI()
  const pc = useMedia('(min-width: 1024px)')
  // 高さの足りないスマホでは、人と絵を少し小さくして、答えまで1画面に入れる
  const low = useMedia('(max-height: 720px)')
  const q = byId.get(s.queue[0])
  const again = !!q && s.firstTry[q.id] !== undefined && !s.answer
  const doneN = s.done.length + (s.answer?.ok ? 1 : 0)

  useEffect(() => {
    if (finished(s) && !doneRef.current) {
      doneRef.current = true
      p.onDone(s)
    }
  })
  // 説明が出たら、見える所まで送る
  useEffect(() => {
    if (!fb) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('reduce-motion')
    fbRef.current?.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' })
  }, [fb])

  const pick = (i: number) => {
    if (!q || s.answer) return
    const ns = answer(s, q, i)
    setS(ns)
    setGain(ns.xp - s.xp)
    setCombo(ns.answer?.ok ? ns.combo : 0)
    if (ns.answer?.ok) {
      sfx.right()
      if (ns.combo >= 3) window.setTimeout(() => sfx.bonus(), 160)
    } else sfx.other()
    // 選んだ所の色を少し見せてから、説明を出す
    window.setTimeout(() => setFb(true), 320)
  }
  const go = () => {
    sfx.ui()
    setFb(false)
    setChat(false)
    setS((v) => next(v))
    mainRef.current?.scrollTo({ top: 0 })
  }

  // キー：1・2・3（○✕は 1・2 か O・X）、Enter で次へ
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat || chat || quit) return
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (!s.answer && q) {
        const n = q.kind === 'tf' ? { '1': 0, '2': 1, o: 0, x: 1, O: 0, X: 1 }[e.key] : { '1': 0, '2': 1, '3': 2 }[e.key]
        if (n !== undefined) pick(n)
      } else if (s.answer && fb && e.key === 'Enter') {
        e.preventDefault()
        go()
      }
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  })

  if (!q) return <div className="min-h-dvh" />
  const picked = s.answer?.pick
  const ok = !!s.answer?.ok
  const mark = (i: number): Mark => (picked === undefined ? 'idle' : isRight(q, i) ? 'right' : picked === i ? 'wrong' : 'dim')
  const place = lessonOf(q.topic)?.place
  const lastOne = s.queue.length === 1 && ok

  return (
    <div className="flex h-dvh flex-col">
      {/* 上の帯：もどる／進み具合／ことば */}
      <header className="flex items-center gap-3 border-b-2 border-hair px-3 py-2 sm:px-5">
        <BackButton onClick={() => setQuit(true)} />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-baseline justify-between gap-2 text-sm text-ink2">
            <span className="truncate">
              {/* スマホでは曜日だけ（場所まで入れると切れるため） */}
              <span className="sm:hidden">{p.kind === 'lesson' && p.lesson ? t(lessonOf(p.lesson).dayName) : p.title}</span>
              <span className="hidden sm:inline">{p.title}</span>
            </span>
            <span className="shrink-0 font-bold tabular-nums text-ink">{t(S.progress(Math.min(doneN, s.total), s.total))}</span>
          </div>
          <div className="h-3.5 overflow-hidden rounded-full border-2 border-line bg-surface" role="progressbar" aria-valuemin={0} aria-valuemax={s.total} aria-valuenow={doneN}>
            <div className="tape h-full transition-[width] duration-300" style={{ width: `${(100 * doneN) / Math.max(1, s.total)}%` }} />
          </div>
        </div>
        <LangToggle lang={p.lang} onChange={p.setLang} />
      </header>

      <main ref={mainRef} className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto grid w-full max-w-xl gap-3 px-4 pb-6 pt-3 sm:gap-4 short:max-w-4xl short:grid-cols-[minmax(0,0.55fr)_minmax(0,1.45fr)] short:items-start short:gap-x-6 lg:max-w-6xl lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start lg:gap-x-12 lg:px-10 lg:pt-10">
          {/* 話す人と、場面の絵（PCでは左に大きく） */}
          <div key={q.id + String(s.firstTry[q.id])} className="flex items-end justify-center gap-3 short:sticky short:top-0 short:flex-col short:items-center lg:sticky lg:top-0 lg:flex-col lg:items-center lg:gap-5">
            <div className="overflow-hidden rounded-xl border-2 border-line bg-surface2">
              <Art id={FACE[q.who] ?? FACE.BOSS} scale={pc ? 5 : low ? 2.5 : 3} />
            </div>
            {q.pic && (
              <div className="overflow-hidden rounded-xl border-2 border-line bg-surface">
                <Art id={q.pic} scale={pc ? 6 : low ? 2.5 : 3} />
              </div>
            )}
          </div>

          <div className="grid content-start gap-4">
            {(p.aiMade || again) && (
              <div className="flex flex-wrap gap-2">
                {p.aiMade && <span className="rounded-md border-2 border-line bg-surface px-2 py-0.5 text-sm">{t(S.aiMade)}</span>}
                {again && <span className="rounded-md bg-ink px-2 py-0.5 text-sm font-bold text-surface">↺ {t(S.againWhy)}</span>}
              </div>
            )}
            {/* 工事黒板：場面 */}
            <div className="board px-4 py-2.5 sm:px-5 sm:py-4">
              {/* 黒板の上の欄：だれの話か／どこか（現場写真の黒板の「工事名・場所」のように） */}
              <div className="flex flex-wrap justify-between gap-x-3 font-pixel text-sm text-chalk2">
                <span>{t(SPEAKER[q.who])}</span>
                {place && <span>{t(place)}</span>}
              </div>
              <p className="mt-1 text-[1.0625rem] leading-relaxed sm:text-lg lg:text-2xl lg:leading-relaxed">{t(q.situation)}</p>
            </div>
            {/* 「？」の問い（答えのボタンとは形を変える） */}
            <div className="flex items-start gap-3 rounded-lg border-l-8 border-act bg-actBg py-2 pl-3 pr-4 lg:py-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-line bg-act font-pixel text-lg text-actInk" aria-hidden>
                ?
              </span>
              <h2 className="text-xl leading-snug lg:text-3xl lg:leading-snug">{t(q.ask)}</h2>
            </div>

            {/* 答え */}
            {q.kind === 'tf' ? (
              <div className="grid grid-cols-2 gap-3">
                {[0, 1].map((i) => (
                  <Choice key={i} i={i} mark={mark(i)} disabled={!!s.answer} onPick={pick} correct={isRight(q, i)} label={i === 0 ? `○ ${t(S.yesWord)}` : `✕ ${t(S.noWord)}`}>
                    <span className="grid justify-items-center py-3 lg:py-5">
                      <span className={`text-6xl leading-none lg:text-7xl ${i === 0 ? 'text-ok' : 'text-ng'}`} aria-hidden>
                        {i === 0 ? '○' : '✕'}
                      </span>
                      <span className="mt-2 text-base font-bold">{t(i === 0 ? S.yesWord : S.noWord)}</span>
                    </span>
                  </Choice>
                ))}
              </div>
            ) : (
              <div className="grid gap-3">
                {q.choices.map((c, i) => (
                  <Choice key={i} i={i} mark={mark(i)} disabled={!!s.answer} onPick={pick} correct={i === q.correct}>
                    <span className="flex w-full items-center gap-3 px-3 py-2.5 text-left">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-ink text-lg font-bold text-surface" aria-hidden>
                        {i + 1}
                      </span>
                      <span className="min-w-0 flex-1 text-lg leading-snug lg:text-xl">{t(c)}</span>
                    </span>
                  </Choice>
                ))}
              </div>
            )}

            {/* 答えたあと：なぜ（選んだ答えの下に） */}
            {s.answer && fb && <Feedback ref={fbRef} q={q} pick={picked!} ok={ok} gained={gain} combo={combo} ai={ai} onAsk={() => setChat(true)} />}
          </div>
        </div>
      </main>

      {/* 下：次へ（答えたあと、いつも見える所に） */}
      {s.answer && fb && (
        <footer className="border-t-2 border-hair bg-bg px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <div className="mx-auto flex max-w-xl justify-end lg:max-w-6xl lg:px-6">
            <button data-next autoFocus className="btn-main w-full text-xl lg:w-[22rem]" onClick={go}>
              {t(lastOne ? S.finish : S.next)}
            </button>
          </div>
        </footer>
      )}

      {s.answer && chat && ai && <AiChat q={q} pick={picked!} lang={p.lang} ai={ai} onAsked={p.onAsked} onClose={() => setChat(false)} />}
      {quit && (
        <Sheet label={t(S.quitSure)} onClose={() => setQuit(false)}>
          <div className="grid gap-4 p-5">
            <div>
              <p className="text-xl font-bold">{t(S.quitSure)}</p>
              <p className="mt-1 text-base text-ink2">{t(S.quitWhy)}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button className="btn-main text-lg" onClick={() => setQuit(false)} autoFocus>
                {t(S.keepGoing)}
              </button>
              <button className="btn text-lg" onClick={p.onQuit}>
                {t(S.quit)}
              </button>
            </div>
          </div>
        </Sheet>
      )}
    </div>
  )
}

/** 答えのボタン：答える前は押せる形、答えたあとは ✓ と ✕ の印 */
function Choice({ i, mark, disabled, onPick, correct, label, children }: { i: number; mark: Mark; disabled: boolean; onPick: (i: number) => void; correct: boolean; label?: string; children: React.ReactNode }) {
  const t = useT()
  const look =
    mark === 'right'
      ? 'border-ok bg-okBg shadow-[0_0_0_2px_var(--color-ok)]'
      : mark === 'wrong'
        ? 'border-ng bg-ngBg shadow-[0_0_0_2px_var(--color-ng)]'
        : mark === 'dim'
          ? 'border-hair bg-surface opacity-55'
          : 'border-line bg-surface shadow-[0_4px_0_0_var(--color-line)] hover:bg-surface2 active:translate-y-[3px] active:shadow-[0_1px_0_0_var(--color-line)]'
  return (
    <button data-answer={i} data-correct={FAST ? String(correct) : undefined} disabled={disabled} onClick={() => onPick(i)} aria-label={label} className={`relative flex min-h-14 w-full items-center justify-center rounded-lg border-2 text-ink transition-[transform,box-shadow,background-color] duration-75 disabled:cursor-default ${look}`}>
      {children}
      {(mark === 'right' || mark === 'wrong') && (
        <span className={`pop absolute -right-2 -top-2 flex h-8 min-w-8 items-center justify-center rounded-full border-2 border-line px-1.5 text-sm font-bold text-surface ${mark === 'right' ? 'bg-ok' : 'bg-ng'}`}>
          <span aria-hidden>{mark === 'right' ? '✓' : '✕'}</span>
          <span className="sr-only">{t(mark === 'right' ? S.right : S.wrong)}</span>
        </span>
      )}
    </button>
  )
}

/** AIが使えるか（null = 使えない、undefined = 調べている） */
function useAI(): SampleFn | null | undefined {
  const [ai, setAi] = useState<SampleFn | null | undefined>(undefined)
  useEffect(() => {
    let alive = true
    // 関数をそのまま setAi に渡すと、React が「更新の関数」として呼んでしまうので包む
    void getAI().then((a) => alive && setAi(() => a))
    return () => {
      alive = false
    }
  }, [])
  return ai
}

// ------------------------------------------------------------
// 答えたあと：結果、選んだ答えへの言葉、覚えること（青い「守ること」の印）
function Feedback({ ref, q, pick, ok, gained, combo, ai, onAsk }: { ref: React.Ref<HTMLElement>; q: Question; pick: number; ok: boolean; gained: number; combo: number; ai: SampleFn | null | undefined; onAsk: () => void }) {
  const t = useT()
  const [more, setMore] = useState(false)
  const [real, setReal] = useState(false)
  // まちがえた時は、その答えを選んだ人への言葉を先に。ふつうの「なぜ」は「くわしく」の中
  const wrongWhy = !ok ? (q.kind === 'tf' ? q.wrongWhy : q.wrongWhy[pick]) : null
  const answerText = q.kind === 'tf' ? (q.answer ? `○ ${t(S.yesWord)}` : `✕ ${t(S.noWord)}`) : `${q.correct + 1} ${t(q.choices[q.correct])}`
  const rc = q.real ? CASES[q.real] : undefined
  return (
    <section ref={ref} className="rise panel scroll-mt-3 overflow-hidden" role="status" aria-live="polite">
      <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 border-b-2 border-line px-4 py-2 ${ok ? 'bg-okBg' : 'bg-ngBg'}`}>
        <span className="overflow-hidden rounded-lg border-2 border-line bg-surface2" aria-hidden>
          <Art id={ok ? 'face.boss_happy' : 'face.boss_worry'} scale={1.5} />
        </span>
        <span className={`text-2xl font-bold ${ok ? 'text-ok' : 'text-ng'}`}>{t(ok ? S.right : S.wrong)}</span>
        {combo >= 3 && <span className="rounded-md bg-ink px-2 py-0.5 text-sm font-bold text-surface">{t(S.combo(combo))}</span>}
        {gained > 0 && (
          <span className="pop ml-auto flex items-center gap-1 font-pixel text-xl">
            <Art id="icon.star" scale={1.5} />
            {t(S.plusPoints(gained))}
          </span>
        )}
      </div>
      <div className="grid gap-3 px-4 py-4">
        {!ok && <p className="text-base font-bold">{t(S.answerIs(answerText))}</p>}
        <p className="text-lg leading-relaxed">{t(wrongWhy ?? q.why)}</p>
        {!ok && more && <p className="rise text-base leading-relaxed text-ink2">{t(q.why)}</p>}
        {/* 覚えること：青い丸は「こうする」の印（安全標識の指示の色） */}
        <div className="flex items-start gap-3 rounded-lg border-2 border-rule bg-ruleBg px-3 py-2.5">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rule text-lg font-bold text-surface" aria-hidden>
            !
          </span>
          <div className="min-w-0">
            <div className="text-sm font-bold text-rule">{t(S.remember)}</div>
            <div className="text-lg font-bold leading-snug">{t(q.tip)}</div>
          </div>
        </div>
        {rc && real && (
          <div className="rise rounded-lg border-2 border-hair bg-surface2 p-3">
            <div className="text-lg font-bold leading-snug">{t(rc.head)}</div>
            <div className="text-sm text-ink2">{t(S.list2(t(rc.who), t(rc.when)))}</div>
            <p className="mt-1 text-base leading-relaxed">{t(rc.body)}</p>
            <a className="mt-1 inline-block text-sm text-rule underline" href={rc.url} target="_blank" rel="noreferrer">
              {t(S.kv(t(S.source), rc.source))}
            </a>
          </div>
        )}
        {(!ok || rc || ai) && (
          <div className="flex flex-wrap gap-2">
            {!ok && (
              <button className="chip" aria-expanded={more} onClick={() => (sfx.ui(), setMore((v) => !v))}>
                {t(S.more)}
              </button>
            )}
            {rc && (
              <button className="chip" aria-expanded={real} onClick={() => (sfx.ui(), setReal((v) => !v))}>
                {t(S.realCase)}
              </button>
            )}
            {ai && (
              <button data-ask-ai className="chip" onClick={() => (sfx.ui(), onAsk())}>
                <Art id="icon.ai" scale={1.5} />
                {t(S.askAI)}
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

// ------------------------------------------------------------
// AIの宮下さん：その問題について、何でも聞ける（短く答える）。自分の考えを言って、見てもらうこともできる
function AiChat({ q, pick, lang, ai, onAsked, onClose }: { q: Question; pick: number; lang: Lang; ai: SampleFn; onAsked: () => void; onClose: () => void }) {
  const t = useT()
  const [turns, setTurns] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const [live, setLive] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [off, setOff] = useState(false)
  const [text, setText] = useState('')
  const [explain, setExplain] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const ctl = useRef<AbortController | null>(null)
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => () => ctl.current?.abort(), [])
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' })
  }, [turns, live, busy])

  const ask = async (msg: string) => {
    const m = msg.trim()
    if (!m || busy || off) return
    const history = [...turns, { role: 'user' as const, content: m }].slice(-8)
    setTurns(history)
    setText('')
    setErr(null)
    setBusy(true)
    setLive('')
    ctl.current = new AbortController()
    onAsked()
    try {
      const { text: reply } = await ai([{ role: 'user', content: tutorRules(q, pick, lang) }, ...history], {
        modelTier: 'quick',
        cache: false,
        signal: ctl.current.signal,
        onText: ({ text: tx }) => setLive(tx),
      })
      setTurns((v) => [...v, { role: 'assistant', content: reply }])
    } catch (e) {
      const kind = errorKind(e)
      const partial = (e as { text?: string })?.text
      if (partial) setTurns((v) => [...v, { role: 'assistant', content: partial }])
      if (kind === 'off') {
        setOff(true)
        setErr(t(S.aiNotAllowed))
      } else if (kind === 'busy') setErr(t(S.aiBusy))
      else if (kind === 'failed') setErr(t(S.aiFailed))
    } finally {
      setBusy(false)
      setLive('')
    }
  }

  // 自分で書いた文とAIの答えは、文節の目印がないので、どこで折り返してもよいことにする
  const bubble = 'max-w-[88%] whitespace-pre-wrap break-words rounded-xl px-3 py-2 text-lg leading-relaxed [word-break:normal]'
  return (
    <Sheet label={t(S.aiTitle)} onClose={onClose}>
      <div className="flex items-center justify-between gap-3 border-b-2 border-hair px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="overflow-hidden rounded-lg border-2 border-line bg-surface2">
            <Art id="face.boss" scale={1.5} />
          </span>
          <span className="text-xl font-bold">{t(S.aiTitle)}</span>
        </div>
        <button className="btn min-h-11 px-3 text-base" onClick={() => (sfx.ui(), onClose())}>
          {t(S.close)}
        </button>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 px-5 py-4">
        <p className="text-sm text-ink2">{t(S.aiNote)}</p>
        {turns.map((m, i) => (
          <div key={i} className={`${bubble} ${m.role === 'user' ? 'justify-self-end bg-ink text-surface' : 'justify-self-start border-2 border-hair bg-surface2'}`}>
            {m.content}
          </div>
        ))}
        {busy && (
          <div className={`${bubble} justify-self-start border-2 border-hair bg-surface2`} aria-live="polite">
            {live || <span className="blink">{t(S.aiThinking)}</span>}
          </div>
        )}
        {err && <p className="rounded-lg border-2 border-ng bg-ngBg px-3 py-2 text-base">{err}</p>}
        {!off && turns.length === 0 && !busy && (
          <div className="flex flex-wrap gap-2">
            {/* 自分でわけを言ってみる（自己説明）。送るのは自分の言葉だけ */}
            <button
              data-ai-explain
              aria-pressed={explain}
              className="btn min-h-11 rounded-full px-3 text-base"
              onClick={() => {
                sfx.ui()
                setExplain(true)
                input.current?.focus()
              }}
            >
              ✎ {t(S.aiExplain)}
            </button>
            {S.aiChips.map((c, i) => (
              <button key={i} data-ai-chip={i} className="btn min-h-11 rounded-full px-3 text-base font-normal" onClick={() => void ask(t(c))}>
                {t(c)}
              </button>
            ))}
          </div>
        )}
        {!off && explain && turns.length === 0 && !busy && <p className="rounded-lg bg-ruleBg px-3 py-2 text-base">{t(S.aiExplainHow)}</p>}
        {!off && (
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              void ask(text)
            }}
          >
            <input ref={input} value={text} onChange={(e) => setText(e.target.value)} maxLength={300} placeholder={t(explain && turns.length === 0 ? S.aiExplainHint : S.aiPlaceholder)} className="min-h-12 min-w-0 flex-1 rounded-lg border-2 border-line bg-surface px-3 text-lg text-ink placeholder:text-ink2" aria-label={t(S.aiPlaceholder)} disabled={busy} />
            {busy ? (
              <button type="button" className="btn text-base" onClick={() => ctl.current?.abort()}>
                {t(S.aiStop)}
              </button>
            ) : (
              <button type="submit" className="btn-main min-h-12 text-base" disabled={!text.trim()}>
                {t(S.aiSend)}
              </button>
            )}
          </form>
        )}
        <div ref={end} />
      </div>
    </Sheet>
  )
}
