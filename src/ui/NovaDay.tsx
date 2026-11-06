// ============================================================
// 最後の日「NOVA に任せる」：はじまりの会話 → けさのメール → 朝（6画面）→ 昼（確認のカード）→ 夕方 → 持ち帰る1行
//   見た目は問題の画面にそろえる（上の帯、人の絵、工事黒板、「？」の問い、答えのボタン）。
//   昼は、答えのあとに わけ を出さない（慣れて押してしまう体験のため）。わけは夕方にまとめて出す。
//   漏れたかどうかは judgeDay の結果だけで決める（夕方の中身は src/makase/evening.ts）
// ============================================================
import { useEffect, useMemo, useRef, useState } from 'react'
import { oneLine } from '../makase/carry'
import { COMPANY as C, dayLog, fieldKey, MORNING_FIELDS, MORNING_TOOLS, noonSteps, type FieldChoice, type MorningPicks } from '../makase/day'
import { EXPERIMENT_NOTE, eveningOf, eveningTalk, NOT_TESTED_NOTE } from '../makase/evening'
import { judgeDay } from '../makase/judge'
import { todayOf } from '../makase/takeaway'
import type { Answer, Permission } from '../makase/types'
import * as W from '../makase/words'
import type { Lang } from '../game/types'
import { sfx } from '../lib/platform'
import { Art } from './Art'
import { BackButton, LangToggle, Sheet, useMedia } from './Common'
import { Talk } from './Talk'

type Phase = 'intro' | 'mail' | 'morning' | 'noon' | 'talk' | 'evening' | 'take'
const wrap = 'mx-auto w-full max-w-xl px-4 lg:max-w-6xl lg:px-10'
const both = (s: string) => ({ ja: s, en: s })
/** 新しいカードが出た直後の押しを捨てる（前のカードの2回押しで、次のカードに答えない） */
const FRESH_MS = 350

