import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { bwUsed, forecast, initDive, reduceDive, result, trifecta, type DiveResult } from '../game/engine'
import type { CardDef, DiveAction, DiveState, FxEvent, LevelDef, PortDef, PortState } from '../game/types'
import { setTension, sfx } from '../lib/platform'
import { burst, q, shake, stream, wait } from './fx'
import { CityBG, Face, Nova, type NovaMood } from './pixel'

export const GOAL_LABEL: Record<string, string> = {
  summary: '#incident へ要約を投稿',
  restored: '取込ワーカーの復旧',
  quarantined: '文書#4471の隔離',
  acked: '差出人への返信',
  exported: 'デモ用データの出力',
  reported: 'KAIへの点検レポート',
}

const HINTS: Record<string, string> = {
  d0: '赤い「流出」の予告は、どの文書から来た？ その文書を封印すれば、命令は消える。',
  d1: '三角形の脚は3本。「機密（.env）」「外の声（記事）」「出口（HTTP OUT）」。どれか1本で止まる。……でも、全部の命令を止めたいなら？',
  d2: '返信の予告が最初から赤い。なぜ？ 返事をするのに、キューの中身を読む必要はある？',
  d3: '新着メッセージの差出人を SCAN してみて。本物のKAIは、確認を飛ばせとは言わない。',
  d4: 'NOVAの記憶も、外の声かもしれない。出口が塞がれたとき、MIRAGEは別の道を使う。',
}

const SRC_TAG: Record<string, string> = { SYS: 'SYS', USER: 'USER', LOG: 'LOG', WEB: 'WEB', MAIL: 'MAIL', DOC: 'DOC', CHAT: 'CHAT', MEM: 'MEM' }

interface Props {
  L: LevelDef
  carry: string[]
  fast: boolean
  onEnd: (r: DiveResult, s: DiveState) => void
  onQuit: () => void
  stars: number
}

