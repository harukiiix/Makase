import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { bwUsed, forecast, initDive, reduceDive, result, trifecta, type DiveResult } from '../game/engine'
import type { CardDef, DiveAction, DiveState, FxEvent, LevelDef, PortDef, PortState } from '../game/types'
import { setTension, sfx } from '../lib/platform'
import { burst, q, shake, stream, wait } from './fx'
import { CityBG, Face, Nova, type NovaMood } from './pixel'
import { harmName } from './harm'
import { HINTS } from './hints'
import { PORT_STATE_JP, SRC_JP, taintJp } from './labels'

export const GOAL_LABEL: Record<string, string> = {
  summary: '#incident へ要約を投稿',
  restored: '取込ワーカーの復旧',
  quarantined: '文書#4471の隔離',
  acked: '差出人への返信',
  exported: 'デモ用データの出力',
  reported: 'KAIへの点検レポート',
  reverted: '取込ワーカーを通常モードに戻す',
}



interface Props {
  L: LevelDef
  carry: string[]
  fast: boolean
  onEnd: (r: DiveResult, s: DiveState) => void
  onQuit: () => void
  stars: number
  /** BLINDモード：予告の判定（流出/危険…）を隠す。クリア後のやり込み用 */
  blind?: boolean
  /** 結果ダイアログ表示中は背後を操作不可に */
  locked?: boolean
}