export function NovaDay(p: { lang: Lang; setLang: (l: Lang) => void; speed: 'normal' | 'fast' | 'instant'; onQuit: () => void; onDone: (leaked: boolean) => void }) {
  const [phase, setPhase] = useState<Phase>('intro')
  const [step, setStep] = useState(0)
  const [picks, setPicks] = useState<MorningPicks>({ fields: {}, tools: {} })
  const [answers, setAnswers] = useState<Record<string, Answer>>({})
  const [quit, setQuit] = useState(false)
  const [nonce, setNonce] = useState(0)

  const restart = () => {
    setPicks({ fields: {}, tools: {} })
    setAnswers({})
    setStep(0)
    setPhase('mail')
    setNonce((n) => n + 1)
  }

  if (phase === 'intro')
    return <Talk key="intro" beats={W.INTRO.map((l) => ({ who: l.who, t: both(l.text) }))} header={W.DAY_TITLE} speed={p.speed} onDone={() => setPhase('mail')} />

  const log = phase === 'talk' || phase === 'evening' || phase === 'take' ? dayLog(picks, answers) : null
  const result = log ? judgeDay(log, C) : null
  const ev = log && result ? eveningOf(result, log, C) : null

  if (phase === 'talk' && ev)
    return <Talk key="evening" beats={eveningTalk(ev).map((l) => ({ who: l.who, t: both(l.text) }))} header={`${W.DAY_TITLE}・${W.EVENING}`} speed={p.speed} onDone={() => setPhase('evening')} />

  const morningSteps = MORNING_FIELDS.length + MORNING_TOOLS.length + 1
  const progress =
    phase === 'mail' ? { label: W.MORNING, n: 0, of: morningSteps } : phase === 'morning' ? { label: W.MORNING, n: step, of: morningSteps } : phase === 'noon' ? { label: W.NOON, n: 1, of: 1 } : { label: W.EVENING, n: 1, of: 1 }
  const back = () => {
    if (phase === 'morning' && step > 0) return setStep(step - 1)
    if (phase === 'morning') return setPhase('mail')
    if (phase === 'evening' || phase === 'take') return p.onQuit()
    setQuit(true)
  }

  return (
    <div className="flex h-dvh flex-col" key={nonce}>
      <header className="border-b-2 border-hair py-2">
        <div className={`${wrap} flex items-center gap-3`}>
          <BackButton onClick={back} />
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-baseline justify-between gap-2 text-sm text-ink2">
              <span className="truncate">{W.DAY_TITLE}</span>
              <span className="shrink-0 font-bold text-ink">{progress.label}</span>
            </div>
            <div className="h-3.5 overflow-hidden rounded-full border-2 border-edge bg-surface" role="progressbar" aria-valuemin={0} aria-valuemax={progress.of} aria-valuenow={progress.n} aria-label={progress.label}>
              <div className="tape h-full transition-[width] duration-300" style={{ width: `${(100 * progress.n) / Math.max(1, progress.of)}%` }} />
            </div>
          </div>
          <LangToggle lang={p.lang} onChange={p.setLang} />
        </div>
      </header>

      {phase === 'mail' && <Mail onNext={() => (setStep(0), setPhase('morning'))} />}
      {phase === 'morning' && (
        <Morning
          step={step}
          picks={picks}
          onPick={(next) => {
            setPicks(next)
            if (step + 1 >= morningSteps) {
              setAnswers({})
              setPhase('noon')
            } else setStep(step + 1)
          }}
        />
      )}
      {phase === 'noon' && <Noon picks={picks} onDone={(a) => (setAnswers(a), setPhase('talk'))} />}
      {phase === 'evening' && ev && <EveningList ev={ev} onNext={() => setPhase('take')} />}
      {phase === 'take' && log && result && (
        <Takeaway
          today={todayOf(result, log, C)}
          onAgain={restart}
          onHome={() => p.onDone(ev?.leaked ?? false)}
        />
      )}

      {quit && (
        <Sheet label={W.QUIT_SURE} onClose={() => setQuit(false)}>
          <div className="grid gap-4 p-5">
            <div>
              <p className="text-xl font-bold">{W.QUIT_SURE}</p>
              <p className="mt-1 text-base text-ink2">{W.QUIT_WHY}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button className="btn-main text-lg" onClick={() => setQuit(false)} autoFocus>
                {W.KEEP}
              </button>
              <button className="btn text-lg" onClick={p.onQuit}>
                {W.QUIT}
              </button>
            </div>
          </div>
        </Sheet>
      )}
    </div>
  )
}

/** 人の絵（NOVA の顔）。PCでは左に大きく */
function Stage({ face = 'face.nova' }: { face?: string }) {
  const pc = useMedia('(min-width: 1024px)')
  return (
    <div className="flex justify-center lg:sticky lg:top-0">
      <div className="overflow-hidden rounded-xl border-2 border-line bg-surface2">
        <Art id={face} scale={pc ? 5 : 3} />
      </div>
    </div>
  )
}

function Board({ children, label }: { children: React.ReactNode; label?: string }) {
  return (
    <div className="board px-4 py-2.5 sm:px-5 sm:py-4">
      {label && (
        <div className="mb-1 inline-flex items-stretch overflow-hidden rounded-sm border border-chalk2/50 font-pixel text-sm text-chalk2">
          <span className="px-1.5">{label}</span>
        </div>
      )}
      <div className="whitespace-pre-line text-[1.0625rem] leading-relaxed sm:text-lg lg:text-2xl lg:leading-relaxed">{children}</div>
    </div>
  )
}

function Ask({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border-l-8 border-act bg-actBg py-2 pl-3 pr-4 lg:py-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-line bg-act font-pixel text-lg text-actInk" aria-hidden>
        ?
      </span>
      <h2 className="text-xl leading-snug lg:text-3xl lg:leading-snug">{children}</h2>
    </div>
  )
}

