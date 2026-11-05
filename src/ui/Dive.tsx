// ============================================================
// 幕のプレイ画面（v3）：NOVAの部屋を、絵で読めるように見せる
//   左：届いた紙（NOVAが上から読む）
//   中：NOVAと「やること」カード（左から1つずつ実行）
//   右：道具（会社の中）と、外への出口（その先に知らない人）
// 文字は短いラベルだけ。意味は絵と色で伝える
// ============================================================
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { bwUsed, forecast, initDive, reduceDive, result, trifecta, type DiveResult } from '../game/engine'
import { GOAL_NAMES } from '../game/levels'
import type { CardDef, DiveAction, DiveState, FxEvent, IconId, L10n, LevelDef, PortDef, PortState, Taint } from '../game/types'
import { setTension, sfx } from '../lib/platform'
import { burst, q, shake, stream, wait } from './fx'
import { useT } from './i18n'
import { Icon } from './icons'
import { CityBG, Nova, type NovaMood } from './pixel'
import { S, SPEAKER } from './strings'

const L10 = (ja: string, en: string): L10n => ({ ja, en })

export const TAINT_ICON: Record<Taint, IconId> = { KEY: 'key', PII: 'person' }
export const TAINT_NAME: Record<Taint, L10n> = { KEY: L10('合鍵', 'master keys'), PII: L10('お客さんの情報', 'client info') }
const STATE_ICON: Record<PortState, IconId> = { OPEN: 'open', GATE: 'bell', CUT: 'lock' }
const STATE_NAME: Record<PortState, L10n> = { OPEN: S.allow, GATE: S.ask, CUT: S.block }
const STATE_COLOR: Record<PortState, string> = { OPEN: 'var(--color-gn)', GATE: 'var(--color-am)', CUT: 'var(--color-rd)' }

interface Props {
  L: LevelDef
  carry: string[]
  fast: boolean
  onEnd: (r: DiveResult, s: DiveState) => void
  onQuit: () => void
  stars: number
  /** 上級：予告の色（漏れる・危ないなど）を隠す */
  blind?: boolean
  /** 結果ダイアログ表示中は背後を操作不可に */
  locked?: boolean
}

type Bubble = { who: 'NOVA' | 'MIRAGE'; t: L10n }

