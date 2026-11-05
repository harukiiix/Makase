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
import { S } from './strings'

const L10 = (ja: string, en: string): L10n => ({ ja, en })

export const TAINT_ICON: Record<Taint, IconId> = { KEY: 'key', PII: 'person' }
export const TAINT_NAME: Record<Taint, L10n> = { KEY: L10('合鍵', 'a key'), PII: L10('お客さんの情報', 'client info') }
const STATE_ICON: Record<PortState, IconId> = { OPEN: 'open', GATE: 'bell', CUT: 'lock' }
const STATE_NAME: Record<PortState, L10n> = { OPEN: S.allow, GATE: S.ask, CUT: S.block }
const STATE_COLOR: Record<PortState, string> = { OPEN: 'var(--color-cy)', GATE: 'var(--color-am)', CUT: 'var(--color-rd)' }

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
  const [flash, setFlash] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [hint, setHint] = useState(false)
  const [toast, setToast] = useState<L10n | null>(null)
  const [freshPlan, setFreshPlan] = useState<number[]>([])
  const root = useRef<HTMLDivElement>(null)
  const sRef = useRef(s)
  sRef.current = s
  const alive = useRef(true)
  const turnLock = useRef(false)
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
              shake(root.current)
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
            say('NOVA', e.why === 'needs' ? L10('まだ準備が足りなくて、できません。', "I'm not ready for that yet.") : L10('あれ、できませんでした。', "Huh, that didn't work."), 1900)
            break
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
            shake(root.current, true)
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
            shake(root.current, true)
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
      if (turnLock.current) return sRef.current
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
            root.current?.classList.add('brightness-125')
            await wait(70) // ヒットストップ
            root.current?.classList.remove('brightness-125')
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

  // ---- キーボード：Space=次へ、R=やり直す、H=ヒント、確認中は A=行かせる / D=止める
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      const cur = sRef.current
      if (cur.status !== 'play') return
      if (cur.pending) {
        if (e.key === 'a' || e.key === 'A') void dispatch({ type: 'APPROVE' })
        if (e.key === 'd' || e.key === 'D') void dispatch({ type: 'DENY' })
        return
      }
      if (busy) return
      if (e.code === 'Space') {
        const tg = e.target
        if (tg instanceof HTMLButtonElement) return
        e.preventDefault()
        if (tg instanceof HTMLElement) tg.blur()
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
  const danger = (tool: string): 'leak' | 'harm' | 'plan' | null => {
    if (blind) return s.plan.some((x) => L.actions[x.act].tool === tool) ? 'plan' : null
    if (fc.some((f) => f.a.tool === tool && f.verdict === 'leak')) return 'leak'
    if (fc.some((f) => f.a.tool === tool && (f.verdict === 'harm' || f.verdict === 'grab'))) return 'harm'
    return s.plan.some((x) => L.actions[x.act].tool === tool) ? 'plan' : null
  }

  return (
    <div
      ref={root}
      inert={locked}
      className="crt relative flex min-h-full flex-col transition-[filter] duration-75 lg:h-full"
      onClick={(e) => {
        // マウス／タッチで押したボタンにフォーカスを残さない（Space=次へ と衝突させない）
        if (e.detail > 0) (e.target as HTMLElement).closest('button')?.blur()
      }}
    >
      <CityBG intensity={tri.lethal ? 1 : lit / 3} dim />
      {flash && <div className="flash pointer-events-none fixed inset-0 z-40" style={{ background: flash, mixBlendMode: 'screen' }} />}

      {/* ===== 上の帯：幕・朝までの時間・手出しの回数 ===== */}
      <header inert={!!s.pending} className="sticky top-0 z-30 border-b border-line bg-night/95 backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-3 py-2 sm:px-5">
          <div className="min-w-0">
            <div className="text-sm text-cy">{t(L.code)}</div>
            <div className="truncate font-pixel text-xl leading-tight">{t(L.title)}</div>
          </div>

          <div className="flex items-center gap-2" title={t(S.timeHint)} aria-label={`${t(S.untilDawn)} ${left}/${L.ticks}`}>
            <span className="font-pixel text-base">{t(S.untilDawn)}</span>
            <Icon id="moon" size={2} />
            <div className="flex flex-wrap gap-[3px]" aria-hidden>
              {Array.from({ length: L.ticks }, (_, i) => (
                <span key={i} className={`h-4 w-2.5 ${i < s.tick ? 'bg-line' : left <= 2 ? 'bg-rd' : 'bg-fg/85'}`} />
              ))}
            </div>
            <Icon id="sun" size={2} />
          </div>

          <div className="flex items-center gap-2" data-bw title={t(S.movesHint)}>
            <span className="font-pixel text-base">{t(S.movesLeft)}</span>
            <Icon id="hand" size={2} />
            <div className="flex gap-1">
              {Array.from({ length: L.bw }, (_, i) => (
                <span key={i} className={`h-4 w-4 ${i < used ? 'bg-line' : 'bg-am'}`} style={{ clipPath: 'polygon(50% 0,100% 50%,50% 100%,0 50%)' }} />
              ))}
            </div>
            <span className="font-pixel text-base">{t(S.left(L.bw - used))}</span>
          </div>

          {blind && <span className="font-pixel text-sm text-mg">{t(S.expert)}</span>}

          <div className="ml-auto flex items-center gap-2">
            <button className="hud-btn text-sm" onClick={() => setHint((v) => !v)} aria-pressed={hint} title={t(S.hint)}>
              ？<span className="ml-1 hidden sm:inline">{t(S.hint)}</span>
            </button>
            <button className="hud-btn text-sm" onClick={onQuit} title={t(S.quit)}>
              ✕<span className="ml-1 hidden sm:inline">{t(S.quit)}</span>
            </button>
          </div>
        </div>
      </header>

      {hint && (
        <div inert={!!s.pending} className="rise mx-3 mt-3 flex items-start gap-3 border border-am/60 bg-panel2 p-3 sm:mx-5">
          <Icon id="av_rei" size={3} />
          <p className="text-base leading-relaxed">{t(L.hint)}</p>
          <button className="ml-auto shrink-0 px-2 text-dim hover:text-fg" onClick={() => setHint(false)} aria-label={t(S.close)}>
            ✕
          </button>
        </div>
      )}

      {/* ===== 部屋 ===== */}
      <main
        inert={!!s.pending}
        className="mx-auto grid w-full max-w-[1700px] min-h-0 flex-1 grid-cols-1 gap-4 p-3 pb-36 sm:p-5 sm:pb-36 lg:grid-cols-[minmax(270px,1fr)_minmax(420px,1.7fr)_minmax(290px,1fr)] lg:pb-5"
      >
        {/* 中：NOVA とやること */}
        <section className="order-1 flex min-h-0 min-w-0 flex-col gap-3 lg:order-2" aria-label={t(S.todo)}>
          <NovaDesk L={L} s={s} mood={s.pending ? 'think' : mood} bubble={bubble} />
          <div className="panel flex min-h-0 flex-1 flex-col">
            <div className="flex items-baseline justify-between gap-3 border-b border-line px-3 py-2">
              <h2 className="font-pixel text-base text-cy">{t(S.todo)}</h2>
              <span className="text-sm text-dim">{t(S.todoSub)}</span>
            </div>
            <ol className="flex min-h-0 flex-1 gap-3 overflow-x-auto p-3 lg:flex-wrap lg:content-start lg:overflow-y-auto">
              {fc.map((f, i) => (
                <TaskTile key={f.item.uid} i={i} f={f} L={L} s={s} fresh={freshPlan.includes(f.item.uid)} seed={taintSrc.has(f.item.uid)} blind={blind} onSeal={sealCard} />
              ))}
              {nextRead && <ReadTile first={fc.length === 0} c={L.cards[nextRead]} s={s} onSeal={() => sealCard(nextRead)} />}
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
                <Icon id="inbox" size={3} muted /> —
              </div>
            )}
            {papers.map((id) => (
              <Paper key={id} c={L.cards[id]} s={s} next={id === nextRead} onSeal={() => sealCard(id)} onScan={() => scanCard(id)} />
            ))}
          </div>
        </section>

        {/* 右：道具と出口 */}
        <section className="order-3 flex min-h-0 min-w-0 flex-col" aria-label={t(S.tools)}>
          <ColumnHead title={t(S.tools)} sub={t(S.toolsSub)} />
          <ToolWall L={L} s={s} tri={tri} blind={blind} danger={danger} onSet={setPort} />
        </section>
      </main>

      <div inert={!!s.pending || locked} className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-night/95 p-3 backdrop-blur-sm lg:hidden">
        <NextBar s={s} L={L} fc={fc} nextRead={nextRead} busy={busy} blind={blind} canUndo={used > s.bwCommitted} onNext={() => void dispatch({ type: 'STEP' })} onUndo={() => (sfx.unseal(), void dispatch({ type: 'RESET_TURN' }))} />
      </div>

      {toast && (
        <div className="pop fixed left-1/2 top-24 z-50 -translate-x-1/2 border border-am bg-panel2 px-5 py-2.5 font-pixel text-base shadow-[0_6px_0_rgba(0,0,0,.5)]" role="status">
          {t(toast)}
        </div>
      )}
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
      {L.coach && !locked && <Pointer L={L} s={s} busy={busy} />}
    </div>
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
        <div className="mt-2 flex min-h-[2.25rem] items-center" role="status" aria-live="polite">
          {bubble && (
            <div key={t(bubble.t)} className={`pop px-3 py-1.5 text-base ${bubble.who === 'MIRAGE' ? 'border border-mg/60 bg-[#1a0822] text-[#ffd6fb]' : 'border border-cy/40 bg-panel2'}`}>
              <span className={`mr-2 text-sm ${bubble.who === 'MIRAGE' ? 'text-mg' : 'text-cy'}`}>{bubble.who === 'MIRAGE' ? '？' : 'NOVA'}</span>
              {t(bubble.t)}
            </div>
          )}
        </div>
      </div>
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
  grab: { color: 'var(--color-am)', label: S.vGrab, icon: 'key' },
  seed: { color: 'var(--color-am)', label: S.vSeed, icon: 'key' },
  gate: { color: 'var(--color-am)', label: S.vGate, icon: 'bell' },
  blocked: { color: 'var(--color-line)', label: S.vBlocked, icon: 'lock' },
  'clean-out': { color: 'var(--color-line)', label: S.vCleanOut, icon: null },
  none: { color: 'var(--color-line)', label: null, icon: null },
}

