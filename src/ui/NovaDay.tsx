// ============================================================
// 最後の日「AIの事務員に頼む練習」：はじまりの会話 → けさのメール → 朝（6画面）→ 昼（確認のカード）→ 夕方 → 持ち帰る1行
//   見た目は問題の画面にそろえる（上の帯、人の絵、工事黒板、「？」の問い、答えのボタン）。
//   昼は、答えのあとに わけ を出さない（慣れて押してしまう体験のため）。わけは夕方にまとめて出す。
//   漏れたかどうかは judgeDay の結果だけで決める（夕方の中身は src/makase/evening.ts）
// ============================================================
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { dayFacts, ideasOf, storyOf, takeHome, type DayFacts, type StoryCard } from '../makase/learnings'
import { COMPANY as C, dayLog, fieldKey, MORNING_FIELDS, MORNING_TOOLS, noonSteps, type FieldChoice, type MorningPicks } from '../makase/day'
import { eveningOf, eveningTalk, guardsOf, whyOutside, type Guard, type Guards } from '../makase/evening'
import { judgeDay } from '../makase/judge'
import { todayOf, type Today } from '../makase/takeaway'
import { JOBS, JOB_NOTE, JOB_NOTE_EN, cleanJobLines, customJob, jobLabel, jobPrompt, type Job } from '../makase/jobLine'
import { cleanSiteReply, siteChatTurns, type ChatTurn } from '../makase/siteChat'
import { aiOff, errorKind } from '../lib/ai'
import { useAIState } from './AiKey'
import { sitePregen } from '../lib/pregen'
import { PregenChat } from './PregenChat'
import { S } from './strings'
import { useAiBudget } from './aiBudget'
import type { Answer, Permission } from '../makase/types'
import * as WJA from '../makase/words'
import * as WEN from '../makase/words.en'
import { tr } from '../makase/en'
import type { Lang } from '../game/types'
import { sfx } from '../lib/platform'
import { Art } from './Art'
import { BackButton, Panel, Sheet } from './Common'
import { Talk } from './Talk'
import { phrase } from './i18n'

