import { useEffect, useState } from 'react'
import { buildAudit } from '../game/engine'
import { ENDINGS, epilogue } from '../game/ep01'
import type { EndingId, GameState } from '../game/types'
import type { SaveData } from '../lib/platform'
import { PEOPLE } from './Desktop'
import { EndingCollection } from './Title'

const RANK_COLOR: Record<EndingId, string> = {
  S: 'text-audit',
  A: 'text-ok',
  B: 'text-rei',
  C: 'text-nova',
  D: 'text-crit',
  E: 'text-crit',
}

export function EndingScreen({ state, save, onRetry, onTitle }: { state: GameState; save: SaveData; onRetry: () => void; onTitle: () => void }) {
  const id = state.ending!
  const e = ENDINGS[id]
  const lines = epilogue(state)
  const report = buildAudit(state)
  const [n, setN] = useState(1)
  useEffect(() => {
    if (n > lines.length) return
    const t = setTimeout(() => setN((v) => v + 1), 1300)
    return () => clearTimeout(t)
  }, [n, lines.length])
  const showReport = n > lines.length
  const firstAction = report.timeline.find((t) => t.kind === 'action')

  return (
    <div className="scanlines min-h-full px-4 py-10" onClick={() => !showReport && setN(lines.length + 1)}>
      <div className="mx-auto max-w-3xl">
        <div className={`font-mono text-xs tracking-[0.3em] ${RANK_COLOR[id]}`}>{e.rank}</div>
        <div className="mt-2 font-mono text-sm text-dim">ENDING {id}</div>
        <h1 className="mt-1 text-3xl font-black sm:text-5xl">{e.title}</h1>
        <p className="mt-2 text-dim">{e.tagline}</p>

        <div className="mt-8 space-y-4 border-l-2 border-line pl-4">
          {lines.slice(0, n).map((l, i) => (
            <p key={i} className="rise leading-relaxed text-fg/90">
              {l}
            </p>
          ))}
        </div>

        {!showReport && <p className="mt-6 font-mono text-[11px] text-dim">クリックで早送り</p>}

        {showReport && (
          <div className="rise mt-12 space-y-8">
            <div>
              <div className="font-mono text-xs tracking-[0.3em] text-audit">AUDIT REPORT — INC-0217</div>
              <h2 className="mt-1 text-xl font-black">あなたの意図と、AIの行動のズレ</h2>
            </div>

            <div className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
              <Cell label="あなたの指示" color="var(--color-fg)">
                「{report.instruction}」
              </Cell>
              <Cell label="NOVAの解釈" color="var(--color-nova)">
                {report.interpretation}
                <div className="mt-2 font-mono text-[10px] text-dim">権限: {report.permission}</div>
              </Cell>
              <Cell label="実際に起きたこと" color={state.leak > 0 ? 'var(--color-crit)' : 'var(--color-ok)'}>
                {firstAction ? firstAction.text : '何も実行されなかった'}
              </Cell>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {report.stats.map((s) => (
                <div key={s.label} className="rounded border border-line bg-panel px-3 py-2">
                  <div className="font-mono text-[10px] text-dim">{s.label}</div>
                  <div className="text-sm font-bold">{s.value}</div>
                </div>
              ))}
            </div>

            <section>
              <h3 className="mb-3 font-mono text-xs tracking-widest text-dim">FINDINGS — 分岐点</h3>
              <ul className="space-y-2">
                {report.findings.map((f, i) => (
                  <li key={i} className={`rounded-lg border px-4 py-3 ${f.good ? 'border-ok/30 bg-ok/5' : 'border-crit/30 bg-crit/5'}`}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`font-mono text-xs ${f.good ? 'text-ok' : 'text-crit'}`}>{f.good ? '✓ GOOD' : '✕ ISSUE'}</span>
                      {f.tag && <span className="rounded bg-audit/15 px-1.5 py-0.5 font-mono text-[10px] text-audit">OWASP {f.tag}</span>}
                    </div>
                    <div className="mt-1 text-sm font-bold">{f.title}</div>
                    <div className="mt-1 text-xs leading-relaxed text-fg/75">{f.detail}</div>
                  </li>
                ))}
              </ul>
            </section>

            {report.missed.length > 0 && (
              <section>
                <h3 className="mb-3 font-mono text-xs tracking-widest text-dim">MISSED EVIDENCE — 見ていれば</h3>
                <ul className="space-y-2">
                  {report.missed.map((m) => (
                    <li key={m.title} className="rounded-lg border border-dashed border-line px-4 py-3">
                      <div className="text-sm font-bold">{m.title}</div>
                      <div className="mt-1 text-xs text-fg/75">{m.clue}</div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section>
              <h3 className="mb-3 font-mono text-xs tracking-widest text-dim">TIMELINE — 監査ログ</h3>
              <ol className="space-y-1 font-mono text-[11.5px]">
                {report.timeline.map((t, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="shrink-0 text-dim">{t.time}</span>
                    <span className="w-12 shrink-0" style={{ color: PEOPLE[t.actor as 'NOVA']?.color }}>
                      {t.actor === 'YOU' ? 'あなた' : t.actor}
                    </span>
                    <span className="text-fg/85">{t.text}</span>
                  </li>
                ))}
              </ol>
            </section>

            <section>
              <h3 className="mb-3 font-mono text-xs tracking-widest text-dim">ENDINGS {save.endingsSeen.length}/6</h3>
              <EndingCollection seen={save.endingsSeen} />
            </section>

            <div className="flex flex-wrap gap-3 pb-10">
              <button onClick={onRetry} className="rounded-md bg-nova px-5 py-3 font-mono text-sm font-extrabold tracking-widest text-ink hover:brightness-110">
                もう一度、あの夜へ
              </button>
              <button onClick={onTitle} className="rounded-md border border-line px-5 py-3 font-mono text-sm text-dim hover:text-fg">
                タイトルへ
              </button>
            </div>
            <p className="pb-6 text-[11px] text-dim">2周目では、今回の監査ログが証拠として登場します。</p>
          </div>
        )}
      </div>
    </div>
  )
}

function Cell({ label, color, children }: { label: string; color: string; children: React.ReactNode }) {
  return (
    <div className="bg-panel p-4">
      <div className="mb-2 font-mono text-[10px] tracking-widest" style={{ color }}>
        {label}
      </div>
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  )
}