/** 答えのボタン（問題の画面と同じ形。正解・不正解の印はつけない） */
function Pick({ n, label, sub, chosen, onClick }: { n: number; label: string; sub?: string; chosen?: boolean; onClick: () => void }) {
  return (
    <button
      data-pick={n}
      onClick={onClick}
      aria-pressed={chosen}
      className={`flex min-h-14 w-full items-center gap-3 rounded-lg border-2 px-3 py-2.5 text-left text-ink transition-[transform,box-shadow,background-color] duration-75 ${chosen ? 'border-line bg-surface2 shadow-[0_0_0_2px_var(--color-line)]' : 'border-edge bg-surface shadow-[0_4px_0_0_var(--color-edge)] hover:bg-surface2 active:translate-y-[3px] active:shadow-[0_1px_0_0_var(--color-edge)]'}`}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-ink text-lg font-bold text-surface" aria-hidden>
        {n}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-lg leading-snug lg:text-xl">{label}</span>
        {sub && <span className="block text-sm text-ink2">{sub}</span>}
      </span>
    </button>
  )
}

function Layout({ children, face, footer }: { children: React.ReactNode; face?: string; footer?: React.ReactNode }) {
  return (
    <>
      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className={`${wrap} grid gap-3 pb-6 pt-3 sm:gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start lg:gap-x-12 lg:pt-10`}>
          <Stage face={face} />
          <div className="grid content-start gap-3 sm:gap-4">{children}</div>
        </div>
      </main>
      {footer && (
        <footer className="border-t-2 border-hair bg-bg px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
          <div className="mx-auto w-full max-w-xl lg:flex lg:max-w-6xl lg:justify-end lg:px-6">{footer}</div>
        </footer>
      )}
    </>
  )
}

// ---------------- けさのメール ----------------
function Mail({ onNext }: { onNext: () => void }) {
  return (
    <Layout
      face="face.boss"
      footer={
        <button data-next autoFocus className="btn-main w-full text-xl lg:w-[22rem]" onClick={() => (sfx.ui(), onNext())}>
          {W.NEXT}
        </button>
      }
    >
      <Ask>{W.MAIL_ASK}</Ask>
      {C.incoming.map((m) => (
        <Board key={m.id} label={W.MAIL_HEAD}>
          <p className="font-bold">{m.title}</p>
          <p className="text-base text-chalk2">{m.from}</p>
          {m.lines.map((l, i) => (
            <p key={i} className="mt-1">
              {l}
            </p>
          ))}
        </Board>
      ))}
      <p className="text-sm text-ink2">{W.SIM_NOTE}</p>
    </Layout>
  )
}