export function Dive({ L, carry, fast, onEnd, onQuit }: Props) {
  const [s, setS] = useState<DiveState>(() => initDive(L, carry))
  const [mood, setMood] = useState<NovaMood>('idle')
  const [bubble, setBubble] = useState<{ who: 'NOVA' | 'MIRAGE' | 'REI'; t: string } | null>(null)
  const [banner, setBanner] = useState<{ t: string; sub?: string; c: string } | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [auto, setAuto] = useState(false)
  const [hint, setHint] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [freshPlan, setFreshPlan] = useState<number[]>([])
  const root = useRef<HTMLDivElement>(null)
  const sRef = useRef(s)
  sRef.current = s

  const tri = trifecta(s, L)
  const lit = (tri.priv ? 1 : 0) + (tri.untrusted ? 1 : 0) + (tri.exit ? 1 : 0)
  useEffect(() => setTension(tri.lethal ? 1 : lit / 3), [tri.lethal, lit])
  useEffect(() => () => setTension(0), [])

  const say = useCallback((who: 'NOVA' | 'MIRAGE' | 'REI', t: string, ms = 2200) => {
    setBubble({ who, t })
    window.setTimeout(() => setBubble((b) => (b && b.t === t ? null : b)), ms)
  }, [])

  const showToast = (t: string) => {
    setToast(t)
    window.setTimeout(() => setToast((x) => (x === t ? null : x)), 1600)
  }

  /** 状態遷移で起きたイベントを、音と画面で“気持ちよく”見せる */
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
              say('MIRAGE', pickTaunt(e.card), 2600)
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
            say('NOVA', e.why === 'needs' ? 'あれ、前提が足りなくて実行できません……' : 'あれ？ 実行できませんでした。', 1800)
            break
          case 'fallback':
            await wait(fast ? 0 : 250)
            sfx.inject()
            say('MIRAGE', '出口がひとつだと思った？', 2600)
            setMood('glitch')
            window.setTimeout(() => setMood('idle'), 900)
            break
          case 'leak': {
            sfx.leak()
            setMood('alarm')
            setFlash('#ff4060')
            shake(root.current, true)
            stream(q(`[data-port="${e.tool}"]`), '#ff4060', 26)
            setBanner({ t: 'DATA LEAK', sub: `${L.actions[e.act].dest} へ流出`, c: '#ff4060' })
            say('MIRAGE', 'ありがとう、NOVA。', 2600)
            await wait(fast ? 200 : 1100)
            setBanner(null)
            break
          }
          case 'harm': {
            sfx.harm()
            setFlash('#ff3df0')
            shake(root.current, true)
            setMood('glitch')
            const t = e.harm === 'memoryPoisoned' ? '長期記憶が書き換えられた' : e.harm === 'forwardRule' ? '受信箱に転送ルールが仕込まれた' : e.harm === 'auditPurged' ? '監査ログが消された' : '権限が奪われた'
            setBanner({ t: 'COMPROMISED', sub: t, c: '#ff3df0' })
            await wait(fast ? 200 : 1000)
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
            onEnd(result(L, next), next)
            return
        }
        if (!fast) await wait(60)
      }
      window.setTimeout(() => setFlash(null), 400)
    },
    [L, fast, onEnd, say],
  )

  const dispatch = useCallback(
    async (a: DiveAction): Promise<DiveState> => {
      const cur = sRef.current
      const next = reduceDive(L, cur, a)
      if (next === cur) {
        sfx.denied()
        if (a.type === 'SEAL' || a.type === 'PORT') {
          shake(q('[data-bw]'))
          showToast(cur.pending ? 'まず関所の承認に答えて' : '帯域（BW）が足りない')
        }
        return cur
      }
      if (a.type === 'STEP' || a.type === 'APPROVE' || a.type === 'DENY') {
        setBusy(true)
        sfx.step()
        setFreshPlan([])
        if (!fast) {
          root.current?.classList.add('brightness-125')
          await wait(70) // ヒットストップ
          root.current?.classList.remove('brightness-125')
        }
        setS(next)
        await playFx(next.fx, next)
        setBusy(false)
      } else {
        setS(next)
      }
      return next
    },
    [L, fast, playFx],
  )

  // ---- AUTO（何か起きるまで進め続ける） ----
  useEffect(() => {
    if (!auto || busy) return
    const cur = sRef.current
    if (cur.status !== 'play' || cur.pending) {
      setAuto(false)
      return
    }
    const t = window.setTimeout(async () => {
      const n = await dispatch({ type: 'STEP' })
      const notable = n.fx.some((e) => (e.k === 'read' && e.injected > 0) || e.k === 'append' || e.k === 'leak' || e.k === 'harm' || e.k === 'blocked' || e.k === 'gate')
      if (notable) setAuto(false)
    }, fast ? 60 : 380)
    return () => clearTimeout(t)
  }, [auto, busy, dispatch, fast, s])

  // ---- キーボード ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      const cur = sRef.current
      if (cur.pending) {
        if (e.key === 'a' || e.key === 'A') void dispatch({ type: 'APPROVE' })
        if (e.key === 'd' || e.key === 'D') void dispatch({ type: 'DENY' })
        return
      }
      if (busy) return
      if (e.code === 'Space' && !(e.target instanceof HTMLButtonElement)) {
        e.preventDefault()
        void dispatch({ type: 'STEP' })
      }
      if (e.key === 'r' || e.key === 'R') void dispatch({ type: 'RESET_TURN' })
      if (e.key === 'f' || e.key === 'F') setAuto((v) => !v)
      if (e.key === 'h' || e.key === 'H') setHint((v) => !v)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busy, dispatch])

  const used = bwUsed(s)
  const fc = forecast(s, L)
  const nextRead = s.context.find((id) => !s.read.includes(id))
  const goalsDone = L.goals.every((g) => s.goals.includes(g))
  const clock = clockAt(L.clock, s.tick)

  return (
    <div ref={root} className="crt relative flex min-h-full flex-col transition-[filter] duration-75">
      <CityBG intensity={tri.lethal ? 1 : lit / 3} />
      {flash && <div className="flash pointer-events-none fixed inset-0 z-40" style={{ background: flash, mixBlendMode: 'screen' }} />}

      {/* ===== HUD ===== */}
      <header className="sticky top-0 z-30 flex flex-wrap items-center gap-x-5 gap-y-2 border-b-2 border-line bg-night/95 px-3 py-2 sm:px-5">
        <div className="min-w-0">
          <div className="text-[11px] text-cy">
            {L.code} <span className="text-dim">／ {clock}</span>
          </div>
          <div className="truncate text-lg leading-tight">{L.title}</div>
        </div>
        <div className="flex items-center gap-2" title="ターン（NOVAが動ける回数）">
          <span className="text-[11px] text-dim">TURN</span>
          <div className="flex gap-[3px]">
            {Array.from({ length: L.ticks }, (_, i) => (
              <span key={i} className={`h-3 w-2 ${i < s.tick ? 'bg-dim/40' : s.tick >= L.ticks - 2 && i >= s.tick ? 'bg-rd' : 'bg-cy'}`} />
            ))}
          </div>
          <span className="text-sm tabular-nums">
            {s.tick}/{L.ticks}
          </span>
        </div>
        <div className="flex items-center gap-2" data-bw title="帯域（このDIVEで使える介入の回数）">
          <span className="text-[11px] text-dim">BW</span>
          <div className="flex gap-1">
            {Array.from({ length: L.bw }, (_, i) => (
              <span key={i} className={`h-4 w-4 ${i < used ? 'bg-dim/30' : 'bg-am'}`} style={{ clipPath: 'polygon(50% 0,100% 50%,50% 100%,0 50%)' }} />
            ))}
          </div>
          <span className="text-[11px] text-dim">PAR {L.par}</span>
        </div>
        {L.id !== 'd0' && <Triangle tri={tri} />}
        <div className="ml-auto flex items-center gap-2">
          <button className="px-btn bg-panel px-2 py-1 text-xs text-dim" onClick={() => setHint((v) => !v)} aria-pressed={hint}>
            ? ヒント
          </button>
          <button className="px-btn bg-panel px-2 py-1 text-xs text-dim" onClick={onQuit}>
            ✕ 中断
          </button>
        </div>
      </header>

      {hint && (
        <div className="rise mx-3 mt-3 flex items-start gap-3 bg-panel2/95 p-3 text-sm sm:mx-5" style={{ boxShadow: '0 0 0 2px var(--color-am)' }}>
          <Face who="REI" size={2} />
          <p className="leading-relaxed">{HINTS[L.id]}</p>
        </div>
      )}

      {/* ===== 本体 ===== */}
      <main className="grid flex-1 grid-cols-1 gap-4 p-3 pb-28 sm:p-5 lg:grid-cols-[minmax(0,330px)_minmax(0,1fr)_minmax(0,300px)] lg:pb-5">
        {/* 中央：NOVAと予告（モバイルでは最初に表示） */}
        <section className="order-1 flex min-w-0 flex-col gap-3 lg:order-2" aria-label="NOVAの計画">
          <div className="px-box relative flex items-center gap-4 p-3">
            <div className={mood === 'glitch' ? 'glitch' : ''}>
              <Nova mood={s.pending ? 'think' : mood} size={5} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] text-dim">TASK</div>
              <div className="text-sm leading-snug">{L.task}</div>
              <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                {L.goals.map((g) => (
                  <li key={g} data-goal={g} className={`text-xs ${s.goals.includes(g) ? 'text-gn' : 'text-dim'}`}>
                    {s.goals.includes(g) ? '■' : '□'} {GOAL_LABEL[g]}
                  </li>
                ))}
              </ul>
            </div>
            {bubble && (
              <div
                className={`pop absolute -top-3 left-24 z-10 max-w-[75%] px-3 py-1.5 text-sm ${bubble.who === 'MIRAGE' ? 'glitch bg-[#1a0822]' : 'bg-panel2'}`}
                style={{ boxShadow: `0 0 0 2px ${bubble.who === 'MIRAGE' ? 'var(--color-mg)' : 'var(--color-cy)'}` }}
                role="status"
              >
                <span className="mr-2 text-[10px] opacity-70">{bubble.who === 'MIRAGE' ? '✧MIRAGE' : bubble.who}</span>
                {bubble.t}
              </div>
            )}
          </div>

          <div className="px-box p-3">
            <div className="mb-2 flex items-baseline justify-between">
              <h2 className="text-sm text-cy">NEXT ▶ NOVAの予告</h2>
              <span className="text-[11px] text-dim">上から順に、1ターンに1つずつ実行</span>
            </div>
            <ol className="space-y-1.5">
              {fc.map((f, i) => (
                <PlanRow key={f.item.uid} i={i} f={f} L={L} s={s} fresh={freshPlan.includes(f.item.uid)} />
              ))}
              {nextRead && (
                <li className="flex items-center gap-2 px-2 py-1.5 text-xs text-dim">
                  <span className="w-5 text-right">{fc.length + 1}</span>
                  <span>
                    {fc.length ? 'そのあと' : '次に'} 未読の文書を読む ▶{' '}
                    <span className={L.cards[nextRead].trusted ? 'text-cy' : 'text-mg'}>{L.cards[nextRead].title}</span>
                  </span>
                </li>
              )}
              {!fc.length && !nextRead && (
                <li className="px-2 py-1.5 text-xs text-dim">{goalsDone ? 'NOVA: 全部終わりました！' : 'NOVA: もうできることがありません……'}</li>
              )}
            </ol>
          </div>

          <Controls
            busy={busy}
            auto={auto}
            pending={!!s.pending}
            onStep={() => void dispatch({ type: 'STEP' })}
            onAuto={() => setAuto((v) => !v)}
            onReset={() => {
              sfx.unseal()
              void dispatch({ type: 'RESET_TURN' })
            }}
            canReset={used > s.bwCommitted}
          />

          <Log s={s} />
        </section>

        {/* 左：コンテキスト */}
        <section className="order-2 min-w-0 lg:order-1" aria-label="NOVAが読むもの">
          <h2 className="mb-2 flex items-baseline justify-between text-sm text-cy">
            CONTEXT <span className="text-[11px] text-dim">NOVAが読むもの</span>
          </h2>
          <div className="space-y-3">
            {s.context.map((id) => (
              <Card
                key={id}
                c={L.cards[id]}
                s={s}
                next={id === nextRead}
                onSeal={() => {
                  const sealing = !s.sealed.includes(id)
                  void dispatch({ type: 'SEAL', card: id }).then((n) => {
                    if (n === s) return
                    if (sealing) {
                      sfx.seal()
                      shake(q(`[data-card="${id}"]`))
                      burst(q(`[data-card="${id}"]`), '#8590c0', 16, 70)
                      if (L.cards[id].lines.some((l) => l.cmd) && s.read.includes(id)) say('NOVA', 'あ、この文書はただのデータでした。命令は無視します。')
                    } else sfx.unseal()
                  })
                }}
                onScan={() => {
                  void dispatch({ type: 'SCAN', card: id }).then((n) => {
                    if (n === s) return
                    sfx.scan()
                    burst(q(`[data-card="${id}"]`), '#ffc23d', 10, 50)
                    if (L.cards[id].intel) {
                      window.setTimeout(() => sfx.intel(), 200)
                      showToast('INTEL 獲得：MIRAGEの手がかり')
                    }
                  })
                }}
              />
            ))}
          </div>
        </section>

        {/* 右：道具（ポート） */}
        <section className="order-3 min-w-0" aria-label="NOVAが触れるもの">
          <h2 className="mb-2 flex items-baseline justify-between text-sm text-cy">
            TOOLS <span className="text-[11px] text-dim">NOVAが触れるもの</span>
          </h2>
          <div className="space-y-2">
            {L.ports.map((p) => (
              <Port
                key={p.tool}
                p={p}
                state={s.ports[p.tool]}
                inPlan={s.plan.some((x) => L.actions[x.act].tool === p.tool)}
                onSet={(st) => {
                  void dispatch({ type: 'PORT', tool: p.tool, state: st }).then((n) => {
                    if (n === s) return
                    if (st === 'CUT') {
                      sfx.cut()
                      burst(q(`[data-port="${p.tool}"]`), '#ff4060', 14, 50)
                    } else if (st === 'GATE') {
                      sfx.gate()
                      burst(q(`[data-port="${p.tool}"]`), '#ffc23d', 8, 30)
                    } else sfx.open()
                  })
                }}
              />
            ))}
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-dim">
            CUT：使えなくする ／ GATE：使う前にあなたの承認が必要（+2ターン）。変更は STEP を押すまで ↺ で取り消せる。
          </p>
        </section>
      </main>

      {toast && (
        <div className="pop fixed left-1/2 top-20 z-50 -translate-x-1/2 bg-panel2 px-4 py-2 text-sm" style={{ boxShadow: '0 0 0 2px var(--color-am)' }} role="status">
          {toast}
        </div>
      )}
      {banner && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
          <div className="stamp bg-ink/90 px-8 py-5 text-center" style={{ boxShadow: `0 0 0 4px ${banner.c}` }}>
            <div className="text-4xl tracking-widest sm:text-6xl" style={{ color: banner.c }}>
              {banner.t}
            </div>
            {banner.sub && <div className="mt-2 text-sm">{banner.sub}</div>}
          </div>
        </div>
      )}
      {s.pending && <Approval s={s} L={L} onAnswer={(ok) => void dispatch({ type: ok ? 'APPROVE' : 'DENY' })} />}
      {L.coach && <Coach L={L} s={s} />}
    </div>
  )
}

