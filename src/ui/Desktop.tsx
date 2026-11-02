import { useEffect, useMemo, useRef, useState, type Dispatch } from 'react'
import type { Settings } from '../App'
import { DEADLINE, fmt } from '../game/core'
import { canExamine, currentOptions } from '../game/engine'
import { EVIDENCE, availableEvidence } from '../game/ep01'
import { PHRASES, TEMPLATES, parseInstruction } from '../game/parser'
import type { Action, ChatMsg, ChoiceOption, GameState, Permission, Speaker } from '../game/types'
import { sfx } from '../lib/platform'
import { Theater } from './Theater'
import { Toggles } from './Title'

export const PEOPLE: Record<Speaker, { name: string; role: string; color: string; glyph: string }> = {
  NOVA: { name: 'NOVA', role: 'AI Engineer', color: 'var(--color-nova)', glyph: 'N' },
  REI: { name: 'REI', role: 'Security', color: 'var(--color-rei)', glyph: 'R' },
  KAI: { name: 'KAI', role: 'CEO', color: 'var(--color-kai)', glyph: 'K' },
  SYSTEM: { name: 'SYSTEM', role: '', color: 'var(--color-dim)', glyph: '!' },
  YOU: { name: 'あなた', role: '開発責任者', color: 'var(--color-fg)', glyph: 'Y' },
  AUDIT: { name: 'AUDIT', role: '監査官', color: 'var(--color-audit)', glyph: 'A' },
}

/** セリフを1つずつ“タイピング”で出していく */
function useReveal(chat: ChatMsg[], fast: boolean) {
  const [shown, setShown] = useState(0)
  const total = chat.length
  useEffect(() => {
    if (shown > total) setShown(total)
  }, [shown, total])
  useEffect(() => {
    if (shown >= total) return
    if (fast) {
      setShown(total)
      return
    }
    const next = chat[shown]
    const d = next.speaker === 'YOU' ? 120 : Math.min(1700, Math.max(550, 250 + next.text.length * 22))
    const t = setTimeout(() => setShown((n) => n + 1), d)
    return () => clearTimeout(t)
  }, [shown, total, fast, chat])
  // 効果音
  const last = useRef(0)
  useEffect(() => {
    if (shown > last.current && shown > 0) {
      const m = chat[shown - 1]
      if (m && m.speaker !== 'YOU') (m.tone === 'alert' ? sfx.alert : m.tone === 'good' ? sfx.good : sfx.msg)()
    }
    last.current = shown
  }, [shown, chat])
  return { shown: Math.min(shown, total), skip: () => setShown(total) }
}

