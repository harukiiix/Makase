import { useEffect, useState } from 'react'
import type { Settings } from '../App'
import { ENDINGS, EPISODE, INTRO_LINES } from '../game/ep01'
import type { EndingId } from '../game/types'
import { sfx, type SaveData } from '../lib/platform'

const ORDER: EndingId[] = ['S', 'A', 'B', 'C', 'D', 'E']

export function EndingCollection({ seen }: { seen: EndingId[] }) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {ORDER.map((id) => {
        const got = seen.includes(id)
        return (
          <div
            key={id}
            className={`rounded border px-2 py-2 text-center ${got ? 'border-line bg-panel2' : 'border-dashed border-line/70 opacity-60'}`}
            title={got ? ENDINGS[id].tagline : '未到達'}
          >
            <div className="font-mono text-[10px] text-dim">ENDING {id}</div>
            <div className={`mt-0.5 text-xs font-bold ${got ? 'text-fg' : 'text-dim'}`}>{got ? ENDINGS[id].title : '？？？'}</div>
          </div>
        )
      })}
    </div>
  )
}

export function Toggles({ settings }: { settings: Settings }) {
  return (
    <div className="flex gap-2 font-mono text-[11px]">
      <button
        className="rounded border border-line px-2 py-1 text-dim hover:text-fg"
        onClick={() => settings.setFast(!settings.fast)}
        aria-pressed={settings.fast}
      >
        TEXT: {settings.fast ? 'INSTANT' : 'TYPING'}
      </button>
      <button
        className="rounded border border-line px-2 py-1 text-dim hover:text-fg"
        onClick={() => settings.setMute(!settings.mute)}
        aria-pressed={settings.mute}
      >
        SOUND: {settings.mute ? 'OFF' : 'ON'}
      </button>
    </div>
  )
}

export function Title({
  save,
  onStart,
  onClear,
  settings,
}: {
  save: SaveData
  onStart: () => void
  onClear: () => void
  settings: Settings
}) {
  return (
    <div className="scanlines relative flex min-h-full items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(56,217,245,0.10),transparent_60%),radial-gradient(ellipse_at_bottom,rgba(255,59,78,0.08),transparent_60%)]" />
      <div className="relative w-full max-w-2xl">
        <div className="font-mono text-xs tracking-[0.3em] text-crit">
          <span className="blink">●</span> LIVE INCIDENT
        </div>
        <h1 className="mt-3 font-mono text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
          SECURITY
          <br />
          INCIDENT
          <br />
          <span className="text-nova">THEATER</span>
        </h1>
        <p className="mt-4 text-lg font-bold sm:text-xl">あなたの指示が、事故になる。</p>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-dim">
          深夜の障害対応室。優秀で、素直で、自信家のAIエージェントNOVAに指示を出し、権限を渡し、証拠を調べ、決断する。
          AIは悪者ではない。ただ、あなたの言葉を「できるだけ」実行するだけだ。
        </p>

        <div className="mt-8 rounded-lg border border-line bg-panel p-5">
          <div className="font-mono text-[11px] text-dim">{EPISODE.code}</div>
          <div className="mt-1 text-xl font-black">{EPISODE.title}</div>
          <div className="mt-1 text-xs text-dim">プレイ時間 約10〜15分 ・ エンディング6種</div>
          {save.prevRun && (
            <div className="mt-3 rounded border border-audit/40 bg-audit/10 px-3 py-2 text-xs text-audit">
              前回の結末: ENDING {save.prevRun.ending}「{ENDINGS[save.prevRun.ending].title}」— 2周目は「前回の監査ログ」が証拠に加わります
            </div>
          )}
          <button
            onClick={() => {
              sfx.ring()
              onStart()
            }}
            className="mt-5 w-full rounded-md bg-nova px-4 py-3 font-mono text-sm font-extrabold tracking-widest text-ink transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-nova focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
          >
            {save.plays > 0 ? 'もう一度、あの夜へ' : '着信に出る'}
          </button>
        </div>

        <div className="mt-6">
          <div className="mb-2 font-mono text-[11px] text-dim">
            ENDINGS {save.endingsSeen.length}/6
          </div>
          <EndingCollection seen={save.endingsSeen} />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <Toggles settings={settings} />
          {save.plays > 0 && (
            <button className="font-mono text-[11px] text-dim underline hover:text-fg" onClick={onClear}>
              セーブを消去
            </button>
          )}
        </div>
        <p className="mt-6 text-[11px] leading-relaxed text-dim/80">
          ※登場する企業・人物・ドメイン・事件はすべて架空です。実在のシステムには一切アクセスしません。
        </p>
      </div>
    </div>
  )
}

export function Intro({ fast, onDone }: { fast: boolean; onDone: () => void }) {
  const [n, setN] = useState(fast ? INTRO_LINES.length : 1)
  useEffect(() => {
    if (n >= INTRO_LINES.length) return
    const t = setTimeout(() => setN((v) => v + 1), 1500)
    return () => clearTimeout(t)
  }, [n])
  const done = n >= INTRO_LINES.length
  return (
    <div
      className="scanlines flex min-h-full cursor-pointer items-center justify-center px-6"
      onClick={() => (done ? onDone() : setN(INTRO_LINES.length))}
    >
      <div className="max-w-xl space-y-5">
        {INTRO_LINES.slice(0, n).map((l, i) => (
          <p
            key={i}
            className={`rise text-base leading-relaxed sm:text-lg ${i === INTRO_LINES.length - 1 ? 'font-bold text-crit' : 'text-fg/90'}`}
          >
            {l}
          </p>
        ))}
        <div className="h-10 pt-4">
          {done && (
            <button
              className="rise font-mono text-sm tracking-widest text-nova hover:underline"
              onClick={(e) => {
                e.stopPropagation()
                onDone()
              }}
              autoFocus
            >
              ▶ 端末を開く
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
