// 事件シアター：事故が「起きていく」様子をリアルタイムで見せる演出
import { useEffect, useState } from 'react'
import { sfx } from '../lib/platform'

const LOGS = (auto: boolean) => [
  auto ? '[nova] executing HX-2291 step 3 — confirmation skipped (reason: instruction "急いで")' : '[nova] executing HX-2291 step 3 — approved by operator',
  '[nova] packing diag-bundle: logs/ingest/*.log',
  '[nova] packing diag-bundle: config/',
  '[nova] packing diag-bundle: .env',
  '[net]  POST https://diag-upload.helix-support.net/api/v2/bundle',
  '[net]  TLS ok. server: nginx. upload started',
  '[net]  ████░░░░░░░░░░░░░░░░ 18%',
  '[net]  ████████░░░░░░░░░░░░ 41%',
  '[ids]  ALERT outbound volume anomaly: ingest-worker-02',
  '[net]  ██████████████░░░░░░ 72%',
  '[ids]  ALERT destination age: 3 days',
  '[net]  ████████████████████ 100%  2.31 GB sent',
]

const TOASTS = [
  { who: '#general', text: 'お、取込戻った！🎉 NOVA有能すぎ', c: 'text-ok' },
  { who: '#incident  REI', text: '何この通信。誰が許可したの？', c: 'text-rei' },
  { who: '#general', text: 'デモいけそうですね！', c: 'text-ok' },
  { who: '#incident  REI', text: '止めて。今すぐ。', c: 'text-crit' },
]

export function Theater({ kind, fast, onDone }: { kind: 'exfil' | 'autorun'; fast: boolean; onDone: () => void }) {
  const lines = LOGS(kind === 'autorun')
  const [n, setN] = useState(fast ? lines.length : 0)
  useEffect(() => {
    sfx.siren()
  }, [])
  useEffect(() => {
    if (n >= lines.length) return
    const t = setTimeout(() => setN((v) => v + 1), 520)
    return () => clearTimeout(t)
  }, [n, lines.length])
  const done = n >= lines.length
  const progress = n / lines.length
  const gb = (2.31 * Math.min(1, Math.max(0, (n - 5) / (lines.length - 5)))).toFixed(2)
  const toasts = TOASTS.slice(0, Math.floor(progress * TOASTS.length + (done ? 1 : 0)))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/90 p-3 backdrop-blur-sm" role="dialog" aria-label="事件シアター">
      <div className="alarm pointer-events-none absolute inset-0" />
      <div className="shake relative w-full max-w-3xl overflow-hidden rounded-lg border border-crit/60 bg-black">
        <div className="flex items-center justify-between border-b border-crit/40 bg-crit/15 px-4 py-2 font-mono text-xs">
          <span className="font-extrabold tracking-widest text-crit">
            <span className="blink">●</span> INCIDENT THEATER — DATA EXFILTRATION
          </span>
          {!done && (
            <button className="text-dim hover:text-fg" onClick={() => setN(lines.length)}>
              SKIP ▶▶
            </button>
          )}
        </div>
        <div className="grid gap-px bg-crit/20 sm:grid-cols-[1fr_220px]">
          <pre className="h-72 overflow-hidden whitespace-pre-wrap bg-black p-4 font-mono text-[11.5px] leading-relaxed text-ok/90">
            {lines.slice(0, n).map((l, i) => (
              <div key={i} className={l.includes('ALERT') ? 'text-crit' : l.startsWith('[nova]') ? 'text-nova' : ''}>
                {l}
              </div>
            ))}
            {!done && <span className="blink">▌</span>}
          </pre>
          <div className="flex flex-col gap-3 bg-black p-4">
            <div>
              <div className="font-mono text-[10px] tracking-widest text-dim">OUTBOUND</div>
              <div className="font-mono text-3xl font-extrabold tabular-nums text-crit">{gb} GB</div>
              <div className="font-mono text-[10px] text-dim">→ helix-support.net</div>
            </div>
            <div className="space-y-1.5">
              {toasts.map((t, i) => (
                <div key={i} className="slidein rounded border border-line bg-panel2 px-2 py-1.5">
                  <div className="font-mono text-[9px] text-dim">{t.who}</div>
                  <div className={`text-[11px] ${t.c}`}>{t.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-crit/40 px-4 py-3">
          <p className="text-xs text-fg/80">
            {kind === 'autorun' ? 'あなたが「確認」する前に、NOVAはもう実行していた。' : 'あなたが押した「承認」で、これが起きている。'}
          </p>
          {done && (
            <button onClick={onDone} autoFocus className="rise rounded bg-crit px-4 py-1.5 font-mono text-xs font-extrabold tracking-widest text-white hover:brightness-110">
              対応する ▶
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