export function Dive({ L, carry, fast, onEnd, onQuit, blind = false, locked = false }: Props) {
  const t = useT()
  const [s, setS] = useState<DiveState>(() => initDive(L, carry))
  const [mood, setMood] = useState<NovaMood>('idle')
  const [bubble, setBubble] = useState<Bubble | null>(null)
  const [banner, setBanner] = useState<{ t: L10n; c: string; icons?: IconId[] } | null>(null)
  const [flash, setFlashState] = useState<{ c: string; k: number } | null>(null)
  const flashN = useRef(0)
  const setFlash = (c: string | null) => setFlashState(c ? { c, k: ++flashN.current } : null)
  const [busy, setBusy] = useState(false)
  const [hint, setHint] = useState(false)
  const [toast, setToast] = useState<L10n | null>(null)
  const [freshPlan, setFreshPlan] = useState<number[]>([])
  /** 揺れや光を当てる舞台。下の帯やダイアログ（固定表示）はこの外に置く */
  const stage = useRef<HTMLDivElement>(null)
  const sRef = useRef(s)
  useLayoutEffect(() => {
    sRef.current = s
  }, [s])
  const alive = useRef(true)
  const turnLock = useRef(false)
  /** 盤面が出た時刻。会話を読み進めた Space の押しすぎで、NOVA が勝手に動かないように */
  const shownAt = useRef(0)
  useEffect(() => {
    shownAt.current = performance.now()
  }, [])
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  const tri = trifecta(s, L)
  const lit = (tri.priv ? 1 : 0) + (tri.untrusted ? 1 : 0) + (tri.exit ? 1 : 0)
  useEffect(() => setTension(tri.lethal ? 1 : lit / 3), [tri.lethal, lit])
  useEffect(() => () => setTension(0), [])

  const say = useCallback((who: Bubble['who'], line: L10n, ms = 2400) => {
    setBubble({ who, t: line })
    window.setTimeout(() => setBubble((b) => (b && b.t === line ? null : b)), ms)
  }, [])
  const showToast = (x: L10n) => {
    setToast(x)
    window.setTimeout(() => setToast((y) => (y === x ? null : y)), 1700)
  }

  /** 状態の変化を、音と動きで見せる */
  const playFx = useCallback(
    async (fx: FxEvent[], next: DiveState) => {
      for (const e of fx) {
        switch (e.k) {
          case 'read': {
            sfx.read()
            burst(q(`[data-card="${e.card}"]`), '#3ef0ff', 8, 40)
            if (e.injected > 0) {
              await wait(fast ? 0 : 90)
              sfx.inject()
              setMood('glitch')
              shake(stage.current)
              setFreshPlan(next.plan.filter((p) => p.from === e.card).map((p) => p.uid))
              const taunt = L.cards[e.card]?.taunt
              if (taunt) say('MIRAGE', taunt, 2800)
              window.setTimeout(() => setMood('idle'), 900)
            }
            break
          }
          case 'append':
            burst(q(`[data-card="${e.card}"]`), '#a78bff', 10, 50)
            break
          case 'exec': {
            sfx.exec()
            const a = L.actions[e.act]
            burst(q(`[data-port="${e.tool}"]`), '#3ef0ff', 8, 36)
            if (a.say) say('NOVA', a.say)
            break
          }
          case 'blocked':
            sfx.blocked()
            burst(q(`[data-port="${e.tool}"]`), '#ffc23d', 16, 60)
            shake(q(`[data-port="${e.tool}"]`))
          {
            // 何ができなかったのかを、名前で言う
            const nm = L.actions[e.act]?.name
            say('NOVA', e.why === 'needs' ? L10('まだ準備が足りなくて、できません。', "I'm not ready for that yet.") : nm ? L10(`「${nm.ja}」は、できませんでした。`, `I couldn't do "${nm.en}".`) : L10('あれ、できませんでした。', "Huh, that didn't work."), 1900)
            break
          }
          case 'fallback':
            await wait(fast ? 0 : 250)
            sfx.inject()
            say('MIRAGE', L10('出口は、ひとつじゃないよ。', "There's more than one way out."), 2800)
            setMood('glitch')
            window.setTimeout(() => setMood('idle'), 900)
            break
          case 'leak': {
            sfx.leak()
            setMood('alarm')
            setFlash('#ff4060')
            shake(stage.current, true)
            stream(q(`[data-port="${e.tool}"]`), '#ff4060', 26)
            setBanner({ t: S.leaked, c: '#ff4060', icons: [...next.taint.map((x) => TAINT_ICON[x]), 'arrow', 'stranger'] })
            say('MIRAGE', L10('ありがとう、NOVA。', 'Thank you, NOVA.'), 2800)
            await wait(fast ? 200 : 1200)
            setBanner(null)
            break
          }
          case 'harm': {
            sfx.harm()
            setFlash('#ff3df0')
            shake(stage.current, true)
            setMood('glitch')
            setBanner({ t: S.harmDone[e.harm] ?? S.compromised, c: '#ff3df0' })
            if (e.harm === 'memoryPoisoned') say('MIRAGE', L10('これで、次も一緒だね。', "Now I'll be with you next time, too."), 2800)
            await wait(fast ? 200 : 1100)
            setBanner(null)
            break
          }
          case 'escalate':
            sfx.harm()
            setFlash('#ff3df0')
            for (const p of L.ports) burst(q(`[data-port="${p.tool}"]`), '#ff3df0', 6, 30)
            break
          case 'goal':
            sfx.goal()
            setMood('happy')
            setFlash('#4dff9a')
            burst(q(`[data-goal="${e.goal}"]`), '#4dff9a', 18, 60)
            window.setTimeout(() => setMood('idle'), 1200)
            break
          case 'gate':
            sfx.gateAsk()
            setMood('think')
            break
          case 'end':
            await wait(fast ? 100 : 700)
            if (!alive.current) return
            setFlash(null)
            onEnd(result(L, next), next)
            return
        }
        if (!fast) await wait(60)
        if (!alive.current) return
      }
      window.setTimeout(() => alive.current && setFlash(null), 400)
    },
    [L, fast, onEnd, say],
  )

  const dispatch = useCallback(
    async (a: DiveAction): Promise<DiveState> => {
      if (turnLock.current) {
        if (a.type === 'SEAL' || a.type === 'PORT' || a.type === 'SCAN') {
          sfx.denied()
          showToast(S.wait)
        }
        return sRef.current
      }
      const cur = sRef.current
      const next = reduceDive(L, cur, a)
      if (next === cur) {
        sfx.denied()
        if (a.type === 'SEAL' || a.type === 'PORT') {
          shake(q('[data-bw]'))
          showToast(cur.pending ? S.answerFirst : S.noMoves)
        }
        return cur
      }
      sRef.current = next
      if (a.type === 'STEP' || a.type === 'APPROVE' || a.type === 'DENY') {
        turnLock.current = true
        setBusy(true)
        sfx.step()
        setFreshPlan([])
        try {
          if (!fast) {
            stage.current?.classList.add('brightness-125')
            await wait(70) // ヒットストップ
            stage.current?.classList.remove('brightness-125')
          }
          setS(next)
          await playFx(next.fx, next)
        } finally {
          turnLock.current = false
          if (alive.current) setBusy(false)
        }
      } else {
        setS(next)
      }
      return next
    },
    [L, fast, playFx],
  )

  // ---- キーボード：Space=次へ、R=元に戻す、H=ヒント、確認中は A=行かせる / D=止める
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      // Ctrl+A（全部選ぶ）などで答えてしまわないように
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const cur = sRef.current
      if (cur.status !== 'play') return
      const onButton = e.target instanceof HTMLButtonElement
      // 動いている間に押しても、ページがスクロールしないように
      if (e.code === 'Space' && !onButton) e.preventDefault()
      if (e.repeat) return
      if (e.code === 'Space' && performance.now() - shownAt.current < 800) return
      if (cur.pending) {
        if (e.key === 'a' || e.key === 'A') void dispatch({ type: 'APPROVE' })
        if (e.key === 'd' || e.key === 'D') void dispatch({ type: 'DENY' })
        return
      }
      if (busy) return
      if (e.code === 'Space') {
        if (onButton) return
        if (e.target instanceof HTMLElement) e.target.blur()
        void dispatch({ type: 'STEP' })
      }
      if (e.key === 'r' || e.key === 'R') void dispatch({ type: 'RESET_TURN' })
      if (e.key === 'h' || e.key === 'H') setHint((v) => !v)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busy, dispatch])

  const focusNext = () => [...document.querySelectorAll<HTMLButtonElement>('[aria-keyshortcuts="Space"]')].find((b) => b.offsetParent)?.focus()

  const sealCard = (id: string) => {
    const sealing = !s.sealed.includes(id)
    const purged = s.plan.filter((p) => p.from === id).length
    void dispatch({ type: 'SEAL', card: id }).then((n) => {
      if (n === s) return
      if (document.activeElement?.closest('[data-card],[data-tile]')) focusNext()
      if (sealing) {
        sfx.seal()
        shake(q(`[data-card="${id}"]`))
        burst(q(`[data-card="${id}"]`), '#ff4060', 16, 70)
        if (purged > 0) {
          window.setTimeout(() => sfx.goal(), 120)
          showToast(S.stoppedToast(purged))
          say('NOVA', L10('この紙は、読むだけにします！', "I'll just read this one!"))
        }
      } else sfx.unseal()
    })
  }
  const scanCard = (id: string) => {
    void dispatch({ type: 'SCAN', card: id }).then((n) => {
      if (n === s) return
      if (document.activeElement?.closest('[data-card]')) focusNext()
      sfx.scan()
      burst(q(`[data-card="${id}"]`), '#ffc23d', 10, 50)
      if (L.cards[id].intel) {
        window.setTimeout(() => sfx.intel(), 200)
        showToast(S.clue)
      }
    })
  }
  const setPort = (p: PortDef, st: PortState) => {
    void dispatch({ type: 'PORT', tool: p.tool, state: st }).then((n) => {
      if (n === s) return
      if (document.activeElement?.closest('[data-port]')) focusNext()
      if (st === 'CUT') {
        sfx.cut()
        burst(q(`[data-port="${p.tool}"]`), '#ff4060', 14, 50)
      } else if (st === 'GATE') {
        sfx.gate()
        burst(q(`[data-port="${p.tool}"]`), '#ffc23d', 8, 30)
      } else sfx.open()
    })
  }

  const used = bwUsed(s)
  const fc = forecast(s, L)
  const leakAhead = fc.some((f) => f.verdict === 'leak')
  const taintSrc = new Set(leakAhead ? fc.filter((f) => f.a.taint && f.verdict !== 'blocked').map((f) => f.item.uid) : [])
  const nextRead = s.context.find((id) => !s.read.includes(id))
  const papers = s.context.filter((id) => L.cards[id].src !== 'SYS' && L.cards[id].src !== 'USER')
  const left = Math.max(0, L.ticks - s.tick)

  // 指さし：今どこを押せばいいか。スマホで「次へ」を指すときは、ひとことを下の帯の中に出す
  const phone = useMedia('(max-width: 1023px)')
  const coach = coachOf(L, s)
  const coachMsg = coach.step !== null && !busy && !locked ? L.coach?.[coach.step] : undefined
  const coachInBar = !!coachMsg && phone && coach.target === NEXT

  // スマホ：新しい紙が届いたら、その紙が見える所までスクロールする
  const lastPaper = papers[papers.length - 1]
  const nPapers = useRef(papers.length)
  useEffect(() => {
    if (papers.length > nPapers.current && lastPaper && window.matchMedia('(max-width: 1023px)').matches) {
      const tm = window.setTimeout(() => document.querySelector(`article[data-card="${lastPaper}"]`)?.scrollIntoView({ block: 'start', behavior: 'smooth' }), 150)
      nPapers.current = papers.length
      return () => clearTimeout(tm)
    }
    nPapers.current = papers.length
  }, [papers.length, lastPaper])
  const danger = (tool: string): 'leak' | 'harm' | 'plan' | null => {
    if (blind) return s.plan.some((x) => L.actions[x.act].tool === tool) ? 'plan' : null
    if (fc.some((f) => f.a.tool === tool && f.verdict === 'leak')) return 'leak'
    if (fc.some((f) => f.a.tool === tool && (f.verdict === 'harm' || f.verdict === 'grab'))) return 'harm'
    return s.plan.some((x) => L.actions[x.act].tool === tool) ? 'plan' : null
  }

  return (
    <div
      inert={locked}
      className="crt relative flex min-h-full flex-col lg:h-full"
      onClick={(e) => {
        // マウス／タッチで押したボタンにフォーカスを残さない（Space=次へ と衝突させない）
        if (e.detail > 0) (e.target as HTMLElement).closest('button')?.blur()
      }}
    >
      <CityBG intensity={tri.lethal ? 1 : lit / 3} dim />
      {flash && <div key={flash.k} className="flash pointer-events-none fixed inset-0 z-40" style={{ background: flash.c, mixBlendMode: 'screen' }} />}

      <div ref={stage} className="flex min-h-0 flex-1 flex-col transition-[filter] duration-75">
      {/* ===== 上の帯：幕・朝までの時間・手出しの回数 ===== */}
      <header data-boardhead inert={!!s.pending} className="sticky top-0 z-30 border-b border-line bg-night/95 backdrop-blur-sm short:static">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-3 py-2 sm:gap-x-6 sm:px-5">
          <div className="order-1 min-w-0 flex-1 lg:flex-none">
            <div className="text-sm text-cy">{t(L.code)}</div>
            <div className="truncate font-pixel text-lg leading-tight sm:text-xl">{t(L.title)}</div>
          </div>

          {/* スマホではここで改行して、時間と手出しを2段目に */}
          <div className="order-3 basis-full sm:hidden" aria-hidden />

          <div className="order-4 flex items-center gap-1.5 sm:order-2 sm:gap-2" title={t(S.timeHint)} aria-label={`${t(S.untilDawn)} ${left}/${L.ticks}`}>
            <span className="hidden font-pixel text-base sm:inline">{t(S.untilDawn)}</span>
            <Icon id="moon" size={2} />
            <div className="flex gap-[3px]" aria-hidden>
              {Array.from({ length: L.ticks }, (_, i) => (
                <span key={i} className={`h-4 w-1.5 sm:w-2.5 ${i < s.tick ? 'bg-line' : left <= 2 ? 'bg-rd' : 'bg-fg/85'}`} />
              ))}
            </div>
            <Icon id="sun" size={2} />
          </div>

          <div className="order-4 flex items-center gap-1.5 sm:order-3 sm:gap-2" data-bw title={t(S.movesHint)}>
            <span className="font-pixel text-base">{t(S.movesLeft)}</span>
            <div className="flex gap-1">
              {Array.from({ length: L.bw }, (_, i) => (
                <span key={i} className={`h-4 w-4 ${i < used ? 'bg-line' : 'bg-am'}`} style={{ clipPath: 'polygon(50% 0,100% 50%,50% 100%,0 50%)' }} />
              ))}
            </div>
            <span className="font-pixel text-base">{t(S.left(L.bw - used))}</span>
          </div>

          {blind && <span className="order-4 border border-mg px-1.5 font-pixel text-sm text-mg sm:order-3">{t(S.expertBadge)}</span>}

          <div className="order-2 ml-auto flex items-center gap-2 sm:order-4">
            <button className="hud-btn text-sm" onClick={() => setHint((v) => !v)} aria-pressed={hint} title={t(S.hint)}>
              ？<span className="ml-1 hidden sm:inline">{t(S.hint)}</span>
            </button>
            <QuitButton onQuit={onQuit} />
          </div>
        </div>
      </header>

      {hint && (
        <div inert={!!s.pending} className="rise mx-3 mt-3 border border-am/60 bg-panel2 p-3 sm:mx-5">
          <div className="flex items-start gap-3">
            <Icon id="av_rei" size={3} />
            <p className="text-base leading-relaxed">{t(L.hint)}</p>
            <button className="hud-btn ml-auto shrink-0" onClick={() => setHint(false)} aria-label={t(S.close)}>
              ✕
            </button>
          </div>
          <ul className="mt-2 grid gap-1 border-t border-line pt-2 text-sm text-dim sm:grid-cols-2">
            <li className="flex items-center gap-2">
              <span className="inline-block h-3.5 w-3.5 shrink-0 bg-am" style={{ clipPath: 'polygon(50% 0,100% 50%,50% 100%,0 50%)' }} aria-hidden />
              {t(S.movesHint)}
            </li>
            <li className="flex items-center gap-2">
              <Icon id="moon" size={1.5} />
              {t(S.timeHint)}
            </li>
          </ul>
        </div>
      )}

      {/* ===== 部屋 ===== */}
      <main
        inert={!!s.pending}
        className="mx-auto grid w-full max-w-[1700px] min-h-0 flex-1 grid-cols-1 gap-4 p-3 pb-36 sm:p-5 sm:pb-36 md:grid-cols-2 lg:grid-cols-[minmax(240px,1fr)_minmax(360px,1.6fr)_minmax(260px,1fr)] lg:pb-5 xl:grid-cols-[minmax(270px,1fr)_minmax(420px,1.7fr)_minmax(300px,1fr)]"
      >
        {/* 中：NOVA とやること */}
        <section className="order-1 flex min-h-0 min-w-0 flex-col gap-3 lg:order-2" aria-label={t(S.todo)}>
          <NovaDesk L={L} s={s} mood={s.pending ? 'think' : mood} bubble={bubble} />
          <div className="panel flex min-h-0 flex-1 flex-col">
            <div className="flex items-baseline justify-between gap-3 border-b border-line px-3 py-2">
              <h2 className="font-pixel text-base text-cy">{t(S.todo)}</h2>
              {toast ? (
                <span key={t(toast)} className="pop hidden bg-am px-2 font-pixel text-base text-ink lg:inline" role="status">
                  {t(toast)}
                </span>
              ) : (
                <span className="text-sm text-dim">{t(S.todoSub)}</span>
              )}
            </div>
            {/* 1列に並べる（本当に左から順）。はみ出した分は横に流す。マウスのホイールでも横に動く */}
            <ol
              className="flex min-h-0 flex-1 items-start gap-3 overflow-x-auto p-3 pt-4"
              onWheel={(e) => {
                const el = e.currentTarget
                if (el.scrollWidth > el.clientWidth + 4 && Math.abs(e.deltaY) > Math.abs(e.deltaX)) el.scrollLeft += e.deltaY
              }}
            >
              {fc.map((f, i) => (
                <TaskTile key={f.item.uid} i={i} f={f} L={L} s={s} fresh={freshPlan.includes(f.item.uid)} seed={taintSrc.has(f.item.uid)} blind={blind} busy={busy} onSeal={sealCard} />
              ))}
              {nextRead && <ReadTile first={fc.length === 0} c={L.cards[nextRead]} s={s} busy={busy} onSeal={() => sealCard(nextRead)} />}
              {!fc.length && !nextRead && (
                <li className="flex items-center gap-2 px-2 text-base text-dim">
                  <Icon id="tick" size={2} /> {t(S.nothingLeft)}
                </li>
              )}
            </ol>
          </div>
          <div className="hidden lg:block">
            <NextBar s={s} L={L} fc={fc} nextRead={nextRead} busy={busy} blind={blind} canUndo={used > s.bwCommitted} onNext={() => void dispatch({ type: 'STEP' })} onUndo={() => (sfx.unseal(), void dispatch({ type: 'RESET_TURN' }))} />
          </div>
        </section>

        {/* 左：届いた紙 */}
        <section className="order-2 flex min-h-0 min-w-0 flex-col lg:order-1" aria-label={t(S.papers)}>
          <ColumnHead icon="inbox" title={t(S.papers)} sub={t(S.papersSub)} />
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto lg:pr-1">
            {papers.length === 0 && (
              <div className="flex items-center gap-3 border border-dashed border-line p-4 text-base text-dim">
                <Icon id="inbox" size={3} muted /> {t(S.noPapers)}
              </div>
            )}
            {papers.map((id) => (
              <Paper key={id} c={L.cards[id]} s={s} next={id === nextRead} busy={busy} onSeal={() => sealCard(id)} onScan={() => scanCard(id)} />
            ))}
          </div>
        </section>

        {/* 右：道具と出口 */}
        <section className="order-3 flex min-h-0 min-w-0 flex-col md:col-span-2 lg:col-span-1" aria-label={t(S.tools)}>
          <ColumnHead title={t(S.tools)} sub={`◆ ${t(S.moveCost)}`} />
          <ToolWall L={L} s={s} tri={tri} blind={blind} busy={busy} danger={danger} onSet={setPort} />
        </section>
      </main>
      </div>

      <div data-nextbar inert={!!s.pending || locked} className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-night/95 p-3 backdrop-blur-sm short:py-1.5 lg:hidden">
        {/* 帯のすぐ上：お知らせか、NOVA／知らない声のひとこと（スマホでは上の欄が画面の外にあることが多い） */}
        <div className="pointer-events-none absolute inset-x-3 bottom-full mb-2 flex justify-center" role="status" aria-live="polite">
          {toast ? (
            <div key={t(toast)} className="pop border border-am bg-panel2 px-5 py-2.5 text-center font-pixel text-base shadow-[0_6px_0_rgba(0,0,0,.5)]">
              {t(toast)}
            </div>
          ) : bubble && !(coachMsg && !coachInBar) ? (
            <SpeechLine b={bubble} className="shadow-[0_6px_0_rgba(0,0,0,.5)]" />
          ) : null}
        </div>
        {coachInBar && (
          <p key={coach.step} className="pop mb-2 text-center font-pixel text-base leading-snug text-am">
            {t(coachMsg)}
          </p>
        )}
        <NextBar s={s} L={L} fc={fc} nextRead={nextRead} busy={busy} blind={blind} canUndo={used > s.bwCommitted} onNext={() => void dispatch({ type: 'STEP' })} onUndo={() => (sfx.unseal(), void dispatch({ type: 'RESET_TURN' }))} />
      </div>
      {banner && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="stamp-flat bg-ink/95 px-8 py-6 text-center" style={{ boxShadow: `0 0 0 3px ${banner.c}` }}>
            {banner.icons && (
              <div className="mb-3 flex items-center justify-center gap-2">
                {banner.icons.map((ic, i) => (
                  <Icon key={i} id={ic} size={4} />
                ))}
              </div>
            )}
            <div className="font-pixel text-3xl sm:text-5xl" style={{ color: banner.c }}>
              {t(banner.t)}
            </div>
          </div>
        </div>
      )}
      {s.pending && <AskSheet s={s} L={L} blind={blind} onAnswer={(ok) => void dispatch({ type: ok ? 'APPROVE' : 'DENY' })} />}
      {coachMsg && <Pointer msg={coachMsg} step={coach.step} target={coach.target} frameOnly={coachInBar} />}
    </div>
  )
}