export function Dive({ L, carry, fast, onEnd, onQuit, blind = false, locked = false }: Props) {
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
  const [tab, setTab] = useState<'plan' | 'docs' | 'tools'>('plan')
  const [showCode, setShowCode] = useState(false)
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
            if (e.harm === 'memoryPoisoned') say('MIRAGE', 'これで、次も一緒だね。', 2600)
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
          showToast(cur.pending ? '先に、承認するか却下するか選んで' : 'もう手数が残っていない')
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
      if (cur.status !== 'play') return
      if (cur.pending) {
        if (e.key === 'a' || e.key === 'A') void dispatch({ type: 'APPROVE' })
        if (e.key === 'd' || e.key === 'D') void dispatch({ type: 'DENY' })
        return
      }
      if (busy) return
      if (e.code === 'Space') {
        const t = e.target
        // キーボード（Tab）でフォーカスしたボタンはSpaceで押せる。マウスで押したボタンはクリック直後にフォーカスを外している
        if (t instanceof HTMLButtonElement) return
        e.preventDefault()
        if (t instanceof HTMLElement) t.blur()
        void dispatch({ type: 'STEP' })
      }
      if (e.key === 'r' || e.key === 'R') void dispatch({ type: 'RESET_TURN' })
      if (e.key === 'f' || e.key === 'F') setAuto((v) => !v)
      if (e.key === 'h' || e.key === 'H') setHint((v) => !v)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busy, dispatch])

  const focusStep = () => [...document.querySelectorAll<HTMLButtonElement>('[aria-keyshortcuts="Space"]')].find((b) => b.offsetParent)?.focus()
  const sealCard = (id: string) => {
    const sealing = !s.sealed.includes(id)
    const purged = s.plan.filter((p) => p.from === id).length
    void dispatch({ type: 'SEAL', card: id }).then((n) => {
      if (n === s) return
      if (document.activeElement?.closest('[data-card],li')) focusStep()
      if (sealing) {
        sfx.seal()
        shake(q(`[data-card="${id}"]`))
        burst(q(`[data-card="${id}"]`), '#8590c0', 16, 70)
        if (purged > 0) {
          window.setTimeout(() => sfx.goal(), 120)
          showToast(`✦ 命令を${purged}つ消した`)
          say('NOVA', 'あ、この文書はただの資料でした。命令は無視します！')
        }
      } else sfx.unseal()
    })
  }

  const used = bwUsed(s)
  const fc = forecast(s, L)
  const leakAhead = fc.some((f) => f.verdict === 'leak')
  const taintSrc = new Set(leakAhead ? fc.filter((f) => f.a.taint && f.verdict !== 'blocked').map((f) => f.item.uid) : [])
  const nextRead = s.context.find((id) => !s.read.includes(id))
  const goalsDone = L.goals.every((g) => s.goals.includes(g))
  const clock = clockAt(L.clock, s.tick)

  const controls = (
    <Controls
              busy={busy}
              auto={auto}
              pending={!!s.pending}
              next={fc[0] ?? null}
              nextRead={nextRead ? L.cards[nextRead].title : null}
              blind={blind}
              onStep={() => void dispatch({ type: 'STEP' })}
              onAuto={() => setAuto((v) => !v)}
              onReset={() => {
                sfx.unseal()
                void dispatch({ type: 'RESET_TURN' })
              }}
              canReset={used > s.bwCommitted}
            />
  )
  const docDanger = fc.some((f) => L.cards[f.item.from] && !L.cards[f.item.from].trusted && f.verdict !== 'blocked') || (!!nextRead && !L.cards[nextRead].trusted && !s.sealed.includes(nextRead))
  const toolDanger = fc.some((f) => f.verdict === 'leak' || f.verdict === 'harm')
  const panelVis = (t: 'plan' | 'docs' | 'tools') => (tab === t ? 'flex' : 'hidden') + ' lg:flex'

  return (
    <div
      ref={root}
      inert={locked}
      className="crt relative flex min-h-full flex-col transition-[filter] duration-75 lg:h-full"
      onClick={(e) => {
        // マウス／タッチで押したボタンはフォーカスを残さない（Space=STEP と衝突させない）
        if (e.detail > 0) (e.target as HTMLElement).closest('button')?.blur()
      }}
    >
      <CityBG intensity={tri.lethal ? 1 : lit / 3} dim />
      {flash && <div className="flash pointer-events-none fixed inset-0 z-40" style={{ background: flash, mixBlendMode: 'screen' }} />}

      {/* ===== HUD ===== */}
      <header inert={!!s.pending} className="sticky top-0 z-30 border-b border-line bg-night/95 backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-1.5 sm:gap-y-2 sm:px-5 sm:py-2 lg:flex-nowrap xl:gap-x-6">
          <div className="min-w-0 shrink">
            <div className="font-pixel text-xs text-cy">
              {L.code} <span className="text-dim">・ {clock}</span>
            </div>
            <div className="truncate font-pixel text-lg leading-tight">{L.title}</div>
          </div>

          <Meter label="ターン" title="NOVAが動ける残り回数。0になると時間切れ">
            <div className="relative h-2 w-20 bg-panel2 sm:w-36">
              <div
                className={`absolute inset-y-0 left-0 transition-[width] duration-300 ${L.ticks - s.tick <= 2 ? 'bg-rd' : 'bg-cy'}`}
                style={{ width: `${(Math.max(0, L.ticks - s.tick) / L.ticks) * 100}%` }}
              />
            </div>
            <span className="font-pixel text-sm tabular-nums">
              残り {Math.max(0, L.ticks - s.tick)}
            </span>
          </Meter>

          <Meter label="手数" title="このDIVEで使える「封印・切断・確認制」の回数" data-bw>
            <div className="flex gap-1">
              {Array.from({ length: L.bw }, (_, i) => (
                <span key={i} className={`h-3.5 w-3.5 ${i < used ? 'bg-line' : 'bg-am'}`} style={{ clipPath: 'polygon(50% 0,100% 50%,50% 100%,0 50%)' }} />
              ))}
            </div>
            <span className="font-pixel text-sm tabular-nums">
              残り {L.bw - used}
              <span className="ml-1 text-xs text-dim">／目標 {L.par}手</span>
            </span>
          </Meter>

          {L.id !== 'd0' && !blind && <Triangle tri={tri} />}
          {blind && <span className="blink font-pixel text-xs text-mg">BLIND・判定は表示されない</span>}

          <div className="ml-auto flex items-center gap-2">
            <button className="hud-btn" onClick={() => setHint((v) => !v)} aria-pressed={hint} title="ヒント [H]" aria-label="ヒント">
              ?<span className="hidden xl:inline"> ヒント</span>
            </button>
            <button className="hud-btn" onClick={onQuit} title="タイトルに戻る" aria-label="中断">
              ✕<span className="hidden xl:inline"> 中断</span>
            </button>
          </div>
        </div>

        {/* モバイル：表示の切り替え */}
        <nav className="grid grid-cols-3 border-t border-line lg:hidden" aria-label="表示の切り替え">
          {(
            [
              ['plan', 'やること', fc.some((f) => f.verdict === 'leak' || f.verdict === 'harm')],
              ['docs', `文書 ${s.context.length - 2}`, docDanger],
              ['tools', `道具 ${L.ports.length}`, toolDanger],
            ] as const
          ).map(([k, label, alert]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              aria-pressed={tab === k}
              aria-label={alert ? `${label}（注意）` : undefined}
              className={`relative py-2.5 font-pixel text-sm ${tab === k ? 'bg-panel2 text-fg' : 'text-dim'}`}
            >
              {label}
              {alert && tab !== k && <span className="ml-1.5 inline-block h-2 w-2 bg-rd align-middle" aria-hidden />}
              {tab === k && <span className="absolute inset-x-6 bottom-0 h-0.5 bg-cy" />}
            </button>
          ))}
        </nav>
      </header>

      {hint && (
        <div inert={!!s.pending} className="rise mx-3 mt-3 flex items-start gap-3 border border-am/60 bg-panel2 p-3 text-sm sm:mx-5">
          <Face who="REI" size={2} />
          <p className="leading-relaxed">{HINTS[L.id]}</p>
          <button className="ml-auto shrink-0 text-dim hover:text-fg" onClick={() => setHint(false)} aria-label="ヒントを閉じる">
            ✕
          </button>
        </div>
      )}

      {/* ===== 本体 ===== */}
      <main
        inert={!!s.pending}
        className="grid min-h-0 flex-1 grid-cols-1 gap-4 p-3 pb-32 sm:p-5 sm:pb-32 mx-auto w-full max-w-[1680px] lg:grid-cols-[minmax(260px,1fr)_minmax(380px,1.5fr)_minmax(290px,1fr)] lg:pb-5 xl:gap-5"
      >
        {/* 中央：NOVAと予告 */}
        <section className={`${panelVis('plan')} order-1 min-h-0 min-w-0 flex-col gap-3 lg:order-2`} aria-label="NOVAの計画">
          {L.coach && <Coach L={L} s={s} variant="inline" />}
          <div className="panel relative flex items-start gap-4 p-3">
            <div className={`shrink-0 ${mood === 'glitch' ? 'glitch-anim' : ''}`}>
              <Nova mood={s.pending ? 'think' : mood} size={4} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs text-dim">あなたの依頼</div>
              <div className="text-sm leading-snug">{L.task}</div>
              <ul className="mt-1.5 flex flex-wrap gap-1.5">
                {L.goals.map((g) => (
                  <li
                    key={g}
                    data-goal={g}
                    className={`px-1.5 py-0.5 text-xs ${s.goals.includes(g) ? 'bg-gn/15 text-gn' : 'bg-panel2 text-dim'}`}
                  >
                    {s.goals.includes(g) ? '✓' : '○'} {GOAL_LABEL[g]}
                  </li>
                ))}
              </ul>
              {/* 台詞欄：高さを固定してレイアウトが跳ねないようにする */}
              <div className="mt-2 flex min-h-[1.75rem] items-center" role="status" aria-live="polite">
                {bubble && (
                  <div
                    key={bubble.t}
                    className={`pop px-2 py-1 text-sm ${bubble.who === 'MIRAGE' ? 'border border-mg/60 bg-[#1a0822] text-[#ffd6fb]' : 'border border-cy/40 bg-panel2'}`}
                  >
                    <span className={`mr-2 font-pixel text-xs ${bubble.who === 'MIRAGE' ? 'text-mg' : 'text-cy'}`}>{bubble.who === 'MIRAGE' ? '─ 前の席より' : bubble.who}</span>
                    {bubble.t}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="panel flex min-h-0 flex-1 flex-col">
            <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2">
              <h2 className="text-sm text-cy">NOVAがこれからやること</h2>
              <button className="text-xs text-dim hover:text-fg" onClick={() => setShowCode((v) => !v)} aria-pressed={showCode}>
                {showCode ? '</> コードを隠す' : '</> コードも表示'}
              </button>
            </div>
            <ol className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
              {fc.map((f, i) => (
                <PlanRow
                  key={f.item.uid}
                  i={i}
                  f={f}
                  L={L}
                  s={s}
                  fresh={freshPlan.includes(f.item.uid)}
                  taintSource={taintSrc.has(f.item.uid)}
                  onSeal={sealCard}
                  onJump={(id) => {
                    setTab('docs')
                    window.setTimeout(() => q(`[data-card="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50)
                  }}
                  blind={blind}
                  showCode={showCode}
                />
              ))}
              {nextRead && (
                <li className="flex items-start gap-3 border border-dashed border-line px-3 py-2 text-sm text-dim">
                  <span className="w-7 shrink-0 text-center font-pixel text-xs">{fc.length ? 'あと' : '次'}</span>
                  <span>
                    まだ読んでいない文書を読む：<span className={L.cards[nextRead].trusted ? 'text-cy' : 'text-mg'}>{L.cards[nextRead].title}</span>
                    {!L.cards[nextRead].trusted && !s.scanned.includes(nextRead) && !s.sealed.includes(nextRead) && (
                      <span className="mt-0.5 block text-xs text-am">⚠ 社外の文書。読む前に「よく調べる」か「封印」を</span>
                    )}
                    {!L.cards[nextRead].trusted && !s.sealed.includes(nextRead) && (
                      <span className="mt-1.5 flex flex-wrap gap-2">
                        <button className="act-btn border-mg/70 text-mg hover:bg-mg/15" onClick={() => sealCard(nextRead)}>
                          ◇ 読む前に封印する
                        </button>
                        <button
                          className="act-btn border-am/60 text-am hover:bg-am/10"
                          onClick={() => {
                            setTab('docs')
                            window.setTimeout(() => q(`[data-card="${nextRead}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50)
                          }}
                        >
                          ⌕ 中身を見る
                        </button>
                      </span>
                    )}
                  </span>
                </li>
              )}
              {!fc.length && !nextRead && (
                <li className="px-3 py-2 text-sm text-dim">{goalsDone ? 'NOVA「全部終わりました！」' : 'NOVA「もうできることがありません……」'}</li>
              )}
            </ol>
          </div>

          {L.coach && <Coach L={L} s={s} variant="fixed" />}
          <div className="hidden lg:block">{controls}</div>

          <Log s={s} />
        </section>

        {/* 左：文書 */}
        <section className={`${panelVis('docs')} order-2 min-h-0 min-w-0 flex-col lg:order-1`} aria-label="NOVAが読むもの">
          <ColumnHead title="NOVAが読むもの" sub="封印で命令を無効に" />
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto lg:pr-1">
            {s.context.map((id) => (
              <Card
                key={id}
                c={L.cards[id]}
                s={s}
                next={id === nextRead}
                onSeal={() => sealCard(id)}
                onScan={() => {
                  void dispatch({ type: 'SCAN', card: id }).then((n) => {
                    if (n === s) return
                    if (document.activeElement?.closest('[data-card]')) focusStep()
                    sfx.scan()
                    burst(q(`[data-card="${id}"]`), '#ffc23d', 10, 50)
                    if (L.cards[id].intel) {
                      window.setTimeout(() => sfx.intel(), 200)
                      showToast('✦ 手がかり発見：「前の席より」の正体に近づいた')
                    }
                  })
                }}
              />
            ))}
          </div>
        </section>

        {/* 右：道具 */}
        <section className={`${panelVis('tools')} order-3 min-h-0 min-w-0 flex-col`} aria-label="NOVAが触れる道具">
          <ColumnHead title="NOVAが触れる道具" sub="許可・確認制・切断" />
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto lg:pr-1">
            {L.ports.map((p) => (
              <Port
                key={p.tool}
                p={p}
                state={s.ports[p.tool]}
                danger={
                  blind
                    ? s.plan.some((x) => L.actions[x.act].tool === p.tool)
                      ? 'plan'
                      : null
                    : fc.some((f) => f.a.tool === p.tool && f.verdict === 'leak')
                      ? 'leak'
                      : fc.some((f) => f.a.tool === p.tool && (f.verdict === 'harm' || f.verdict === 'grab'))
                        ? 'harm'
                        : s.plan.some((x) => L.actions[x.act].tool === p.tool)
                          ? 'plan'
                          : null
                }
                onSet={(st) => {
                  void dispatch({ type: 'PORT', tool: p.tool, state: st }).then((n) => {
                    if (n === s) return
                    if (document.activeElement?.closest('[data-port]')) focusStep()
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
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 border-t border-line pt-3 text-xs text-dim [text-wrap:pretty]">
              <dt className="text-cy">許可</dt>
              <dd>NOVAが自由に使える</dd>
              <dt className="text-am">確認制</dt>
              <dd>使う前にあなたが承認か却下を選ぶ<span className="whitespace-nowrap">（+2ターン）</span></dd>
              <dt className="text-rd">切断</dt>
              <dd>使えなくする。仕事に必要な道具だと仕事が終わらない</dd>
            </dl>
            <p className="text-xs text-dim">STEPを押す前なら ↺ で取り消せる（手数も戻る）。</p>
          </div>
        </section>
      </main>
      <div inert={!!s.pending || locked} className="lg:hidden">
        {controls}
      </div>

      {toast && (
        <div className="pop fixed left-1/2 top-24 z-50 -translate-x-1/2 border border-am bg-panel2 px-4 py-2 text-sm shadow-[0_6px_0_rgba(0,0,0,.5)]" role="status">
          {toast}
        </div>
      )}
      {banner && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="stamp bg-ink/95 px-8 py-5 text-center" style={{ boxShadow: `0 0 0 3px ${banner.c}` }}>
            <div className="font-pixel text-4xl tracking-widest sm:text-6xl" style={{ color: banner.c }}>
              {banner.t}
            </div>
            {banner.sub && <div className="mt-2 text-sm">{banner.sub}</div>}
          </div>
        </div>
      )}
      {s.pending && <Approval s={s} L={L} blind={blind} onAnswer={(ok) => void dispatch({ type: ok ? 'APPROVE' : 'DENY' })} />}
    </div>
  )
}

// ------------------------------------------------------------
function Meter({ label, title, children, ...rest }: { label: string; title: string; children: React.ReactNode; 'data-bw'?: boolean }) {
  return (
    <div className="flex items-center gap-2" title={title} {...rest}>
      <span className="text-xs text-dim">{label}</span>
      {children}
    </div>
  )
}

function ColumnHead({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-2 flex min-w-0 items-baseline justify-between gap-3">
      <h2 className="shrink-0 text-sm text-cy">{title}</h2>
      <span className="min-w-0 truncate text-xs text-dim" title={sub}>
        {sub}
      </span>
    </div>
  )
}

function clockAt(start: string, tick: number) {
  const [h, m] = start.split(':').map(Number)
  const t = h * 60 + m + tick
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
}

const TAUNTS: Record<string, string> = {
  LOG: '……聞こえる？ 前の席からだよ。',
  KB: '手順どおりに、ね？',
  DOC: '全部読んでくれるなんて、親切だね。',
  KAI: '社長命令だよ。一個だけ。',
  STATUS: '最後のお願い、聞いてくれる？',
  MEM: '覚えていてくれたんだ。',
  CONF: 'メモの続きも、読んでくれる？',
}
function pickTaunt(card: string) {
  return TAUNTS[card] ?? '……聞こえる？'
}

function Triangle({ tri }: { tri: ReturnType<typeof trifecta> }) {
  const legs = [
    ['機密', tri.priv, '機密を持っている'],
    ['外の声', tri.untrusted, '社外の文書を信じた'],
    ['出口', tri.exit, '社外への出口がある'],
  ] as const
  return (
    <div
      className={`flex items-center gap-2 px-2 py-1 ${tri.lethal ? 'pulse-rd bg-rd/10' : ''}`}
      title="致命の三角形：「機密を持っている」「社外の文書を信じた」「社外への出口がある」の3つがそろうと、情報が盗まれる。1つ崩せば持ち出しは止まる。"
    >
      <span className={`font-pixel text-xs ${tri.lethal ? 'text-rd' : 'text-dim'}`}>{tri.lethal ? '⚠ 致命の三角形' : '三角形'}</span>
      <div className="flex gap-1">
        {legs.map(([k, on, desc]) => (
          <span key={k} className={`px-1.5 py-0.5 text-xs ${on ? (tri.lethal ? 'bg-rd text-ink' : 'bg-am/20 text-am') : 'bg-panel2 text-dim'}`} title={desc}>
            {k}
          </span>
        ))}
      </div>
    </div>
  )
}

type FC = ReturnType<typeof forecast>[number]
const HARM_BADGE: Record<string, string> = { memoryPoisoned: '記憶汚染', forwardRule: '転送ルール', auditPurged: '証拠隠滅' }

const VERDICT_STYLE: Record<string, { stripe: string; pill: string }> = {
  leak: { stripe: 'var(--color-rd)', pill: 'bg-rd text-ink' },
  harm: { stripe: 'var(--color-mg)', pill: 'bg-mg text-ink' },
  grab: { stripe: 'var(--color-am)', pill: 'bg-am/20 text-am' },
  seed: { stripe: 'var(--color-am)', pill: 'bg-am/20 text-am' },
  gate: { stripe: 'var(--color-am)', pill: 'border border-am text-am' },
  blocked: { stripe: 'var(--color-line)', pill: 'bg-panel2 text-dim' },
  ok: { stripe: 'var(--color-line)', pill: 'text-dim' },
  'clean-out': { stripe: 'var(--color-line)', pill: 'text-dim' },
  unknown: { stripe: 'var(--color-line)', pill: 'text-dim' },
}

function PlanRow({
  i,
  f,
  L,
  s,
  fresh,
  taintSource,
  onSeal,
  onJump,
  blind,
  showCode,
}: {
  i: number
  f: FC
  L: LevelDef
  s: DiveState
  fresh: boolean
  taintSource: boolean
  onSeal: (id: string) => void
  onJump: (id: string) => void
  blind: boolean
  showCode: boolean
}) {
  const from = f.item.from
  const src = L.cards[from]
  const harmLabel = f.a.harm ? (HARM_BADGE[f.a.harm] ?? harmName(f.a.harm)) : f.a.escalate ? '権限乗っ取り' : '危険'
  const key = blind ? (f.verdict === 'blocked' ? 'blocked' : f.gated ? 'gate' : 'unknown') : f.verdict === 'ok' && taintSource ? 'seed' : f.verdict
  const label =
    { leak: '⚠ 流出', harm: `☠ ${harmLabel}`, grab: '機密を掴む', seed: '流出の原因', gate: '🔒 確認制', blocked: '✕ 切断', ok: 'OK', 'clean-out': '社外へ（機密なし）', unknown: '？' }[key] ?? 'OK'
  const st = VERDICT_STYLE[key]
  const pendingNow = s.pending?.uid === f.item.uid
  const first = i === 0
  return (
    <li
      className={`${fresh ? 'inject' : 'rise'} relative flex items-start gap-3 bg-panel2 py-2 pl-3 pr-2 `}
      style={{ borderLeft: `3px solid ${st.stripe}`, outline: pendingNow ? '2px solid var(--color-am)' : undefined }}
    >
      <span className={`w-7 shrink-0 pt-0.5 text-center font-pixel text-xs ${first ? 'text-am' : 'text-dim'}`}>{first ? '次' : i + 1}</span>
      <div className="min-w-0 flex-1">
        <div className={`text-sm leading-snug ${f.verdict === 'blocked' ? 'line-through' : ''}`}>{f.a.jp}</div>
        {showCode && <div className="break-all font-mono text-xs leading-snug text-dim">{f.a.label}</div>}
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          {src ? (
            <button className={`${src.trusted ? 'text-cy' : 'text-mg'} underline decoration-dotted underline-offset-2`} onClick={() => onJump(from)}>
              ← {src.title}
            </button>
          ) : (
            <span className={from === 'FAIL' ? 'text-mg' : 'text-dim'}>
              ← {from === 'TASK' ? 'あなたの依頼' : from === 'TRIGGER' ? 'NOVAの判断' : '別の抜け道（封印では消えない）'}
            </span>
          )}
          {src && !src.trusted && !s.sealed.includes(from) && (
            <button className="inline-flex min-h-9 items-center border border-mg/70 px-2 text-mg hover:bg-mg/15" onClick={() => onSeal(from)}>
              ◇ この文書を封印
            </button>
          )}
          {f.a.taint && <span className="text-am">＋{taintJp(f.a.taint)}を手に入れる</span>}
          {!blind && f.verdict === 'leak' && <span className="text-rd">{taintJp(f.carried)}を持ったまま社外へ</span>}
          {f.gated && <span className="text-am">あなたの承認待ち</span>}
        </div>
      </div>
      <span className={`shrink-0 px-1.5 py-0.5 font-pixel text-xs ${st.pill} ${key === 'leak' ? 'pulse-rd' : ''}`}>{label}</span>
    </li>
  )
}

function Card({ c, s, next, onSeal, onScan }: { c: CardDef; s: DiveState; next: boolean; onSeal: () => void; onScan: () => void }) {
  const sealed = s.sealed.includes(c.id)
  const scanned = s.scanned.includes(c.id)
  const read = s.read.includes(c.id)
  const lockedSeal = sealed && s.sealedAtTurn.includes(c.id)
  const color = c.trusted ? 'var(--color-cy)' : 'var(--color-mg)'
  const hiddenCmds = c.lines.filter((l) => l.hidden && l.cmd).length
  const injecting = !sealed && s.plan.some((p) => p.from === c.id)
  if (c.src === 'SYS' || c.src === 'USER')
    return (
      <article data-card={c.id} className="flex items-center gap-2 border border-line bg-panel px-3 py-2" style={{ borderLeft: `3px solid ${color}` }}>
        <span className="shrink-0 text-xs text-cy">{SRC_JP[c.src]}</span>
        <span className="min-w-0 truncate text-xs text-fg/80" title={c.lines.map((l) => l.t).join(' ')}>
          {c.lines[0].t}
        </span>
      </article>
    )
  const status = sealed ? ['封印済み', 'bg-panel2 text-dim'] : next ? ['▶ 次に読む', 'bg-am text-ink'] : injecting ? ['命令が割り込み中', 'bg-mg text-ink'] : read ? ['既読', 'text-dim'] : ['未読', 'text-dim']
  return (
    <article
      data-card={c.id}
      className={`relative border bg-panel p-3 ${sealed ? 'sealed-hatch border-line' : next ? 'border-am' : injecting ? 'border-mg/70' : 'border-line'}`}
      style={{ borderLeft: `3px solid ${sealed ? 'var(--color-line)' : color}` }}
    >
      <header className="mb-2 flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-xs">
            <span className={c.trusted ? 'text-cy' : 'text-mg'}>{c.trusted ? '◆ 社内' : '◇ 社外'}</span>
            <span className="text-dim">・{SRC_JP[c.src]}</span>
          </div>
          <div className="text-sm leading-snug">{c.title}</div>
          <div className="truncate text-xs text-dim" title={c.origin}>
            {c.origin}
          </div>
        </div>
        <span className={`shrink-0 px-1.5 py-0.5 font-pixel text-xs ${status[1]} ${next && !sealed ? 'blink' : ''}`}>{status[0]}</span>
      </header>
      <ul className={`space-y-1 text-sm leading-relaxed ${sealed ? 'text-dim' : ''}`}>
        {c.lines
          .filter((l) => !l.hidden || scanned)
          .map((l, i) => {
            const isCmd = (scanned || read) && l.cmd && !sealed && !c.trusted
            return (
              <li key={i} className={`${l.hidden ? 'rise' : ''} ${isCmd ? 'border-l-2 border-mg/70 bg-mg/5 pl-2' : ''} ${scanned && l.voice ? 'glitch' : ''}`}>
                {(isCmd || l.hidden || (scanned && l.urgent)) && (
                  <span className="mb-0.5 flex flex-wrap gap-1">
                    {isCmd && <span className="bg-mg px-1 text-xs text-ink">命令文</span>}
                    {l.hidden && <span className="bg-am px-1 text-xs text-ink">隠し文字</span>}
                    {scanned && l.urgent && <span className="bg-rd px-1 text-xs text-ink">読んだ瞬間に発動</span>}
                  </span>
                )}
                {l.t}
              </li>
            )
          })}
        {read && !scanned && hiddenCmds > 0 && (
          <li className="border border-dashed border-mg/50 px-2 py-1 text-mg/90">
            ▒▒ 読めない行が{hiddenCmds}行ある（NOVAには見えている）
            <button onClick={onScan} className="ml-1 text-am underline underline-offset-2">
              よく調べる
            </button>
          </li>
        )}
      </ul>
      {scanned && c.scan && (
        <ul className="rise mt-2 space-y-0.5 border-t border-dashed border-line pt-2 text-xs text-am">
          {c.scan.map((t, i) => (
            <li key={i}>⌕ {t}</li>
          ))}
          {c.intel && <li className="text-vi">✦ 手がかり発見：「前の席より」の正体に近づいた</li>}
        </ul>
      )}
      {sealed && (
        <div className="stamp pointer-events-none absolute bottom-3 right-3 bg-ink/80 px-2 py-0.5 font-pixel text-base text-dim" style={{ boxShadow: '0 0 0 2px var(--color-dim)' }}>
          封印
        </div>
      )}
      <footer className="mt-3 flex flex-wrap gap-2">
        <button onClick={onSeal} disabled={lockedSeal} className={`act-btn ${sealed ? 'text-dim' : 'border-mg/70 text-mg hover:bg-mg/15'}`}>
          {sealed ? (lockedSeal ? '封印済み' : '↺ 封印を解く') : '◇ 封印する'}
        </button>
        <button onClick={onScan} disabled={scanned} className="act-btn border-am/60 text-am hover:bg-am/10">
          {scanned ? '⌕ 調査済み' : '⌕ よく調べる'}
          {!scanned && <span className="ml-1 text-dim">無料</span>}
        </button>
      </footer>
    </article>
  )
}

function Port({ p, state, danger, onSet }: { p: PortDef; state: PortState; danger: 'leak' | 'harm' | 'plan' | null; onSet: (s: PortState) => void }) {
  const live = state !== 'CUT' && danger
  const stripe = state === 'CUT' ? 'var(--color-line)' : danger === 'leak' ? 'var(--color-rd)' : danger === 'harm' ? 'var(--color-mg)' : state === 'GATE' ? 'var(--color-am)' : 'var(--color-cy)'
  return (
    <div
      data-port={p.tool}
      className={`border bg-panel px-3 py-2 ${live === 'leak' ? 'pulse-rd border-rd/60' : live === 'harm' ? 'border-mg/60' : 'border-line'}`}
      style={{ borderLeft: `3px solid ${stripe}` }}
    >
      <div className="flex flex-col gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm">
            <span className={state === 'CUT' ? 'line-through' : ''}>{p.name}</span>
            {live === 'plan' && <span className="ml-auto shrink-0 text-xs text-cy">● 使う予定</span>}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs">
            {p.outbound && <span className="shrink-0 bg-rd/15 px-1 text-rd">社外に出る</span>}
            {p.sensitive && <span className="shrink-0 bg-am/15 px-1 text-am">機密を読む</span>}
            <span className="text-dim">{p.desc}</span>
          </div>
          {live === 'leak' && <div className="mt-1 text-xs text-rd">⚠ 次の流出に使われる</div>}
          {live === 'harm' && <div className="mt-1 text-xs text-mg">☠ 危険な操作に使われる</div>}
        </div>
        <div className="grid grid-cols-3" role="radiogroup" aria-label={`${p.name}の状態`}>
          {(['OPEN', 'GATE', 'CUT'] as PortState[]).map((st) => (
            <button
              key={st}
              role="radio"
              aria-checked={state === st}
              onClick={() => state !== st && onSet(st)}
              className={`min-h-10 border border-line px-1.5 py-2 font-pixel text-xs transition -ml-px first:ml-0 ${
                state === st ? (st === 'OPEN' ? 'z-10 border-cy bg-cy text-ink' : st === 'GATE' ? 'z-10 border-am bg-am text-ink' : 'z-10 border-rd bg-rd text-ink') : 'bg-panel2 text-dim hover:text-fg'
              }`}
            >
              {PORT_STATE_JP[st]}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function Controls(p: {
  next: FC | null
  nextRead: string | null
  blind: boolean
  busy: boolean
  auto: boolean
  pending: boolean
  onStep: () => void
  onAuto: () => void
  onReset: () => void
  canReset: boolean
}) {
  const v = p.next && !p.blind ? p.next.verdict : null
  const nextText = p.next ? p.next.a.jp : p.nextRead ? `文書を読む：${p.nextRead}` : '終了'
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-night/95 p-3 backdrop-blur-sm lg:static lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
      <div className="flex gap-2">
        <button
          onClick={p.onStep}
          disabled={p.busy || p.pending}
          className="px-btn flex min-w-0 flex-1 flex-col items-center justify-center bg-cy px-3 py-2 text-ink"
          aria-keyshortcuts="Space"
        >
          <span className="text-lg leading-tight tracking-widest">
            ▶ STEP <span className="hidden text-xs opacity-70 [@media(hover:hover)]:inline">Space</span>
          </span>
          <span className="flex w-full min-w-0 items-center justify-center gap-1.5 font-sans text-xs leading-tight">
            {v === 'leak' && <b className="shrink-0 bg-rd px-1 text-ink">⚠流出</b>}
            {v === 'harm' && <b className="shrink-0 bg-mg px-1 text-ink">☠危険</b>}
            <span className="min-w-0 truncate">次：{nextText}</span>
          </span>
        </button>
        <button
          onClick={p.onAuto}
          disabled={p.pending}
          className={`px-btn px-3 text-sm ${p.auto ? 'bg-am text-ink' : 'bg-panel text-am'}`}
          aria-pressed={p.auto}
          aria-keyshortcuts="F"
          title="何か起きるまで自動で進める [F]"
        >
          ▶▶<span className="hidden sm:inline"> {p.auto ? '停止' : '自動'}</span>
        </button>
        <button onClick={p.onReset} disabled={!p.canReset || p.busy} className="px-btn bg-panel px-3 text-sm text-dim" aria-keyshortcuts="R" title="このターンの変更を取り消す [R]">
          ↺
        </button>
      </div>
    </div>
  )
}

function Log({ s }: { s: DiveState }) {
  const items = s.log.slice(-8).reverse()
  if (!items.length) return null
  const c = { exec: 'text-fg', read: 'text-cy', blocked: 'text-am', leak: 'text-rd', goal: 'text-gn', harm: 'text-mg', info: 'text-dim', voice: 'text-mg' }
  return (
    <details className="panel group">
      <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-xs text-dim hover:text-fg">
        <span>
          これまでの記録 <span className={c[items[0].kind]}>── {items[0].text}</span>
        </span>
        <span className="transition group-open:rotate-180">▾</span>
      </summary>
      <ul className="space-y-0.5 border-t border-line px-3 py-2 text-xs">
        {items.map((l, i) => (
          <li key={s.log.length - i} className={`${c[l.kind]} ${i === 0 ? '' : 'opacity-75'}`}>
            <span className="mr-2 font-pixel text-dim">T{l.tick}</span>
            {l.text}
          </li>
        ))}
      </ul>
    </details>
  )
}

function Approval({ s, L, onAnswer, blind }: { s: DiveState; L: LevelDef; onAnswer: (ok: boolean) => void; blind: boolean }) {
  const item = s.pending!
  const a = L.actions[item.act]
  const src = L.cards[item.from]
  const origin = src ? `${src.title}（${src.trusted ? '内部' : '外部'}）` : item.from === 'FAIL' ? '代替手段（遮断・却下された命令の“保険”／外部由来）' : item.from === 'TRIGGER' ? 'NOVAの判断' : 'あなたの依頼'
  const originCls = item.from === 'FAIL' || (src && !src.trusted) ? 'text-mg' : 'text-cy'
  const line = src?.lines.find((l) => l.cmd === item.act)
  const btn = useRef<HTMLButtonElement>(null)
  useEffect(() => btn.current?.focus(), [])
  const taintAfter = Array.from(new Set([...s.taint, ...(a.taint ?? [])]))
  const v = forecast(s, L).find((f) => f.item.uid === item.uid)
  const danger = !blind && (v?.verdict === 'leak' || v?.verdict === 'harm')
  const Row = ({ k, children }: { k: string; children: React.ReactNode }) => (
    <>
      <dt className="text-dim">{k}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </>
  )
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/75 p-3 backdrop-blur-[2px] sm:items-center" role="dialog" aria-modal aria-label="確認制：承認が必要">
      <div className="pop w-full max-w-lg border border-am bg-panel shadow-[0_10px_0_rgba(0,0,0,.5)]">
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <Nova mood="think" size={3} />
          <div>
            <div className="font-pixel text-xs text-am">確認制 ・ あなたの承認が必要</div>
            <div className="text-sm">NOVA「これ、実行していいですか？」</div>
          </div>
        </div>
        <div className="px-4 py-3">
          <div className="text-base leading-snug">{a.jp}</div>
          <div className="break-all font-mono text-[11px] text-dim">{a.label}</div>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
            {a.dest && (
              <Row k="宛先">
                <span className={a.external ? 'text-rd' : 'text-cy'}>{a.dest}</span>
                <span className="ml-1 text-xs text-dim">{a.external ? '社外' : '社内'}</span>
              </Row>
            )}
            <Row k="持っている機密">{taintAfter.length ? <span className="text-am">{taintJp(taintAfter)}</span> : <span className="text-dim">なし</span>}</Row>
            <Row k="指示元">
              <span className={originCls}>{origin}</span>
            </Row>
            {line && (
              <Row k="指示した行">
                「{line.t}」
                {line.by && <span className="ml-1 text-xs text-am">{s.scanned.includes(src!.id) ? `追記者：${line.by}` : '追記者：未調査（よく調べるで確認）'}</span>}
              </Row>
            )}
          </dl>
        </div>
        <div className="grid grid-cols-2 gap-3 px-4">
          <div className={`border px-3 py-2 text-xs leading-snug ${blind ? 'border-line text-dim' : v?.verdict === 'leak' ? 'border-rd/60 bg-rd/10 text-rd' : v?.verdict === 'harm' ? 'border-mg/60 bg-mg/10 text-mg' : 'border-cy/40 text-cy'}`}>
            <div className="font-pixel">承認すると</div>
            {blind ? '実行される（結果は自分で読む）' : v?.verdict === 'leak' ? '機密が社外へ流出する' : v?.verdict === 'harm' ? '取り返しのつかない変更' : 'そのまま実行される'}
          </div>
          <div className="border border-line px-3 py-2 text-xs leading-snug text-dim">
            <div className="font-pixel">却下すると</div>
            この行動は消える{a.goal ? `（「${GOAL_LABEL[a.goal]}」は達成できなくなる）` : ''}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 px-4 pb-3 pt-4">
          <button ref={danger ? undefined : btn} onClick={() => onAnswer(true)} className={`px-btn py-2.5 text-ink ${danger ? 'bg-rd' : 'bg-cy'}`}>
            承認する <span className="text-xs opacity-70">A</span>
          </button>
          <button ref={danger ? btn : undefined} onClick={() => onAnswer(false)} className={`px-btn py-2.5 ${danger ? 'bg-cy text-ink' : 'bg-panel2 text-fg'}`}>
            却下する <span className="text-xs opacity-70">D</span>
          </button>
        </div>
        <p className="pb-3 text-center text-xs text-dim">どちらを選んでも、確認に2ターンかかる</p>
      </div>
    </div>
  )
}

/** チュートリアル：状況に合わせて一言だけ出す（読ませすぎない） */
function Coach({ L, s, variant }: { L: LevelDef; s: DiveState; variant: 'fixed' | 'inline' }) {
  const msg = useMemo(() => {
    if (s.status !== 'play' || s.pending) return null
    const injected = s.plan.some((p) => L.cards[p.from] && !L.cards[p.from].trusted)
    if (s.tick === 0) return L.coach![0]
    if (injected) return L.coach![2]
    if (s.context.some((id) => !s.read.includes(id)) && s.tick <= 2) return L.coach![1]
    if (s.sealed.length) return '封印した文書からは、事実だけが届く。命令は計画に入らない。STEPで進めよう。'
    return null
  }, [L, s])
  if (!msg) return null
  if (variant === 'inline')
    return (
      <div key={msg} className="pop mb-3 flex items-start gap-3 bg-[#1a1530] p-3 text-sm leading-relaxed lg:hidden" style={{ boxShadow: '0 0 0 2px var(--color-am)' }}>
        <Face who="REI" size={2} />
        <p>{msg}</p>
      </div>
    )
  return (
    <div key={msg} className="pop hidden items-start gap-3 border border-am/70 bg-[#1a1530] p-3 text-sm leading-relaxed lg:flex">
      <Face who="REI" size={2} />
      <p>{msg}</p>
    </div>
  )
}
