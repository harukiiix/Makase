// ============================================================
// 見回りの画面：場面の絵を押して、情報がもれそうな物を探す
//   スマホ縦：上に絵、下に監督の欄 / スマホ横：左に絵、右に欄 / PC：左に大きな絵、右に欄
//   どの形でも、遊んでいる間はページをスクロールしない
// ============================================================
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { SCENE_H, SCENE_W } from '../art/scene'
import { allFound, initRound, reduceRound, resultOf, risks, spotOf, type DayResult, type RoundAction, type RoundState } from '../game/round'
import type { Box, Day, Mark } from '../game/types'
import { FAST, sfx } from '../lib/platform'
import { Art, boxesOf, cropURL, sceneURL } from './Art'
import { useT } from './i18n'
import { FACE, S, SPEAKER } from './strings'

export function useMedia(query: string) {
  const [m, setM] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setM(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [query])
  return m
}

const MARK_COLOR: Record<Mark | 'asking' | 'hint', string> = {
  right: 'var(--color-right)',
  other: 'var(--color-other)',
  safe: '#8a8475',
  bonus: 'var(--color-bonus)',
  asking: 'var(--color-risk)',
  hint: 'var(--color-hint)',
}

export function Round({
  day,
  tutorial,
  onEnd,
  onQuit,
  onHowto,
}: {
  day: Day
  /** 初めての見回り：指さしで1つ教える */
  tutorial: boolean
  onEnd: (r: DayResult) => void
  onQuit: () => void
  onHowto: () => void
}) {
  const [s, setS] = useState<RoundState>(() => initRound(day))
  const sRef = useRef(s)
  useLayoutEffect(() => {
    sRef.current = s
  }, [s])
  const boxes = useMemo(() => boxesOf(day), [day])
  const [confirm, setConfirm] = useState(false)
  const [nudge, setNudge] = useState(0)
  const complete = allFound(day, s)
  const rs = risks(day)
  const foundN = rs.filter((r) => s.marks[r.id] === 'right' || s.marks[r.id] === 'other').length

  const act = (a: RoundAction) => {
    const cur = sRef.current
    const next = reduceRound(day, cur, a)
    if (a.type === 'TAP') {
      if (cur.asking && next === cur) {
        // 「どうする？」に答える前に、ほかを押した
        sfx.wait()
        setNudge((n) => n + 1)
        return
      }
      const sp = spotOf(day, a.spot)
      if (next.asking && !cur.asking) sfx.found()
      else if (sp && !cur.marks[sp.id]) {
        if (sp.kind === 'safe') sfx.safe()
        else sfx.bonus()
      }
      else sfx.ui()
    }
    if (a.type === 'CHOOSE' && cur.asking && next !== cur) {
      if (next.marks[cur.asking] === 'right') sfx.right()
      else sfx.other()
      if (allFound(day, next)) window.setTimeout(() => sfx.complete(), 380)
    }
    if (a.type === 'HINT' && next !== cur) sfx.hint()
    sRef.current = next
    setS(next)
    if (next.ended && !cur.ended) onEnd(resultOf(day, next))
  }

  const tryEnd = () => {
    if (sRef.current.asking) return act({ type: 'TAP', spot: sRef.current.asking })
    if (allFound(day, sRef.current)) return act({ type: 'END' })
    sfx.ui()
    setConfirm(true)
  }

  // キー：1・2 で選ぶ、H で宮下さんに聞く、Esc で確認を閉じる
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return
      const cur = sRef.current
      if (cur.asking && (e.key === '1' || e.key === '2')) act({ type: 'CHOOSE', index: e.key === '1' ? 0 : 1 })
      else if (!cur.asking && (e.key === 'h' || e.key === 'H')) act({ type: 'HINT' })
      else if (e.key === 'Escape') setConfirm(false)
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  })

  const showPointer = tutorial && !!day.firstPoint && Object.keys(s.marks).length === 0 && !s.asking
  return (
    <div className="flex h-dvh flex-col">
      <Header day={day} s={s} foundN={foundN} all={rs.length} onHowto={onHowto} onQuit={onQuit} />
      <main className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-3 p-3 short:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] short:grid-rows-1 short:gap-2 short:p-2 lg:grid-cols-[minmax(0,1fr)_minmax(360px,420px)] lg:grid-rows-1 lg:gap-4 lg:p-4">
        <SceneBox day={day} s={s} boxes={boxes} pointer={showPointer ? day.firstPoint! : null} onTap={(id) => act({ type: 'TAP', spot: id })} />
        <Panel
          day={day}
          s={s}
          boxes={boxes}
          complete={complete}
          tutorial={showPointer}
          confirm={confirm}
          nudge={nudge}
          remaining={rs.length - foundN}
          onChoose={(i) => act({ type: 'CHOOSE', index: i })}
          onHint={() => act({ type: 'HINT' })}
          onEnd={tryEnd}
          onConfirm={() => {
            setConfirm(false)
            act({ type: 'END' })
          }}
          onCancel={() => setConfirm(false)}
        />
      </main>
    </div>
  )
}

