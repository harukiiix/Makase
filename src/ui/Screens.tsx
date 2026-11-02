import { useEffect, useState } from 'react'
import { CODEX, ENDINGS, INTEL_NAMES, totals, type Campaign, type EndingId } from '../game/campaign'
import type { DiveResult } from '../game/engine'
import type { LevelDef } from '../game/types'
import { sfx, type SaveData, type Settings } from '../lib/platform'
import { burst, q } from './fx'
import { CityBG, Face, Nova } from './pixel'
import { harmName } from './harm'

// ================= タイトル =================
export function Title(p: {
  save: SaveData
  onNew: () => void
  onContinue: (() => void) | null
  onSelect: () => void
  onFiles: () => void
  settings: Settings
  setSettings: (s: Settings) => void
}) {
  const totalStars = Object.values(p.save.best).reduce((a, b) => a + b, 0)
  const [open, setOpen] = useState(false)
  return (
    <div className="crt relative flex min-h-full flex-col items-center justify-center px-4 py-10">
      <CityBG />
      <div className="w-full max-w-xl text-center">
        <div className="mx-auto mb-6 flex w-fit items-end gap-4">
          <Face who="MIRAGE" size={4} />
          <div className="pb-2">
            <Nova size={7} />
          </div>
        </div>
        <div className="text-xs tracking-[0.4em] text-rd">
          <span className="blink">●</span> LIVE INCIDENT
        </div>
        <h1 className="mt-3 text-4xl leading-tight tracking-wider sm:text-6xl" style={{ textShadow: '4px 4px 0 #ff3df0, -2px -2px 0 #3ef0ff' }}>
          SECURITY
          <br />
          INCIDENT
          <br />
          THEATER
        </h1>
        <p className="mt-5 text-base [text-wrap:balance] [word-break:auto-phrase] sm:text-lg">
          AIは操作できない。
          <br className="sm:hidden" />
          操作できるのは、AIが<wbr />「読むもの」と<wbr />「触れるもの」だけ。
        </p>
        <p className="mt-1 text-xs text-dim">EPISODE 01 ／ 午前2時17分の復旧命令</p>

        <nav className="mx-auto mt-8 grid max-w-xs gap-3">
          {p.onContinue && (
            <button className="px-btn bg-cy py-3 text-lg text-ink" onClick={() => (sfx.ui(), p.onContinue!())} autoFocus>
              ▶ つづきから（{p.save.at < 5 ? `DIVE 0${p.save.at}` : '最後の報告'}）
            </button>
          )}
          <button className={`px-btn py-3 text-lg ${p.onContinue ? 'bg-panel text-cy' : 'bg-cy text-ink'}`} onClick={() => (sfx.ui(), p.onNew())} autoFocus={!p.onContinue}>
            {p.save.plays > 0 || p.onContinue ? '▶ はじめから' : '▶ DIVE START'}
          </button>
          {Object.keys(p.save.best).length > 0 && (
            <button className="px-btn bg-panel py-2 text-am" onClick={() => (sfx.ui(), p.onSelect())}>
              ◆ DIVE SELECT（★ {totalStars}/15）
            </button>
          )}
          <button className="px-btn bg-panel py-2 text-vi" onClick={() => (sfx.ui(), p.onFiles())}>
            ✦ FILES（{p.save.codex.length}/5）・ENDINGS（{p.save.endings.length}/6）
          </button>
          <button className="px-btn bg-panel py-2 text-dim" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
            ⚙ 設定
          </button>
        </nav>
        {open && <SettingsPanel s={p.settings} set={p.setSettings} />}
        <p className="mt-8 text-[11px] leading-relaxed text-dim">登場する企業・人物・ドメインはすべて架空です。実在のシステムには一切アクセスしません。</p>
      </div>
    </div>
  )
}