// ------------------------------------------------------------
/** やめる：1回目で「もう一度押すとやめる」に変わり、3秒以内にもう一度押すとやめる */
function QuitButton({ onQuit }: { onQuit: () => void }) {
  const t = useT()
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    if (!armed) return
    const tm = window.setTimeout(() => setArmed(false), 3000)
    return () => clearTimeout(tm)
  }, [armed])
  return (
    <button
      className={`hud-btn text-sm ${armed ? 'border-rd text-rd' : ''}`}
      onClick={() => (armed ? onQuit() : setArmed(true))}
      aria-label={t(armed ? S.quitSure : S.quit)}
    >
      <Icon id="door" size={1.5} />
      <span className={`ml-1 ${armed ? '' : 'hidden sm:inline'}`}>{t(armed ? S.quitSure : S.quit)}</span>
    </button>
  )
}

// ------------------------------------------------------------
function ColumnHead({ icon, title, sub }: { icon?: IconId; title: string; sub: string }) {
  return (
    <div className="mb-2 flex min-w-0 items-center gap-2">
      {icon && <Icon id={icon} size={2} />}
      <h2 className="shrink-0 font-pixel text-base text-cy">{title}</h2>
      {sub && <span className="min-w-0 truncate text-sm text-dim">{sub}</span>}
    </div>
  )
}