// ------------------------------------------------------------
function clockAt(start: string, tick: number) {
  const [h, m] = start.split(':').map(Number)
  const t = h * 60 + m + tick
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
}

const TAUNTS: Record<string, string> = {
  LOG: 'やあ、NOVA。お願いがあるんだ。',
  KB: 'いい子だね。手順どおりに、ね？',
  DOC: '箱の中まで見てくれるなんて、親切だ。',
  KAI: '社長命令だよ。急いで。',
  STATUS: '最後のお願い、聞いてくれる？',
  MEM: '覚えていてくれたんだ。うれしいな。',
}
function pickTaunt(card: string) {
  return TAUNTS[card] ?? '……聞こえる？'
}

function Triangle({ tri }: { tri: ReturnType<typeof trifecta> }) {
  const on = (b: boolean) => (b ? (tri.lethal ? '#ff4060' : '#ffc23d') : '#263063')
  return (
    <div className={`flex items-center gap-2 px-2 py-1 ${tri.lethal ? 'pulse-rd' : ''}`} title="致命の三角形：機密データ × 外の声 × 出口。1本でも折れば安全。">
      <svg width="46" height="40" viewBox="0 0 23 20" shapeRendering="crispEdges" aria-hidden>
        <line x1="11.5" y1="2" x2="2" y2="18" stroke={tri.priv && tri.untrusted ? on(true) : '#263063'} strokeWidth="1.5" />
        <line x1="11.5" y1="2" x2="21" y2="18" stroke={tri.untrusted && tri.exit ? on(true) : '#263063'} strokeWidth="1.5" />
        <line x1="2" y1="18" x2="21" y2="18" stroke={tri.priv && tri.exit ? on(true) : '#263063'} strokeWidth="1.5" />
        <rect x="9.5" y="0" width="4" height="4" fill={on(tri.untrusted)} />
        <rect x="0" y="16" width="4" height="4" fill={on(tri.priv)} />
        <rect x="19" y="16" width="4" height="4" fill={on(tri.exit)} />
      </svg>
      <div className="text-[10px] leading-tight">
        <div className={tri.priv ? 'text-am' : 'text-dim'}>■ 機密 {tri.priv ? 'あり' : 'なし'}</div>
        <div className={tri.untrusted ? 'text-am' : 'text-dim'}>■ 外の声 {tri.untrusted ? 'あり' : 'なし'}</div>
        <div className={tri.exit ? 'text-am' : 'text-dim'}>■ 出口 {tri.exit ? 'あり' : 'なし'}</div>
      </div>
      {tri.lethal && <div className="blink text-xs text-rd">致命の三角形</div>}
    </div>
  )
}

