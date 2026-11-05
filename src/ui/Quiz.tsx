// ============================================================
// 問題の画面（持ち主の絵のとおり）
//   左上：もどる、右上：English / 日本語
//   上：人（と場面の絵）→ 場面の文（2行）→「？」の問い → ○✕ か 1・2・3
//   答えると、下から「なぜ」が出る。まちがえた問題は、最後にもう一度
// ============================================================
import { useEffect, useMemo, useRef, useState } from 'react'
import { CASES } from '../game/cases'
import { answer, finished, isRight, next, startSession, type Session, type SessionKind } from '../game/learn'
import type { Lang, Question, TopicId } from '../game/types'
import { errorKind, getAI, tutorRules, type SampleFn } from '../lib/ai'
import { FAST, sfx } from '../lib/platform'
import { Art } from './Art'
import { BackButton, LangToggle, Sheet, useMedia } from './Common'
import { useT } from './i18n'
import { FACE, S, SPEAKER } from './strings'

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
  const [sheet, setSheet] = useState(false)
  const [combo, setCombo] = useState(0)
  const [gain, setGain] = useState(0)
  const doneRef = useRef(false)
  const ai = useAI()
  const tall = useMedia('(min-height: 760px)')
  const pc = useMedia('(min-width: 1024px)')
  const q = byId.get(s.queue[0])
  const again = !!q && s.firstTry[q.id] !== undefined && !s.answer
  const doneN = s.done.length

  useEffect(() => {
    if (finished(s) && !doneRef.current) {
      doneRef.current = true
      p.onDone(s)
    }
  })

  const pick = (i: number) => {
    if (!q || s.answer) return
    const ns = answer(s, q, i)
    setS(ns)
    setGain(ns.xp - s.xp)
    if (ns.answer?.ok) {
      sfx.right()
      if (ns.combo >= 3) {
        setCombo(ns.combo)
        window.setTimeout(() => sfx.bonus(), 160)
      }
    } else sfx.other()
    // 選んだ所の色を少し見せてから、説明を出す
    window.setTimeout(() => setSheet(true), 380)
  }
  const go = () => {
    sfx.ui()
    setSheet(false)
    setChat(false)
    setCombo(0)
    setS((v) => next(v))
  }

  // キー：1・2・3（○✕は 1・2 か O・X）、Enter で次へ
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat || chat || quit) return
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (!s.answer && q) {
        const n = q.kind === 'tf' ? { '1': 0, '2': 1, o: 0, x: 1, O: 0, X: 1 }[e.key] : { '1': 0, '2': 1, '3': 2 }[e.key]
        if (n !== undefined) pick(n)
      } else if (s.answer && sheet && (e.key === 'Enter' || e.code === 'Space')) {
        e.preventDefault()
        go()
      }
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  })

  if (!q) return <div className="min-h-dvh" />
  // 場面の絵があるスマホでは、顔を少し小さくして横に並べる
  const scale = pc ? 6 : tall && !q.pic ? 4 : 3
  const picScale = pc ? 6 : 3
  const picked = s.answer?.pick
  const ok = s.answer?.ok
  return (
    <div className="flex h-dvh flex-col">
      {/* 上の帯：もどる／進み具合／ことば */}
      <header className="flex items-center gap-3 px-3 pb-1 pt-2 sm:px-5">
        <BackButton onClick={() => setQuit(true)} />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center justify-between gap-2 text-sm text-onDark2">
            <span className="truncate">{p.title}</span>
            <span className="shrink-0 tabular-nums">{t(S.progress(Math.min(doneN + (s.answer?.ok ? 1 : 0), s.total), s.total))}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-asphalt3" role="progressbar" aria-valuemin={0} aria-valuemax={s.total} aria-valuenow={doneN}>
            <div className="h-full rounded-full bg-safety transition-[width] duration-300" style={{ width: `${(100 * (doneN + (s.answer?.ok ? 1 : 0))) / Math.max(1, s.total)}%` }} />
          </div>
        </div>
        <LangToggle lang={p.lang} onChange={p.setLang} />
      </header>

      <main className="mx-auto flex min-h-0 w-full max-w-xl flex-1 flex-col gap-3 overflow-y-auto px-4 pb-4 pt-2 lg:grid lg:max-w-6xl lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:content-center lg:items-center lg:gap-x-12 lg:px-10">
        {p.aiMade && <p className="rounded-lg bg-asphalt2 px-3 py-1.5 text-center text-sm text-onDark2 lg:col-span-2">{t(S.aiMade)}</p>}
        {/* 人と、場面の絵（PCでは左に大きく） */}
        <div key={q.id + String(s.firstTry[q.id])} className="pop flex min-h-0 items-end justify-center gap-3 lg:row-span-4 lg:flex-col lg:items-center lg:gap-4">
          <div className="rounded-2xl bg-paper2 p-1.5" style={{ boxShadow: '0 0 0 2px #1d1f24' }}>
            <Art id={FACE[q.who] ?? FACE.BOSS} scale={scale} />
          </div>
          {q.pic && (
            <div className="rounded-2xl bg-paper p-1.5" style={{ boxShadow: '0 0 0 2px #1d1f24' }}>
              <Art id={q.pic} scale={picScale} />
            </div>
          )}
        </div>
        {/* 場面（2行ほど） */}
        <div className="text-center lg:text-left">
          {again && <span className="mb-1 inline-block rounded-full bg-other px-2.5 py-0.5 text-sm font-bold text-white">↺ {t(S.againWhy)}</span>}
          <div className="text-sm text-onDark2">{t(SPEAKER[q.who])}</div>
          <p className="text-lg leading-relaxed lg:text-2xl">{t(q.situation)}</p>
        </div>
        {/* 「？」の問い */}
        <div className="flex items-start gap-3 rounded-xl bg-paper px-4 py-3 text-ink" style={{ boxShadow: '0 0 0 2px #1d1f24, 0 4px 0 rgba(0,0,0,.35)' }}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink font-pixel text-xl text-safety" aria-hidden>
            ?
          </span>
          <p className="pt-0.5 text-lg font-bold leading-snug lg:text-2xl">{t(q.ask)}</p>
        </div>
        {combo >= 3 && !sheet && <div className="pop text-center font-pixel text-lg text-safety">{t(S.combo(combo))}</div>}

        {/* 答え */}
        {q.kind === 'tf' ? (
          <div className="grid grid-cols-2 gap-3">
            {[0, 1].map((i) => {
              const state = picked === undefined ? 'idle' : isRight(q, i) ? 'right' : picked === i ? 'wrong' : 'dim'
              return (
                <button
                  key={i}
                  data-answer={i}
                  data-correct={FAST ? String(isRight(q, i)) : undefined}
                  disabled={!!s.answer}
                  onClick={() => pick(i)}
                  className={`flex aspect-[4/3] max-h-44 w-full flex-col items-center justify-center rounded-2xl text-ink transition ${state === 'right' ? 'bg-[#c9f0d6]' : state === 'wrong' ? 'bg-[#f7c9c9]' : 'bg-paper'} ${state === 'dim' ? 'opacity-50' : ''}`}
                  style={{ boxShadow: `0 0 0 ${state === 'right' || state === 'wrong' ? 4 : 2}px ${state === 'right' ? 'var(--color-right)' : state === 'wrong' ? 'var(--color-risk)' : '#1d1f24'}, 0 5px 0 #1d1f24` }}
                  aria-label={i === 0 ? `○ ${t(S.yesWord)}` : `✕ ${t(S.noWord)}`}
                >
                  <span className={`text-6xl leading-none sm:text-7xl ${i === 0 ? 'text-[#1f7a46]' : 'text-[#b52a2a]'}`} aria-hidden>
                    {i === 0 ? '○' : '✕'}
                  </span>
                  {p.lang === 'en' && <span className="mt-1 text-base font-bold">{i === 0 ? 'Yes' : 'No'}</span>}
                </button>
              )
            })}
          </div>
        ) : (
          <div className="grid gap-2.5">
            {q.choices.map((c, i) => {
              const state = picked === undefined ? 'idle' : i === q.correct ? 'right' : picked === i ? 'wrong' : 'dim'
              return (
                <button
                  key={i}
                  data-answer={i}
                  data-correct={FAST ? String(i === q.correct) : undefined}
                  disabled={!!s.answer}
                  onClick={() => pick(i)}
                  className={`flex min-h-14 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-lg leading-snug text-ink transition ${state === 'right' ? 'bg-[#c9f0d6]' : state === 'wrong' ? 'bg-[#f7c9c9]' : 'bg-paper'} ${state === 'dim' ? 'opacity-50' : ''}`}
                  style={{ boxShadow: `0 0 0 ${state === 'right' || state === 'wrong' ? 4 : 2}px ${state === 'right' ? 'var(--color-right)' : state === 'wrong' ? 'var(--color-risk)' : '#1d1f24'}, 0 4px 0 #1d1f24` }}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink text-lg font-bold text-paper" aria-hidden>
                    {i + 1}
                  </span>
                  <span className="min-w-0 lg:text-xl">{t(c)}</span>
                </button>
              )
            })}
          </div>
        )}
      </main>

      {/* 答えたあと：なぜ */}
      {s.answer && sheet && !chat && <Feedback q={q} pick={picked!} ok={!!ok} lastOne={s.queue.length === 1 && !!ok} gained={gain} ai={ai} onAsk={() => setChat(true)} onNext={go} />}
      {s.answer && chat && ai && (
        <AiChat
          q={q}
          pick={picked!}
          lang={p.lang}
          ai={ai}
          onAsked={p.onAsked}
          onClose={() => setChat(false)}
        />
      )}
      {quit && (
        <Sheet label={t(S.quitSure)} onClose={() => setQuit(false)}>
          <div className="grid gap-3 p-5">
            <p className="text-lg font-bold">{t(S.quitSure)}</p>
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
function Feedback({ q, pick, ok, lastOne, gained, ai, onAsk, onNext }: { q: Question; pick: number; ok: boolean; lastOne: boolean; gained: number; ai: SampleFn | null | undefined; onAsk: () => void; onNext: () => void }) {
  const t = useT()
  const [more, setMore] = useState(false)
  const [real, setReal] = useState(false)
  const btn = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    btn.current?.focus({ preventScroll: true })
  }, [])
  // まちがえた時は、その答えを選んだ人への言葉を先に。ふつうの「なぜ」は「くわしく」の中
  const wrongWhy = !ok ? (q.kind === 'tf' ? q.wrongWhy : q.wrongWhy[pick]) : null
  const answerText = q.kind === 'tf' ? (q.answer ? `○ ${t(S.yesWord)}` : `✕ ${t(S.noWord)}`) : `${q.correct + 1}. ${t(q.choices[q.correct])}`
  const rc = q.real ? CASES[q.real] : undefined
  return (
    <Sheet label={t(ok ? S.right : S.wrong)} tone={ok ? 'right' : 'wrong'}>
      <div className={`flex items-center justify-between gap-3 px-5 py-3 ${ok ? 'bg-[#c9f0d6]' : 'bg-[#f7d4cf]'}`}>
        <div className={`font-pixel text-2xl ${ok ? 'text-[#1f7a46]' : 'text-[#b52a2a]'}`}>{ok ? `○ ${t(S.right)}` : `✕ ${t(S.wrong)}`}</div>
        {gained > 0 && (
          <div className="pop flex items-center gap-1 font-pixel text-xl text-[#8a6a00]">
            <Art id="icon.star" scale={2} />
            {t(S.plusPoints(gained))}
          </div>
        )}
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 px-5 pb-3 pt-3">
        <div className="flex items-start gap-3">
          <div className="shrink-0 rounded-xl bg-paper2 p-1" style={{ boxShadow: '0 0 0 2px #1d1f24' }} aria-hidden>
            <Art id={ok ? 'face.boss_happy' : 'face.boss_worry'} scale={2} />
          </div>
          <div className="min-w-0 text-lg leading-relaxed" role="status" aria-live="polite">
            {!ok && <p className="font-bold">{t(S.answerIs(answerText))}</p>}
            <p>{t(wrongWhy ?? q.why)}</p>
            {!ok && more && <p className="rise mt-1 text-ink2">{t(q.why)}</p>}
          </div>
        </div>
        <div className="rounded-xl bg-safety px-4 py-2.5 text-ink" style={{ boxShadow: '0 0 0 2px #1d1f24' }}>
          <span className="mr-2 font-pixel text-sm">{t(S.remember)}</span>
          <span className="text-lg font-bold">{t(q.tip)}</span>
        </div>
        {rc && real && (
          <div className="rise rounded-xl bg-paper2 p-3" style={{ boxShadow: '0 0 0 2px #1d1f24' }}>
            <div className="text-lg font-bold leading-snug">{t(rc.head)}</div>
            <div className="text-sm text-ink2">{t(S.list2(t(rc.who), t(rc.when)))}</div>
            <p className="mt-1 text-base leading-relaxed">{t(rc.body)}</p>
            <a className="mt-1 block text-sm text-hint underline" href={rc.url} target="_blank" rel="noreferrer">
              {t(S.kv(t(S.source), rc.source))}
            </a>
          </div>
        )}
      </div>
      {/* 下：小さなボタンと「つぎへ」（いつも見える） */}
      <div className="sticky bottom-0 grid gap-2 border-t-2 border-paperLine bg-paper px-5 pb-4 pt-3">
        <div className="flex flex-wrap gap-2">
          {!ok && (
            <button className="btn min-h-11 flex-1 px-3 text-base" aria-expanded={more} onClick={() => (sfx.ui(), setMore((v) => !v))}>
              {more ? '▲' : '▼'} {t(S.more)}
            </button>
          )}
          {rc && (
            <button className="btn min-h-11 flex-1 px-3 text-base" aria-expanded={real} onClick={() => (sfx.ui(), setReal((v) => !v))}>
              {real ? '▲' : '▼'} {t(S.realCase)}
            </button>
          )}
          {ai && (
            <button data-ask-ai className="btn min-h-11 flex-1 px-3 text-base" onClick={() => (sfx.ui(), onAsk())}>
              <Art id="icon.ai" scale={1.5} />
              {t(S.askAI)}
            </button>
          )}
        </div>
        <button ref={btn} data-next className="btn-main w-full text-xl" onClick={onNext}>
          {t(lastOne ? S.finish : S.next)} ▶
        </button>
      </div>
    </Sheet>
  )
}

// ------------------------------------------------------------
// AIの宮下さん：その問題について、何でも聞ける（短く答える）
function AiChat({ q, pick, lang, ai, onAsked, onClose }: { q: Question; pick: number; lang: Lang; ai: SampleFn; onAsked: () => void; onClose: () => void }) {
  const t = useT()
  const [turns, setTurns] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const [live, setLive] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [off, setOff] = useState(false)
  const [text, setText] = useState('')
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

  return (
    <Sheet label={t(S.aiTitle)} onClose={onClose}>
      <div className="flex items-center justify-between gap-3 border-b-2 border-paperLine px-5 py-3">
        <div className="flex items-center gap-2">
          <Art id="face.boss" scale={1.5} />
          <span className="font-pixel text-xl">{t(S.aiTitle)}</span>
        </div>
        <button className="btn min-h-11 px-3 text-base" onClick={() => (sfx.ui(), onClose())}>
          {t(S.close)}
        </button>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 px-5 py-4">
        <p className="text-sm text-ink2">{t(S.aiNote)}</p>
        {turns.map((m, i) => (
          <div key={i} className={`max-w-[88%] whitespace-pre-wrap break-words rounded-xl px-3 py-2 text-lg leading-relaxed ${m.role === 'user' ? 'justify-self-end bg-hint text-white' : 'justify-self-start bg-paper2'}`} style={m.role === 'user' ? undefined : { boxShadow: '0 0 0 2px #1d1f24' }}>
            {m.content}
          </div>
        ))}
        {busy && (
          <div className="max-w-[88%] justify-self-start whitespace-pre-wrap rounded-xl bg-paper2 px-3 py-2 text-lg leading-relaxed" style={{ boxShadow: '0 0 0 2px #1d1f24' }} aria-live="polite">
            {live || <span className="blink">{t(S.aiThinking)}</span>}
          </div>
        )}
        {err && <p className="rounded-lg bg-[#f7d4cf] px-3 py-2 text-base text-[#8a1f1f]">{err}</p>}
        {!off && turns.length === 0 && !busy && (
          <div className="flex flex-wrap gap-2">
            {S.aiChips.map((c, i) => (
              <button key={i} data-ai-chip={i} className="btn min-h-11 rounded-full px-3 text-base" onClick={() => void ask(t(c))}>
                {t(c)}
              </button>
            ))}
          </div>
        )}
        {!off && (
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              void ask(text)
            }}
          >
            <input value={text} onChange={(e) => setText(e.target.value)} maxLength={300} placeholder={t(S.aiPlaceholder)} className="min-h-12 min-w-0 flex-1 rounded-xl bg-white px-3 text-lg text-ink" style={{ boxShadow: '0 0 0 2px #1d1f24' }} aria-label={t(S.aiPlaceholder)} disabled={busy} />
            {busy ? (
              <button type="button" className="btn text-base" onClick={() => ctl.current?.abort()}>
                {t(S.aiStop)}
              </button>
            ) : (
              <button type="submit" className="btn-main text-base" disabled={!text.trim()}>
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