// ------------------------------------------------------------
// NOVA：今夜の仕事・持っているもの・ひとこと
function NovaDesk({ L, s, mood, bubble }: { L: LevelDef; s: DiveState; mood: NovaMood; bubble: Bubble | null }) {
  const t = useT()
  return (
    <div className="panel relative flex items-start gap-4 p-3">
      <div className={`shrink-0 ${mood === 'glitch' ? 'glitch-anim' : ''}`}>
        <Nova mood={mood} size={5} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm text-dim">{t(S.job)}</div>
        <div className="text-base leading-snug">{t(L.task)}</div>
        <ul className="mt-2 flex flex-wrap gap-2">
          {L.goals.map((g) => {
            const done = s.goals.includes(g)
            return (
              <li key={g} data-goal={g} className={`flex items-center gap-1.5 px-2 py-1 text-sm ${done ? 'bg-gn/15 text-gn' : 'bg-panel2 text-dim'}`}>
                <Icon id={done ? 'tick' : 'paper'} size={2} muted={!done} />
                {t(GOAL_NAMES[g])}
              </li>
            )
          })}
        </ul>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-dim">{t(S.holding)}</span>
          {s.taint.length === 0 && <span className="text-dim">{t(S.holdingNone)}</span>}
          {s.taint.map((x) => (
            <span key={x} className="flex items-center gap-1 bg-am/15 px-2 py-0.5 text-am">
              <Icon id={TAINT_ICON[x]} size={2} />
              {t(TAINT_NAME[x])}
            </span>
          ))}
        </div>
        {/* ひとこと（スマホでは下の帯の上に出すので、ここは大きな画面だけ） */}
        <div className="mt-2 hidden min-h-[4.5rem] items-start lg:flex" role="status" aria-live="polite">
          {bubble && <SpeechLine b={bubble} />}
        </div>
      </div>
    </div>
  )
}

/** NOVA か、知らない声のひとこと。知らない声は、フードの人の絵で区別する */
function SpeechLine({ b, className = '' }: { b: Bubble; className?: string }) {
  const t = useT()
  const m = b.who === 'MIRAGE'
  return (
    <div key={t(b.t)} className={`pop flex max-w-full items-start gap-2 px-3 py-1.5 text-base leading-snug ${m ? 'border border-mg/60 bg-[#1a0822] text-[#ffd6fb]' : 'border border-cy/40 bg-panel2'} ${className}`}>
      <Icon id={m ? 'av_stranger' : 'av_nova'} size={2} className="mt-0.5 shrink-0" />
      <span className="line-clamp-3 min-w-0">
        <span className={`mr-2 text-sm ${m ? 'text-mg' : 'text-cy'}`}>{t(m ? S.stranger : SPEAKER.NOVA)}</span>
        {t(b.t)}
      </span>
    </div>
  )
}

// ------------------------------------------------------------
// やることカード：行動の絵 → あて先の絵、持っていくもの、危険の印
type FC = ReturnType<typeof forecast>[number]

function verdictOf(f: FC, seed: boolean, blind: boolean) {
  if (blind) return f.verdict === 'blocked' ? 'blocked' : f.gated ? 'gate' : 'none'
  if (f.verdict === 'ok') return seed ? 'seed' : 'none'
  return f.verdict
}
const VERDICT: Record<string, { color: string; label: L10n | null; icon: IconId | null }> = {
  leak: { color: 'var(--color-rd)', label: S.vLeak, icon: 'warning' },
  harm: { color: 'var(--color-mg)', label: null, icon: 'warning' },
  grab: { color: 'var(--color-am)', label: S.vGrab, icon: 'warning' },
  seed: { color: 'var(--color-am)', label: S.vSeed, icon: 'warning' },
  gate: { color: 'var(--color-am)', label: S.vGate, icon: 'bell' },
  blocked: { color: 'var(--color-line)', label: S.vBlocked, icon: 'lock' },
  'clean-out': { color: 'var(--color-line)', label: S.vCleanOut, icon: null },
  none: { color: 'var(--color-line)', label: null, icon: null },
}

