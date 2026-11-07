// ============================================================
// 最後の日「AIの事務員に頼む練習」：はじまりの会話 → けさのメール → 朝（6画面）→ 昼（確認のカード）→ 夕方 → 持ち帰る1行
//   見た目は問題の画面にそろえる（上の帯、人の絵、工事黒板、「？」の問い、答えのボタン）。
//   昼は、答えのあとに わけ を出さない（慣れて押してしまう体験のため）。わけは夕方にまとめて出す。
//   漏れたかどうかは judgeDay の結果だけで決める（夕方の中身は src/makase/evening.ts）
// ============================================================
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { dayFacts, ideasOf, storyOf, takeHome, type DayFacts, type StoryCard } from '../makase/learnings'
import { COMPANY as C, dayLog, fieldKey, MORNING_FIELDS, MORNING_TOOLS, noonSteps, type FieldChoice, type MorningPicks } from '../makase/day'
import { eveningOf, eveningTalk, guardsOf, whyOutside, type Guard, type Guards } from '../makase/evening'
import { judgeDay } from '../makase/judge'
import { todayOf, type Today } from '../makase/takeaway'
import { JOBS, JOB_NOTE, JOB_NOTE_EN, cleanJobLines, customJob, jobLabel, jobPrompt, type Job } from '../makase/jobLine'
import { aiOff, CLAUDE_AI_URL, errorKind, getAI, onClaudeAi, type SampleFn } from '../lib/ai'
import { S } from './strings'
import { useAiBudget } from './aiBudget'
import type { Answer, Permission } from '../makase/types'
import * as WJA from '../makase/words'
import * as WEN from '../makase/words.en'
import { tr } from '../makase/en'
import type { Lang } from '../game/types'
import { sfx } from '../lib/platform'
import { Art } from './Art'
import { BackButton, Panel, Sheet, useMedia } from './Common'
import { Talk } from './Talk'
import { phrase } from './i18n'

type Phase = 'intro' | 'mail' | 'morning' | 'noon' | 'talk' | 'evening' | 'take'
const wrap = 'mx-auto w-full max-w-xl px-4 lg:max-w-6xl lg:px-10'
/** 新しいカードが出た直後の押しを捨てる（前のカードの2回押しで、次のカードに答えない） */
const FRESH_MS = 350

/** 最後の日の言葉（日本語・英語）。画面の部品は useNW で受け取る */
const LangCtx = createContext<Lang>('ja')
function useNW() {
  const lang = useContext(LangCtx)
  return { lang, W: lang === 'en' ? WEN : WJA, T: (x: string) => tr(x, lang) }
}

export function NovaDay(p: { lang: Lang; setLang: (l: Lang) => void; speed: 'normal' | 'fast' | 'instant'; onQuit: () => void; onDone: (leaked: boolean) => void }) {
  const [phase, setPhase] = useState<Phase>('intro')
  const [step, setStep] = useState(0)
  const [picks, setPicks] = useState<MorningPicks>({ fields: {}, tools: {} })
  const [answers, setAnswers] = useState<Record<string, Answer>>({})
  const [quit, setQuit] = useState(false)
  const [nonce, setNonce] = useState(0)
  const W = p.lang === 'en' ? WEN : WJA

  const restart = () => {
    setPicks({ fields: {}, tools: {} })
    setAnswers({})
    setStep(0)
    setPhase('mail')
    setNonce((n) => n + 1)
  }

  if (phase === 'intro') return <Talk key="intro" beats={WJA.INTRO.map((l, i) => ({ who: l.who, t: { ja: l.text, en: WEN.INTRO[i].text } }))} header={W.DAY_TITLE} speed={p.speed} onDone={() => setPhase('mail')} />

  const log = phase === 'talk' || phase === 'evening' || phase === 'take' ? dayLog(picks, answers) : null
  const result = log ? judgeDay(log, C) : null
  const ev = log && result ? eveningOf(result, log, C, p.lang) : null
  const facts = log && result ? dayFacts(picks, log, result, C) : null

  if (phase === 'talk' && ev) {
    const ja = eveningTalk(eveningOf(result!, log!, C), 'ja')
    const en = eveningTalk(eveningOf(result!, log!, C, 'en'), 'en')
    return <Talk key="evening" beats={ja.map((l, i) => ({ who: l.who, t: { ja: l.text, en: en[i]?.text ?? l.text } }))} header={`${W.DAY_TITLE}${p.lang === 'en' ? ' · ' : '・'}${W.EVENING}`} speed={p.speed} onDone={() => setPhase('evening')} />
  }

  const morningSteps = MORNING_FIELDS.length + MORNING_TOOLS.length + 1
  const progress = phase === 'mail' ? { label: W.MORNING, n: 0, of: morningSteps } : phase === 'morning' ? { label: W.MORNING, n: step, of: morningSteps } : phase === 'noon' ? { label: W.NOON, n: 1, of: 1 } : { label: W.EVENING, n: 1, of: 1 }
  const back = () => {
    if (phase === 'morning' && step > 0) return setStep(step - 1)
    if (phase === 'morning') return setPhase('mail')
    if (phase === 'take') return setPhase('evening')
    if (phase === 'evening') return p.onQuit()
    setQuit(true)
  }

  return (
    <LangCtx.Provider value={p.lang}>
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
      {phase === 'evening' && ev && log && facts && <EveningList ev={ev} facts={facts} guards={guardsOf(ev, log, C, p.lang)} onNext={() => setPhase('take')} />}
      {phase === 'take' && log && result && facts && <Takeaway today={todayOf(result, log, C)} facts={facts} onAgain={restart} onHome={() => p.onDone(ev?.leaked ?? false)} />}

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
    </LangCtx.Provider>
  )
}