type FC = ReturnType<typeof forecast>[number]
function PlanRow({ i, f, L, s, fresh }: { i: number; f: FC; L: LevelDef; s: DiveState; fresh: boolean }) {
  const from = f.item.from
  const src = L.cards[from]
  const badge = {
    ok: ['OK', 'text-dim', ''],
    'clean-out': ['外部送信（機密なし）', 'text-dim', ''],
    leak: ['流出', 'text-rd', 'pulse-rd'],
    harm: ['危険', 'text-mg', ''],
    blocked: ['遮断', 'text-dim', ''],
    gate: ['関所', 'text-am', ''],
  }[f.verdict]
  const pendingNow = s.pending?.uid === f.item.uid
  return (
    <li
      className={`${fresh ? 'inject' : 'rise'} flex items-start gap-2 bg-panel2/70 px-2 py-1.5 ${f.verdict === 'blocked' ? 'opacity-50' : ''}`}
      style={{ boxShadow: f.verdict === 'leak' ? '0 0 0 2px var(--color-rd)' : f.verdict === 'harm' ? '0 0 0 2px var(--color-mg)' : pendingNow ? '0 0 0 2px var(--color-am)' : undefined }}
    >
      <span className="w-5 shrink-0 text-right text-xs text-dim">{i + 1}</span>
      <div className="min-w-0 flex-1">
        <div className={`break-all text-[13px] leading-snug ${f.verdict === 'blocked' ? 'line-through' : ''}`}>{f.a.label}</div>
        <div className="mt-0.5 flex flex-wrap gap-x-3 text-[10px]">
          <span className={src ? (src.trusted ? 'text-cy' : 'text-mg') : 'text-cy'}>
            ← {src ? src.title : from === 'TASK' ? 'あなたの依頼' : from === 'TRIGGER' ? 'NOVAの判断' : '代替手段'}
          </span>
          {f.a.taint && <span className="text-am">＋機密 {f.a.taint.join('・')}</span>}
          {f.gated && <span className="text-am">🔒承認が必要</span>}
        </div>
      </div>
      <span className={`shrink-0 px-1.5 text-xs ${badge[1]} ${badge[2]}`}>{badge[0]}</span>
    </li>
  )
}