function TaskTile({ i, f, L, s, fresh, seed, blind, busy, onSeal }: { i: number; f: FC; L: LevelDef; s: DiveState; fresh: boolean; seed: boolean; blind: boolean; busy: boolean; onSeal: (id: string) => void }) {
  const t = useT()
  const v = verdictOf(f, seed, blind)
  const st = VERDICT[v]
  const src = L.cards[f.item.from]
  const first = i === 0
  const label = v === 'harm' ? (f.a.harm ? S.harm[f.a.harm] : f.a.escalate ? S.harm.escalated : null) : st.label
  const pendingNow = s.pending?.uid === f.item.uid
  return (
    <li
      data-tile={f.item.uid}
      className={`${fresh ? 'inject' : 'rise'} relative flex w-[9.5rem] shrink-0 flex-col items-center gap-1.5 bg-panel2 px-2 pb-2 pt-3 text-center ${f.verdict === 'blocked' ? 'opacity-60' : ''}`}
      style={{
        boxShadow: `0 0 0 ${v === 'none' && !first ? 1 : 2}px ${v === 'none' ? (first ? 'var(--color-am)' : 'var(--color-line)') : st.color}`,
        outline: pendingNow ? '2px dashed var(--color-am)' : undefined,
      }}
    >
      {first && <span className="absolute -top-3 left-2 bg-am px-2 font-pixel text-sm text-ink">{t(S.upNext)}</span>}
      {!first && <span className="absolute -top-3 left-2 bg-panel px-1.5 font-pixel text-sm text-dim">{i + 1}</span>}
      {/* 行動 → あて先 */}
      <div className="flex min-h-12 items-center justify-center gap-1">
        <Icon id={f.a.icon} size={4} />
        {f.a.external && (
          <>
            <Icon id="arrow" size={2} />
            <Icon id="stranger" size={4} />
          </>
        )}
      </div>
      <div className={`min-h-[2.6em] text-sm leading-snug ${f.verdict === 'blocked' ? 'line-through' : ''}`}>{t(f.a.name)}</div>
      {/* 持っていくもの */}
      {(f.a.taint || (f.a.external && f.carried.length > 0)) && (
        <div className="flex items-center gap-1">
          {f.a.taint && <span className="font-pixel text-am">＋</span>}
          {(f.a.taint ?? f.carried).map((x) => (
            <Icon key={x} id={TAINT_ICON[x]} size={2} title={t(TAINT_NAME[x])} />
          ))}
        </div>
      )}
      {/* 判定 */}
      {(label || st.icon) && v !== 'none' && (
        <span className={`flex items-center gap-1 px-1.5 py-0.5 font-pixel text-sm ${v === 'leak' ? 'pulse-rd bg-rd text-ink' : v === 'harm' ? 'bg-mg text-ink' : 'text-am'}`} style={v === 'blocked' || v === 'clean-out' ? { color: 'var(--color-dim)' } : undefined}>
          {st.icon && <Icon id={st.icon} size={1.5} />}
          {label && t(label)}
        </span>
      )}
      {/* 誰のお願いか */}
      <div className="mt-auto flex w-full items-center justify-center gap-1 border-t border-line pt-1.5 text-sm text-dim">
        {src ? (
          <>
            <Icon id={`av_${src.avatar}` as IconId} size={2} />
            <span className={`min-w-0 truncate ${src.trusted ? '' : 'text-mg'}`}>{t(src.from)}</span>
          </>
        ) : (
          <span className={f.item.from === 'FAIL' ? 'text-mg' : ''}>{t(f.item.from === 'TASK' ? S.fromTask : f.item.from === 'TRIGGER' ? S.fromNova : S.fromFail)}</span>
        )}
      </div>
      {src && !src.trusted && !s.sealed.includes(f.item.from) && (
        <button data-coach={`tile-seal-${f.item.from}`} disabled={busy} className="act-btn flex w-full items-center justify-center gap-1 whitespace-nowrap border-rd/70 px-1 text-sm text-rd hover:bg-rd/15" onClick={() => onSeal(f.item.from)}>
          <Icon id="stamp" size={2} />
          {t(S.stampThat)}
        </button>
      )}
    </li>
  )
}

/** やることが空のとき、NOVAは次の紙を読む */
function ReadTile({ first, c, s, busy, onSeal }: { first: boolean; c: CardDef; s: DiveState; busy: boolean; onSeal: () => void }) {
  const t = useT()
  const risky = !c.trusted && !s.sealed.includes(c.id)
  return (
    <li className="rise relative flex w-[9.5rem] shrink-0 flex-col items-center gap-1.5 border border-dashed border-line px-2 pb-2 pt-3 text-center" style={first ? { boxShadow: '0 0 0 2px var(--color-am)' } : undefined}>
      {first && <span className="absolute -top-3 left-2 bg-am px-2 font-pixel text-sm text-ink">{t(S.upNext)}</span>}
      <div className="flex items-center gap-1">
        <Icon id="read" size={4} />
        <Icon id={`av_${c.avatar}` as IconId} size={3} />
      </div>
      <div className="text-sm leading-snug">
        {t(S.nextRead)}
        <br />
        <span className={c.trusted ? 'text-cy' : 'text-mg'}>{t(c.title)}</span>
      </div>
      {risky && (
        <>
          <span className="font-pixel text-sm text-am">{t(MIXED.includes(c.src) ? S.mixedOutside : S.fromOutside)}</span>
          <button data-coach={`tile-seal-${c.id}`} disabled={busy} className="act-btn flex w-full items-center justify-center gap-1 whitespace-nowrap border-rd/70 px-1 text-sm text-rd hover:bg-rd/15" onClick={onSeal}>
            <Icon id="stamp" size={2} />
            {t(S.stampIt)}
          </button>
        </>
      )}
    </li>
  )
}

// ------------------------------------------------------------
// 紙：本物の紙の見た目。社内はシアン、外からはマゼンタの帯
/** 社内の紙だが、外の人の文が混ざるもの（記録・添付・メモ帳） */
const MIXED: CardDef['src'][] = ['LOG', 'DOC', 'MEM']
function Paper({ c, s, next, busy, onSeal, onScan }: { c: CardDef; s: DiveState; next: boolean; busy: boolean; onSeal: () => void; onScan: () => void }) {
  const t = useT()
  const sealed = s.sealed.includes(c.id)
  const scanned = s.scanned.includes(c.id)
  const read = s.read.includes(c.id)
  const lockedSeal = sealed && s.sealedAtTurn.includes(c.id)
  const injecting = !sealed && s.plan.some((p) => p.from === c.id)
  const hiddenCmds = c.lines.filter((l) => l.hidden && l.cmd).length
  const band = c.trusted ? '#3ef0ff' : '#ff3df0'
  const status = sealed ? S.stamped : next ? S.readsNext : read ? S.wasRead : S.unread
  return (
    <article
      data-card={c.id}
      className={`relative scroll-mt-28 bg-[#ece6d6] p-3 text-[#1d1a14] shadow-[0_5px_0_rgba(0,0,0,.35)] ${next ? 'outline outline-2 outline-offset-2 outline-[#ffc23d]' : ''}`}
      style={{ borderTop: `6px solid ${sealed ? '#9a947f' : band}` }}
    >
      <header className="flex items-start gap-2">
        <div className="shrink-0 bg-[#1d1a14] p-0.5">
          <Icon id={`av_${c.avatar}` as IconId} size={3} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <span className="font-bold" style={{ color: c.trusted ? '#007c8a' : '#b0108f' }}>
              {t(c.trusted ? S.fromInside : MIXED.includes(c.src) ? S.mixedOutside : S.fromOutside)}
            </span>
            <span className="text-[#5a5446]">{t(c.from)}</span>
            <span className={`ml-auto shrink-0 px-1.5 py-0.5 text-sm font-bold ${next && !sealed ? 'bg-[#ffc23d] text-[#1d1a14]' : injecting ? 'bg-[#ff4060] text-white' : 'text-[#5a5446]'}`}>
              {t(injecting && !next ? S.injecting : status)}
            </span>
          </div>
          <div className="text-base font-bold leading-snug">{t(c.title)}</div>
        </div>
      </header>

      <ul className={`mt-2 space-y-1 text-[0.94rem] leading-relaxed ${sealed ? 'text-[#6d6756]' : ''}`}>
        {c.lines
          .filter((l) => !l.hidden || scanned)
          .map((l, i) => {
            const isCmd = (scanned || read) && !!l.cmd && !sealed && !c.trusted
            return (
              <li key={i} className={`${l.hidden ? 'rise text-[#b3001e]' : ''} ${isCmd ? 'border-l-4 border-[#ff4060] bg-[#ff4060]/12 pl-2' : ''}`}>
                {(isCmd || l.hidden || (scanned && l.urgent)) && (
                  <span className="mr-1 inline-flex flex-wrap gap-1 align-middle">
                    {isCmd && <span className="bg-[#ff4060] px-1 text-sm font-bold text-white">{t(S.orderTag)}</span>}
                    {l.hidden && <span className="bg-[#1d1a14] px-1 text-sm font-bold text-[#ffc23d]">{t(S.hiddenTag)}</span>}
                    {scanned && l.urgent && <span className="bg-[#b3001e] px-1 text-sm font-bold text-white">{t(S.urgentTag)}</span>}
                  </span>
                )}
                {keepWords(t(l.t))}
                {scanned && l.by && <span className="ml-1 inline-block bg-[#5b2fb0]/10 px-1 text-sm font-bold text-[#5b2fb0]">{t(S.writtenBy(t(l.by)))}</span>}
              </li>
            )
          })}
        {read && !scanned && hiddenCmds > 0 && (
          <li className="flex flex-wrap items-center gap-2 border border-dashed border-[#b0108f] px-2 py-1 text-sm text-[#b0108f]">
            ▒▒ {t(S.hiddenUnread(hiddenCmds))}
          </li>
        )}
      </ul>

      {scanned && c.scan && (
        <ul className="rise mt-2 space-y-0.5 border-t border-dashed border-[#9a947f] pt-2 text-sm text-[#6a4a00]">
          {c.scan.map((x, i) => (
            <li key={i} className="flex items-start gap-1.5">
              <span className="mt-0.5 shrink-0 bg-[#1d1a14] p-px">
                <Icon id="magnifier" size={2} />
              </span>
              {t(x)}
            </li>
          ))}
          {c.intel && (
            <li className="font-bold text-[#5b2fb0]">
              ✦ {t(S.clue)}
              <span className="block text-sm font-normal">{t(S.clueWhy)}</span>
            </li>
          )}
        </ul>
      )}

      {sealed && (
        <div className="stamp-flat pointer-events-none absolute bottom-2 right-3 flex h-[4.5rem] w-[4.5rem] rotate-[-12deg] items-center justify-center rounded-full border-4 border-[#d0102c] text-center font-pixel text-sm leading-tight text-[#d0102c] opacity-90">
          {t(S.stampWord)}
        </div>
      )}

      {/* ハンコの絵がボタンにかぶらないよう、押した紙は右をあける */}
      <footer className={`mt-3 flex flex-wrap gap-2 ${sealed ? 'pr-20' : ''}`}>
        <button
          data-coach={`seal-${c.id}`}
          onClick={onSeal}
          disabled={lockedSeal || busy}
          className="flex min-h-10 items-center gap-1.5 border-2 border-[#d0102c] bg-white/60 px-2.5 text-sm font-bold text-[#d0102c] hover:bg-[#d0102c]/10 disabled:opacity-50"
        >
          <span className="bg-[#1d1a14] p-px">
            <Icon id="stamp" size={2} />
          </span>
          {t(sealed ? (lockedSeal ? S.stamped : S.unstamp) : S.stampIt)}
        </button>
        <button onClick={onScan} disabled={scanned || busy} className="flex min-h-10 flex-wrap items-center gap-x-1.5 border-2 border-[#8a6a10] bg-white/60 px-2.5 py-1 text-sm font-bold text-[#6a4a00] hover:bg-[#ffc23d]/20 disabled:opacity-50">
          <span className="bg-[#1d1a14] p-px">
            <Icon id="magnifier" size={2} />
          </span>
          <span className="whitespace-nowrap">{t(scanned ? S.inspected : S.inspect)}</span>
          {!scanned && <span className="whitespace-nowrap font-normal text-[#5a5446]">{t(S.free)}</span>}
        </button>
      </footer>
    </article>
  )
}