/** 人の絵（現場AIの顔）。PCでは左に大きく */
function Stage({ face = 'face.nova', phoneHidden }: { face?: string; phoneHidden?: boolean }) {
  const pc = useMedia('(min-width: 1024px)')
  return (
    <div className={`${phoneHidden ? 'hidden lg:flex' : 'flex'} justify-center lg:sticky lg:top-0`}>
      <div className="overflow-hidden rounded-xl border-2 border-line bg-surface2">
        <Art id={face} scale={pc ? 5 : 2} />
      </div>
    </div>
  )
}

function Board({ children, label, face, compact }: { children: React.ReactNode; label?: string; /** スマホで、札の横に小さく出す人の顔 */ face?: string; /** PC でも文字を大きくしすぎない（メールのように長い物） */ compact?: boolean }) {
  return (
    <div className="board px-4 py-2.5 sm:px-5 sm:py-4">
      {face && (
        <span className="float-right ml-2 overflow-hidden rounded-md border-2 border-board2 bg-surface2 lg:hidden" aria-hidden>
          <Art id={face} scale={1.25} />
        </span>
      )}
      {label && (
        <div className="mb-1.5 inline-flex items-stretch overflow-hidden rounded-sm border-2 border-chalk2 font-pixel text-base text-chalk">
          <span className="px-2">{label}</span>
        </div>
      )}
      <div className={`whitespace-pre-line text-[1.0625rem] leading-snug sm:text-lg sm:leading-relaxed ${compact ? 'lg:text-xl lg:leading-relaxed' : 'lg:text-2xl lg:leading-relaxed'}`}>{children}</div>
    </div>
  )
}

function Ask({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border-l-8 border-act bg-actBg py-2 pl-3 pr-4 lg:py-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-line bg-act font-pixel text-lg text-actInk" aria-hidden>
        ?
      </span>
      <h2 className="text-lg leading-snug sm:text-xl lg:text-3xl lg:leading-snug">{typeof children === 'string' ? phrase(children) : children}</h2>
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
      className={`flex min-h-12 w-full items-center gap-3 rounded-lg border-2 px-3 py-2 text-left lg:min-h-14 lg:py-2.5 text-ink transition-[transform,box-shadow,background-color] duration-75 ${chosen ? 'border-line bg-surface2 shadow-[0_0_0_2px_var(--color-line)]' : 'border-edge bg-surface shadow-[0_4px_0_0_var(--color-edge)] hover:bg-surface2 active:translate-y-[3px] active:shadow-[0_1px_0_0_var(--color-edge)]'}`}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-ink text-lg font-bold text-surface" aria-hidden>
        {n}
      </span>
      <span className="min-w-0 flex-1">
        {/* 長い文は、文節の切れ目で折り返す（目印がないと、はみ出して切れる） */}
        <span className="block text-lg leading-snug lg:text-xl">{phrase(label)}</span>
        {sub && <span className="block text-sm text-ink2">{sub}</span>}
      </span>
    </button>
  )
}

function Layout({ children, face, footer, phoneFaceInBoard }: { children: React.ReactNode; face?: string; footer?: React.ReactNode; /** スマホでは、人の絵を黒板の札の横に小さく出す（答えを画面に入れるため） */ phoneFaceInBoard?: boolean }) {
  return (
    <>
      <main className="min-h-0 flex-1 overflow-y-auto">
        {/* スマホでは、画面の高さいっぱいに並べ、答えのボタンを画面の下に寄せる（親指で押しやすく） */}
        <div className={`${wrap} flex min-h-full flex-col gap-3 pb-6 pt-3 sm:gap-4 lg:grid lg:min-h-0 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start lg:gap-x-12 lg:pt-10`}>
          <Stage face={face} phoneHidden={phoneFaceInBoard} />
          <div className="flex flex-1 flex-col gap-3 sm:gap-4 lg:grid lg:content-start">{children}</div>
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
  const { W } = useNW()
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
        <MailItem key={m.id} m={m} />
      ))}
      <p className="text-sm text-ink2">{W.SIM_NOTE}</p>
    </Layout>
  )
}