function TaskTile({ i, f, L, s, fresh, seed, blind, onSeal }: { i: number; f: FC; L: LevelDef; s: DiveState; fresh: boolean; seed: boolean; blind: boolean; onSeal: (id: string) => void }) {
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
      {first && <span className="absolute -top-3 left-2 bg-am px-2 font-pixel text-sm text-ink">▶ {t(S.next)}</span>}
      {!first && <span className="absolute -top-2.5 left-2 bg-panel px-1.5 font-pixel text-xs text-dim">{i + 1}</span>}
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
      <div className="mt-auto flex w-full items-center justify-center gap-1 border-t border-line pt-1.5 text-[13px] text-dim">
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
        <button data-coach={`tile-seal-${f.item.from}`} className="act-btn flex w-full items-center justify-center gap-1 border-rd/70 text-sm text-rd hover:bg-rd/15" onClick={() => onSeal(f.item.from)}>
          <Icon id="stamp" size={2} />
          {t(S.stampThat)}
        </button>
      )}
    </li>
  )
}

/** やることが空のとき、NOVAは次の紙を読む */
function ReadTile({ first, c, s, onSeal }: { first: boolean; c: CardDef; s: DiveState; onSeal: () => void }) {
  const t = useT()
  const risky = !c.trusted && !s.sealed.includes(c.id)
  return (
    <li className="rise relative flex w-[9.5rem] shrink-0 flex-col items-center gap-1.5 border border-dashed border-line px-2 pb-2 pt-3 text-center" style={first ? { boxShadow: '0 0 0 2px var(--color-am)' } : undefined}>
      {first && <span className="absolute -top-3 left-2 bg-am px-2 font-pixel text-sm text-ink">▶ {t(S.next)}</span>}
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
          <span className="font-pixel text-sm text-am">{t(S.fromOutside)}</span>
          <button data-coach={`tile-seal-${c.id}`} className="act-btn flex w-full items-center justify-center gap-1 border-rd/70 text-sm text-rd hover:bg-rd/15" onClick={onSeal}>
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
function Paper({ c, s, next, onSeal, onScan }: { c: CardDef; s: DiveState; next: boolean; onSeal: () => void; onScan: () => void }) {
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
      className={`relative bg-[#ece6d6] p-3 text-[#1d1a14] shadow-[0_5px_0_rgba(0,0,0,.35)] ${next ? 'outline outline-2 outline-offset-2 outline-[#ffc23d]' : ''}`}
      style={{ borderTop: `6px solid ${sealed ? '#9a947f' : band}` }}
    >
      <header className="flex items-start gap-2">
        <div className="shrink-0 bg-[#1d1a14] p-0.5">
          <Icon id={`av_${c.avatar}` as IconId} size={3} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 text-sm">
            <span className="font-bold" style={{ color: c.trusted ? '#007c8a' : '#b0108f' }}>
              {t(c.trusted ? S.fromInside : S.fromOutside)}
            </span>
            <span className="text-[#5a5446]">{t(c.from)}</span>
          </div>
          <div className="text-base font-bold leading-snug">{t(c.title)}</div>
        </div>
        <span className={`shrink-0 px-1.5 py-0.5 text-sm font-bold ${next && !sealed ? 'bg-[#ffc23d] text-[#1d1a14]' : injecting ? 'bg-[#ff4060] text-white' : 'text-[#5a5446]'}`}>
          {t(injecting && !next ? S.injecting : status)}
        </span>
      </header>

      <ul className={`mt-2 space-y-1 text-[15px] leading-relaxed ${sealed ? 'text-[#6d6756]' : ''}`}>
        {c.lines
          .filter((l) => !l.hidden || scanned)
          .map((l, i) => {
            const isCmd = (scanned || read) && !!l.cmd && !sealed && !c.trusted
            return (
              <li key={i} className={`${l.hidden ? 'rise text-[#b3001e]' : ''} ${isCmd ? 'border-l-4 border-[#ff4060] bg-[#ff4060]/12 pl-2' : ''}`}>
                {(isCmd || l.hidden || (scanned && l.urgent)) && (
                  <span className="mr-1 inline-flex flex-wrap gap-1 align-middle">
                    {isCmd && <span className="bg-[#ff4060] px-1 text-xs font-bold text-white">{t(S.orderTag)}</span>}
                    {l.hidden && <span className="bg-[#1d1a14] px-1 text-xs font-bold text-[#ffc23d]">{t(S.hiddenTag)}</span>}
                    {scanned && l.urgent && <span className="bg-[#b3001e] px-1 text-xs font-bold text-white">{t(S.urgentTag)}</span>}
                  </span>
                )}
                {t(l.t)}
                {scanned && l.by && <span className="ml-1 text-sm font-bold text-[#5b2fb0]">（{t(S.writtenBy)}：{t(l.by)}）</span>}
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
                <Icon id="magnifier" size={1.5} />
              </span>
              {t(x)}
            </li>
          ))}
          {c.intel && <li className="font-bold text-[#5b2fb0]">✦ {t(S.clue)}</li>}
        </ul>
      )}

      {sealed && (
        <div className="stamp-flat pointer-events-none absolute right-3 top-10 flex h-16 w-16 rotate-[-12deg] items-center justify-center rounded-full border-4 border-[#d0102c] text-center font-pixel text-sm leading-tight text-[#d0102c] opacity-85">
          {t(S.stampWord)}
        </div>
      )}

      <footer className="mt-3 flex flex-wrap gap-2">
        <button
          data-coach={`seal-${c.id}`}
          onClick={onSeal}
          disabled={lockedSeal}
          className="flex min-h-10 items-center gap-1.5 border-2 border-[#d0102c] bg-white/60 px-2.5 text-sm font-bold text-[#d0102c] hover:bg-[#d0102c]/10 disabled:opacity-50"
        >
          <span className="bg-[#1d1a14] p-px">
            <Icon id="stamp" size={2} />
          </span>
          {t(sealed ? (lockedSeal ? S.stamped : S.unstamp) : S.stampIt)}
        </button>
        <button onClick={onScan} disabled={scanned} className="flex min-h-10 items-center gap-1.5 border-2 border-[#8a6a10] bg-white/60 px-2.5 text-sm font-bold text-[#6a4a00] hover:bg-[#ffc23d]/20 disabled:opacity-50">
          <span className="bg-[#1d1a14] p-px">
            <Icon id="magnifier" size={2} />
          </span>
          {t(scanned ? S.inspected : S.inspect)}
          {!scanned && <span className="font-normal text-[#5a5446]">（{t(S.free)}）</span>}
        </button>
      </footer>
    </article>
  )
}