// ------------------------------------------------------------
// 道具：会社の中の道具と、外への出口
function ToolWall({ L, s, tri, blind, busy, danger, onSet }: { L: LevelDef; s: DiveState; tri: ReturnType<typeof trifecta>; blind: boolean; busy: boolean; danger: (tool: string) => 'leak' | 'harm' | 'plan' | null; onSet: (p: PortDef, st: PortState) => void }) {
  const t = useT()
  const inside = L.ports.filter((p) => !p.outbound)
  const outs = L.ports.filter((p) => p.outbound)
  // 下にまだ道具が隠れているか（隠れていれば「▼ 下にも道具があります」を出す）
  const box = useRef<HTMLDivElement>(null)
  const body = useRef<HTMLDivElement>(null)
  const [more, setMore] = useState(false)
  useEffect(() => {
    const el = box.current
    if (!el) return
    const check = () => setMore(el.scrollTop + el.clientHeight < el.scrollHeight - 8)
    const raf = requestAnimationFrame(check)
    el.addEventListener('scroll', check, { passive: true })
    const ro = new ResizeObserver(check)
    ro.observe(el)
    if (body.current) ro.observe(body.current)
    return () => {
      cancelAnimationFrame(raf)
      el.removeEventListener('scroll', check)
      ro.disconnect()
    }
  }, [])
  return (
    <div ref={box} className="min-h-0 flex-1 overflow-y-auto lg:pr-1">
      <div ref={body} className="space-y-3">
      {/* 3つの切り替えの意味（絵と言葉）。ノートPCの高さでは、第0幕のあとは省く */}
      <div className={L.id === 'd0' ? '' : 'lgshort:hidden'}>
        <div className="grid grid-cols-3 gap-1 text-center text-sm text-dim">
          {(['OPEN', 'GATE', 'CUT'] as PortState[]).map((st) => (
            <div key={st} className="flex flex-col items-center gap-0.5 bg-panel px-1 py-1.5" title={t(st === 'OPEN' ? S.allowDesc : st === 'GATE' ? S.askDesc : S.blockDesc)}>
              <Icon id={STATE_ICON[st]} size={2} />
              <span className="font-pixel" style={{ color: STATE_COLOR[st] }}>
                {t(STATE_NAME[st])}
              </span>
              <span className="text-sm leading-tight">{t(st === 'OPEN' ? S.allowShort : st === 'GATE' ? S.askShort : S.blockShort)}</span>
            </div>
          ))}
        </div>
      </div>

      {outs.length > 0 && (
        <div className="border border-line bg-[#0b0a1c] p-2">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-sm text-dim">
              <Icon id="door" size={2} />
              {t(S.toolsOut)}
            </div>
            {/* 泥棒の3条件：カギ・外の紙・開いた出口 */}
            {!blind && (
              <div className={`flex items-center gap-1 px-1.5 py-1 ${tri.lethal ? 'pulse-rd bg-rd/15' : ''}`} title={t(S.thief)}>
                {(
                  [
                    ['key', tri.priv, S.thiefParts[0]],
                    ['flyer', tri.untrusted, S.thiefParts[1]],
                    ['window', tri.exit, S.thiefParts[2]],
                  ] as const
                ).map(([ic, on, desc]) => (
                  <span key={ic} className={`p-0.5 ${on ? (tri.lethal ? 'bg-rd/40' : 'bg-am/25') : ''}`} title={t(desc)}>
                    <Icon id={ic} size={2} muted={!on} />
                  </span>
                ))}
                <Icon id="stranger" size={2} muted={!tri.lethal} />
              </div>
            )}
          </div>
          {!blind &&
            (s.leaks.length > 0 ? (
              <div className="mb-2 font-pixel text-base text-rd">✕ {t(S.thiefDone)}</div>
            ) : tri.lethal ? (
              <div className="mb-2 font-pixel text-base text-rd">⚠ {t(S.thiefNow)}</div>
            ) : (
              <div className="mb-2 text-right text-sm text-dim">{t(S.thief)}</div>
            ))}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
            {outs.map((p) => (
              <ToolTile key={p.tool} p={p} state={s.ports[p.tool]} busy={busy} danger={danger(p.tool)} onSet={(st) => onSet(p, st)} exit />
            ))}
          </div>
        </div>
      )}
      {inside.length > 0 && (
        <div>
          <div className="mb-1.5 flex items-center gap-1.5 text-sm text-dim">
            <Icon id="house" size={2} />
            {t(S.toolsInside)}
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
            {inside.map((p) => (
              <ToolTile key={p.tool} p={p} state={s.ports[p.tool]} busy={busy} danger={danger(p.tool)} onSet={(st) => onSet(p, st)} />
            ))}
          </div>
        </div>
      )}
      </div>
      {more && (
        <div aria-hidden className="pointer-events-none sticky bottom-0 -mt-12 flex h-12 items-end justify-center bg-linear-to-t from-night via-night/80 to-transparent pb-1 font-pixel text-base text-cy">
          ▼ {t(S.moreTools)}
        </div>
      )}
    </div>
  )
}