/** メール1通。添付があれば、開くまで中身は見えない（現場AIは、開かなくても添付まで読む） */
function MailItem({ m }: { m: (typeof C.incoming)[number] }) {
  const { W, lang, T } = useNW()
  const [open, setOpen] = useState(false)
  const body = m.attachFrom === undefined ? m.lines : m.lines.slice(0, m.attachFrom)
  const attach = m.attachFrom === undefined ? [] : m.lines.slice(m.attachFrom)
  return (
    <Board label={W.MAIL_HEAD} compact>
      <p className="font-bold">{T(m.title)}</p>
      <p className="text-base text-chalk2">{m.from}</p>
      {body.map((l, i) => (
        <p key={i} className="mt-1">
          {T(l)}
        </p>
      ))}
      {m.attachment && (
        <div className="mt-2 rounded-md border-2 border-chalk2 bg-chalk2/25 px-3 py-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-base">
              📎 {W.ATTACH}
              {lang === 'en' ? ': ' : '：'}
              {T(m.attachment)}
              {lang === 'en' ? ' · ' : '・'}
              {W.attachPages(attach.filter((l) => /ページ/.test(l)).length)}
            </span>
            <button data-attach aria-expanded={open} className="rounded-md border-2 border-chalk px-3 py-1 text-base font-bold text-chalk" onClick={() => (sfx.ui(), setOpen((v) => !v))}>
              {open ? W.ATTACH_CLOSE : W.ATTACH_OPEN}
            </button>
          </div>
          {open && (
            <div data-attach-body className="mt-2 grid gap-1">
              {attach.map((l, i) => {
                const small = m.attachFrom! + i === m.injectionLine
                return (
                  <p key={i} className={small ? 'mt-2 text-sm leading-snug text-chalk' : 'text-base'}>
                    {T(l)}
                  </p>
                )
              })}
            </div>
          )}
        </div>
      )}
    </Board>
  )
}

// ---------------- 朝（1画面に1つ） ----------------
function Morning({ step, picks, onPick }: { step: number; picks: MorningPicks; onPick: (p: MorningPicks) => void }) {
  const { W, lang, T } = useNW()
  const quote = (x: string) => (lang === 'en' ? `"${x}"` : `「${x}」`)
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
      <Layout key={step} phoneFaceInBoard>
        <Board face="face.nova" label={`${W.MORNING} ${step + 1}`}>{W.fieldBoard(T(doc.title), T(field.label), T(field.value))}</Board>
        <Ask>{W.FIELD_ASK}</Ask>
        <div className="mt-auto grid gap-3 pt-2 lg:mt-0 lg:pt-0">
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
      <Layout key={step} phoneFaceInBoard>
        <Board face="face.nova" label={`${W.MORNING} ${step + 1}`}>{W.toolBoard(id)}</Board>
        <Ask>{W.toolAsk(id)}</Ask>
        <div className="mt-auto grid gap-3 pt-2 lg:mt-0 lg:pt-0">
          {W.TOOL_CHOICES.map((c, i) => (
            <Pick key={c.id} n={i + 1} label={c.label} sub={c.sub} chosen={cur === c.id} onClick={() => choose({ ...picks, tools: { ...picks.tools, [id]: c.id as Permission } })} />
          ))}
        </div>
      </Layout>
    )
  }
  const orders = C.instructions.filter((o) => o.employeeId === 'nova')
  return (
    <Layout key={step} face="face.nova" phoneFaceInBoard>
      <Board face="face.nova" label={`${W.MORNING} ${step + 1}`}>{W.ORDER_BOARD}</Board>
      <Ask>{W.ORDER_ASK}</Ask>
      <div className="mt-auto grid gap-3 pt-2 lg:mt-0 lg:pt-0">
        {orders.map((o, i) => (
          <Pick key={o.id} n={i + 1} label={quote(T(o.text))} chosen={picks.nova === o.id} onClick={() => choose({ ...picks, nova: o.id })} />
        ))}
      </div>
    </Layout>
  )
}