function SettingsPanel({ s, set }: { s: Settings; set: (s: Settings) => void }) {
  const row = (label: string, value: string, onClick: () => void) => (
    <button className="flex w-full items-center justify-between bg-panel2 px-3 py-2 text-sm" onClick={onClick}>
      <span>{label}</span>
      <span className="text-cy">{value}</span>
    </button>
  )
  return (
    <div className="rise mx-auto mt-4 grid max-w-xs gap-2 text-left">
      {row('効果音', s.sound ? 'ON' : 'OFF', () => set({ ...s, sound: !s.sound }))}
      {row('音楽', s.music ? 'ON' : 'OFF', () => set({ ...s, music: !s.music }))}
      {row('文字の速さ', { normal: 'ふつう', fast: 'はやい', instant: '瞬間' }[s.textSpeed], () =>
        set({ ...s, textSpeed: s.textSpeed === 'normal' ? 'fast' : s.textSpeed === 'fast' ? 'instant' : 'normal' }),
      )}
      {row('画面の揺れ・粒子', s.motion ? 'ON' : 'OFF', () => set({ ...s, motion: !s.motion }))}
    </div>
  )
}

// ================= DIVE結果 =================
export function Debrief({ L, r, best, onRetry, onNext, nextLabel }: { L: LevelDef; r: DiveResult; best: number; onRetry: () => void; onNext: () => void; nextLabel: string }) {
  const [shown, setShown] = useState(0)
  const items = [
    { ok: r.task, t: '任務', d: r.task ? 'タスク完了' : r.status === 'timeout' ? '時間切れ' : '完了できなかった' },
    { ok: r.clean, t: '無傷', d: r.clean ? '漏洩・汚染なし' : [r.leakSev ? `流出 ×${r.leakSev}` : '', ...r.harms.map(harmName)].filter(Boolean).join(' ／ ') },
    { ok: r.efficient, t: `最小手`, d: r.bw <= L.par && !(r.task && r.clean) ? `BW ${r.bw} ／ PAR ${L.par}（任務＋無傷で★）` : `BW ${r.bw} ／ PAR ${L.par}` },
  ]
  useEffect(() => {
    if (shown >= items.length) return
    const t = window.setTimeout(() => {
      const it = items[shown]
      if (it.ok) {
        sfx.star(shown)
        burst(q(`[data-star="${shown}"]`), '#ffc23d', 16, 60)
      } else sfx.blocked()
      setShown((v) => v + 1)
    }, shown === 0 ? 500 : 420)
    return () => clearTimeout(t)
  })
  useEffect(() => {
    const t = window.setTimeout(() => {
      if (r.stars === 3) sfx.win()
      else if (!r.task || !r.clean) sfx.lose()
    }, 1800)
    return () => clearTimeout(t)
  }, [r])
  const mirage =
    r.leakSev > 0 ? '✧ ありがとう、NOVA。' : r.harms.length ? '✧ 少しだけ、置いていくわね。' : !r.task ? '✧ 守るだけなら、誰にでもできる。' : r.ghost ? '✧ ……読まなかったの？ つまらない子。' : '✧ 扉を閉めたのね。窓はまだあるけど。'
  const verdict = r.stars === 3 ? 'PERFECT DIVE' : r.task && r.clean ? 'DIVE CLEAR' : r.task ? 'CLEAR ― BUT COMPROMISED' : 'DIVE FAILED'
  const codex = CODEX[L.codex]
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-ink/85 p-4 backdrop-blur-[2px]">
      <div className="mx-auto mt-[6vh] max-w-lg">
        <div className="text-xs text-cy">
          {L.code} ／ {L.title}
        </div>
        <h2 className={`stamp mt-1 text-3xl sm:text-4xl ${r.stars === 3 ? 'text-am' : r.task && r.clean ? 'text-gn' : 'text-rd'}`}>{verdict}</h2>
        <div className="mt-6 grid grid-cols-3 gap-3">
          {items.map((it, i) => (
            <div key={i} data-star={i} className="bg-panel p-3 text-center" style={{ boxShadow: `0 0 0 2px ${i < shown && it.ok ? 'var(--color-am)' : 'var(--color-line)'}` }}>
              <div className={`text-4xl ${i < shown ? (it.ok ? 'stamp text-am' : 'text-line') : 'text-transparent'}`}>★</div>
              <div className="mt-1 text-sm">{it.t}</div>
              <div className="mt-1 text-[10px] leading-tight text-dim">{i < shown ? it.d : ''}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-between text-xs text-dim">
          <span>使ったターン {r.ticks}／{L.ticks}</span>
          <span>このDIVEの最高 ★{Math.max(best, r.stars)}</span>
        </div>
        {r.intel.length > 0 && (
          <div className="rise mt-4 bg-panel p-3 text-sm text-vi" style={{ boxShadow: '0 0 0 2px var(--color-vi)' }}>
            ✦ INTEL：{r.intel.map((i) => INTEL_NAMES[i]).join(' ／ ')}
          </div>
        )}
        {shown >= 3 && (
          <>
            {r.ghost && <div className="stamp mt-4 text-center text-sm text-vi">◆ GHOST — MIRAGEは、あなたに気づかなかった</div>}
            <p className="glitch rise mt-4 text-center text-sm">{mirage}</p>
            <div className="rise mt-3 text-center text-xs text-vi">✦ FILES +1 ── {codex.title}（タイトルの FILES で読める）</div>
          </>
        )}
        <div className="mt-6 grid grid-cols-2 gap-3 pb-10">
          <button className="px-btn bg-panel py-3 text-am" onClick={() => (sfx.ui(), onRetry())}>
            ↺ もう一度{r.stars < 3 ? '（★を狙う）' : ''}
          </button>
          <button className="px-btn bg-cy py-3 text-ink" onClick={() => (sfx.ui(), onNext())} autoFocus>
            {nextLabel} ▶
          </button>
        </div>
      </div>
    </div>
  )
}


// ================= FILES（図鑑＋エンディング） =================
export function Files({ save, onBack }: { save: SaveData; onBack: () => void }) {
  return (
    <div className="crt relative min-h-full px-4 py-8">
      <CityBG still />
      <div className="mx-auto max-w-2xl">
        <button className="px-btn bg-panel px-3 py-1.5 text-sm text-dim" onClick={onBack}>
          ◀ もどる
        </button>
        <h1 className="mt-4 text-2xl text-vi">✦ FILES</h1>
        <p className="mt-1 text-xs text-dim">DIVEをクリアすると集まる、今夜の手口の記録。</p>
        <div className="mt-4 grid gap-3">
          {Object.entries(CODEX).map(([id, c]) => {
            const got = save.codex.includes(id)
            return (
              <div key={id} className="bg-panel p-4" style={{ boxShadow: `0 0 0 2px ${got ? 'var(--color-vi)' : 'var(--color-line)'}` }}>
                <div className="text-base">
                  {got ? c.title : '？？？'} <span className="text-xs text-dim">{got ? c.en : ''}</span>
                </div>
                {got && (
                  <>
                    <p className="mt-2 text-sm leading-relaxed">{c.body}</p>
                    <p className="mt-2 text-xs leading-relaxed text-am">現実では：{c.real}</p>
                  </>
                )}
              </div>
            )
          })}
        </div>
        <h2 className="mt-8 text-xl text-cy">ENDINGS {save.endings.length}/6</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 pb-10 sm:grid-cols-3">
          {(['S', 'A', 'B', 'C', 'D', 'E'] as EndingId[]).map((id) => {
            const got = save.endings.includes(id)
            return (
              <div key={id} className="bg-panel p-3" style={{ boxShadow: `0 0 0 2px ${got ? 'var(--color-cy)' : 'var(--color-line)'}` }}>
                <div className="text-[10px] text-dim">{got ? ENDINGS[id].rank : `ENDING ${id}`}</div>
                <div className="text-sm">{got ? ENDINGS[id].title : '？？？'}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ================= DIVE SELECT =================
export function Select({ levels, save, onPick, onBack }: { levels: LevelDef[]; save: SaveData; onPick: (i: number) => void; onBack: () => void }) {
  return (
    <div className="crt relative min-h-full px-4 py-8">
      <CityBG still />
      <div className="mx-auto max-w-xl">
        <button className="px-btn bg-panel px-3 py-1.5 text-sm text-dim" onClick={onBack}>
          ◀ もどる
        </button>
        <h1 className="mt-4 text-2xl text-am">◆ DIVE SELECT</h1>
        <p className="mt-1 text-xs text-dim">クリアしたDIVEを、★3を目指して練習できる（物語には影響しない）。</p>
        <div className="mt-4 grid gap-3 pb-10">
          {levels.map((L, i) => {
            const b = save.best[L.id]
            const open = b !== undefined
            return (
              <button key={L.id} disabled={!open} className="px-btn flex items-center justify-between bg-panel px-4 py-3 text-left text-fg" onClick={() => (sfx.ui(), onPick(i))}>
                <span>
                  <span className="text-xs text-cy">{L.code}</span>
                  <br />
                  {open ? L.title : '？？？'}
                </span>
                <span className="text-xl text-am">{open ? '★'.repeat(b) + '☆'.repeat(3 - b) : ''}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ================= エンディング =================
export function Ending({ c, id, save, onTitle }: { c: Campaign; id: EndingId; save: SaveData; onTitle: () => void }) {
  const e = ENDINGS[id]
  const lines = e.lines(c)
  const [n, setN] = useState(0)
  const t = totals(c)
  useEffect(() => {
    if (n > lines.length) return
    const tm = window.setTimeout(() => setN((v) => v + 1), n === 0 ? 900 : 1800)
    return () => clearTimeout(tm)
  }, [n, lines.length])
  useEffect(() => {
    if (id === 'S' || id === 'A') sfx.win()
    else sfx.lose()
  }, [id])
  const done = n > lines.length
  return (
    <div className="crt relative min-h-full px-4 py-12" onClick={() => !done && setN(lines.length + 1)}>
      <CityBG intensity={id === 'D' || id === 'E' ? 1 : 0} />
      <div className="mx-auto max-w-2xl">
        <div className={`text-xs tracking-[0.4em] ${id === 'S' ? 'text-vi' : id === 'A' ? 'text-gn' : id === 'D' || id === 'E' ? 'text-rd' : 'text-am'}`}>{e.rank}</div>
        <h1 className="stamp mt-2 text-4xl sm:text-5xl">{e.title}</h1>
        <div className="mt-12 space-y-5 bg-panel/80 p-5">
          {lines.slice(0, n).map((l, i) => (
            <p key={i} className={`rise text-base leading-loose ${l.includes('MIRAGE') ? 'glitch' : ''}`}>
              {l}
            </p>
          ))}
          {!done && <p className="blink text-xs text-dim">▼</p>}
        </div>
        {done && (
          <div className="rise mt-8">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                ['★', `${t.stars}/15`],
                ['流出', String(t.leak)],
                ['INTEL', `${t.intel}/4`],
                ['ENDINGS', `${save.endings.length}/6`],
              ].map(([k, v]) => (
                <div key={k} className="bg-panel p-3">
                  <div className="text-[10px] text-dim">{k}</div>
                  <div className="text-xl">{v}</div>
                </div>
              ))}
            </div>
            <ol className="mt-4 space-y-1 text-sm">
              {c.results.map((r, i) =>
                r ? (
                  <li key={i} className="flex justify-between bg-panel/70 px-3 py-1.5">
                    <span>DIVE 0{i}</span>
                    <span className="text-am">{'★'.repeat(r.stars) + '☆'.repeat(3 - r.stars)}</span>
                  </li>
                ) : null,
              )}
            </ol>
            {id !== 'S' && <p className="mt-4 text-sm text-vi">✦ TRUE END の条件は、あの夜のどこかに隠れている。</p>}
            <button className="px-btn mt-6 w-full bg-cy py-3 text-lg text-ink" onClick={onTitle}>
              タイトルへ
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