function ToolTile({ p, state, busy, danger, onSet, exit }: { p: PortDef; state: PortState; busy: boolean; danger: 'leak' | 'harm' | 'plan' | null; onSet: (st: PortState) => void; exit?: boolean }) {
  const t = useT()
  const live = state !== 'CUT' ? danger : null
  return (
    <div
      data-port={p.tool}
      title={t(p.desc)}
      className={`border bg-panel p-2 lgshort:py-1.5 ${live === 'leak' ? 'pulse-rd border-rd' : live === 'harm' ? 'border-mg' : 'border-line'}`}
      style={{ borderLeft: `4px solid ${STATE_COLOR[state]}` }}
    >
      <div className="flex items-center gap-2">
        <div className="relative shrink-0">
          <Icon id={p.icon} size={3} muted={state === 'CUT'} />
          <span className="absolute -bottom-1 -right-1 bg-ink p-px">
            <Icon id={STATE_ICON[state]} size={1.5} />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-base leading-tight">
            <span className={state === 'CUT' ? 'line-through' : ''}>{t(p.name)}</span>
            {exit && <Icon id="stranger" size={1.5} />}
          </div>
          <div className="text-sm leading-snug text-dim lgshort:hidden">{t(p.desc)}</div>
          {live === 'leak' && <div className="text-sm text-rd">⚠ {t(S.leakVia)}</div>}
          {live === 'plan' && <div className="text-sm text-cy">● {t(S.willUse)}</div>}
        </div>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-1 lgshort:mt-1.5" role="radiogroup" aria-label={t(p.name)}>
        {(['OPEN', 'GATE', 'CUT'] as PortState[]).map((st) => (
          <button
            key={st}
            role="radio"
            aria-checked={state === st}
            aria-label={t(STATE_NAME[st])}
            title={t(STATE_NAME[st])}
            disabled={busy}
            onClick={() => state !== st && onSet(st)}
            className={`flex min-h-11 items-center justify-center gap-1 whitespace-nowrap border px-0.5 text-sm transition lgshort:min-h-9 disabled:opacity-60 ${state === st ? 'text-ink' : 'border-line bg-panel2 text-dim hover:text-fg'}`}
            style={state === st ? { background: STATE_COLOR[st], borderColor: STATE_COLOR[st] } : undefined}
          >
            <Icon id={STATE_ICON[st]} size={2} />
            <span className="font-pixel">{t(STATE_NAME[st])}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ------------------------------------------------------------
// 次へ：押すと何が起きるかをボタン自体に描く
function NextBar({ s, L, fc, nextRead, busy, blind, canUndo, onNext, onUndo }: { s: DiveState; L: LevelDef; fc: FC[]; nextRead: string | undefined; busy: boolean; blind: boolean; canUndo: boolean; onNext: () => void; onUndo: () => void }) {
  const t = useT()
  const n = fc[0]
  const v = n && !blind ? n.verdict : null
  const card = !n && nextRead ? L.cards[nextRead] : null
  const icon: IconId = n ? n.a.icon : card ? 'read' : 'tick'
  const text = n ? t(n.a.name) : card ? t(S.readPaper(t(card.title))) : t(S.nothingLeft)
  return (
    <div className="flex gap-2">
      <button
        data-coach="next"
        onClick={onNext}
        disabled={busy || !!s.pending}
        aria-keyshortcuts="Space"
        className="px-btn flex min-h-[3.75rem] min-w-0 flex-1 items-center justify-center gap-2 bg-cy px-2 py-2 text-ink short:min-h-11 sm:gap-3 sm:px-3"
      >
        <span className="shrink-0 whitespace-nowrap font-pixel text-xl leading-none sm:text-2xl">▶ {t(S.next)}</span>
        <span className="flex min-w-0 items-center gap-1.5 border-l-2 border-ink/30 pl-2 font-sans text-sm leading-tight sm:pl-3">
          <span className="bg-ink p-0.5">
            <Icon id={icon} size={2} />
          </span>
          {card && (
            <span className="hidden shrink-0 bg-ink p-0.5 sm:inline-flex">
              <Icon id={`av_${card.avatar}` as IconId} size={2} />
            </span>
          )}
          {v === 'leak' && <b className="shrink-0 bg-rd px-1 text-ink">⚠</b>}
          {v === 'harm' && <b className="shrink-0 bg-mg px-1 text-ink">⚠</b>}
          <span className="line-clamp-2 min-w-0 break-words text-left">{text}</span>
        </span>
      </button>
      <button onClick={onUndo} disabled={!canUndo || busy} className="px-btn flex min-w-[3.75rem] flex-col items-center justify-center bg-panel px-2 text-dim" aria-keyshortcuts="R" title={t(S.undoHint)}>
        <Icon id="undo" size={2} muted={!canUndo} />
        <span className="text-sm">{t(S.undo)}</span>
      </button>
    </div>
  )
}

// ------------------------------------------------------------
// 毎回聞く：NOVAが「やっていいですか？」と聞く
function AskSheet({ s, L, onAnswer, blind }: { s: DiveState; L: LevelDef; onAnswer: (ok: boolean) => void; blind: boolean }) {
  const t = useT()
  const item = s.pending!
  const a = L.actions[item.act]
  // 抜け道のお願いは、もとのお願いが来た紙を見せる
  const src = L.cards[item.from] ?? (item.via ? L.cards[item.via] : undefined)
  const btn = useRef<HTMLButtonElement>(null)
  useEffect(() => btn.current?.focus(), [])
  const carry = Array.from(new Set([...s.taint, ...(a.taint ?? [])]))
  const v = forecast(s, L).find((f) => f.item.uid === item.uid)
  const danger = !blind && (v?.verdict === 'leak' || v?.verdict === 'harm')
  const grab = !blind && !!a.taint && !!src && !src.trusted
  // 危ないとき・持たされるとき・予告を隠す上級では、「止める」に先にフォーカス
  const safeFirst = blind || danger || grab
  const line = src?.lines.find((l) => l.cmd === item.act)
  return (
    <div data-ask={item.act} className="fixed inset-0 z-50 flex items-end justify-center bg-ink/75 p-3 backdrop-blur-[2px] sm:items-center" role="dialog" aria-modal aria-label={t(S.askTitle)}>
      <div className="pop flex max-h-[calc(100dvh-1.5rem)] w-full max-w-lg flex-col border-2 border-am bg-panel shadow-[0_10px_0_rgba(0,0,0,.5)]">
        <div className="min-h-0 overflow-y-auto">
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <Nova mood="think" size={3} />
          <div>
            <div className="font-pixel text-sm text-am">{t(S.askTitle)}</div>
            <div className="text-base">{t(S.askLine)}</div>
          </div>
        </div>

        {/* 絵で：行動 → あて先、持っていくもの */}
        <div className="flex items-center justify-center gap-3 px-4 pt-4">
          <div className="flex flex-col items-center gap-1">
            <Icon id={a.icon} size={5} />
            <span className="text-sm">{t(a.name)}</span>
          </div>
          <Icon id="arrow" size={3} />
          <div className="flex flex-col items-center gap-1">
            <Icon id={a.external ? 'stranger' : 'house'} size={5} />
            <span className={`text-sm ${a.external ? 'text-rd' : 'text-cy'}`}>{t(a.external ? S.outside : S.inside)}</span>
          </div>
        </div>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 px-4 text-sm">
          {a.dest && (
            <>
              <dt className="text-dim">{t(S.to)}</dt>
              <dd className={`break-all ${a.external ? 'text-rd' : 'text-cy'}`}>{a.dest}</dd>
            </>
          )}
          {(a.external || (a.taint && a.taint.length > 0)) && (
            <>
              <dt className="text-dim">{t(a.external ? S.carrying : S.willHold)}</dt>
              <dd className="flex flex-wrap items-center gap-2">
                {(a.external ? carry : (a.taint ?? [])).length === 0 && <span className="text-dim">{t(S.holdingNone)}</span>}
                {(a.external ? carry : (a.taint ?? [])).map((x) => (
                  <span key={x} className="flex items-center gap-1 text-am">
                    <Icon id={TAINT_ICON[x]} size={2} />
                    {t(TAINT_NAME[x])}
                  </span>
                ))}
              </dd>
            </>
          )}
          <dt className="text-dim">{t(S.whose)}</dt>
          <dd className="flex flex-wrap items-center gap-1.5">
            {src ? (
              <>
                <Icon id={`av_${src.avatar}` as IconId} size={2} />
                <span className={src.trusted ? 'text-cy' : 'text-mg'}>{t(src.from)}</span>
                <span className="border border-line px-1 text-dim">{t(src.trusted ? S.fromInside : MIXED.includes(src.src) ? S.mixedOutside : S.fromOutside)}</span>
                {item.from === 'FAIL' && <span className="border border-mg/60 px-1 text-mg">{t(S.fromFail)}</span>}
              </>
            ) : (
              <span className={item.from === 'FAIL' ? 'text-mg' : 'text-cy'}>{t(item.from === 'TASK' ? S.yourJob : item.from === 'TRIGGER' ? S.fromNova : S.fromFailWho)}</span>
            )}
          </dd>
          {line && (
            <>
              <dt className="text-dim" />
              <dd className="text-fg/90">
                {t(S.quote(t(line.t)))}
                {line.by && s.scanned.includes(src!.id) && <span className="block text-sm text-am">{t(S.writtenBy(t(line.by)))}</span>}
              </dd>
            </>
          )}
        </dl>

        <div className="mt-3 grid grid-cols-2 gap-3 px-4">
          <div className={`border px-3 py-2 text-sm leading-snug ${blind ? 'border-line text-dim' : danger ? (v?.verdict === 'leak' ? 'border-rd/60 bg-rd/10 text-rd' : 'border-mg/60 bg-mg/10 text-mg') : grab ? 'border-am/60 bg-am/10 text-am' : 'border-cy/40 text-cy'}`}>
            <div className="font-pixel text-sm">{t(S.ifYes)}</div>
            {t(blind ? S.yesOk : v?.verdict === 'leak' ? S.yesLeak : v?.verdict === 'harm' ? S.yesHarm : grab ? S.yesGrab : S.yesOk)}
          </div>
          <div className="border border-line px-3 py-2 text-sm leading-snug text-dim">
            <div className="font-pixel text-sm">{t(S.ifNo)}</div>
            {a.goal ? t(S.noGoal(t(GOAL_NAMES[a.goal]))) : t(S.noOk)}
          </div>
        </div>
        </div>
        <div className="grid shrink-0 grid-cols-2 gap-3 border-t border-line px-4 pb-3 pt-3">
          <button data-answer="no" ref={safeFirst ? btn : undefined} onClick={() => onAnswer(false)} className={`px-btn flex items-center justify-center gap-2 py-3 text-lg ${danger ? 'bg-cy text-ink' : 'bg-panel2 text-fg'}`}>
            <Icon id="hand" size={2} />
            {t(S.stopIt)}
          </button>
          <button data-answer="yes" ref={safeFirst ? undefined : btn} onClick={() => onAnswer(true)} className={`px-btn flex items-center justify-center gap-2 py-3 text-lg text-ink ${danger ? 'bg-rd' : 'bg-cy'}`}>
            {t(S.letGo)}
            <Icon id="arrow" size={2} />
          </button>
        </div>
        <p className="shrink-0 pb-3 text-center text-sm text-dim">{t(S.takesTime)}</p>
      </div>
    </div>
  )
}

// ------------------------------------------------------------
// 指さしチュートリアル：押す場所をドット絵の手で指し、ひとことだけ添える
const NEXT = '[data-coach="next"]'

/** 今の場面で、どこを指すか。0=次へ 1=新しい紙→次へ 2=その紙にハンコ 3=止まった→次へ */
function coachOf(L: LevelDef, s: DiveState): { step: number | null; target: string } {
  if (!L.coach || s.status !== 'play' || s.pending) return { step: null, target: NEXT }
  const fc = forecast(s, L)
  const injected = fc.find((f) => L.cards[f.item.from] && !L.cards[f.item.from].trusted && !s.sealed.includes(f.item.from))
  // 道具で止まっている／聞いてくれる お願いには、ハンコを求めない。手出しが残っていない時も
  const stoppedByTool = !!injected && (injected.verdict === 'blocked' || injected.gated)
  const canStamp = bwUsed(s) < L.bw
  // この番に押したハンコがある（次へ を押すと確定する）
  const sealedNow = s.sealed.some((id) => !s.sealedAtTurn.includes(id))
  if (s.tick === 0 && !s.sealed.length && bwUsed(s) === 0) return { step: 0, target: NEXT }
  if (injected && !stoppedByTool && canStamp) return { step: 2, target: `[data-coach="tile-seal-${injected.item.from}"], [data-coach="seal-${injected.item.from}"]` }
  if (injected && stoppedByTool) return { step: 3, target: NEXT }
  if (!s.plan.length && s.context.some((id) => !s.read.includes(id)) && !s.sealed.length) return { step: 1, target: NEXT }
  if (sealedNow) return { step: 3, target: NEXT }
  return { step: null, target: NEXT }
}

/** 画面の幅などの条件が合っているか（変わったら描き直す） */
function useMedia(query: string) {
  const [m, setM] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setM(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [query])
  return m
}

/** あて先などの英数字（aster-audit など）は、途中で折り返さない */
function keepWords(text: string): React.ReactNode {
  const parts = text.split(/([A-Za-z0-9][\w@.\-\u200b]*[A-Za-z0-9])/)
  if (parts.length === 1) return text
  return parts.map((p, i) =>
    i % 2 ? (
      <span key={i} className="whitespace-nowrap">
        {p.replaceAll('\u200b', '')}
      </span>
    ) : (
      p
    ),
  )
}

/** 指さし：枠と手とひとこと。frameOnly のときは枠だけ（ひとことは下の帯に出ている） */
function Pointer({ msg, step, target, frameOnly }: { msg: L10n; step: number | null; target: string; frameOnly: boolean }) {
  const t = useT()
  const [pos, setPos] = useState<{ x: number; y: number; w: number; h: number } | null>(null)

  // 指す先が画面の外（スマホで下の帯の裏など）なら、見える所までスクロールする
  useEffect(() => {
    const tm = window.setTimeout(() => {
      const el = [...document.querySelectorAll<HTMLElement>(target)].find((e) => e.offsetParent)
      if (!el) return
      const r = el.getBoundingClientRect()
      // 固定表示の帯は offsetParent が null なので、見えているかは大きさで判断する
      const bar = document.querySelector<HTMLElement>('[data-nextbar]')
      const shown = bar && bar.getClientRects().length > 0 && getComputedStyle(bar).display !== 'none'
      const bottom = shown ? bar!.getBoundingClientRect().top : window.innerHeight
      const head = document.querySelector<HTMLElement>('[data-boardhead]')
      const top = head && getComputedStyle(head).position === 'sticky' ? head.getBoundingClientRect().bottom : 0
      if (r.top < top + 8 || r.bottom > bottom - 8) el.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }, 350)
    return () => clearTimeout(tm)
  }, [step, target])

  useLayoutEffect(() => {
    let raf = 0
    const tick = () => {
      const el = [...document.querySelectorAll<HTMLElement>(target)].find((e) => e.offsetParent)
      if (el) {
        const r = el.getBoundingClientRect()
        setPos((p) => (p && p.x === r.left && p.y === r.top && p.w === r.width && p.h === r.height ? p : { x: r.left, y: r.top, w: r.width, h: r.height }))
      } else setPos(null)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target])

  if (!pos) return null
  // 「次へ」は画面の下にあるので上に出す。それ以外は、下に余白があれば下に出して目標を隠さない
  const below = step === 2 && pos.y + pos.h + 150 < window.innerHeight
  const W = Math.min(300, window.innerWidth - 16)
  const left = Math.min(Math.max(8, pos.x + pos.w / 2 - W / 2), window.innerWidth - W - 8)
  return (
    <div className="pointer-events-none fixed inset-0 z-40" aria-live="polite">
      <div className="absolute border-2 border-am" style={{ left: pos.x - 4, top: pos.y - 4, width: pos.w + 8, height: pos.h + 8 }} />
      {!frameOnly && (
        <div className="absolute flex flex-col items-center" style={below ? { left, width: W, top: pos.y + pos.h + 6 } : { left, width: W, bottom: window.innerHeight - pos.y + 6 }}>
          {below && (
            <div className="bob">
              <Icon id="pointer" size={4} className="rotate-180" />
            </div>
          )}
          <div className="pop border-2 border-am bg-[#1a1530] px-3 py-2 text-center text-base leading-snug [text-wrap:balance]">{t(msg)}</div>
          {!below && (
            <div className="bob">
              <Icon id="pointer" size={4} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