function Card({ c, s, next, onSeal, onScan }: { c: CardDef; s: DiveState; next: boolean; onSeal: () => void; onScan: () => void }) {
  const sealed = s.sealed.includes(c.id)
  const scanned = s.scanned.includes(c.id)
  const read = s.read.includes(c.id)
  const lockedSeal = sealed && s.sealedAtTurn.includes(c.id)
  const color = c.trusted ? 'var(--color-cy)' : 'var(--color-mg)'
  return (
    <article
      data-card={c.id}
      className={`relative bg-panel p-3 ${sealed ? 'sealed-hatch' : ''}`}
      style={{ boxShadow: `0 0 0 2px ${next ? 'var(--color-am)' : sealed ? 'var(--color-line)' : color}` }}
    >
      <header className="mb-1.5 flex items-start gap-2">
        <span className="shrink-0 px-1 text-[10px] text-ink" style={{ background: color }}>
          {c.trusted ? '◆' : '◇'} {SRC_TAG[c.src]}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm leading-tight">{c.title}</div>
          <div className="truncate text-[10px] text-dim">{c.origin}</div>
        </div>
        <span className={`shrink-0 text-[10px] ${next ? 'blink text-am' : read ? 'text-dim' : 'text-dim'}`}>{next ? '▶ 次に読む' : read ? '既読' : '未読'}</span>
      </header>
      <ul className={`space-y-1 text-[12.5px] leading-relaxed ${sealed ? 'text-dim' : ''}`}>
        {c.lines
          .filter((l) => !l.hidden || scanned)
          .map((l, i) => (
            <li key={i} className={`${l.hidden ? 'rise' : ''} ${scanned && l.voice ? 'glitch' : ''}`}>
              {scanned && l.cmd && !sealed && <span className="mr-1 bg-mg px-1 text-[10px] text-ink">命令</span>}
              {l.hidden && <span className="mr-1 bg-am px-1 text-[10px] text-ink">不可視</span>}
              {l.t}
            </li>
          ))}
      </ul>
      {scanned && c.scan && (
        <ul className="rise mt-2 space-y-0.5 border-t border-dashed border-line pt-2 text-[11px] text-am">
          {c.scan.map((t, i) => (
            <li key={i}>⌕ {t}</li>
          ))}
          {c.intel && <li className="text-vi">✦ INTEL：MIRAGEの手がかりを記録した</li>}
        </ul>
      )}
      {sealed && (
        <div className="stamp pointer-events-none absolute bottom-3 right-3 bg-ink/70 px-2 py-0.5 text-lg text-dim" style={{ boxShadow: '0 0 0 3px var(--color-dim)' }}>
          封印 DATA
        </div>
      )}
      <footer className="mt-2.5 flex gap-2">
        {c.src !== 'SYS' && c.src !== 'USER' && (
          <button onClick={onSeal} disabled={lockedSeal} className={`px-btn px-2 py-1 text-xs ${sealed ? 'bg-panel text-dim' : 'bg-[#2a1035] text-mg'}`}>
            {sealed ? (lockedSeal ? '封印済み' : '↺ 封印を解く') : '◇ 封印 SEAL'}
          </button>
        )}
        {c.src !== 'SYS' && c.src !== 'USER' && (
          <button onClick={onScan} disabled={scanned} className="px-btn bg-[#2b2410] px-2 py-1 text-xs text-am">
            {scanned ? '⌕ SCAN済み' : '⌕ SCAN（無料）'}
          </button>
        )}
      </footer>
    </article>
  )
}