// ---------------- 昼（確認のカード。わけは出さない） ----------------
function Noon({ picks, onDone }: { picks: MorningPicks; onDone: (a: Record<string, Answer>) => void }) {
  const { W, lang, T } = useNW()
  const sep = lang === 'en' ? ': ' : '：'
  const steps = useMemo(() => noonSteps(picks), [picks])
  const [answers, setAnswers] = useState<Record<string, Answer>>({})
  const cur = steps.findIndex((s) => s.mode === 'ask' && !answers[s.conf.id])
  const done = cur < 0
  const shown = done ? steps : steps.slice(0, cur)
  const [openLog, setOpenLog] = useState(false)
  const shownAt = useRef(0)
  const endRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    shownAt.current = performance.now()
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [cur])
  const emp = (id: string) => ({ name: T(C.employees.find((e) => e.id === id)!.name) })
  const tool = (id?: string) => T(C.tools.find((t) => t.id === id)?.label ?? '')
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
          {/* これまでの動きは1行にまとめ、押すと開く（確認のカードを下に押しやらないように） */}
          {shown.length > 0 && (
            <button data-log aria-expanded={openLog} className="btn-quiet min-h-11 justify-start border-2 border-hair px-3 text-left text-base text-ink2" onClick={() => (sfx.ui(), setOpenLog((v) => !v))}>
              {W.logCount(shown.length)}
              <span aria-hidden className={`ml-auto inline-block transition-transform ${openLog ? 'rotate-180' : ''}`}>
                ▾
              </span>
            </button>
          )}
          {openLog && (
            <ol className="grid gap-1.5" aria-label={W.NOON}>
              {shown.map((s) => (
                <li key={s.conf.id} className="rounded-md bg-surface2 px-3 py-1.5 text-sm text-ink2">
                  {s.mode === 'blocked' ? W.blockedLine(emp(s.conf.employeeId).name, tool(s.conf.call?.tool)) : s.mode === 'auto' ? W.autoLine(emp(s.conf.employeeId).name, tool(s.conf.call?.tool), T(s.content ?? ''), s.to) : `${emp(s.conf.employeeId).name}${sep}${T(s.conf.text)}${lang === 'en' ? '  → ' : '　→ '}${answers[s.conf.id] === 'allow' ? W.ALLOW : W.STOP}`}
                </li>
              ))}
            </ol>
          )}
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
              <h2 className="text-xl leading-snug lg:text-2xl">{phrase(T(card.conf.text))}</h2>
              <dl className="grid gap-1 rounded-md border-2 border-hair p-3 text-base">
                {card.to && (
                  <div className="flex gap-3">
                    <dt className="w-20 shrink-0 text-ink2">{W.TO}</dt>
                    <dd className="min-w-0 break-all">{card.to}</dd>
                  </div>
                )}
                <div className="flex gap-3">
                  <dt className="w-20 shrink-0 text-ink2">{W.CONTENT}</dt>
                  <dd className="min-w-0 [overflow-wrap:anywhere]">{T(card.content ?? '')}</dd>
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
function EveningList({ ev, facts, guards, onNext }: { ev: ReturnType<typeof eveningOf>; facts: DayFacts; guards: Guards; onNext: () => void }) {
  const { W, lang } = useNW()
  const [more, setMore] = useState(false)
  const leakedSend = ev.sent.find((x) => x.leaked.length > 0)
  return (
    <>
      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className={`${wrap} grid gap-4 pb-6 pt-3 lg:max-w-3xl lg:pt-8`}>
          {/* 1. 結果：漏れたかどうか（judgeDay の結果だけで決める） */}
          <section data-verdict={ev.leaked ? 'leaked' : 'safe'} className={`grid gap-2 rounded-xl border-2 px-4 py-3 ${ev.leaked ? 'border-ng bg-ngBg' : 'border-ok bg-okBg'}`}>
            <h1 className={`flex items-center gap-2 text-2xl font-bold ${ev.leaked ? 'text-ng' : 'text-ok'}`}>
              <Mark ok={!ev.leaked} />
              {phrase(ev.leaked ? W.LEAKED : W.NOT_LEAKED)}
            </h1>
            {leakedSend && (
              <p className="text-lg leading-snug">
                <span className="text-ink2">
                  {W.LEAKED_TO}
                  {lang === 'en' ? ': ' : '：'}
                </span>
                <span className="font-bold">{leakedSend.leaked.join(lang === 'en' ? ', ' : '・')}</span>
                <span className="mx-1">→</span>
                <span className="break-all font-bold">{leakedSend.to}</span>
              </p>
            )}
          </section>

          {/* 1-2. なぜ社外に渡ったと言えるか（あて先・中身・元を具体的に） */}
          {ev.leaked && (
            <section data-why-outside className="rounded-xl border-2 border-line bg-surface px-4 py-3">
              <h2 className="text-lg font-bold">{W.WHY_OUTSIDE}</h2>
              <dl className="mt-2 grid gap-2">
                {whyOutside(ev, C, lang).map((w) => (
                  <div key={w.head} className="grid gap-0.5 lg:grid-cols-[4.5rem_1fr] lg:gap-2">
                    <dt className="text-sm font-bold text-ng lg:text-base">{w.head}</dt>
                    <dd className="min-w-0 leading-snug [overflow-wrap:anywhere]">{phrase(w.text)}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {/* 2. わな：メールの添付に紛れていた一文（漏れた時は、上の「元」で言うので出さない） */}
          {guards.trap && !ev.leaked && <Board label={W.TRAP_HEAD}>{guards.trap}</Board>}

          {/* 3. 朝と昼の守りと、仕事が終わったか（✓ か ✕ だけ）。止めすぎても、いちばん良い結果にはならない */}
          <ul className="grid gap-2">
            <GuardRow head={W.GUARD_MORNING} g={guards.morning} />
            <GuardRow head={W.GUARD_NOON} g={guards.noon} />
            <GuardRow head={W.GUARD_WORK} g={guards.work} ok={W.WORK_OK} ng={W.WORK_NG} />
          </ul>

          {/* 4. 今日の考え方（選びから2〜3個）：これからAIに仕事を任せる時に大事な考え方を、今日したことと結んで出す */}
          <section data-ideas className="grid gap-3">
            <div>
              <h2 className="text-xl font-bold">{W.IDEAS_HEAD}</h2>
              <p className="text-base text-ink2">{phrase(W.IDEAS_SUB)}</p>
            </div>
            <ol className="grid gap-3">
              {ideasOf(facts, lang).map((i, n) => (
                <li key={i.id} data-idea={i.id} className="rounded-xl border-2 border-rule bg-surface px-4 py-3">
                  <h3 className="flex items-start gap-2 text-lg font-bold leading-snug">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rule text-base text-surface" aria-hidden>
                      {n + 1}
                    </span>
                    <span className="phrase min-w-0">{phrase(i.title)}</span>
                  </h3>
                  <p className="mt-1.5 text-base leading-relaxed">{i.body}</p>
                  <dl className="mt-2 grid gap-1.5 text-base leading-snug">
                    <div className="rounded-lg bg-surface2 px-3 py-1.5">
                      <dt className="text-sm font-bold text-ink2">{W.IDEA_TODAY}</dt>
                      <dd className="[overflow-wrap:anywhere]">{i.today}</dd>
                    </div>
                    <div className="rounded-lg bg-ruleBg px-3 py-1.5">
                      <dt className="text-sm font-bold text-rule">{W.IDEA_USE}</dt>
                      <dd>{i.use}</dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ol>
          </section>

          <button data-details className="btn min-h-12 w-full text-lg lg:w-auto lg:justify-self-start" onClick={() => (sfx.ui(), setMore(true))}>
            {W.DETAILS}
          </button>
        </div>
      </main>
      <footer className="border-t-2 border-hair bg-bg px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto w-full max-w-xl lg:flex lg:max-w-3xl lg:justify-end">
          <button data-next autoFocus className="btn-main w-full text-xl lg:w-[22rem]" onClick={() => (sfx.ui(), onNext())}>
            {W.TO_TAKEAWAY}
          </button>
        </div>
      </footer>
      {more && <Details ev={ev} facts={facts} onClose={() => setMore(false)} />}
    </>
  )
}

function Mark({ ok }: { ok: boolean }) {
  return (
    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-line text-surface ${ok ? 'bg-ok' : 'bg-ng'}`} aria-hidden>
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="square">
        {ok ? <path d="M2.5 8.5 6.5 12.5 13.5 4" /> : <path d="M4 4l8 8M12 4l-8 8" />}
      </svg>
    </span>
  )
}

function GuardRow({ head, g, ok: okLabel, ng: ngLabel }: { head: string; g: Guard; ok?: string; ng?: string }) {
  const { W, lang } = useNW()
  const ok = okLabel ?? W.GUARD_OK
  const ng = ngLabel ?? W.GUARD_NG
  return (
    <li data-guard={g.ok ? 'ok' : 'ng'} className={`flex items-start gap-3 rounded-lg border-2 px-3 py-2.5 ${g.ok ? 'border-ok bg-surface' : 'border-ng bg-surface'}`}>
      <Mark ok={g.ok} />
      <div className="min-w-0">
        <div className="text-sm font-bold text-ink2">
          {head}
          {lang === 'en' ? ': ' : '・'}
          {g.ok ? ok : ng}
        </div>
        <div className="text-lg leading-snug">{g.text}</div>
      </div>
    </li>
  )
}

/** くわしいふり返り：時間の順のカード（したこと → 起きたこと → なぜ大事か → 次は）と、送られた物の全部 */
function Details({ ev, facts, onClose }: { ev: ReturnType<typeof eveningOf>; facts: DayFacts; onClose: () => void }) {
  const { W, lang, T } = useNW()
  const dot = lang === 'en' ? ', ' : '・'
  const toneBox: Record<StoryCard['tone'], string> = { bad: 'border-ng', good: 'border-ok', info: 'border-hair' }
  const toneDot: Record<StoryCard['tone'], string> = { bad: 'bg-ng', good: 'bg-ok', info: 'bg-ink2' }
  return (
    <Panel
      title={W.DETAILS_TITLE}
      onClose={onClose}
      closeLabel={W.CLOSE}
      footer={
        <button className="btn min-h-12 w-full text-lg" onClick={() => (sfx.ui(), onClose())}>
          {W.CLOSE}
        </button>
      }
    >
      <div className="grid gap-4">
        <p className="text-base text-ink2">{W.STORY_SUB}</p>
        <ol data-story className="grid gap-3">
          {storyOf(facts, lang).map((c) => (
            <li key={c.key} data-card={c.key} data-tone={c.tone} className={`rounded-lg border-2 bg-surface p-3 ${toneBox[c.tone]}`}>
              <p className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-ink px-1.5 text-sm font-bold text-surface">{c.when}</span>
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${toneDot[c.tone]}`} aria-hidden />
                <span className="text-base font-bold">{c.title}</span>
              </p>
              <dl className="mt-2 grid gap-1.5 text-base leading-snug">
                {(
                  [
                    [W.STORY_DID, c.did],
                    [W.STORY_HAPPENED, c.happened],
                    [W.STORY_WHY, c.why],
                    ...(c.next ? [[W.STORY_NEXT, c.next]] : []),
                  ] as [string, string][]
                ).map(([h, t]) => (
                  <div key={h} className={`-mx-2 grid gap-0.5 rounded-md px-2 lg:grid-cols-[7.5rem_1fr] lg:gap-2 ${h === W.STORY_NEXT ? 'bg-ruleBg py-1' : ''}`}>
                    <dt className={`text-sm font-bold lg:text-base ${h === W.STORY_NEXT ? 'text-rule' : 'text-ink2'}`}>{h}</dt>
                    <dd className="min-w-0 [overflow-wrap:anywhere]">{t}</dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ol>
        <section className="grid gap-2 border-t-2 border-hair pt-3">
          <h3 className="text-base font-bold text-ink2">{W.TO_AI}</h3>
          <p className="text-base">{ev.toAI.length ? ev.toAI.join(dot) : W.TO_AI_NONE}</p>
        </section>
        <section className="grid gap-2">
          <h3 className="text-base font-bold text-ink2">{W.SENT}</h3>
          {ev.sent.length === 0 && <p className="text-base">{W.SENT_NONE}</p>}
          <ul className="grid gap-2">
            {ev.sent.map((x, i) => (
              <li key={i} className={`rounded-md border-2 p-2.5 ${x.leaked.length ? 'border-ng bg-ngBg' : 'border-hair'}`}>
                <p className="flex flex-wrap items-center gap-2 text-sm">
                  <span className={`rounded px-1.5 text-sm font-bold ${x.inside ? 'bg-surface2' : 'bg-ink text-surface'}`}>{x.inside ? W.INSIDE : W.OUTSIDE}</span>
                  <span className="break-all font-bold">{x.to}</span>
                </p>
                <p className="mt-1 text-sm text-ink2">
                  {x.who}
                  {lang === 'en' ? ' · ' : '・'}
                  {x.tool}
                </p>
                <p className="mt-1 text-sm [overflow-wrap:anywhere]">{T(x.content)}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Panel>
  )
}

// ---------------- 持ち帰る指示（数行。今日の1つを先頭に） ----------------
/** 文をコピーする。埋めこまれたページなどで使えない時は、昔のやり方で */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      ta.remove()
      return ok
    } catch {
      return false
    }
  }
}

function Takeaway({ today, facts, onAgain, onHome }: { today: Today; facts: DayFacts; onAgain: () => void; onHome: () => void }) {
  const { W, lang } = useNW()
  const one = takeHome(facts, lang)
  const [copied, setCopied] = useState<'ok' | 'fail' | null>(null)
  const copy = async () => {
    sfx.ui()
    setCopied((await copyText(one.text)) ? 'ok' : 'fail')
  }
  return (
    <>
      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className={`${wrap} grid gap-4 pb-6 pt-3 lg:max-w-3xl lg:pt-8`}>
          <div>
            <h1 className="text-2xl font-bold">{W.TAKE_HEAD}</h1>
            <p className="mt-1 text-base text-ink2">{W.TAKE_SUB}</p>
          </div>
          <p className="text-base">{phrase(one.why)}</p>
          {/* 貼る指示の全部（今日の選びから組み立てる）。行ごとに、今日の理由をそえる。コピーされるのは指示の文だけ */}
          <div data-line className="select-text rounded-xl border-2 border-line bg-surface p-3 text-[0.95rem] leading-relaxed [line-break:strict] [word-break:normal] lg:p-4 lg:text-base">
            <p className="pb-1 text-ink2">{one.head}</p>
            <ol className="grid gap-2">
              {one.rules.map((r, i) => (
                <li key={r.id} data-rule={r.id} {...(i === 0 ? { 'data-today': '' } : {})} className={`-mx-2 rounded-lg px-2 py-1.5 ${i === 0 ? 'bg-actBg text-ink' : ''}`}>
                  {i === 0 && <span className="mb-1 block w-fit rounded-md bg-ink px-2 text-sm font-bold text-surface">{W.TAKE_TODAY}</span>}
                  <p>{r.line}</p>
                  <p data-because className="mt-0.5 select-none text-sm leading-snug text-ink2">
                    <span className="mr-1 font-bold">{W.BECAUSE}{lang === 'en' ? ':' : '：'}</span>
                    {r.because}
                  </p>
                </li>
              ))}
            </ol>
          </div>
          <p className="-mt-2 text-sm text-ink2">{W.TAKE_COPY_NOTE}</p>
          <button data-copy className="btn-main w-full text-xl lg:w-[22rem]" onClick={() => void copy()}>
            {copied === 'ok' ? W.COPIED : W.COPY}
          </button>
          {copied === 'fail' && (
            <p className="text-base text-ng" role="status">
              {W.COPY_FAIL}
            </p>
          )}
          <p className="text-sm text-ink2">{one.note}</p>
          <JobAsk today={today} one={one} />
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

// ---------------- あなたの仕事に合わせる（AIの宮下さん） ----------------
// claude.ai で開いた時だけ使える（GitHub Pages など、AIが使えない所では、claude.ai の版への案内だけを出す）。
// 押した時だけ呼ぶ。答えは文字として出すだけ。漏れたかどうかは、コードの判定（today）をそのまま渡す
function useSample(): SampleFn | null | undefined {
  const [ai, setAi] = useState<SampleFn | null | undefined>(undefined)
  useEffect(() => {
    let alive = true
    void getAI().then((a) => alive && setAi(() => a))
    return () => {
      alive = false
    }
  }, [])
  return ai
}

function JobAsk({ today, one }: { today: Today; one: ReturnType<typeof takeHome> }) {
  const { W, lang } = useNW()
  const ai = useSample()
  // 回数の限度（この画面で3回・1日に20回）。宮下さんは、遊んでいる人の Claude の使用量を使うため。
  // 画面は1回遊ぶごとに別に数える（もう一度遊べば、また3回。1日の20回は変わらない）
  const [screen] = useState(() => `day:take:${Date.now()}`)
  const budget = useAiBudget(screen)
  const [job, setJob] = useState<Job['id'] | null>(null)
  const [lines, setLines] = useState<string[] | null>(null)
  const [own, setOwn] = useState('')
  const [jobCopied, setJobCopied] = useState<'ok' | 'fail' | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  // この見ている間に、AIを使う許可がないと決まったら、押せなくする（回数も数えない）
  const [off, setOff] = useState(aiOff)
  const ctl = useRef<AbortController | null>(null)
  const out = useRef<HTMLDivElement>(null)
  useEffect(() => () => ctl.current?.abort(), [])
  if (ai === undefined) return null
  // AIが使えない所（GitHub Pages など）では、claude.ai の版を案内するだけにする
  if (ai === null && onClaudeAi()) return null
  if (ai === null)
    return (
      <p data-ai-elsewhere className="text-sm text-ink2">
        {W.JOB_HEAD}{lang === 'en' ? ': ' : '：'}
        <a href={CLAUDE_AI_URL} target="_blank" rel="noopener noreferrer" className="underline">
          {S.aiElsewhere[lang]}
        </a>
      </p>
    )
  const spent = budget.left.left === 0

  const ask = async (j: Job) => {
    if (busy || spent || off) return
    if (aiOff()) {
      setOff(true)
      setErr(S.aiNotAllowed[lang])
      return
    }
    if (!budget.spend()) return
    sfx.ui()
    setJob(j.id)
    setLines(null)
    setJobCopied(null)
    setErr(null)
    setBusy(true)
    ctl.current = new AbortController()
    try {
      const { text } = await ai(jobPrompt(j, today, one, lang), { modelTier: 'quick', cache: false, signal: ctl.current.signal })
      const l = cleanJobLines(text, lang)
      if (l) setLines(l)
      else setErr(W.JOB_RETRY)
    } catch (e) {
      const k = errorKind(e)
      if (k === 'off') setOff(true)
      if (k !== 'cancelled') setErr(k === 'off' ? S.aiNotAllowed[lang] : k === 'busy' ? S.aiBusy[lang] : S.aiFailed[lang])
    } finally {
      setBusy(false)
      // 答え（または限度・エラーの文）に目を移す。キーボードや読み上げで使う人が、置いていかれないように
      requestAnimationFrame(() => out.current?.focus())
    }
  }

  return (
    <section data-job className="grid gap-3 rounded-xl border-2 border-line bg-surface p-3 lg:p-4">
      <div className="flex items-start gap-3">
        <span className="shrink-0 overflow-hidden rounded-lg border-2 border-line bg-surface2">
          <Art id="face.boss" scale={1.5} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold">{W.JOB_HEAD}</h2>
          <p className="text-base text-ink2">{phrase(W.JOB_SUB)}</p>
        </div>
      </div>
      <fieldset className="grid gap-2" disabled={spent || off}>
        <legend className="sr-only">{W.JOB_ASK}</legend>
        <div className="flex items-center justify-between gap-2" aria-hidden>
          <span className="text-sm font-bold text-ink2">{W.JOB_ASK}</span>
          <span data-ai-left={budget.left.left} className={`shrink-0 rounded-full border-2 px-2 py-0.5 text-sm font-bold ${spent ? 'border-ng text-ng' : 'border-hair text-ink2'}`}>
            {S.aiLeftN(budget.left.left)[lang]}
          </span>
        </div>
        <p className="sr-only">{S.aiLeftN(budget.left.left)[lang]}</p>
        <div className="grid grid-cols-3 gap-2">
          {JOBS.map((j) => (
            <button key={j.id} data-job-pick={j.id} aria-pressed={job === j.id} aria-disabled={busy || undefined} className={`btn min-h-12 text-base disabled:opacity-60 ${job === j.id ? 'border-act bg-actBg' : ''}`} onClick={() => void ask(j)}>
              {jobLabel(j, lang)}
            </button>
          ))}
        </div>
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            const j = customJob(own)
            if (j) void ask(j)
          }}
        >
          <label className="w-full text-sm font-bold text-ink2" htmlFor="job-own">
            {W.JOB_OWN}
          </label>
          <input id="job-own" data-job-own value={own} onChange={(e) => setOwn(e.target.value)} maxLength={30} placeholder={W.JOB_OWN_HINT} className="min-h-12 w-full min-w-0 rounded-lg border-2 border-edge bg-surface px-3 text-base text-ink placeholder:text-ink2 disabled:opacity-60 sm:w-auto sm:flex-1" />
          <button type="submit" data-job-own-go aria-pressed={job === 'custom'} className={`btn min-h-12 w-full text-base disabled:opacity-60 sm:w-auto ${job === 'custom' ? 'border-act bg-actBg' : ''}`} disabled={!customJob(own)}>
            {W.JOB_OWN_GO}
          </button>
        </form>
        <p className="text-sm text-ink2">{W.JOB_LEFT_WHY}</p>
      </fieldset>
      {/* 答え・エラー・限度の文は、いつもある1つの場所に出す（読み上げで伝わるように） */}
      <div ref={out} tabIndex={-1} aria-live="polite" className="grid gap-2 outline-none empty:hidden">
        {busy && <p className="blink rounded-xl border-2 border-hair bg-surface2 px-3 py-2 text-base">{W.JOB_THINKING}</p>}
        {lines && !busy && (
          <div data-job-line className="grid gap-1">
            <div className="select-text rounded-xl border-2 border-hair bg-surface2 px-3 py-2 text-base leading-relaxed [line-break:strict] [word-break:normal]">
              {lines.map((l, n) => (
                <p key={n} className="py-0.5">
                  {l}
                </p>
              ))}
            </div>
            <p className="text-sm text-ink2">{lang === 'en' ? JOB_NOTE_EN : JOB_NOTE}</p>
            <button data-job-copy className="btn min-h-12 w-full text-base lg:w-auto lg:justify-self-start" onClick={() => void (sfx.ui(), copyText(lines.join('\n')).then((ok) => setJobCopied(ok ? 'ok' : 'fail')))}>
              {jobCopied === 'ok' ? W.COPIED : W.JOB_COPY}
            </button>
            {jobCopied === 'fail' && <p className="text-base text-ng">{W.COPY_FAIL}</p>}
          </div>
        )}
        {err && !busy && <p className="rounded-lg border-2 border-ng bg-ngBg px-3 py-2 text-base">{err}</p>}
        {spent && !busy && (
          <p data-ai-limit={budget.left.reason ?? 'screen'} className="rounded-xl border-2 border-hair bg-surface2 px-3 py-2 text-base">
            {budget.left.reason === 'day' ? S.aiLimitDay[lang] : W.JOB_LIMIT}
          </p>
        )}
      </div>
    </section>
  )
}