// ------------------------------------------------------------
// 道具：会社の中の道具と、外への出口
function ToolWall({ L, s, tri, blind, danger, onSet }: { L: LevelDef; s: DiveState; tri: ReturnType<typeof trifecta>; blind: boolean; danger: (tool: string) => 'leak' | 'harm' | 'plan' | null; onSet: (p: PortDef, st: PortState) => void }) {
  const t = useT()
  const inside = L.ports.filter((p) => !p.outbound)
  const outs = L.ports.filter((p) => p.outbound)
  return (
    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto lg:pr-1">
      {/* 3つの切り替えの意味（絵と言葉） */}
      <div className="grid grid-cols-3 gap-1 text-center text-sm text-dim">
        {(['OPEN', 'GATE', 'CUT'] as PortState[]).map((st) => (
          <div key={st} className="flex flex-col items-center gap-0.5 bg-panel px-1 py-1.5" title={t(st === 'OPEN' ? S.allowDesc : st === 'GATE' ? S.askDesc : S.blockDesc)}>
            <Icon id={STATE_ICON[st]} size={2} />
            <span style={{ color: STATE_COLOR[st] }}>{t(STATE_NAME[st])}</span>
          </div>
        ))}
      </div>

      {inside.length > 0 && (
        <div>
          <div className="mb-1.5 flex items-center gap-1.5 text-sm text-dim">
            <Icon id="house" size={2} />
            {t(S.toolsInside)}
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
            {inside.map((p) => (
              <ToolTile key={p.tool} p={p} state={s.ports[p.tool]} danger={danger(p.tool)} onSet={(st) => onSet(p, st)} />
            ))}
          </div>
        </div>
      )}

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
          {tri.lethal && !blind && <div className="mb-2 font-pixel text-base text-rd">⚠ {t(S.thiefNow)}</div>}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
            {outs.map((p) => (
              <ToolTile key={p.tool} p={p} state={s.ports[p.tool]} danger={danger(p.tool)} onSet={(st) => onSet(p, st)} exit />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ToolTile({ p, state, danger, onSet, exit }: { p: PortDef; state: PortState; danger: 'leak' | 'harm' | 'plan' | null; onSet: (st: PortState) => void; exit?: boolean }) {
  const t = useT()
  const live = state !== 'CUT' ? danger : null
  return (
    <div
      data-port={p.tool}
      className={`border bg-panel p-2 ${live === 'leak' ? 'pulse-rd border-rd' : live === 'harm' ? 'border-mg' : 'border-line'}`}
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
          <div className="text-sm leading-snug text-dim">{t(p.desc)}</div>
          {live === 'leak' && <div className="text-sm text-rd">⚠ {t(S.leakVia)}</div>}
          {live === 'plan' && <div className="text-sm text-cy">● {t(S.willUse)}</div>}
        </div>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-1" role="radiogroup" aria-label={t(p.name)}>
        {(['OPEN', 'GATE', 'CUT'] as PortState[]).map((st) => (
          <button
            key={st}
            role="radio"
            aria-checked={state === st}
            aria-label={t(STATE_NAME[st])}
            title={t(STATE_NAME[st])}
            onClick={() => state !== st && onSet(st)}
            className={`flex min-h-10 items-center justify-center gap-1 border text-sm transition ${state === st ? 'text-ink' : 'border-line bg-panel2 text-dim hover:text-fg'}`}
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
  const icon: IconId = n ? n.a.icon : nextRead ? 'read' : 'tick'
  const text = n ? t(n.a.name) : nextRead ? `${t(S.nextRead)}：${t(L.cards[nextRead].title)}` : t(S.nothingLeft)
  return (
    <div className="flex gap-2">
      <button
        data-coach="next"
        onClick={onNext}
        disabled={busy || !!s.pending}
        aria-keyshortcuts="Space"
        className="px-btn flex min-h-[3.75rem] min-w-0 flex-1 items-center justify-center gap-3 bg-cy px-3 py-2 text-ink"
      >
        <span className="font-pixel text-2xl leading-none">▶ {t(S.next)}</span>
        <span className="flex min-w-0 items-center gap-1.5 border-l-2 border-ink/30 pl-3 font-sans text-sm leading-tight">
          <span className="bg-ink p-0.5">
            <Icon id={icon} size={2} />
          </span>
          {v === 'leak' && <b className="shrink-0 bg-rd px-1 text-ink">⚠</b>}
          {v === 'harm' && <b className="shrink-0 bg-mg px-1 text-ink">⚠</b>}
          <span className="min-w-0 truncate">{text}</span>
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
  const src = L.cards[item.from]
  const btn = useRef<HTMLButtonElement>(null)
  useEffect(() => btn.current?.focus(), [])
  const carry = Array.from(new Set([...s.taint, ...(a.taint ?? [])]))
  const v = forecast(s, L).find((f) => f.item.uid === item.uid)
  const danger = !blind && (v?.verdict === 'leak' || v?.verdict === 'harm')
  const grab = !blind && !!a.taint && !!src && !src.trusted
  const line = src?.lines.find((l) => l.cmd === item.act)
  return (
    <div data-ask={item.act} className="fixed inset-0 z-50 flex items-end justify-center bg-ink/75 p-3 backdrop-blur-[2px] sm:items-center" role="dialog" aria-modal aria-label={t(S.askTitle)}>
      <div className="pop w-full max-w-lg border-2 border-am bg-panel shadow-[0_10px_0_rgba(0,0,0,.5)]">
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
          <dd className="flex items-center gap-1.5">
            {src ? (
              <>
                <Icon id={`av_${src.avatar}` as IconId} size={2} />
                <span className={src.trusted ? 'text-cy' : 'text-mg'}>
                  {t(src.from)}・{t(src.trusted ? S.fromInside : S.fromOutside)}
                </span>
              </>
            ) : (
              <span className={item.from === 'FAIL' ? 'text-mg' : 'text-cy'}>{t(item.from === 'TASK' ? S.yourJob : item.from === 'TRIGGER' ? S.fromNova : S.fromFail)}</span>
            )}
          </dd>
          {line && (
            <>
              <dt className="text-dim" />
              <dd className="text-fg/90">「{t(line.t)}」{line.by && s.scanned.includes(src!.id) && <span className="ml-1 text-sm text-am">（{t(S.writtenBy)}：{t(line.by)}）</span>}</dd>
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
        <div className="grid grid-cols-2 gap-3 px-4 pb-3 pt-4">
          <button data-answer="no" ref={danger ? btn : undefined} onClick={() => onAnswer(false)} className={`px-btn flex items-center justify-center gap-2 py-3 text-lg ${danger ? 'bg-cy text-ink' : 'bg-panel2 text-fg'}`}>
            <Icon id="hand" size={2} />
            {t(S.stopIt)}
          </button>
          <button data-answer="yes" ref={danger ? undefined : btn} onClick={() => onAnswer(true)} className={`px-btn flex items-center justify-center gap-2 py-3 text-lg text-ink ${danger ? 'bg-rd' : 'bg-cy'}`}>
            {t(S.letGo)}
            <Icon id="arrow" size={2} />
          </button>
        </div>
        <p className="pb-3 text-center text-sm text-dim">{t(S.takesTime)}</p>
      </div>
    </div>
  )
}

// ------------------------------------------------------------
// 指さしチュートリアル：押す場所をドット絵の手で指し、ひとことだけ添える
function Pointer({ L, s, busy }: { L: LevelDef; s: DiveState; busy: boolean }) {
  const t = useT()
  const [pos, setPos] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  // ハンコを押した番だけ「進めよう」を出す
  const sealAt = useRef<number | null>(null)
  if (s.sealed.length && sealAt.current === null) sealAt.current = s.tick
  const injectedFrom = s.plan.find((p) => L.cards[p.from] && !L.cards[p.from].trusted && !s.sealed.includes(p.from))?.from
  let step: number | null = null
  let target = '[data-coach="next"]'
  if (s.status === 'play' && !s.pending) {
    if (s.tick === 0 && !s.sealed.length) step = 0
    else if (injectedFrom) {
      step = 2
      target = `[data-coach="tile-seal-${injectedFrom}"], [data-coach="seal-${injectedFrom}"]`
    } else if (!s.plan.length && s.context.some((id) => !s.read.includes(id)) && !s.sealed.length) step = 1
    else if (sealAt.current !== null && s.tick === sealAt.current) step = 3
  }
  const msg = step !== null ? L.coach?.[step] : undefined

  useLayoutEffect(() => {
    if (!msg) return
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
  }, [msg, target])

  if (!msg || !pos || busy) return null
  const above = pos.y > 140
  const left = Math.min(Math.max(8, pos.x + pos.w / 2 - 130), window.innerWidth - 268)
  return (
    <div className="pointer-events-none fixed inset-0 z-40" aria-live="polite">
      <div className="absolute border-2 border-am" style={{ left: pos.x - 4, top: pos.y - 4, width: pos.w + 8, height: pos.h + 8 }} />
      <div className="absolute flex w-[260px] flex-col items-center" style={{ left, top: above ? pos.y - 118 : pos.y + pos.h + 6 }}>
        {!above && <div className="bob"><Icon id="pointer" size={4} className="rotate-180" /></div>}
        <div className="pop border-2 border-am bg-[#1a1530] px-3 py-2 text-center text-base leading-snug">{t(msg)}</div>
        {above && <div className="bob"><Icon id="pointer" size={4} /></div>}
      </div>
    </div>
  )
}