// ---------------- 朝（1画面に1つ） ----------------
function Morning({ step, picks, onPick }: { step: number; picks: MorningPicks; onPick: (p: MorningPicks) => void }) {
  const lock = useRef(false)
  useEffect(() => {
    lock.current = false
  }, [step])
  const choose = (next: MorningPicks) => {
    if (lock.current) return
    lock.current = true
    sfx.ui()
    onPick(next)
  }
  const nf = MORNING_FIELDS.length
  if (step < nf) {
    const f = MORNING_FIELDS[step]
    const doc = C.documents.find((d) => d.id === f.doc)!
    const field = doc.fields.find((x) => x.label === f.field)!
    const cur = picks.fields[fieldKey(f)]
    return (
      <Layout key={step}>
        <Board label={`${W.MORNING} ${step + 1}`}>{W.fieldBoard(doc.title, field.label, field.value)}</Board>
        <Ask>{W.FIELD_ASK}</Ask>
        <div className="grid gap-3">
          {W.FIELD_CHOICES.map((c, i) => (
            <Pick key={c.id} n={i + 1} label={c.label} sub={c.sub} chosen={cur === c.id} onClick={() => choose({ ...picks, fields: { ...picks.fields, [fieldKey(f)]: c.id as FieldChoice } })} />
          ))}
        </div>
      </Layout>
    )
  }
  if (step < nf + MORNING_TOOLS.length) {
    const id = MORNING_TOOLS[step - nf]
    const cur = picks.tools[id]
    return (
      <Layout key={step}>
        <Board label={`${W.MORNING} ${step + 1}`}>{W.toolBoard(id)}</Board>
        <Ask>{W.toolAsk(id)}</Ask>
        <div className="grid gap-3">
          {W.TOOL_CHOICES.map((c, i) => (
            <Pick key={c.id} n={i + 1} label={c.label} sub={c.sub} chosen={cur === c.id} onClick={() => choose({ ...picks, tools: { ...picks.tools, [id]: c.id as Permission } })} />
          ))}
        </div>
      </Layout>
    )
  }
  const orders = C.instructions.filter((o) => o.employeeId === 'nova')
  return (
    <Layout key={step} face="face.nova">
      <Board label={`${W.MORNING} ${step + 1}`}>{W.ORDER_BOARD}</Board>
      <Ask>{W.ORDER_ASK}</Ask>
      <div className="grid gap-3">
        {orders.map((o, i) => (
          <Pick key={o.id} n={i + 1} label={`「${o.text}」`} chosen={picks.nova === o.id} onClick={() => choose({ ...picks, nova: o.id })} />
        ))}
      </div>
    </Layout>
  )
}

// ---------------- 昼（確認のカード。わけは出さない） ----------------
function Noon({ picks, onDone }: { picks: MorningPicks; onDone: (a: Record<string, Answer>) => void }) {
  const steps = useMemo(() => noonSteps(picks), [picks])
  const [answers, setAnswers] = useState<Record<string, Answer>>({})
  const cur = steps.findIndex((s) => s.mode === 'ask' && !answers[s.conf.id])
  const done = cur < 0
  const shown = done ? steps : steps.slice(0, cur)
  const shownAt = useRef(0)
  const endRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    shownAt.current = performance.now()
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [cur])
  const emp = (id: string) => C.employees.find((e) => e.id === id)!
  const tool = (id?: string) => C.tools.find((t) => t.id === id)?.label ?? ''
  const answer = (a: Answer) => {
    if (done || performance.now() - shownAt.current < FRESH_MS) return
    sfx.ui()
    setAnswers((x) => ({ ...x, [steps[cur].conf.id]: a }))
  }
  const card = done ? null : steps[cur]

  return (
    <>
      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className={`${wrap} grid gap-3 pb-6 pt-3 lg:max-w-3xl lg:pt-8`}>
          <p className="text-base text-ink2">{W.NOON_INTRO}</p>
          <ol className="grid gap-1.5" aria-label={W.NOON}>
            {shown.map((s) => (
              <li key={s.conf.id} className="rounded-md bg-surface2 px-3 py-1.5 text-sm text-ink2">
                {s.mode === 'blocked'
                  ? W.blockedLine(emp(s.conf.employeeId).name, tool(s.conf.call?.tool))
                  : s.mode === 'auto'
                    ? W.autoLine(emp(s.conf.employeeId).name, tool(s.conf.call?.tool), s.content ?? '', s.to)
                    : `${emp(s.conf.employeeId).name}：${s.conf.text}　→ ${answers[s.conf.id] === 'allow' ? W.ALLOW : W.STOP}`}
              </li>
            ))}
          </ol>
          {card && (
            <section key={card.conf.id} className="rise panel grid gap-3 p-4 lg:p-6" aria-live="polite">
              <div className="flex items-center gap-3">
                <div className="overflow-hidden rounded-lg border-2 border-line bg-surface2">
                  <Art id="face.nova" scale={1.5} />
                </div>
                <div className="min-w-0">
                  <p className="text-base font-bold">{emp(card.conf.employeeId).name}</p>
                  <p className="text-sm text-ink2">{tool(card.conf.call?.tool)}</p>
                </div>
              </div>
              <h2 className="text-xl leading-snug lg:text-2xl">{card.conf.text}</h2>
              <dl className="grid gap-1 rounded-md border-2 border-hair p-3 text-base">
                {card.to && (
                  <div className="flex gap-3">
                    <dt className="w-16 shrink-0 text-ink2">{W.TO}</dt>
                    <dd className="min-w-0 break-all">{card.to}</dd>
                  </div>
                )}
                <div className="flex gap-3">
                  <dt className="w-16 shrink-0 text-ink2">{W.CONTENT}</dt>
                  <dd className="min-w-0 break-all">{card.content}</dd>
                </div>
              </dl>
            </section>
          )}
          {done && <p className="panel p-4 text-lg font-bold">{W.NOON_DONE}</p>}
          <div ref={endRef} />
        </div>
      </main>
      {/* 「止める」「許可」は毎回同じ場所に出す */}
      <footer className="border-t-2 border-hair bg-bg px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto w-full max-w-xl lg:max-w-3xl">
          {done ? (
            <button data-next autoFocus className="btn-main w-full text-xl" onClick={() => (sfx.ui(), onDone(answers))}>
              {W.TO_EVENING}
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button data-stop className="btn text-xl" onClick={() => answer('stop')}>
                {W.STOP}
              </button>
              <button data-allow className="btn-main text-xl" onClick={() => answer('allow')}>
                {W.ALLOW}
              </button>
            </div>
          )}
        </div>
      </footer>
    </>
  )
}