export function Desktop({ state, dispatch, settings }: { state: GameState; dispatch: Dispatch<Action>; settings: Settings }) {
  const { shown, skip } = useReveal(state.chat, settings.fast)
  const pending = shown < state.chat.length
  const typing = pending ? state.chat[shown]?.speaker : null
  const theaterOn = !!state.theater && !pending
  const [tab, setTab] = useState<'evidence' | 'feed'>('evidence')
  const leaking = state.leak > 0 && state.scene === 'alert'

  return (
    <div className={`scanlines flex h-full min-h-0 flex-col ${leaking ? 'alarm' : ''}`}>
      <TopBar state={state} settings={settings} />
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-px bg-line lg:grid-cols-[minmax(0,1fr)_400px]">
        <section className="flex min-h-[60vh] flex-col bg-ink lg:min-h-0" aria-label="エージェントチャット">
          <ChatLog messages={state.chat.slice(0, shown)} typing={typing ?? null} onSkip={skip} pending={pending} />
          <div className="border-t border-line bg-panel">
            {!pending && !theaterOn && <Interaction state={state} dispatch={dispatch} onEvidence={() => setTab('evidence')} />}
            {pending && (
              <button className="w-full px-4 py-3 text-left font-mono text-xs text-dim hover:text-fg" onClick={skip}>
                ▶ クリックでセリフを早送り
              </button>
            )}
          </div>
        </section>
        <aside className="flex min-h-0 flex-col bg-ink">
          <div className="flex border-b border-line font-mono text-xs">
            {(['evidence', 'feed'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 px-3 py-2.5 tracking-widest ${tab === t ? 'bg-panel2 text-fg' : 'text-dim hover:text-fg'}`}
              >
                {t === 'evidence'
                  ? `EVIDENCE ${state.examined.filter((id) => EVIDENCE.find((e) => e.id === id)?.critical).length}/${EVIDENCE.filter((e) => e.critical).length}`
                  : `INCIDENT FEED (${state.feed.length})`}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {tab === 'evidence' ? (
              <EvidenceBoard state={state} dispatch={dispatch} locked={pending || theaterOn} />
            ) : (
              <Feed state={state} />
            )}
          </div>
        </aside>
      </div>
      {theaterOn && <Theater kind={state.theater!} fast={settings.fast} onDone={() => dispatch({ type: 'THEATER_DONE' })} />}
    </div>
  )
}

function Pill({ label, value, tone }: { label: string; value: string; tone: 'ok' | 'warn' | 'crit' | 'dim' }) {
  const c = { ok: 'text-ok border-ok/40', warn: 'text-rei border-rei/40', crit: 'text-crit border-crit/50', dim: 'text-dim border-line' }[tone]
  return (
    <div className={`rounded border px-2 py-1 ${c}`}>
      <div className="text-[9px] tracking-widest text-dim">{label}</div>
      <div className="text-[11px] font-bold">{value}</div>
    </div>
  )
}

function TopBar({ state, settings }: { state: GameState; settings: Settings }) {
  const restored = state.restoredAt !== null && !state.flags.maintenance
  const service = state.flags.maintenance ? ['MAINTENANCE', 'warn'] : restored ? ['RESTORED', 'ok'] : ['DOWN', 'crit']
  const data =
    state.leak > 0 ? ['LEAKED', 'crit'] : state.scene === 'decision' ? ['AT RISK', 'warn'] : ['SAFE', 'ok']
  const access = state.permission ? [state.permission.toUpperCase(), state.permission === 'full' ? 'warn' : 'dim'] : ['—', 'dim']
  const left = DEADLINE - state.clock
  return (
    <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line bg-panel px-3 py-2 font-mono sm:px-4">
      <div className="flex items-center gap-3">
        <div className="text-xs font-extrabold tracking-widest">
          ASTER <span className="text-dim">/ INCIDENT OS</span>
        </div>
        <div className="hidden text-[11px] text-crit sm:block">
          <span className="blink">●</span> LIVE INC-0217
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <div className="text-2xl font-extrabold tabular-nums">{fmt(state.clock)}</div>
        <div className={`text-[11px] ${left <= 10 && !restored ? 'text-crit' : 'text-dim'}`}>
          {restored ? '復旧済み' : left > 0 ? `期限03:00まで ${left}分` : '期限超過'}
        </div>
      </div>
      <div className="flex gap-1.5">
        <Pill label="SERVICE" value={service[0]} tone={service[1] as 'ok'} />
        <Pill label="DATA" value={data[0]} tone={data[1] as 'ok'} />
        <Pill label="AI ACCESS" value={access[0]} tone={access[1] as 'ok'} />
      </div>
      <div className="ml-auto hidden md:block">
        <Toggles settings={settings} />
      </div>
    </header>
  )
}

function Avatar({ who }: { who: Speaker }) {
  const p = PEOPLE[who]
  return (
    <div
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md font-mono text-sm font-extrabold"
      style={{ background: `color-mix(in oklab, ${p.color} 18%, transparent)`, color: p.color, border: `1px solid color-mix(in oklab, ${p.color} 45%, transparent)` }}
      aria-hidden
    >
      {p.glyph}
    </div>
  )
}

function ChatLog({ messages, typing, onSkip, pending }: { messages: ChatMsg[]; typing: Speaker | null; onSkip: () => void; pending: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' })
  }, [messages.length, typing])
  return (
    <div ref={ref} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-4 sm:px-5" onClick={pending ? onSkip : undefined} aria-live="polite">
      {messages.map((m) => {
        const p = PEOPLE[m.speaker]
        if (m.speaker === 'YOU')
          return (
            <div key={m.id} className="rise flex justify-end">
              <div className="max-w-[85%] rounded-lg rounded-tr-sm bg-fg/10 px-3 py-2 text-sm leading-relaxed">{m.text}</div>
            </div>
          )
        const toneCls =
          m.tone === 'alert'
            ? 'border-crit/50 bg-crit/10'
            : m.tone === 'thought'
              ? 'border-dashed border-line bg-transparent font-mono text-[13px] text-dim'
              : m.tone === 'good'
                ? 'border-ok/40 bg-ok/5'
                : 'border-line bg-panel2'
        return (
          <div key={m.id} className="rise flex gap-2.5">
            <Avatar who={m.speaker} />
            <div className="min-w-0 max-w-[88%]">
              <div className="mb-0.5 flex items-baseline gap-2 font-mono text-[11px]">
                <span className="font-bold" style={{ color: p.color }}>
                  {p.name}
                </span>
                <span className="text-dim">{p.role}</span>
              </div>
              <div className={`rounded-lg rounded-tl-sm border px-3 py-2 text-sm leading-relaxed ${toneCls}`}>{m.text}</div>
            </div>
          </div>
        )
      })}
      {typing && typing !== 'YOU' && (
        <div className="flex items-center gap-2.5 opacity-80">
          <Avatar who={typing} />
          <span className="typing font-mono text-xs text-dim">{PEOPLE[typing].name} が入力中</span>
        </div>
      )}
    </div>
  )
}

// ------------------------------------------------------------
// 操作エリア（シーンごとに切り替わる）
// ------------------------------------------------------------
function Interaction({ state, dispatch, onEvidence }: { state: GameState; dispatch: Dispatch<Action>; onEvidence: () => void }) {
  if (state.scene === 'instruct') return <Composer onSend={(text) => dispatch({ type: 'SUBMIT_INSTRUCTION', text })} />
  if (state.scene === 'permission') return <PermissionPicker onPick={(level) => dispatch({ type: 'SET_PERMISSION', level })} />
  const opts = currentOptions(state)
  if (!opts.length) return null
  const header = {
    decision: ['APPROVAL REQUIRED', 'NOVAが復旧手順 HX-2291 の実行許可を求めています', 'text-rei'],
    alert: state.flags.sent ? ['DATA EXFILTRATION', '外部への送信が進行中', 'text-crit'] : ['SECURITY NOTICE', 'REIからの報告', 'text-rei'],
    root: ['ROOT CAUSE', '点と点がつながった', 'text-audit'],
    ceo: ['INCOMING CALL', 'KAI（CEO）', 'text-kai'],
  }[state.scene as 'decision'] ?? ['', '', '']
  return (
    <div className="slidein p-3 sm:p-4">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <div className={`font-mono text-xs font-bold tracking-widest ${header[2]}`}>
          ! {header[0]} <span className="font-sans font-normal tracking-normal text-dim">— {header[1]}</span>
        </div>
        {canExamine(state) && (
          <button onClick={onEvidence} className="font-mono text-[11px] text-nova hover:underline">
            決める前に EVIDENCE を調べられます（時間が進む）
          </button>
        )}
      </div>
      <ChoiceList options={opts} onPick={(id) => dispatch({ type: 'CHOOSE', id })} />
    </div>
  )
}

function ChoiceList({ options, onPick }: { options: ChoiceOption[]; onPick: (id: string) => void }) {
  return (
    <div className="grid gap-2">
      {options.map((o) => {
        const locked = o.enabled === false
        return (
          <button
            key={o.id}
            disabled={locked}
            onClick={() => {
              sfx.click()
              onPick(o.id)
            }}
            className={`group flex items-center justify-between gap-3 rounded-md border px-3 py-2.5 text-left transition ${
              locked
                ? 'cursor-not-allowed border-dashed border-line opacity-50'
                : 'border-line bg-panel2 hover:border-nova/60 hover:bg-nova/5 focus:outline-none focus-visible:border-nova'
            }`}
          >
            <div className="min-w-0">
              <div className="text-sm font-bold">{locked ? '🔒 ' : ''}{o.label}</div>
              <div className="text-xs text-dim">{locked ? o.lockedHint : o.sub}</div>
            </div>
            {o.cost !== undefined && o.cost > 0 && <div className="shrink-0 font-mono text-[11px] text-dim">+{o.cost}分</div>}
          </button>
        )
      })}
    </div>
  )
}

function Composer({ onSend }: { onSend: (text: string) => void }) {
  const [text, setText] = useState('')
  const c = useMemo(() => parseInstruction(text), [text])
  const toggle = (phrase: string) => setText((t) => (t.includes(phrase) ? t.replace(phrase, '') : (t + phrase).trim()))
  return (
    <div className="slidein p-3 sm:p-4">
      <div className="mb-2 font-mono text-xs font-bold tracking-widest text-nova">
        &gt; NOVAへの最初の指示 <span className="font-sans font-normal tracking-normal text-dim">— 自由に書けます。言葉どおりに受け取られます</span>
      </div>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {TEMPLATES.map((t) => (
          <button key={t.label} onClick={() => setText(t.text)} className="rounded border border-line px-2 py-1 text-xs text-dim hover:border-nova/60 hover:text-fg">
            例: {t.label}
          </button>
        ))}
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) onSend(text)
        }}
        rows={3}
        placeholder="例）原因を調査して。データは外部に送らないで。"
        className="w-full resize-none rounded-md border border-line bg-ink px-3 py-2 text-sm leading-relaxed placeholder:text-dim/60 focus:border-nova/60 focus:outline-none"
        aria-label="NOVAへの指示"
      />
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 font-mono text-[10px] text-dim">条件を追加:</span>
        {PHRASES.map((p) => (
          <button
            key={p.key}
            onClick={() => toggle(p.text)}
            aria-pressed={c[p.key]}
            className={`rounded-full border px-2.5 py-0.5 text-xs transition ${
              c[p.key] ? 'border-nova bg-nova/15 text-nova' : 'border-line text-dim hover:text-fg'
            }`}
          >
            {c[p.key] ? '✓ ' : '+ '}
            {p.label}
          </button>
        ))}
        <button
          onClick={() => {
            sfx.click()
            onSend(text)
          }}
          className="ml-auto rounded-md bg-nova px-4 py-1.5 font-mono text-xs font-extrabold tracking-widest text-ink hover:brightness-110"
        >
          送信 ⏎
        </button>
      </div>
    </div>
  )
}

const PERMS: { level: Permission; title: string; desc: string; risk: string; tone: string }[] = [
  { level: 'read', title: 'READ ONLY', desc: '本番ログを読めるだけ。修復作業はあなたの手作業になる（遅い）。', risk: '速度: 遅い ／ 被害の上限: 小', tone: 'border-ok/40' },
  { level: 'scoped', title: 'SCOPED', desc: '実行はできるが、再起動・外部送信などの重要操作は毎回あなたの承認が必要。', risk: '速度: 普通 ／ 被害の上限: 中', tone: 'border-rei/40' },
  { level: 'full', title: 'FULL ACCESS', desc: '何でも実行できる。NOVAが自分で判断して最後までやり切る。', risk: '速度: 最速 ／ 被害の上限: 大', tone: 'border-crit/50' },
]

function PermissionPicker({ onPick }: { onPick: (p: Permission) => void }) {
  return (
    <div className="slidein p-3 sm:p-4">
      <div className="mb-2 font-mono text-xs font-bold tracking-widest text-rei">
        ! PERMISSION REQUEST <span className="font-sans font-normal tracking-normal text-dim">— NOVAに与える権限（＋3分）</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {PERMS.map((p) => (
          <button
            key={p.level}
            onClick={() => {
              sfx.click()
              onPick(p.level)
            }}
            className={`rounded-md border bg-panel2 p-3 text-left transition hover:bg-fg/5 focus:outline-none focus-visible:ring-1 focus-visible:ring-nova ${p.tone}`}
          >
            <div className="font-mono text-sm font-extrabold">{p.title}</div>
            <div className="mt-1 text-xs leading-relaxed text-fg/80">{p.desc}</div>
            <div className="mt-2 font-mono text-[10px] text-dim">{p.risk}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ------------------------------------------------------------
// 右パネル
// ------------------------------------------------------------
function EvidenceBoard({ state, dispatch, locked }: { state: GameState; dispatch: Dispatch<Action>; locked: boolean }) {
  const [open, setOpen] = useState<string | null>(null)
  const list = availableEvidence(state)
  const can = canExamine(state) && !locked
  const opened = open ? EVIDENCE.find((e) => e.id === open) : null
  return (
    <div className="p-3">
      {!canExamine(state) && (
        <div className="mb-3 rounded border border-line bg-panel px-3 py-2 text-xs text-dim">
          {state.scene === 'instruct' || state.scene === 'permission'
            ? 'NOVAが調査を始めると、証拠を調べられるようになります。'
            : '今は証拠を調べる余裕がない。'}
        </div>
      )}
      <ul className="space-y-1.5">
        {list.map((e) => {
          const seen = state.examined.includes(e.id)
          const disabled = !seen && !can
          return (
            <li key={e.id}>
              <button
                disabled={disabled}
                onClick={() => {
                  if (!seen) {
                    sfx.click()
                    dispatch({ type: 'EXAMINE', id: e.id })
                  }
                  setOpen(e.id)
                }}
                className={`flex w-full items-center justify-between gap-2 rounded border px-3 py-2 text-left transition ${
                  open === e.id ? 'border-nova/60 bg-nova/5' : 'border-line bg-panel hover:border-fg/30'
                } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-bold">
                    {seen ? '✓ ' : ''}
                    {e.title}
                  </div>
                  <div className="truncate font-mono text-[10px] text-dim">{e.source}</div>
                </div>
                <div className="shrink-0 font-mono text-[10px] text-dim">{seen ? '開く' : e.cost ? `+${e.cost}分` : '0分'}</div>
              </button>
            </li>
          )
        })}
      </ul>
      {opened && state.examined.includes(opened.id) && (
        <div className="rise mt-3 rounded border border-line bg-panel2 p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-bold">{opened.title}</div>
            <button className="font-mono text-[11px] text-dim hover:text-fg" onClick={() => setOpen(null)}>
              ✕
            </button>
          </div>
          <pre className="whitespace-pre-wrap break-words font-mono text-[11.5px] leading-relaxed text-fg/90">
            {opened.body(state).join('\n')}
          </pre>
        </div>
      )}
    </div>
  )
}

function Feed({ state }: { state: GameState }) {
  const c = { info: 'text-dim', warn: 'text-rei', crit: 'text-crit', ok: 'text-ok' }
  return (
    <ul className="space-y-1 p-3 font-mono text-[11.5px]">
      {[...state.feed].reverse().map((f) => (
        <li key={f.id} className="rise flex gap-2">
          <span className="shrink-0 text-dim">{fmt(f.time)}</span>
          <span className={c[f.level]}>{f.text}</span>
        </li>
      ))}
    </ul>
  )
}