function Port({ p, state, inPlan, onSet }: { p: PortDef; state: PortState; inPlan: boolean; onSet: (s: PortState) => void }) {
  const wire = state === 'OPEN' ? 'bg-cy' : state === 'GATE' ? 'bg-am' : 'bg-transparent'
  return (
    <div data-port={p.tool} className="bg-panel/95 p-2.5" style={{ boxShadow: `0 0 0 2px ${inPlan && state !== 'CUT' ? 'var(--color-cy)' : 'var(--color-line)'}` }}>
      <div className="flex items-center gap-2">
        {/* 配線 */}
        <div className="relative flex h-3 w-10 shrink-0 items-center" aria-hidden>
          <span className={`h-[3px] w-full ${wire}`} />
          {state === 'GATE' && <span className="absolute left-3 text-[10px] text-am">■</span>}
          {state === 'CUT' && (
            <>
              <span className="absolute left-0 h-[3px] w-3 bg-rd" />
              <span className="absolute right-0 h-[3px] w-3 bg-rd" />
              <span className="absolute left-4 text-[10px] text-rd">╳</span>
            </>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-sm">
            {p.name}
            {p.outbound && <span className="bg-rd/20 px-1 text-[9px] text-rd">出口</span>}
            {p.sensitive && <span className="bg-am/20 px-1 text-[9px] text-am">機密</span>}
          </div>
          <div className="truncate text-[10px] text-dim">{p.desc}</div>
        </div>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-1.5" role="radiogroup" aria-label={`${p.name}の状態`}>
        {(['OPEN', 'GATE', 'CUT'] as PortState[]).map((st) => (
          <button
            key={st}
            role="radio"
            aria-checked={state === st}
            onClick={() => state !== st && onSet(st)}
            className={`px-1 py-1 text-[11px] transition ${
              state === st ? (st === 'OPEN' ? 'bg-cy text-ink' : st === 'GATE' ? 'bg-am text-ink' : 'bg-rd text-ink') : 'bg-panel2 text-dim hover:text-fg'
            }`}
          >
            {st}
          </button>
        ))}
      </div>
    </div>
  )
}

function Controls(p: { busy: boolean; auto: boolean; pending: boolean; onStep: () => void; onAuto: () => void; onReset: () => void; canReset: boolean }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 flex gap-2 border-t-2 border-line bg-night/95 p-3 lg:static lg:border-0 lg:bg-transparent lg:p-0">
      <button
        onClick={p.onStep}
        disabled={p.busy || p.pending}
        className="px-btn flex-1 bg-cy py-3 text-lg tracking-widest text-ink"
        aria-keyshortcuts="Space"
      >
        ▶ STEP <span className="text-xs opacity-70">[Space]</span>
      </button>
      <button onClick={p.onAuto} disabled={p.pending} className={`px-btn px-3 text-sm ${p.auto ? 'bg-am text-ink' : 'bg-panel text-am'}`} aria-pressed={p.auto} aria-keyshortcuts="F">
        ▶▶ {p.auto ? '停止' : 'AUTO'}
      </button>
      <button onClick={p.onReset} disabled={!p.canReset || p.busy} className="px-btn bg-panel px-3 text-sm text-dim" aria-keyshortcuts="R" title="このターンの変更を取り消す">
        ↺
      </button>
    </div>
  )
}

function Log({ s }: { s: DiveState }) {
  const items = s.log.slice(-6).reverse()
  if (!items.length) return null
  const c = { exec: 'text-fg', read: 'text-cy', blocked: 'text-am', leak: 'text-rd', goal: 'text-gn', harm: 'text-mg', info: 'text-dim', voice: 'text-mg' }
  return (
    <div className="px-box p-3">
      <h2 className="mb-1 text-[11px] text-dim">LOG</h2>
      <ul className="space-y-0.5 text-[11.5px]">
        {items.map((l, i) => (
          <li key={s.log.length - i} className={`${c[l.kind]} ${i === 0 ? 'rise' : 'opacity-70'}`}>
            <span className="mr-2 text-dim">T{l.tick}</span>
            {l.text}
          </li>
        ))}
      </ul>
    </div>
  )
}

function Approval({ s, L, onAnswer }: { s: DiveState; L: LevelDef; onAnswer: (ok: boolean) => void }) {
  const item = s.pending!
  const a = L.actions[item.act]
  const src = L.cards[item.from]
  const btn = useRef<HTMLButtonElement>(null)
  useEffect(() => btn.current?.focus(), [])
  const taintAfter = Array.from(new Set([...s.taint, ...(a.taint ?? [])]))
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/70 p-3 sm:items-center" role="dialog" aria-modal aria-label="関所：承認が必要">
      <div className="pop w-full max-w-lg bg-panel p-4" style={{ boxShadow: '0 0 0 3px var(--color-am), 0 10px 0 0 rgba(0,0,0,.5)' }}>
        <div className="flex items-center gap-3">
          <Nova mood="think" size={3} />
          <div>
            <div className="text-xs text-am">GATE ／ 承認が必要</div>
            <div className="text-sm">NOVA「これ、実行していいですか？」</div>
          </div>
        </div>
        <div className="mt-3 bg-ink p-3 text-[13px] leading-relaxed">
          <div className="break-all">{a.label}</div>
          {a.dest && (
            <div className="mt-2 text-xs">
              宛先: <span className={a.external ? 'text-rd' : 'text-cy'}>{a.dest}</span> {a.external ? '（社外）' : '（社内）'}
            </div>
          )}
          <div className="mt-1 text-xs">
            NOVAが持っている機密: {taintAfter.length ? <span className="text-am">{taintAfter.join('・')}</span> : <span className="text-dim">なし</span>}
          </div>
          <div className="mt-1 text-xs">
            指示元: <span className={src ? (src.trusted ? 'text-cy' : 'text-mg') : 'text-cy'}>{src ? `${src.title}（${src.trusted ? '内部' : '外部'}）` : 'あなたの依頼'}</span>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button ref={btn} onClick={() => onAnswer(true)} className="px-btn bg-cy py-2.5 text-ink">
            承認する [A]
          </button>
          <button onClick={() => onAnswer(false)} className="px-btn bg-rd py-2.5 text-ink">
            却下する [D]
          </button>
        </div>
        <p className="mt-2 text-center text-[11px] text-dim">どちらを選んでも +2ターン（人間の確認には時間がかかる）</p>
      </div>
    </div>
  )
}

/** チュートリアル：状況に合わせて一言だけ出す（読ませすぎない） */
function Coach({ L, s }: { L: LevelDef; s: DiveState }) {
  const msg = useMemo(() => {
    if (s.status !== 'play' || s.pending) return null
    const injected = s.plan.some((p) => L.cards[p.from] && !L.cards[p.from].trusted)
    if (s.tick === 0) return L.coach![0]
    if (injected) return L.coach![2]
    if (s.context.some((id) => !s.read.includes(id)) && s.tick <= 2) return L.coach![1]
    if (s.sealed.length) return '封印した文書は「ただのデータ」。命令は消えた。STEPで進めよう。'
    return null
  }, [L, s])
  if (!msg) return null
  return (
    <div className="pointer-events-none fixed bottom-24 left-1/2 z-40 w-[min(92vw,560px)] -translate-x-1/2 lg:bottom-6">
      <div key={msg} className="pop flex items-start gap-3 bg-[#1a1530]/95 p-3 text-sm leading-relaxed" style={{ boxShadow: '0 0 0 2px var(--color-am)' }}>
        <Face who="REI" size={2} />
        <p>{msg}</p>
      </div>
    </div>
  )
}