// ------------------------------------------------------------
function Header({ day, s, foundN, all, onHowto, onQuit }: { day: Day; s: RoundState; foundN: number; all: number; onHowto: () => void; onQuit: () => void }) {
  const t = useT()
  const [menu, setMenu] = useState(false)
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    if (!armed) return
    const tm = window.setTimeout(() => setArmed(false), 3000)
    return () => clearTimeout(tm)
  }, [armed])
  const bonus = day.spots.some((x) => x.kind === 'bonus' && s.marks[x.id] === 'bonus')
  return (
    <header className="relative z-30 flex items-center gap-3 border-b-2 border-[#15171b] bg-asphalt2 px-3 py-1.5 sm:px-4 short:py-1">
      <span className="stripes hidden h-8 w-3 shrink-0 sm:block" aria-hidden />
      <div className="min-w-0 flex-1 leading-tight">
        <div className="text-sm text-onDark2">{t(day.dayName)}</div>
        <div className="truncate font-pixel text-lg">{t(day.place)}</div>
      </div>
      {/* 見つけた数：丸が埋まっていく */}
      <div className="flex items-center gap-1.5" role="status" aria-label={t(S.found(foundN, all))}>
        {risks(day).map((r) => {
          const m = s.marks[r.id]
          return <span key={r.id} className={`h-4 w-4 rounded-full ${m ? 'pop' : ''}`} style={{ background: m === 'right' ? 'var(--color-right)' : m === 'other' ? 'var(--color-other)' : 'transparent', boxShadow: `0 0 0 2px ${m ? '#15171b' : 'var(--color-onDark2)'}` }} aria-hidden />
        })}
        <span className="ml-1 font-pixel text-base tabular-nums text-onDark" aria-hidden>
          {foundN}/{all}
        </span>
        {bonus && (
          <span className="pop ml-1 flex h-6 w-6 items-center justify-center rounded-full bg-bonus font-pixel text-sm text-white" title={t(S.bonusMark)}>
            ?
          </span>
        )}
      </div>
      <div className="relative">
        <button className="btn-dark h-11 w-11 p-0 text-xl" aria-expanded={menu} aria-label={t(S.menu)} onClick={() => (sfx.ui(), setMenu((v) => !v))}>
          ☰
        </button>
        {menu && (
          <div className="rise absolute right-0 top-full z-40 mt-2 grid w-60 gap-2 bg-asphalt2 p-2" style={{ boxShadow: '0 0 0 2px #15171b, 0 8px 0 rgba(0,0,0,.35)' }}>
            <button className="btn-dark justify-start text-base" onClick={() => (setMenu(false), onHowto())}>
              ？ {t(S.howto)}
            </button>
            <button className={`btn-dark justify-start text-base ${armed ? 'text-[#ff8a8a]' : ''}`} onClick={() => (armed ? onQuit() : setArmed(true))}>
              ⏏ {t(armed ? S.quitSure : S.quit)}
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

// ------------------------------------------------------------
// 場面の絵と、押せる物
function SceneBox({ day, s, boxes, pointer, onTap }: { day: Day; s: RoundState; boxes: Record<string, Box>; pointer: string | null; onTap: (id: string) => void }) {
  const t = useT()
  const wrap = useRef<HTMLDivElement>(null)
  const pc = useMedia('(min-width: 1024px)')
  const short = useMedia('(max-height: 500px)')
  const [k, setK] = useState(2)
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([])
  const rid = useRef(0)

  useLayoutEffect(() => {
    const el = wrap.current
    if (!el) return
    const fit = () => {
      const r = el.getBoundingClientRect()
      const byW = r.width / SCENE_W
      // スマホ縦：下の欄（ひとこと＋2択）が画面に入るよう、絵の高さを残りの分までにする
      const byH = pc || short ? r.height / SCENE_H : Math.max(150, window.innerHeight - 340) / SCENE_H
      let v = Math.min(byW, byH)
      // 大きく出せる時は、1ドットがそろう整数倍にする（くっきり見える）
      if (v >= 3) v = Math.floor(v)
      setK(Math.max(1, v))
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    window.addEventListener('resize', fit)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', fit)
    }
  }, [pc, short])

  // 大きい物から先に置く（小さい物が上に来て、押しやすい）
  const order = [...day.spots].filter((x) => boxes[x.id]).sort((a, b) => boxes[b.id][2] * boxes[b.id][3] - boxes[a.id][2] * boxes[a.id][3])
  const MIN = 40
  const rectOf = (b: Box, pad = 0) => {
    let w = b[2] * k + pad * 2
    let h = b[3] * k + pad * 2
    let x = b[0] * k - pad
    let y = b[1] * k - pad
    if (w < MIN) {
      x -= (MIN - w) / 2
      w = MIN
    }
    if (h < MIN) {
      y -= (MIN - h) / 2
      h = MIN
    }
    return { left: x, top: y, width: w, height: h }
  }

  return (
    <div ref={wrap} className={`relative flex min-h-0 min-w-0 justify-center ${pc || short ? 'items-center' : 'items-start'}`}>
      <div
        className="relative cursor-zoom-in select-none"
        style={{ width: SCENE_W * k, height: SCENE_H * k, boxShadow: '0 0 0 3px #15171b, 0 6px 0 rgba(0,0,0,.4)' }}
        onClick={(e) => {
          // 何もない所：小さな波紋だけ（失敗にはしない）
          const r = e.currentTarget.getBoundingClientRect()
          const id = ++rid.current
          setRipples((v) => [...v.slice(-3), { id, x: e.clientX - r.left, y: e.clientY - r.top }])
          window.setTimeout(() => setRipples((v) => v.filter((x) => x.id !== id)), 420)
          sfx.tap()
        }}
      >
        <img src={sceneURL(day.scene)} alt="" aria-hidden className="pixelated absolute inset-0 h-full w-full" draggable={false} />
        {order.map((sp) => (
          <button
            key={sp.id}
            data-spot={sp.id}
            data-kind={FAST ? sp.kind : undefined}
            aria-label={t(sp.name)}
            className="absolute rounded-md bg-transparent focus-visible:outline-offset-0"
            style={rectOf(boxes[sp.id])}
            onClick={(e) => {
              e.stopPropagation()
              onTap(sp.id)
            }}
          />
        ))}
        {/* 印：見つけた物・大丈夫な物・気になる人・いま選んでいる物・ヒント */}
        {day.spots.map((sp) => {
          const b = boxes[sp.id]
          if (!b) return null
          const m = s.marks[sp.id]
          const asking = s.asking === sp.id
          const hinted = s.hinted === sp.id && !m && !asking
          if (!m && !asking && !hinted) return null
          const kind = asking ? 'asking' : hinted ? 'hint' : m!
          const pad = hinted ? 10 : 4
          const r = rectOf(b, pad)
          const color = MARK_COLOR[kind]
          if (kind === 'safe')
            return (
              <span key={sp.id} className="pop pointer-events-none absolute flex h-6 min-w-6 items-center justify-center rounded-full px-1 font-pixel text-xs text-white" style={{ left: r.left + r.width - 14, top: r.top - 8, background: color, boxShadow: '0 0 0 2px #15171b' }} aria-hidden>
                OK
              </span>
            )
          return (
            <span key={sp.id} className={`pointer-events-none absolute ${hinted ? 'pulse' : 'ring-in'}`} style={r} aria-hidden>
              <span className="absolute inset-0 rounded-[50%]" style={{ border: `${hinted ? 3 : 4}px ${hinted || kind === 'bonus' ? 'dashed' : 'solid'} ${color}`, boxShadow: '0 0 0 2px rgba(255,255,255,.75)' }} />
              {(kind === 'right' || kind === 'other' || kind === 'bonus') && (
                <span className="pop absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full font-pixel text-base text-white" style={{ background: color, boxShadow: '0 0 0 2px #15171b' }}>
                  {kind === 'bonus' ? '?' : '✓'}
                </span>
              )}
              {hinted && <span className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-hint px-2 py-0.5 font-pixel text-sm text-white">{t(S.here)}</span>}
            </span>
          )
        })}
        {pointer && boxes[pointer] && (
          <span className="bob pointer-events-none absolute flex flex-col items-center" style={{ left: rectOf(boxes[pointer]).left + rectOf(boxes[pointer]).width / 2 - 24, top: Math.max(0, rectOf(boxes[pointer]).top - 46), width: 48 }} aria-hidden>
            <span className="bg-safety px-2 py-0.5 font-pixel text-sm text-ink" style={{ boxShadow: '0 0 0 2px #15171b' }}>
              {t(S.here)}
            </span>
            <span className="text-2xl leading-none text-safety" style={{ textShadow: '0 2px 0 #15171b' }}>
              ▼
            </span>
          </span>
        )}
        {ripples.map((r) => (
          <span key={r.id} className="ripple pointer-events-none absolute h-10 w-10 rounded-full border-2 border-white/80" style={{ left: r.x, top: r.y }} aria-hidden />
        ))}
      </div>
    </div>
  )
}

// ------------------------------------------------------------
// 監督の欄：ひとこと、どうする？の2択、ヒント、終わる
function Panel(p: {
  day: Day
  s: RoundState
  boxes: Record<string, Box>
  complete: boolean
  tutorial: boolean
  confirm: boolean
  nudge: number
  remaining: number
  onChoose: (i: 0 | 1) => void
  onHint: () => void
  onEnd: () => void
  onConfirm: () => void
  onCancel: () => void
}) {
  const t = useT()
  const { day, s, boxes } = p
  const sp = s.last ? spotOf(day, s.last.spot) : undefined
  const asking = s.asking ? spotOf(day, s.asking) : undefined
  const focus = asking ?? sp
  let text = t(day.start)
  let badge: Mark | null = null
  if (asking) text = t(asking.look)
  else if (s.last?.show === 'reply' && sp?.choices && s.last.choice !== undefined) {
    const c = sp.choices[s.last.choice]
    text = t(c.reply)
    badge = c.ok ? 'right' : 'other'
  } else if (s.last && sp) {
    if (sp.kind === 'risk') {
      const ok = sp.choices?.find((c) => c.ok)
      text = t(ok?.reply ?? sp.look)
      badge = s.marks[sp.id] === 'right' ? 'right' : 'other'
    } else {
      text = t(sp.look)
      badge = sp.kind === 'safe' ? 'safe' : 'bonus'
    }
  } else if (s.hinted) text = t(S.objectHint)
  else if (p.tutorial) text = t(S.tryThis)

  const badgeText = badge === 'right' ? S.rightMark : badge === 'other' ? S.otherMark : badge === 'safe' ? S.safeMark : badge === 'bonus' ? S.bonusMark : null
  return (
    <section className="paper flex min-h-0 flex-col" aria-label={t(SPEAKER.BOSS)}>
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3 sm:p-4">
        {/* 監督のひとこと。物を押した時は、顔のかわりにその物を大きく見せる（小さな画面でも、何を押したかわかるように） */}
        <div className="flex items-start gap-3" role="status" aria-live="polite">
          {focus && boxes[focus.id] ? (
            <img key={`zoom-${focus.id}`} src={cropURL(day.scene, boxes[focus.id], 4)} alt="" aria-hidden className="pop pixelated h-16 w-auto max-w-[38%] shrink-0 bg-paper2 object-contain p-0.5 lg:h-24" style={{ boxShadow: `0 0 0 2px ${asking ? 'var(--color-risk)' : '#1d1f24'}` }} draggable={false} />
          ) : (
            <div className="shrink-0 bg-paper2 p-0.5" style={{ boxShadow: '0 0 0 2px #1d1f24' }} aria-hidden>
              <Art id={FACE.BOSS} scale={1.5} className="lg:hidden" />
              <Art id={FACE.BOSS} scale={2} className="hidden lg:inline-block" />
            </div>
          )}
          <div key={`${s.last?.spot}-${s.last?.show}-${s.hinted}-${s.asking}`} className="rise min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              {focus ? <span className="text-sm font-bold text-ink">{t(focus.name)}</span> : <span className="font-pixel text-sm text-ink2">{t(SPEAKER.BOSS)}</span>}
              {badgeText && (
                <span className="px-1.5 py-0.5 font-pixel text-sm text-white" style={{ background: MARK_COLOR[badge!] }}>
                  {badge === 'right' || badge === 'other' ? '✓ ' : ''}
                  {t(badgeText)}
                </span>
              )}
            </div>
            <p className="text-lg leading-relaxed lg:text-xl">{text}</p>
            {focus?.zoom && <p className="mt-1 whitespace-pre-line break-words bg-paper2 px-2 py-1 font-mono text-sm leading-snug text-ink">{t(focus.zoom)}</p>}
          </div>
        </div>

        {/* どうする？ */}
        {asking?.choices && (
          <div key={`${asking.id}-${p.nudge}`} className={`grid gap-2 ${p.nudge ? 'shake' : ''}`}>
            <div className="font-pixel text-base text-risk">{t(S.yourChoice)}</div>
            {asking.choices.map((c, i) => (
              <button key={i} data-pick={i} data-ok={FAST ? String(c.ok) : undefined} className="btn w-full justify-start gap-3 py-2 text-left text-lg leading-snug" onClick={() => p.onChoose(i as 0 | 1)}>
                <span className="hidden h-6 w-6 shrink-0 items-center justify-center bg-ink font-pixel text-sm text-paper lg:flex" aria-hidden>
                  {i + 1}
                </span>
                <Art id={c.icon} scale={2} />
                <span className="min-w-0">{t(c.t)}</span>
              </button>
            ))}
          </div>
        )}

        {/* 全部見つけた */}
        {p.complete && !asking && (
          <div className="rise mt-auto grid gap-2 border-t-2 border-dashed border-paperLine pt-3">
            <p className="text-lg font-bold leading-relaxed">{t(day.done)}</p>
            <button data-finish className="btn-main w-full text-lg" onClick={p.onEnd}>
              {t(S.finishDay)} ▶
            </button>
          </div>
        )}
      </div>

      {/* 下：宮下さんに聞く / 見回りを終える */}
      {!p.complete && !s.asking && (
        <div className="border-t-2 border-paperLine p-2 sm:p-3">
          {p.confirm ? (
            <div className="rise grid gap-2">
              <p className="text-base font-bold">{t(S.endSure(p.remaining))}</p>
              <div className="grid grid-cols-2 gap-2">
                <button className="btn-main text-base" onClick={p.onCancel} autoFocus>
                  {t(S.keepLooking)}
                </button>
                <button data-end-anyway className="btn text-base" onClick={p.onConfirm}>
                  {t(S.endAnyway)}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button data-hint className="btn text-base" disabled={!!s.asking} onClick={p.onHint}>
                <Art id="icon.ask" scale={1.5} />
                {t(S.askBoss)}
              </button>
              <button data-end className="btn text-base" disabled={!!s.asking} onClick={p.onEnd}>
                {t(S.endRound)}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
