// ============================================================
// 問題の画面（持ち主の下書きのとおり）
//   左上：もどる、右上：English / 日本語
//   上：その場にいる人と場面の絵 → 工事黒板に場面の文 →「？」の問い → ○✕ か 1・2・3
//   答えが画面に入りきらない時は、人と絵を小さくし、それでも入らなければ絵を黒板の中に入れる
//   答えると：スマホでは下から説明が出て、問いと印のついた答えはその上に見えたまま。PCでは答えの下に
//   まちがえた問題は、最後にもう一度（その時は答えの並びを入れかえる）
// ============================================================
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { CASES } from '../game/cases'
import { lessonOf } from '../game/course'
import { answer, finished, isRight, next, shuffle, startSession, type Session, type SessionKind } from '../game/learn'
import type { Lang, Question, TopicId } from '../game/types'
import { errorKind, getAI, tutorRules, type SampleFn } from '../lib/ai'
import { FAST, sfx } from '../lib/platform'
import { Art } from './Art'
import { BackButton, Panel, Sheet, useMedia } from './Common'
import { useT } from './i18n'
import { FACE, S } from './strings'

type Mark = 'idle' | 'right' | 'wrong' | 'dim'
type Detail = 'more' | 'real' | 'ai'

/** 文字列から決まった数（答えの並びの入れかえ用） */
const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)