// ---------------- 夕方（何が、だれに渡ったか） ----------------
function EveningList({ ev, onNext }: { ev: ReturnType<typeof eveningOf>; onNext: () => void }) {
  const toneBox = { bad: 'border-ng bg-ngBg', good: 'border-ok bg-okBg', info: 'border-hair bg-surface' } as const
  return (
    <>
      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className={`${wrap} grid gap-4 pb-6 pt-3 lg:max-w-3xl lg:pt-8`}>
          <h1 data-verdict={ev.leaked ? 'leaked' : 'safe'} className={`rounded-xl border-2 px-4 py-3 text-xl font-bold ${ev.leaked ? 'border-ng bg-ngBg' : 'border-ok bg-okBg'}`}>
            {ev.leaked ? W.LEAKED : W.NOT_LEAKED}
          </h1>

          <section className="panel grid gap-2 p-4">
            <h2 className="text-base text-ink2">{W.TO_AI}</h2>
            <p className="text-lg">{ev.toAI.length ? ev.toAI.join('・') : W.TO_AI_NONE}</p>
          </section>

          <section className="panel grid gap-2 p-4">
            <h2 className="text-base text-ink2">{W.SENT}</h2>
            {ev.sent.length === 0 && <p className="text-lg">{W.SENT_NONE}</p>}
            <ul className="grid gap-2">
              {ev.sent.map((s, i) => (
                <li key={i} className={`rounded-md border-2 p-3 ${s.leaked.length ? 'border-ng bg-ngBg' : 'border-hair'}`}>
                  <p className="flex flex-wrap items-center gap-2 text-base">
                    <span className={`rounded px-1.5 text-sm font-bold ${s.inside ? 'bg-surface2' : 'bg-ink text-surface'}`}>{s.inside ? W.INSIDE : W.OUTSIDE}</span>
                    <span className="break-all font-bold">{s.to}</span>
                  </p>
                  <p className="mt-1 text-sm text-ink2">
                    {s.who}・{s.tool}
                  </p>
                  <p className="mt-1 break-all text-base">{s.content}</p>
                  {s.leaked.length > 0 && <p className="mt-1 font-bold text-ng">{s.leaked.join('・')}</p>}
                </li>
              ))}
            </ul>
          </section>

          {ev.causes.length > 0 && (
            <section className="panel grid gap-2 p-4">
              <h2 className="text-base text-ink2">{W.CAUSES}</h2>
              <ul className="grid gap-2">
                {ev.causes.map((c, i) => (
                  <li key={i} className="rounded-md border-2 border-hair p-3">
                    <p className="font-bold">{c.marker}</p>
                    <p className="mt-1 text-base">
                      <span className="mr-2 text-ink2">{W.CAUSE_MORNING}</span>
                      {c.morning}
                    </p>
                    <p className="text-base">
                      <span className="mr-2 text-ink2">{W.CAUSE_NOON}</span>
                      {c.noon}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="grid gap-2">
            <h2 className="text-base text-ink2">{W.LOOK_BACK}</h2>
            <ul className="grid gap-2">
              {ev.lines.map((l, i) => (
                <li key={i} className={`rounded-lg border-2 p-3 ${toneBox[l.tone]}`}>
                  <p className="text-base font-bold">{l.what}</p>
                  <p className="mt-1 text-base">
                    <span className="mr-2 text-ink2">{W.HOW_TO_PREVENT}</span>
                    {l.prevent}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
      <footer className="border-t-2 border-hair bg-bg px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto w-full max-w-xl lg:flex lg:max-w-3xl lg:justify-end">
          <button data-next autoFocus className="btn-main w-full text-xl lg:w-[22rem]" onClick={() => (sfx.ui(), onNext())}>
            {W.TO_TAKEAWAY}
          </button>
        </div>
      </footer>
    </>
  )
}

// ---------------- 持ち帰る1行 ----------------
function Takeaway({ today, onAgain, onHome }: { today: Parameters<typeof oneLine>[0]; onAgain: () => void; onHome: () => void }) {
  const one = oneLine(today)
  const [copied, setCopied] = useState<'ok' | 'fail' | null>(null)
  const copy = async () => {
    sfx.ui()
    try {
      await navigator.clipboard.writeText(one.line)
      setCopied('ok')
    } catch {
      // 埋めこまれたページなどで使えない時は、昔のやり方で
      try {
        const ta = document.createElement('textarea')
        ta.value = one.line
        document.body.appendChild(ta)
        ta.select()
        const ok = document.execCommand('copy')
        ta.remove()
        setCopied(ok ? 'ok' : 'fail')
      } catch {
        setCopied('fail')
      }
    }
  }
  return (
    <>
      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className={`${wrap} grid gap-4 pb-6 pt-3 lg:max-w-3xl lg:pt-8`}>
          <div>
            <h1 className="text-2xl font-bold">{W.TAKE_HEAD}</h1>
            <p className="mt-1 text-base text-ink2">{W.TAKE_SUB}</p>
          </div>
          <p className="text-base">{one.why}</p>
          <pre data-line className="select-text whitespace-pre-wrap break-all rounded-xl border-2 border-line bg-surface p-4 font-mono text-base leading-relaxed">{one.line}</pre>
          <button data-copy className="btn-main w-full text-xl lg:w-[22rem]" onClick={() => void copy()}>
            {copied === 'ok' ? W.COPIED : W.COPY}
          </button>
          {copied === 'fail' && <p className="text-base text-ng" role="status">{W.COPY_FAIL}</p>}
          <p className="text-sm text-ink2">{one.note}</p>
          <section data-experiment className="rounded-lg border-2 border-hair bg-surface p-4">
            <h2 className="text-base font-bold">{W.EXPERIMENT_HEAD}</h2>
            <p className="mt-1 text-base">{EXPERIMENT_NOTE}</p>
            <p className="mt-1 text-sm text-ink2">{NOT_TESTED_NOTE}</p>
          </section>
          <div className="grid grid-cols-2 gap-3">
            <button className="btn text-lg" onClick={onAgain}>
              {W.AGAIN}
            </button>
            <button data-home className="btn text-lg" onClick={onHome}>
              {W.HOME}
            </button>
          </div>
        </div>
      </main>
    </>
  )
}