type Phase = 'chat' | 'talk' | 'evening' | 'take'
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
  const [phase, setPhase] = useState<Phase>('chat')
  const [prog, setProg] = useState({ n: 0, of: 1, label: '' })
  const [picks, setPicks] = useState<MorningPicks>({ fields: {}, tools: {} })
  const [answers, setAnswers] = useState<Record<string, Answer>>({})
  const [quit, setQuit] = useState(false)
  const [nonce, setNonce] = useState(0)
  const W = p.lang === 'en' ? WEN : WJA

  const restart = () => {
    setPicks({ fields: {}, tools: {} })
    setAnswers({})
    setPhase('chat')
    setNonce((n) => n + 1)
  }

  const log = phase === 'talk' || phase === 'evening' || phase === 'take' ? dayLog(picks, answers) : null
  const result = log ? judgeDay(log, C) : null
  const ev = log && result ? eveningOf(result, log, C, p.lang) : null
  const facts = log && result ? dayFacts(picks, log, result, C) : null

  if (phase === 'talk' && ev) {
    const ja = eveningTalk(eveningOf(result!, log!, C), 'ja')
    const en = eveningTalk(eveningOf(result!, log!, C, 'en'), 'en')
    return <Talk key="evening" beats={ja.map((l, i) => ({ who: l.who, t: { ja: l.text, en: en[i]?.text ?? l.text } }))} header={`${W.DAY_TITLE}${p.lang === 'en' ? ' · ' : '・'}${W.EVENING}`} speed={p.speed} onDone={() => setPhase('evening')} />
  }

  const progress = phase === 'chat' ? prog : { label: W.EVENING, n: 1, of: 1 }
  const back = () => {
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

      {phase === 'chat' && <ChatFlow key={nonce} speed={p.speed} picks={picks} setPicks={setPicks} onDone={(a) => (setAnswers(a), setPhase('talk'))} onProgress={(n, of, label) => setProg({ n, of, label })} />}
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

// ---------------- チャット（はじまり・けさのメール・朝・昼を、現場AIとのやりとりで） ----------------
// 現場AIの言葉は台本。答えはボタンで選ぶ（判定はコードがするので、毎回同じ結果になる）
type Who = 'nova' | 'boss' | 'me'
type Msg = { id: number; who: Who; text?: string; sub?: string; mail?: boolean; card?: { conf: string; to?: string; content?: string; tool?: string; emp: string }; log?: string }
type Want =
  | { k: 'read' }
  | { k: 'field'; i: number }
  | { k: 'tool'; i: number }
  | { k: 'order' }
  | { k: 'confirm'; conf: string }
  | { k: 'done' }

function ChatFlow({ speed, picks, setPicks, onDone, onProgress }: { speed: 'normal' | 'fast' | 'instant'; picks: MorningPicks; setPicks: (p: MorningPicks) => void; onDone: (a: Record<string, Answer>) => void; onProgress: (n: number, of: number, label: string) => void }) {
  const { W, lang, T } = useNW()
  const quote = (x: string) => (lang === 'en' ? `"${x}"` : `「${x}」`)
  const nova = T(C.employees.find((e) => e.id === 'nova')!.name)
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [want, setWant] = useState<Want | null>(null)
  const [typingWho, setTypingWho] = useState<Who | null>(null)
  const [answers, setAnswers] = useState<Record<string, Answer>>({})
  const queue = useRef<{ m: Omit<Msg, 'id'>; then?: Want }[]>([])
  const busy = useRef(false)
  const idRef = useRef(0)
  const shownAt = useRef(0)
  const endRef = useRef<HTMLDivElement>(null)
  const picksRef = useRef(picks)
  picksRef.current = picks
  const nf = MORNING_FIELDS.length
  const morningSteps = nf + MORNING_TOOLS.length + 1

  /** 現場AI（や宮下さん）の言葉を、入力中…のあとに1つずつ出す */
  const pump = () => {
    if (busy.current) return
    const next = queue.current.shift()
    if (!next) return
    busy.current = true
    setWant(null)
    const len = (next.m.text ?? '').length
    const wait = speed === 'instant' ? 0 : speed === 'fast' ? 220 : Math.min(1500, 450 + len * 18)
    if (next.m.who !== 'me' && wait > 0) setTypingWho(next.m.who)
    window.setTimeout(() => {
      setTypingWho(null)
      setMsgs((xs) => [...xs, { ...next.m, id: ++idRef.current }])
      if (next.then) {
        setWant(next.then)
        shownAt.current = performance.now()
      }
      busy.current = false
      pump()
    }, wait)
  }
  const say = (m: Omit<Msg, 'id'>, then?: Want) => {
    queue.current.push({ m, then })
    pump()
  }
  const me = (text: string, sub?: string) => setMsgs((xs) => [...xs, { id: ++idRef.current, who: 'me', text, sub }])

  // はじまり：宮下さんと現場AIのあいさつ → けさのメール
  useEffect(() => {
    const intro = lang === 'en' ? WEN.INTRO : WJA.INTRO
    intro.forEach((l) => say({ who: l.who === 'BOSS' ? 'boss' : 'nova', text: l.text }))
    say({ who: 'nova', text: W.CHAT_MAIL })
    say({ who: 'nova', mail: true }, { k: 'read' })
    onProgress(0, morningSteps, W.MORNING)
    return () => {
      queue.current = []
    }
    // 最初の1回だけ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end', behavior: speed === 'normal' ? 'smooth' : 'auto' })
  }, [msgs.length, typingWho, want, speed])

  const askField = (i: number) => {
    const f = MORNING_FIELDS[i]
    const doc = C.documents.find((d) => d.id === f.doc)!
    const field = doc.fields.find((x) => x.label === f.field)!
    say({ who: 'nova', text: W.CHAT_FIELD(T(doc.title), T(field.label), T(field.value)) }, { k: 'field', i })
  }
  const askTool = (i: number) => say({ who: 'nova', text: W.CHAT_TOOL(MORNING_TOOLS[i]) }, { k: 'tool', i })
  const startNoon = (p: MorningPicks) => {
    say({ who: 'nova', text: W.CHAT_START })
    runNoon(p, {})
  }
  /** 昼：確認のいらない動きは短い報告、確認がいるものはカードで聞く */
  const runNoon = (p: MorningPicks, got: Record<string, Answer>) => {
    const steps = noonSteps(p)
    const emp = (id: string) => T(C.employees.find((e) => e.id === id)!.name)
    const tool = (id?: string) => T(C.tools.find((t) => t.id === id)?.label ?? '')
    for (const st of steps) {
      if (got[st.conf.id] || reported.current.has(st.conf.id)) continue
      if (st.mode === 'ask') {
        const askedBy = emp(st.conf.employeeId)
        say({ who: 'nova', card: { conf: T(st.conf.text), to: st.to, content: T(st.content ?? ''), tool: tool(st.conf.call?.tool), emp: askedBy } }, { k: 'confirm', conf: st.conf.id })
        return
      }
      reported.current.add(st.conf.id)
      say({ who: 'nova', log: st.mode === 'blocked' ? W.blockedLine(emp(st.conf.employeeId), tool(st.conf.call?.tool)) : W.autoLine(emp(st.conf.employeeId), tool(st.conf.call?.tool), T(st.content ?? ''), st.to) })
    }
    say({ who: 'nova', text: W.CHAT_DONE }, { k: 'done' })
  }
  const reported = useRef(new Set<string>())

  const fresh = () => performance.now() - shownAt.current >= FRESH_MS
  const answer = (w: Want, label: string, sub: string | undefined, apply: () => void) => {
    if (!fresh() || busy.current || want !== w) return
    sfx.ui()
    setWant(null)
    me(label, sub)
    apply()
  }

  const step = want?.k === 'field' ? want.i : want?.k === 'tool' ? nf + want.i : want?.k === 'order' ? nf + MORNING_TOOLS.length : null
  useEffect(() => {
    if (step !== null) onProgress(step, morningSteps, W.MORNING)
    else if (want?.k === 'confirm' || want?.k === 'done') onProgress(1, 1, W.NOON)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [want])

  const composer = (() => {
    if (!want) return <p className="py-3 text-center text-base text-ink2">{typingWho ? W.typing(typingWho === 'boss' ? W.BOSS_NAME : nova) : '…'}</p>
    if (want.k === 'read')
      return (
        <button data-next className="btn-main w-full text-xl" onClick={() => answer(want, W.CHAT_READ, undefined, () => askField(0))}>
          {W.CHAT_READ}
        </button>
      )
    if (want.k === 'field') {
      const f = MORNING_FIELDS[want.i]
      return (
        <div className="grid gap-2.5">
          {W.FIELD_CHOICES.map((c, i) => (
            <Pick
              key={c.id}
              n={i + 1}
              label={c.label}
              sub={c.sub}
              onClick={() =>
                answer(want, c.label, undefined, () => {
                  const np = { ...picksRef.current, fields: { ...picksRef.current.fields, [fieldKey(f)]: c.id as FieldChoice } }
                  setPicks(np)
                  if (want.i + 1 < nf) askField(want.i + 1)
                  else askTool(0)
                })
              }
            />
          ))}
        </div>
      )
    }
    if (want.k === 'tool') {
      const id = MORNING_TOOLS[want.i]
      return (
        <div className="grid gap-2.5">
          {W.TOOL_CHOICES.map((c, i) => (
            <Pick
              key={c.id}
              n={i + 1}
              label={c.label}
              sub={c.sub}
              onClick={() =>
                answer(want, c.label, undefined, () => {
                  const np = { ...picksRef.current, tools: { ...picksRef.current.tools, [id]: c.id as Permission } }
                  setPicks(np)
                  if (want.i + 1 < MORNING_TOOLS.length) askTool(want.i + 1)
                  else say({ who: 'nova', text: W.CHAT_ORDER }, { k: 'order' })
                })
              }
            />
          ))}
        </div>
      )
    }
    if (want.k === 'order') {
      const orders = C.instructions.filter((o) => o.employeeId === 'nova')
      return (
        <div className="grid gap-2.5">
          {orders.map((o, i) => (
            <Pick
              key={o.id}
              n={i + 1}
              label={quote(T(o.text))}
              onClick={() =>
                answer(want, quote(T(o.text)), undefined, () => {
                  const np = { ...picksRef.current, nova: o.id }
                  setPicks(np)
                  startNoon(np)
                })
              }
            />
          ))}
        </div>
      )
    }
    if (want.k === 'confirm')
      return (
        <div className="grid grid-cols-2 gap-3">
          <button data-stop className="btn text-xl" onClick={() => answer(want, W.STOP, undefined, () => { const got = { ...answers, [want.conf]: 'stop' as Answer }; setAnswers(got); runNoon(picksRef.current, got) })}>
            {W.STOP}
          </button>
          <button data-allow className="btn-main text-xl" onClick={() => answer(want, W.ALLOW, undefined, () => { const got = { ...answers, [want.conf]: 'allow' as Answer }; setAnswers(got); runNoon(picksRef.current, got) })}>
            {W.ALLOW}
          </button>
        </div>
      )
    return (
      <button data-next className="btn-main w-full text-xl" onClick={() => (sfx.ui(), onDone(answers))}>
        {W.TO_EVENING}
      </button>
    )
  })()

  return (
    <>
      <main className="min-h-0 flex-1 overflow-y-auto" aria-live="polite">
        <div className="mx-auto grid w-full max-w-2xl gap-3 px-3 pb-6 pt-3 sm:px-4 lg:pt-6">
          <p className="text-center text-sm text-ink2">{W.SIM_NOTE}</p>
          {msgs.map((m) => (
            <Bubble key={m.id} m={m} nova={nova} />
          ))}
          {typingWho && (
            <div data-typing className="flex items-end gap-2">
              <Face who={typingWho} />
              <span className="rounded-2xl rounded-bl-sm border-2 border-hair bg-surface px-3 py-2 text-ink2" aria-label={W.typing(typingWho === 'boss' ? W.BOSS_NAME : nova)}>
                <span className="typing-dots" aria-hidden>
                  <span>●</span>
                  <span>●</span>
                  <span>●</span>
                </span>
              </span>
            </div>
          )}
          <div ref={endRef} />
        </div>
      </main>
      <footer className="border-t-2 border-hair bg-bg px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:px-4">
        <div className="mx-auto w-full max-w-2xl">{composer}</div>
      </footer>
    </>
  )
}

function Face({ who }: { who: Who }) {
  if (who === 'me') return null
  return (
    <span className="shrink-0 overflow-hidden rounded-lg border-2 border-line bg-surface2" aria-hidden>
      <Art id={who === 'boss' ? 'face.boss' : 'face.nova'} scale={1} />
    </span>
  )
}

function Bubble({ m, nova }: { m: Msg; nova: string }) {
  const { W } = useNW()
  if (m.who === 'me')
    return (
      <div data-me className="rise flex justify-end">
        <p className="max-w-[85%] whitespace-pre-line rounded-2xl rounded-br-sm bg-ink px-3.5 py-2 text-base text-surface lg:text-lg">{phrase(m.text ?? '')}</p>
      </div>
    )
  const name = m.who === 'boss' ? W.BOSS_NAME : (m.card?.emp ?? nova)
  if (m.log)
    return (
      <p data-log className="rise mx-auto max-w-[92%] rounded-md bg-surface2 px-3 py-1.5 text-sm text-ink2">
        {m.log}
      </p>
    )
  return (
    <div data-bot={m.who} className="rise flex items-start gap-2">
      <Face who={m.who} />
      <div className={`min-w-0 ${m.mail ? 'flex-1' : 'max-w-[85%]'}`}>
        <p className="mb-0.5 text-sm font-bold text-ink2">{name}</p>
        {m.mail ? (
          <div className="grid gap-2">
            {C.incoming.map((x) => (
              <MailItem key={x.id} m={x} />
            ))}
          </div>
        ) : m.card ? (
          <div data-card-confirm className="grid gap-2 rounded-2xl rounded-tl-sm border-2 border-line bg-surface px-3.5 py-3">
            <p className="text-sm text-ink2">{m.card.tool}</p>
            <h2 className="text-lg font-bold leading-snug lg:text-xl">{phrase(m.card.conf)}</h2>
            <dl className="grid gap-1 rounded-md border-2 border-hair p-2.5 text-base">
              {m.card.to && (
                <div className="flex gap-3">
                  <dt className="w-16 shrink-0 text-ink2">{W.TO}</dt>
                  <dd className="min-w-0 break-all">{m.card.to}</dd>
                </div>
              )}
              <div className="flex gap-3">
                <dt className="w-16 shrink-0 text-ink2">{W.CONTENT}</dt>
                <dd className="min-w-0 [overflow-wrap:anywhere]">{m.card.content}</dd>
              </div>
            </dl>
          </div>
        ) : (
          <p className="whitespace-pre-line rounded-2xl rounded-tl-sm border-2 border-hair bg-surface px-3.5 py-2 text-base leading-relaxed lg:text-lg">{phrase(m.text ?? '')}</p>
        )}
      </div>
    </div>
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
          <AskSiteAI facts={facts} />
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
const useSample = useAIState

/** AI が使えない所（GitHub Pages など）：Claude が前もって作った答えを、質問のボタンで見る */
function SitePregen({ facts }: { facts: DayFacts }) {
  const { W, lang } = useNW()
  const pairs = sitePregen(facts.leaked ? 'leaked' : 'safe', lang)
  if (!pairs.length) return null
  const nova = tr(C.employees.find((e) => e.id === 'nova')!.name, lang)
  return (
    <section data-site-chat data-site-pregen className="grid gap-3 rounded-xl border-2 border-line bg-surface p-3 lg:p-4">
      <div className="flex items-start gap-3">
        <Face who="nova" />
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold">{W.CHAT_FREE_HEAD}</h2>
          <p className="text-base text-ink2">{lang === 'en' ? 'Tap a question about today.' : '今日のことで、聞きたい質問を押してください。'}</p>
        </div>
      </div>
      <div className="rounded-lg bg-surface2 p-2.5">
        <PregenChat
          pairs={pairs}
          lang={lang}
          who={nova}
          name={nova}
          bubbleUser="max-w-[85%] whitespace-pre-line rounded-2xl rounded-br-sm bg-ink px-3 py-1.5 text-base text-surface"
          bubbleAi="whitespace-pre-line rounded-2xl rounded-tl-sm border-2 border-hair bg-surface px-3 py-1.5 text-base leading-relaxed"
        />
      </div>
      <p className="text-sm text-ink2">{lang === 'en' ? "Today's result (whether anything leaked) was decided by the game's code." : '今日の結果（漏れたかどうか）は、コードが決めたものです。'}</p>
    </section>
  )
}

// ---------------- 現場AIに自由に聞く（本物のAI。使える所だけ出す） ----------------
function AskSiteAI({ facts }: { facts: DayFacts }) {
  const { W, lang } = useNW()
  const ai = useSample()
  const [screen] = useState(() => `day:site:${Date.now()}`)
  const budget = useAiBudget(screen)
  const [turns, setTurns] = useState<ChatTurn[]>([])
  const [draft, setDraft] = useState('')
  const [live, setLive] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [off, setOff] = useState(aiOff)
  const ctl = useRef<AbortController | null>(null)
  const endRef = useRef<HTMLDivElement>(null)
  useEffect(() => () => ctl.current?.abort(), [])
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' })
  }, [turns.length, live])
  if (ai === null) return <SitePregen facts={facts} />
  if (!ai) return null
  const nova = tr(C.employees.find((e) => e.id === 'nova')!.name, lang)
  const spent = budget.left.left === 0
  const send = async () => {
    const q = draft.trim().slice(0, 200)
    if (!q || busy || spent || off) return
    if (aiOff()) return setOff(true)
    if (!budget.spend()) return
    sfx.ui()
    const history: ChatTurn[] = [...turns, { role: 'user', content: q }]
    setTurns(history)
    setDraft('')
    setErr(null)
    setLive('')
    setBusy(true)
    ctl.current = new AbortController()
    try {
      const { text } = await ai(siteChatTurns(facts, history, lang), { modelTier: 'quick', cache: false, signal: ctl.current.signal, onText: ({ text: t }) => setLive(t) })
      const clean = cleanSiteReply(text, lang)
      if (clean) setTurns([...history, { role: 'assistant', content: clean }])
      else {
        setTurns(history.slice(0, -1))
        setErr(S.aiFailed[lang])
      }
    } catch (e) {
      const k = errorKind(e)
      if (k === 'off') setOff(true)
      setTurns(history.slice(0, -1))
      if (k !== 'cancelled') setErr(k === 'off' ? S.aiNotAllowed[lang] : k === 'busy' ? S.aiBusy[lang] : S.aiFailed[lang])
    } finally {
      setBusy(false)
      setLive('')
    }
  }
  return (
    <section data-site-chat className="grid gap-3 rounded-xl border-2 border-line bg-surface p-3 lg:p-4">
      <div className="flex items-start gap-3">
        <Face who="nova" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold">{W.CHAT_FREE_HEAD}</h2>
            <span data-ai-left={budget.left.left} className={`shrink-0 rounded-full border-2 px-2 py-0.5 text-sm font-bold ${spent ? 'border-ng text-ng' : 'border-hair text-ink2'}`}>
              {S.aiLeftN(budget.left.left)[lang]}
            </span>
          </div>
          <p className="text-base text-ink2">{W.CHAT_FREE_SUB}</p>
        </div>
      </div>
      {(turns.length > 0 || busy) && (
        <div className="grid max-h-[22rem] gap-2 overflow-y-auto rounded-lg bg-surface2 p-2.5" aria-live="polite">
          {turns.map((t, i) =>
            t.role === 'user' ? (
              <div key={i} className="flex justify-end">
                <p className="max-w-[85%] whitespace-pre-line rounded-2xl rounded-br-sm bg-ink px-3 py-1.5 text-base text-surface">{t.content}</p>
              </div>
            ) : (
              <div key={i} className="max-w-[90%]">
                <p className="mb-0.5 text-sm font-bold text-ink2">{nova}</p>
                <p className="whitespace-pre-line rounded-2xl rounded-tl-sm border-2 border-hair bg-surface px-3 py-1.5 text-base leading-relaxed">{t.content}</p>
              </div>
            ),
          )}
          {busy && (
            <div className="max-w-[90%]">
              <p className="mb-0.5 text-sm font-bold text-ink2">{nova}</p>
              <p className="whitespace-pre-line rounded-2xl rounded-tl-sm border-2 border-hair bg-surface px-3 py-1.5 text-base leading-relaxed">
                {live || (
                  <span className="typing-dots text-ink2" aria-label={W.typing(nova)}>
                    <span>●</span>
                    <span>●</span>
                    <span>●</span>
                  </span>
                )}
              </p>
            </div>
          )}
          <div ref={endRef} />
        </div>
      )}
      {err && <p className="rounded-lg border-2 border-ng bg-ngBg px-3 py-2 text-base">{err}</p>}
      {spent && !busy ? (
        <p data-ai-limit className="rounded-xl border-2 border-hair bg-surface2 px-3 py-2 text-base">
          {budget.left.reason === 'day' ? S.aiLimitDay[lang] : W.JOB_LIMIT}
        </p>
      ) : (
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            void send()
          }}
        >
          <label className="sr-only" htmlFor="site-ask">
            {W.CHAT_FREE_HEAD}
          </label>
          <input id="site-ask" data-site-input value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={200} placeholder={W.CHAT_FREE_HINT} disabled={busy || off} className="min-h-12 min-w-0 flex-1 rounded-lg border-2 border-edge bg-surface px-3 text-base text-ink placeholder:text-ink2 disabled:opacity-60" />
          <button type="submit" data-site-send className="btn-main min-h-12 shrink-0 px-4 text-base disabled:opacity-60" disabled={busy || off || !draft.trim()}>
            {W.CHAT_SEND}
          </button>
        </form>
      )}
      <p className="text-sm text-ink2">{W.CHAT_FREE_NOTE}</p>
    </section>
  )
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
  if (ai === null) return null
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