export function Quiz(p: {
  kind: SessionKind
  lesson?: TopicId
  title: string
  questions: Question[]
  lang: Lang
  setLang: (l: Lang) => void
  /** AIが作った問題の時は true（上に注意書きを出す） */
  aiMade?: boolean
  /** 答えの並びを1回目から入れかえる（復習・まとめテスト・2回目のレッスン） */
  mix?: boolean
  /** 途中から（保存してあった時） */
  resume?: Session
  /** 答えるたびに呼ぶ（途中で切れても続きからできるように） */
  onSave?: (s: Session) => void
  onDone: (s: Session) => void
  onQuit: () => void
  onAsked: () => void
}) {
  const t = useT()
  const byId = useMemo(() => new Map(p.questions.map((q) => [q.id, q])), [p.questions])
  const [s, setS] = useState<Session>(() => {
    const r = p.resume
    // 説明を見ている途中で切れていたら、次の問題から
    if (r) return r.answer ? next(r) : r
    return startSession(
      p.kind,
      p.questions.map((q) => q.id),
      p.lesson,
    )
  })
  const [quit, setQuit] = useState(false)
  /** 開いている読む板（正解のわけ・実際にあった話・AIの宮下さん） */
  const [detail, setDetail] = useState<Detail | null>(null)
  const chat = detail !== null
  const closeDetail = useCallback(() => setDetail(null), [])
  const [fb, setFb] = useState(false)
  const [combo, setCombo] = useState(0)
  const [gain, setGain] = useState(0)
  /** 画面に入れるための詰め方（0：ふつう、1：人と絵を小さく、2：絵を黒板の中に、3：文字も少し小さく） */
  const [dense, setDense] = useState(0)
  const [sheetH, setSheetH] = useState(0)
  const doneRef = useRef(false)
  /** 問題が出た時刻（指で「次へ」を2回押した時に、次の問題の答えまで押してしまわないように） */
  const shownAt = useRef(0)
  const touch = useRef(false)
  useEffect(() => {
    const on = (e: PointerEvent) => (touch.current = e.pointerType === 'touch')
    window.addEventListener('pointerdown', on, { capture: true })
    return () => window.removeEventListener('pointerdown', on, { capture: true })
  }, [])
  const mainRef = useRef<HTMLElement>(null)
  const answersRef = useRef<HTMLDivElement>(null)
  const fbRef = useRef<HTMLElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const ai = useAI()
  const pc = useMedia('(min-width: 1024px)')
  // 横向きのスマホ：左に絵と黒板、右に問いと答え
  const landRaw = useMedia('(max-height: 500px)')
  const land = landRaw && !pc
  const q = byId.get(s.queue[0])
  const retry = !!q && s.firstTry[q.id] !== undefined
  const again = retry && !s.answer
  const cleared = s.done.length + (s.answer?.ok ? 1 : 0)
  const left = s.queue.length - (s.answer?.ok ? 1 : 0)

  // 答えの並び（画面の順 → もとの番号）。まちがえて戻ってきた時と、mix の時は入れかえる
  //   答えたあとも同じ並びのままにするため、その問題が出た時に1回だけ決める
  const occ = q ? `${q.id}|${s.done.length}|${s.queue.length}` : ''
  const orderRef = useRef<{ key: string; order: number[] } | null>(null)
  if (q && orderRef.current?.key !== occ) {
    let o = [0, 1, 2]
    if (q.kind === 'mc' && (p.mix || retry)) {
      o = shuffle([0, 1, 2], hash(q.id) + (retry ? 101 : 0) + s.total)
      // 入れかえても同じ並びになった時は、1つずらす
      if (o.every((v, i) => v === i)) o = [1, 2, 0]
    }
    orderRef.current = { key: occ, order: o }
  }
  const order = orderRef.current?.order ?? [0, 1, 2]

  useEffect(() => {
    if (finished(s) && !doneRef.current) {
      doneRef.current = true
      p.onDone(s)
    }
  })

  // 問題が変わったら、まずふつうの大きさで並べてみる
  useLayoutEffect(() => {
    setDense(0)
  }, [occ, pc])
  // 答えの最後が画面の下にはみ出していたら、1段ずつ詰める（描く前に決めるので、ちらつかない）
  useLayoutEffect(() => {
    if (pc || fb || dense >= 4) return
    const main = mainRef.current
    const box = answersRef.current
    if (!main || !box) return
    if (box.getBoundingClientRect().bottom > main.getBoundingClientRect().bottom - 8) setDense((d) => d + 1)
  })
  useEffect(() => {
    const on = () => setDense(0)
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])

  // スマホ：説明の板の高さだけ下をあけ、印のついた答えが板のすぐ上に見えるようにする
  useLayoutEffect(() => {
    if (!fb || pc || land) {
      setSheetH(0)
      return
    }
    const el = sheetRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setSheetH(el.getBoundingClientRect().height))
    ro.observe(el)
    return () => ro.disconnect()
  }, [fb, pc, land])
  useEffect(() => {
    if (!fb) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('reduce-motion')
    const behavior: ScrollBehavior = reduce ? 'auto' : 'smooth'
    const main = mainRef.current
    // scrollIntoView は、新しいブラウザでは Promise を返すので、そのまま return しない
    // PC と横向きのスマホは、説明が左の列に出るので、動かさない
    if (pc || land) return
    const box = answersRef.current
    if (!main || !box || !sheetH) return
    // 答えのいちばん下が、説明の板の上の端に来るように
    const top = box.offsetTop + box.offsetHeight - (main.clientHeight - sheetH) + 12
    main.scrollTo({ top: Math.max(0, top), behavior })
  }, [fb, pc, sheetH])

  const pick = (orig: number) => {
    if (!q || s.answer) return
    if (touch.current && performance.now() - shownAt.current < 350) return
    const ns = answer(s, q, orig)
    setS(ns)
    p.onSave?.(ns)
    setGain(ns.xp - s.xp)
    setCombo(ns.answer?.ok ? ns.combo : 0)
    if (ns.answer?.ok) {
      sfx.right()
      if (ns.combo >= 3) window.setTimeout(() => sfx.bonus(), 160)
    } else sfx.other()
    // 選んだ所の印を少し見せてから、説明を出す
    window.setTimeout(() => setFb(true), 280)
  }
  const go = () => {
    shownAt.current = performance.now()
    sfx.ui()
    setFb(false)
    setDetail(null)
    const n = next(s)
    setS(n)
    if (!finished(n)) p.onSave?.(n)
    mainRef.current?.scrollTo({ top: 0 })
  }

  // キー：1・2・3（○✕は 1・2 か O・X）、Enter で次へ
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat || chat || quit) return
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (!s.answer && q) {
        const n = q.kind === 'tf' ? { '1': 0, '2': 1, o: 0, x: 1, O: 0, X: 1 }[e.key] : { '1': 0, '2': 1, '3': 2 }[e.key]
        if (n !== undefined) {
          touch.current = false
          pick(q.kind === 'tf' ? n : order[n])
        }
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
  const mark = (orig: number): Mark => (picked === undefined ? 'idle' : isRight(q, orig) ? 'right' : picked === orig ? 'wrong' : 'dim')
  const place = q.place ?? lessonOf(q.topic)?.place
  const lastOne = s.queue.length === 1 && ok
  const showStage = pc || land || dense < 2
  /** 答えたあと、説明を左の列に出すか（PC と横向きのスマホ）。右の問いと答えは動かさない */
  const side = (pc || land) && !!s.answer && fb
  const small = dense >= 1 && !pc
  const tiny = dense >= 3 && !pc
  /** いちばん詰めた時（小さいスマホ）：場所の欄を出さず、すき間と答えの高さを少し小さく */
  const packed = dense >= 4 && !pc
  const board = (
    <div className={`board px-4 sm:px-5 ${packed ? 'py-2' : 'py-2.5 sm:py-4'}`}>
      {!showStage && q.pic && (
        <div className="float-right mb-1 ml-3 mt-1 overflow-hidden rounded-md border-2 border-board2 bg-surface" aria-hidden>
          <Art id={q.pic} scale={1.5} />
        </div>
      )}
      {place && !packed && (
        <div className="mb-1.5 inline-flex items-stretch overflow-hidden rounded-sm border-2 border-chalk2 font-pixel text-base text-chalk">
          <span className="border-r-2 border-chalk2 bg-chalk2/25 px-2">{t(S.placeLabel)}</span>
          <span className="px-2">{t(place)}</span>
        </div>
      )}
      <p className={`leading-relaxed ${tiny || land ? 'text-base' : 'text-[1.0625rem] sm:text-lg'} lg:text-2xl lg:leading-relaxed`}>{t(q.situation)}</p>
    </div>
  )
  const wrap = 'mx-auto w-full max-w-xl px-4 short:max-w-4xl lg:max-w-6xl lg:px-10'
  const nextBtn = (
    <button data-next autoFocus className="btn-main w-full text-xl" onClick={go}>
      {t(lastOne ? S.finish : S.next)}
    </button>
  )

  return (
    <div className="flex h-dvh flex-col">
      {/* 上の帯：もどる／進み具合／ことば（中身と同じ幅にそろえる） */}
      <header className="border-b-2 border-hair py-2">
        <div className={`${wrap} flex items-center gap-3`}>
          <BackButton onClick={() => setQuit(true)} />
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-baseline justify-between gap-2 text-sm text-ink2">
              <span className="truncate">{p.title}</span>
              <span className="shrink-0 font-bold tabular-nums text-ink">{t(S.left(Math.max(0, left)))}</span>
            </div>
            <div className="h-3.5 overflow-hidden rounded-full border-2 border-edge bg-surface" role="progressbar" aria-valuemin={0} aria-valuemax={s.total} aria-valuenow={cleared} aria-label={t.attr(S.left(Math.max(0, left)))}>
              <div className="tape h-full transition-[width] duration-300" style={{ width: `${(100 * cleared) / Math.max(1, s.total)}%` }} />
            </div>
          </div>
        </div>
      </header>

      <main ref={mainRef} className="min-h-0 flex-1 overflow-y-auto" style={sheetH ? { paddingBottom: sheetH } : undefined}>
        <div className={`${wrap} grid gap-3 pb-6 pt-3 sm:gap-4 ${side && land ? 'short:grid-cols-2' : 'short:grid-cols-[minmax(0,0.55fr)_minmax(0,1.45fr)]'} short:items-start short:gap-x-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start lg:gap-x-12 lg:pt-10`}>
          {/* その場にいる人と、場面の絵（PCでは左に大きく）。答えたあとは、PC と横向きのスマホでは、ここに説明と「次へ」を出す */}
          {side ? (
            <div data-side-feedback className="sticky top-0 grid min-h-0 min-w-0 max-h-[calc(100dvh-5.5rem)] grid-rows-[minmax(0,1fr)_auto] gap-2 lg:max-h-[calc(100dvh-8rem)] lg:gap-3">
              <div className="rise min-h-0 overflow-y-auto rounded-xl border-2 border-line bg-surface">
                <Feedback ref={fbRef} q={q} pick={picked!} ok={ok} gained={gain} combo={combo} ai={ai} onOpen={setDetail} sheet />
              </div>
              {nextBtn}
            </div>
          ) : (
            showStage && (
              <div key={occ} className="flex items-end justify-center gap-3 short:sticky short:top-0 short:flex-col short:items-center lg:sticky lg:top-0 lg:flex-col lg:items-center lg:gap-5">
                {!land && (
                  <div className="overflow-hidden rounded-xl border-2 border-line bg-surface2">
                    <Art id={FACE[q.who] ?? FACE.BOSS} scale={pc ? 5 : small ? 2 : 3} />
                  </div>
                )}
                {q.pic && (
                  <div className="overflow-hidden rounded-xl border-2 border-line bg-surface">
                    <Art id={q.pic} scale={pc ? 6 : land || small ? 2 : 3} />
                  </div>
                )}
                {land && board}
              </div>
            )
          )}

          <div className={`grid content-start ${packed ? 'gap-2' : 'gap-3 sm:gap-4'}`}>
            {(p.aiMade || again) && (
              <div className="flex flex-wrap gap-2">
                {p.aiMade && (
                  <p className="flex items-center gap-2 rounded-md bg-surface2 px-3 py-1.5 text-sm text-ink2">
                    <Art id="icon.ai" scale={1.5} />
                    {t(S.aiMade)}
                  </p>
                )}
                {again && <span className="rounded-md bg-ink px-2 py-0.5 text-sm font-bold text-surface">↺ {t(S.againWhy)}</span>}
              </div>
            )}
            {/* 工事黒板：場所の欄と、場面（横向きのスマホでは左の列に） */}
            {!land && board}
            {/* 「？」の問い（答えのボタンとは形を変える） */}
            <div className="flex items-start gap-3 rounded-lg border-l-8 border-act bg-actBg py-2 pl-3 pr-4 lg:py-3">
              {!tiny && (
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-line bg-act font-pixel text-lg text-actInk" aria-hidden>
                  ?
                </span>
              )}
              <h2 className={`${tiny ? 'text-lg' : 'text-xl'} leading-snug lg:text-3xl lg:leading-snug`}>{t(q.ask)}</h2>
            </div>

            {/* 答え */}
            <div ref={answersRef} className={`grid scroll-mt-3 ${packed ? 'gap-2' : 'gap-3'}`}>
              {q.kind === 'tf' ? (
                <div className="grid grid-cols-2 gap-3">
                  {[0, 1].map((i) => (
                    <Choice key={i} i={i} mark={mark(i)} disabled={!!s.answer} onPick={pick} correct={isRight(q, i)} compact={packed || land} label={t.attr(i === 0 ? `○ ${t(S.yesWord)}` : `✕ ${t(S.noWord)}`)}>
                      <span className={`grid justify-items-center ${packed || land ? 'py-1' : small ? 'py-1.5' : 'py-3'} lg:py-5`}>
                        <span className={`${packed || land ? 'text-4xl' : small ? 'text-5xl' : 'text-6xl'} leading-none text-ink lg:text-7xl`} aria-hidden>
                          {i === 0 ? '○' : '✕'}
                        </span>
                        <span className="mt-1.5 text-base font-bold">{t(i === 0 ? S.yesWord : S.noWord)}</span>
                      </span>
                    </Choice>
                  ))}
                </div>
              ) : (
                order.map((orig, d) => (
                  <Choice key={orig} i={orig} mark={mark(orig)} disabled={!!s.answer} onPick={pick} correct={orig === q.correct} compact={packed || land} hideDim={fb && !pc && !land}>
                    <span className={`flex w-full items-center gap-3 px-3 text-left ${packed || land ? 'py-1.5' : 'py-2.5'}`}>
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-ink text-lg font-bold text-surface" aria-hidden>
                        {d + 1}
                      </span>
                      <span className="min-w-0 flex-1 text-lg leading-snug lg:text-xl">{t(q.choices[orig])}</span>
                    </span>
                  </Choice>
                ))
              )}
            </div>

          </div>
        </div>
      </main>

      {/* スマホ：説明と次へを、下から出る板に（問いと答えは上に見えたまま） */}
      {s.answer && fb && !pc && !land && (
        <div ref={sheetRef} className="rise fixed inset-x-0 bottom-0 z-30 flex max-h-[60dvh] flex-col rounded-t-2xl border-t-2 border-line bg-surface shadow-[0_-6px_0_0_rgb(0_0_0/0.08)]">
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto max-w-xl short:max-w-4xl">
              <Feedback ref={fbRef} q={q} pick={picked!} ok={ok} gained={gain} combo={combo} ai={ai} onOpen={setDetail} sheet />
            </div>
          </div>
          <div className="border-t-2 border-hair px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
            <div className="mx-auto max-w-xl short:max-w-4xl">{nextBtn}</div>
          </div>
        </div>
      )}

      {s.answer && detail === 'ai' && ai && <AiChat q={q} pick={picked!} lang={p.lang} ai={ai} onAsked={p.onAsked} onClose={closeDetail} />}
      {s.answer && detail === 'more' && <MorePanel q={q} order={order} onClose={closeDetail} />}
      {s.answer && detail === 'real' && q.real && CASES[q.real] && <RealPanel rc={CASES[q.real]} onClose={closeDetail} />}
      {quit && (
        <Sheet label={t.attr(S.quitSure)} onClose={() => setQuit(false)}>
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

/** ✓ と ✕ の印（同じ太さの線で） */
function MarkIcon({ ok, className = 'h-4 w-4' }: { ok: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="square" aria-hidden>
      {ok ? <path d="M2.5 8.5 6.5 12.5 13.5 4" /> : <path d="M4 4l8 8M12 4l-8 8" />}
    </svg>
  )
}

/** 答えのボタン：答える前は押せる形、答えたあとは ✓ と ✕ の印 */
function Choice({ i, mark, disabled, onPick, correct, label, compact, hideDim, children }: { i: number; mark: Mark; disabled: boolean; onPick: (i: number) => void; correct: boolean; label?: string; compact?: boolean; hideDim?: boolean; children: React.ReactNode }) {
  const t = useT()
  const look = mark === 'right' ? 'border-ok bg-okBg shadow-[0_0_0_2px_var(--color-ok)]' : mark === 'wrong' ? 'border-ng bg-ngBg shadow-[0_0_0_2px_var(--color-ng)]' : mark === 'dim' ? `border-hair bg-surface opacity-55 ${hideDim ? 'hidden' : ''}` : 'border-edge bg-surface shadow-[0_4px_0_0_var(--color-edge)] hover:bg-surface2 active:translate-y-[3px] active:shadow-[0_1px_0_0_var(--color-edge)]'
  return (
    <button data-answer={i} data-correct={FAST ? String(correct) : undefined} disabled={disabled} onClick={() => onPick(i)} aria-label={label} className={`relative flex ${compact ? 'min-h-12' : 'min-h-14'} w-full items-center justify-center rounded-lg border-2 text-ink transition-[transform,box-shadow,background-color] duration-75 disabled:cursor-default ${look}`}>
      {children}
      {(mark === 'right' || mark === 'wrong') && (
        <span className={`pop absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-line text-surface ${mark === 'right' ? 'bg-ok' : 'bg-ng'}`}>
          <MarkIcon ok={mark === 'right'} />
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
function Feedback({ ref, q, pick, ok, gained, combo, ai, onOpen, sheet }: { ref: React.Ref<HTMLElement>; q: Question; pick: number; ok: boolean; gained: number; combo: number; ai: SampleFn | null | undefined; onOpen: (d: Detail) => void; sheet?: boolean }) {
  const t = useT()
  // まちがえた時は、その答えを選んだ人への言葉を先に。正解のわけは、押すと出る
  const wrongWhy = !ok ? (q.kind === 'tf' ? q.wrongWhy : q.wrongWhy[pick]) : null
  const rc = q.real ? CASES[q.real] : undefined
  return (
    <section ref={ref} className={`${sheet ? '' : 'rise panel overflow-hidden'} scroll-mt-3`} role="status" aria-live="polite">
      <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 ${sheet ? 'rounded-t-2xl' : 'border-b-2 border-line'} ${ok ? 'bg-okBg' : 'bg-ngBg'}`}>
        <span className="overflow-hidden rounded-lg border-2 border-line bg-surface2" aria-hidden>
          <Art id={ok ? 'face.boss_happy' : 'face.boss_worry'} scale={1.5} />
        </span>
        <span className={`flex items-center gap-1.5 text-2xl font-bold ${ok ? 'text-ok' : 'text-ng'}`}>
          <MarkIcon ok={ok} className="h-5 w-5" />
          {t(ok ? S.right : S.wrong)}
        </span>
        {combo >= 3 && <span className="rounded-md bg-ink px-2 py-0.5 text-sm font-bold text-surface">{t(S.combo(combo))}</span>}
        {gained > 0 && (
          <span className="pop ml-auto flex items-center gap-1 font-num text-xl">
            <Art id="icon.star" scale={1.5} />
            {t(S.plusPoints(gained))}
          </span>
        )}
      </div>
      <div className="grid gap-3 px-4 py-3">
        <p className="text-lg leading-relaxed">{t(wrongWhy ?? q.why)}</p>
        {/* 覚えること：青い丸は「こうする」の印（安全標識の指示の色）。スマホの板では、隠れないように先に */}
        <div className={`flex items-start gap-3 rounded-lg border-2 border-rule bg-ruleBg px-3 py-2.5 ${sheet ? '-order-1' : ''}`}>
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rule text-lg font-bold text-surface" aria-hidden>
            !
          </span>
          <div className="min-w-0">
            <div className="text-sm font-bold text-rule">{t(S.remember)}</div>
            <div className="phrase text-lg font-bold leading-snug">{t(q.tip)}</div>
          </div>
        </div>
        {/* もっと知りたい時のボタン。押すと、画面の上のほうまで大きな板が開く（説明の板はのびない） */}
        {(!ok || rc || ai) && (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(8.5rem,1fr))] gap-2">
            {!ok && (
              <button data-more className="btn min-h-12 px-3 text-base" onClick={() => (sfx.ui(), onOpen('more'))}>
                {t(S.more)}
              </button>
            )}
            {rc && (
              <button data-real className="btn min-h-12 px-3 text-base" onClick={() => (sfx.ui(), onOpen('real'))}>
                {t(S.realCase)}
              </button>
            )}
            {ai && (
              <button data-ask-ai className="btn min-h-12 px-3 text-base" onClick={() => (sfx.ui(), onOpen('ai'))}>
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

/** 正解のわけ（まちがえた時）：正しい答えと、そのわけ */
function MorePanel({ q, order, onClose }: { q: Question; order: number[]; onClose: () => void }) {
  const t = useT()
  const answerText = q.kind === 'tf' ? (q.answer ? `○ ${t(S.yesWord)}` : `✕ ${t(S.noWord)}`) : `${order.indexOf(q.correct) + 1} ${t(q.choices[q.correct])}`
  return (
    <Panel title={t.attr(S.more)} onClose={onClose} closeLabel={t.attr(S.close)} footer={<BackToAnswer onClick={onClose} />}>
      <div className="grid gap-3">
        <p className="phrase rounded-lg border-2 border-ok bg-okBg px-3 py-2 text-lg font-bold">{t(S.answerIs(answerText))}</p>
        <p className="text-lg leading-relaxed">{t(q.why)}</p>
      </div>
    </Panel>
  )
}

/** 実際にあった話：見出し、どこで・いつ、中身、出典 */
function RealPanel({ rc, onClose }: { rc: (typeof CASES)[string]; onClose: () => void }) {
  const t = useT()
  return (
    <Panel title={t.attr(S.realCase)} onClose={onClose} closeLabel={t.attr(S.close)} footer={<BackToAnswer onClick={onClose} />}>
      <div className="grid gap-2">
        <p className="phrase text-xl font-bold leading-snug">{t(rc.head)}</p>
        <p className="text-base text-ink2">{t(S.list2(t(rc.who), t(rc.when)))}</p>
        <p className="text-lg leading-relaxed">{t(rc.body)}</p>
        <a className="inline-flex min-h-11 items-center text-base text-rule underline" href={rc.url} target="_blank" rel="noreferrer">
          {t(S.kv(t(S.source), t(rc.source)))}
        </a>
        <p className="text-sm text-ink2">{t(S.summaryNote)}</p>
      </div>
    </Panel>
  )
}

function BackToAnswer({ onClick }: { onClick: () => void }) {
  const t = useT()
  return (
    <button data-back-answer className="btn min-h-12 w-full text-lg" onClick={() => (sfx.ui(), onClick())}>
      {t(S.backToAnswer)}
    </button>
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

  // AIの答えには文節の目印を入れる。自分で書いた文は目印がないので、どこで折り返してもよい
  const bubble = 'max-w-[88%] whitespace-pre-wrap rounded-xl px-3 py-2 text-lg leading-relaxed [line-break:strict] [overflow-wrap:anywhere]'
  return (
    <Panel
      title={t.attr(S.aiTitle)}
      onClose={onClose}
      tall
      closeLabel={t.attr(S.close)}
      icon={
        <span className="shrink-0 overflow-hidden rounded-lg border-2 border-line bg-surface2">
          <Art id="face.boss" scale={1.5} />
        </span>
      }
      footer={
        off ? (
          <BackToAnswer onClick={onClose} />
        ) : (
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              void ask(text)
            }}
          >
            <input ref={input} value={text} onChange={(e) => setText(e.target.value)} maxLength={300} placeholder={t.attr(explain && turns.length === 0 ? S.aiExplainHint : S.aiPlaceholder)} className="min-h-12 min-w-0 flex-1 rounded-lg border-2 border-edge bg-surface px-3 text-lg text-ink placeholder:text-ink2" aria-label={t.attr(S.aiPlaceholder)} disabled={busy} />
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
        )
      }
    >
      <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
        <p className="text-sm text-ink2">{t(S.aiNote)}</p>
        {turns.map((m, i) => (
          <div key={i} className={`${bubble} ${m.role === 'user' ? 'justify-self-end bg-ink text-surface [word-break:normal]' : 'justify-self-start border-2 border-hair bg-surface2'}`}>
            {m.role === 'user' ? m.content : t(m.content)}
          </div>
        ))}
        {busy && (
          <div className={`${bubble} justify-self-start border-2 border-hair bg-surface2`} aria-live="polite">
            {live ? t(live) : <span className="blink">{t(S.aiThinking)}</span>}
          </div>
        )}
        {err && <p className="rounded-lg border-2 border-ng bg-ngBg px-3 py-2 text-base">{err}</p>}
        {!off && turns.length === 0 && !busy && (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(11rem,1fr))] gap-2">
            {/* 自分でわけを言ってみる（自己説明）。送るのは自分の言葉だけ */}
            <button
              data-ai-explain
              aria-pressed={explain}
              className="btn min-h-12 px-3 text-base"
              onClick={() => {
                sfx.ui()
                setExplain(true)
                input.current?.focus()
              }}
            >
              ✎ {t(S.aiExplain)}
            </button>
            {S.aiChips.map((c, i) => (
              <button key={i} data-ai-chip={i} className="btn min-h-12 px-3 text-base font-normal" onClick={() => void ask(t.attr(c))}>
                {t(c)}
              </button>
            ))}
          </div>
        )}
        {!off && explain && turns.length === 0 && !busy && <p className="rounded-lg bg-ruleBg px-3 py-2 text-base">{t(S.aiExplainHow)}</p>}
        <div ref={end} />
      </div>
    </Panel>
  )
}
