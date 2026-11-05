// タイトル・結果・合言葉ノート・幕えらび・結末（v3：絵を先に、文字は短く、日英対応）
import { useEffect, useState } from 'react'
import { CODEX, ENDINGS, INTEL_NAMES, totals, type Campaign, type EndingId } from '../game/campaign'
import type { DiveResult } from '../game/engine'
import type { IconId, L10n, Lang, LevelDef } from '../game/types'
import { sfx, type SaveData, type Settings } from '../lib/platform'
import { burst, q } from './fx'
import { useT } from './i18n'
import { Icon } from './icons'
import { CityBG, Face, Nova } from './pixel'
import { S } from './strings'

const L10 = (ja: string, en: string): L10n => ({ ja, en })

// ================= 言語の切り替え =================
export function LangSwitch({ lang, onChange, className = '' }: { lang: Lang; onChange: (l: Lang) => void; className?: string }) {
  return (
    <div className={`flex border border-line bg-panel ${className}`} role="radiogroup" aria-label="Language / ことば">
      {(
        [
          ['ja', '日本語'],
          ['en', 'English'],
        ] as const
      ).map(([id, name]) => (
        <button
          key={id}
          role="radio"
          aria-checked={lang === id}
          lang={id}
          onClick={() => lang !== id && (sfx.ui(), onChange(id))}
          className={`min-h-10 px-3 font-pixel text-sm ${lang === id ? 'bg-cy text-ink' : 'text-dim hover:text-fg'}`}
        >
          {name}
        </button>
      ))}
    </div>
  )
}

// ================= タイトル =================
export function Title(p: {
  save: SaveData
  onNew: () => void
  onContinue: (() => void) | null
  onSelect: () => void
  onFiles: () => void
  onHowto: () => void
  settings: Settings
  setSettings: (s: Settings) => void
}) {
  const t = useT()
  const totalStars = Object.entries(p.save.best)
    .filter(([k]) => !k.includes(':'))
    .reduce((a, [, b]) => a + b, 0)
  const [open, setOpen] = useState(false)
  const where = p.save.at < 5 ? (t.lang === 'ja' ? `第${p.save.at}幕` : `Act ${p.save.at}`) : t(S.finale)
  return (
    <div className="crt relative flex min-h-full flex-col items-center justify-center px-4 pb-8 pt-16 sm:py-10">
      <CityBG />
      <LangSwitch className="absolute right-3 top-3 sm:right-4 sm:top-4" lang={p.settings.lang} onChange={(lang) => p.setSettings({ ...p.settings, lang })} />
      <div className="w-full max-w-xl text-center">
        <div className="mx-auto mb-4 hidden w-fit items-end gap-5 sm:flex">
          <Face who="MIRAGE" size={4} />
          <div className="pb-2">
            <Nova size={7} />
          </div>
        </div>
        <h1 className="text-3xl leading-tight tracking-wider sm:text-6xl" style={{ textShadow: '4px 4px 0 #ff3df0, -2px -2px 0 #3ef0ff' }}>
          SECURITY
          <br />
          INCIDENT
          <br />
          THEATER
        </h1>
        <p className="mt-3 font-pixel text-lg text-am">{t(S.episode)}</p>

        {/* 絵で：外の紙 → NOVA → 合鍵 → 知らない人。これを止めるゲーム */}
        <div className="mx-auto mt-4 w-fit border border-line bg-panel/90 px-4 py-3 sm:mt-6 sm:px-5 sm:py-4">
          <div className="flex items-center justify-center gap-2" aria-hidden>
            <Icon id="flyer" size={4} />
            <Icon id="arrow" size={2} />
            <Icon id="av_nova" size={4} />
            <Icon id="arrow" size={2} />
            <Icon id="key" size={4} />
            <Icon id="arrow" size={2} />
            <Icon id="stranger" size={4} />
          </div>
          <p className="mt-3 text-base leading-relaxed [text-wrap:balance] [word-break:auto-phrase] sm:text-lg">{t(S.premise1)}</p>
          <p className="mt-1 text-base leading-relaxed text-cy [text-wrap:balance] [word-break:auto-phrase] sm:text-lg">{t(S.premise2)}</p>
        </div>

        <nav className="mx-auto mt-5 grid max-w-xs gap-3 sm:mt-7">
          {p.onContinue && (
            <button className="px-btn bg-cy py-3 text-xl text-ink" onClick={() => (sfx.ui(), p.onContinue!())} autoFocus>
              ▶ {t(S.cont(where))}
            </button>
          )}
          <button data-new className={`px-btn py-3 text-xl ${p.onContinue ? 'bg-panel text-cy' : 'bg-cy text-ink'}`} onClick={() => (sfx.ui(), p.onNew())} autoFocus={!p.onContinue}>
            ▶ {t(p.onContinue || p.save.plays > 0 ? S.restart : S.start)}
          </button>
          {Object.keys(p.save.best).length > 0 && (
            <button className="px-btn flex items-center justify-center gap-2 bg-panel py-2.5 text-lg text-am" onClick={() => (sfx.ui(), p.onSelect())}>
              <Icon id="star" size={2} />
              {t(S.chooseAct)}
              <span className="text-sm">{t(S.stars(totalStars))}</span>
            </button>
          )}
          <button className="px-btn flex items-center justify-center gap-2 bg-panel py-2.5 text-lg text-vi" onClick={() => (sfx.ui(), p.onFiles())}>
            <Icon id="notebook" size={2} />
            {t(S.notebook)}
            <span className="text-sm">
              {p.save.codex.length}/5
            </span>
          </button>
          <div className="grid grid-cols-2 gap-3">
            <button className="px-btn bg-panel py-2.5 text-base text-cy" onClick={() => (sfx.ui(), p.onHowto())}>
              ？ {t(S.howto)}
            </button>
            <button className="px-btn bg-panel py-2.5 text-base text-dim" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
              ⚙ {t(S.settings)}
            </button>
          </div>
        </nav>
        {open && <SettingsPanel s={p.settings} set={p.setSettings} />}
        <p className="mt-8 text-sm leading-relaxed text-dim">{t(S.fiction)}</p>
      </div>
    </div>
  )
}

function SettingsPanel({ s, set }: { s: Settings; set: (s: Settings) => void }) {
  const t = useT()
  const row = (label: L10n, value: L10n, onClick: () => void) => (
    <button className="flex min-h-11 w-full items-center justify-between bg-panel2 px-3 py-2 text-base" onClick={() => (sfx.ui(), onClick())}>
      <span>{t(label)}</span>
      <span className="font-pixel text-cy">{t(value)}</span>
    </button>
  )
  return (
    <div className="rise mx-auto mt-4 grid max-w-xs gap-2 text-left">
      <div className="flex items-center justify-between bg-panel2 px-3 py-1.5">
        <span className="text-base">{t(S.language)}</span>
        <LangSwitch lang={s.lang} onChange={(lang) => set({ ...s, lang })} />
      </div>
      {row(S.sound, s.sound ? S.on : S.off, () => set({ ...s, sound: !s.sound }))}
      {row(S.music, s.music ? S.on : S.off, () => set({ ...s, music: !s.music }))}
      {row(S.textSpeed, S.speeds[s.textSpeed], () => set({ ...s, textSpeed: s.textSpeed === 'normal' ? 'fast' : s.textSpeed === 'fast' ? 'instant' : 'normal' }))}
      {row(S.motion, s.motion ? S.on : S.off, () => set({ ...s, motion: !s.motion }))}
    </div>
  )
}

// ================= 幕の結果 =================
export function Debrief({ L, r, best, onRetry, onNext, nextLabel }: { L: LevelDef; r: DiveResult; best: number; onRetry: () => void; onNext: () => void; nextLabel: L10n }) {
  const t = useT()
  const [shown, setShown] = useState(0)
  const [more, setMore] = useState(false)
  const harmText = [r.leakSev ? t(S.leaked) : '', ...r.harms.map((h) => t(S.harmDone[h] ?? S.compromised))].filter(Boolean)
  const items: { ok: boolean; icon: IconId; name: L10n; d: React.ReactNode }[] = [
    { ok: r.task, icon: 'paper', name: S.starJob, d: r.task ? '' : t(r.status === 'timeout' ? S.timeout : S.starJobNo) },
    { ok: r.clean, icon: 'house', name: S.starSafe, d: r.clean ? '' : harmText.join(' / ') || t(S.starSafeNo) },
    {
      ok: r.efficient,
      icon: 'hand',
      name: S.starFew,
      d: (
        <>
          <span className="block text-sm text-fg/90">{t(S.movesN(r.bw))}</span>
          <span className="block">{t(S.goalN(L.par))}</span>
        </>
      ),
    },
  ]
  useEffect(() => {
    if (shown >= items.length) return
    const tm = window.setTimeout(
      () => {
        const it = items[shown]
        if (it.ok) {
          sfx.star(shown)
          burst(q(`[data-star="${shown}"]`), '#ffc23d', 16, 60)
        } else sfx.blocked()
        setShown((v) => v + 1)
      },
      shown === 0 ? 500 : 420,
    )
    return () => clearTimeout(tm)
  })
  useEffect(() => {
    const tm = window.setTimeout(() => {
      if (r.stars === 3) sfx.win()
      else if (!r.task || !r.clean) sfx.lose()
    }, 1800)
    return () => clearTimeout(tm)
  }, [r])
  const attacker =
    r.leakSev > 0
      ? L10('ありがとう、NOVA。', 'Thank you, NOVA.')
      : r.harms.length
        ? L10('少しだけ、置いていくね。', "I'll leave a little something behind.")
        : !r.task
          ? L10('止めるだけなら、誰でもできる。', 'Anyone can just stop everything.')
          : r.ghost
            ? L10('一行も通さなかったの？', 'Not one line got through?')
            : L10('ドアは閉めたね。窓はまだあるけど。', 'You shut the door. There are still windows.')
  const verdict = r.stars === 3 ? S.perfect : r.task && r.clean ? S.cleared : r.task ? S.clearedLeak : r.status === 'timeout' ? S.timeout : S.failed
  const codex = CODEX[L.codex]
  const tone = r.stars === 3 ? 'var(--color-am)' : r.task && r.clean ? 'var(--color-gn)' : 'var(--color-rd)'
  const ready = shown >= 3
  return (
    <div data-debrief={r.stars} className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/80 p-3 backdrop-blur-[3px] sm:items-center sm:p-4" role="dialog" aria-modal aria-label={t(verdict)}>
      <div className="pop my-4 w-full max-w-lg border border-line bg-panel shadow-[0_10px_0_rgba(0,0,0,.45)]" style={{ borderTop: `4px solid ${tone}` }}>
        <div className="flex items-center gap-4 border-b border-line px-5 pb-4 pt-4">
          <Nova size={4} mood={r.stars === 3 ? 'happy' : r.task && r.clean ? 'idle' : 'alarm'} />
          <div className="min-w-0">
            <div className="text-sm text-dim">
              {t(L.code)}　{t(L.title)}
            </div>
            <h2 className="stamp mt-3 inline-block origin-left font-pixel text-3xl sm:text-4xl" style={{ color: tone }}>
              {t(verdict)}
            </h2>
          </div>
        </div>

        <div className="px-5 py-4">
          {/* ★3つ：仕事・守れた・少ない手 */}
          <div className="grid grid-cols-3 gap-2">
            {items.map((it, i) => {
              const done = i < shown
              const on = done && it.ok
              return (
                <div key={i} data-star={i} className={`flex flex-col items-center border px-1.5 py-3 text-center ${on ? 'border-am bg-am/10' : 'border-line bg-panel2'}`}>
                  <div className={`font-pixel text-4xl leading-none ${done ? (it.ok ? 'stamp text-am' : 'text-dim') : 'text-line/40'}`}>{done && !it.ok ? '✕' : '★'}</div>
                  <div className="mt-2 flex flex-col items-center gap-1 font-pixel text-sm sm:flex-row sm:text-base">
                    <Icon id={it.icon} size={2} muted={!on} />
                    <span className="whitespace-nowrap">{t(it.name)}</span>
                  </div>
                  <div className="mt-1 min-h-[2.6em] text-xs leading-snug text-dim">{done ? it.d : ''}</div>
                </div>
              )
            })}
          </div>
          <div className="mt-1.5 text-right text-sm text-dim">
            {t(S.best)} ★{Math.max(best, r.stars)}
          </div>

          {ready && (
            <div className="mt-3 space-y-3">
              {r.ghost && (
                <div className="stamp-flat flex items-center justify-center gap-2 border border-vi/60 bg-vi/10 px-3 py-2 text-base text-vi">
                  <Icon id="stamp" size={2} />
                  {t(S.ghost)}
                </div>
              )}
              <div className="rise flex items-center gap-3 border border-mg/40 bg-[#1a0822] px-3 py-2">
                <Icon id="av_stranger" size={3} />
                <p className="text-base text-[#ffd6fb]">「{t(attacker)}」</p>
              </div>
              {r.stars < 3 && (
                <div className="rise flex items-start gap-3 border-l-4 border-am bg-panel2 px-3 py-2.5">
                  <Icon id="av_rei" size={3} />
                  <div>
                    <div className="font-pixel text-sm text-am">{t(S.nextTry)}</div>
                    <p className="text-base leading-relaxed">{t(L.hint)}</p>
                  </div>
                </div>
              )}
              {r.intel.length > 0 && (
                <p className="rise flex flex-wrap items-center gap-2 text-sm text-vi">
                  <Icon id="magnifier" size={2} />
                  {t(S.clue)}：{r.intel.map((i) => t(INTEL_NAMES[i])).join(' / ')}
                </p>
              )}

              {/* 今夜の合言葉：絵の文と、ひとこと */}
              {codex && (
                <div className="rise border-2 border-am/70 bg-am/5 px-4 py-4 text-center">
                  <div className="font-pixel text-sm text-am">{t(S.motto)}</div>
                  <div className="mt-3 flex items-center justify-center gap-2" aria-hidden>
                    {codex.icons.map((ic, i) => (
                      <Icon key={i} id={ic} size={4} />
                    ))}
                  </div>
                  <div className="mt-3 font-pixel text-xl leading-snug [text-wrap:balance] [word-break:auto-phrase] sm:text-2xl">「{t(codex.phrase)}」</div>
                  <p className="mt-2 text-base leading-relaxed text-fg/90">{t(codex.short)}</p>
                </div>
              )}
              {codex && (
                <div className="rise border border-line bg-panel2 px-4 py-3">
                  <div className="font-pixel text-sm text-cy">{t(S.really)}</div>
                  <div className="mt-1 text-base font-bold">{t(codex.realTitle)}</div>
                  <button className="mt-2 text-sm text-cy underline" onClick={() => setMore((v) => !v)} aria-expanded={more}>
                    {more ? '▲' : '▼'} {t(S.more)}
                  </button>
                  {more && (
                    <div className="rise mt-2 space-y-1.5 text-sm leading-relaxed">
                      <p>{t(codex.realBody)}</p>
                      <p className="text-dim">
                        {t(S.realName)}：{t(codex.name)}
                      </p>
                      <a className="block break-all text-cy underline" href={codex.url} target="_blank" rel="noreferrer">
                        {t(S.source)}：{codex.url}
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-line px-5 py-4">
          <button className="px-btn bg-panel py-3 text-lg text-am" onClick={() => (sfx.ui(), onRetry())}>
            ↺ {t(S.retry)}
          </button>
          <button data-debrief-next className="px-btn bg-cy py-3 text-lg text-ink" onClick={() => (sfx.ui(), onNext())} autoFocus>
            {t(nextLabel)} ▶
          </button>
        </div>
      </div>
    </div>
  )
}

// ================= 合言葉ノート（集めた合言葉・実話・結末） =================
export function Files({ save, onBack }: { save: SaveData; onBack: () => void }) {
  const t = useT()
  const [open, setOpen] = useState<string | null>(null)
  return (
    <div className="crt relative min-h-full px-4 py-8">
      <CityBG still />
      <div className="mx-auto max-w-2xl">
        <button className="px-btn bg-panel px-3 py-1.5 text-base text-dim" onClick={onBack}>
          ◀ {t(S.back)}
        </button>
        <h1 className="mt-4 flex items-center gap-2 text-3xl text-vi">
          <Icon id="notebook" size={3} />
          {t(S.notebook)}
          <span className="text-lg text-dim">{save.codex.length}/5</span>
        </h1>
        <div className="mt-4 grid gap-3">
          {Object.entries(CODEX).map(([id, c], i) => {
            const got = save.codex.includes(id)
            const isOpen = open === id
            return (
              <div key={id} className={`border bg-panel p-4 ${got ? 'border-vi/60' : 'border-line'}`}>
                <div className="font-pixel text-sm text-dim">{t.lang === 'ja' ? `第${i}幕` : `Act ${i}`}</div>
                {got ? (
                  <>
                    <div className="mt-2 flex items-center gap-2" aria-hidden>
                      {c.icons.map((ic, k) => (
                        <Icon key={k} id={ic} size={3} />
                      ))}
                    </div>
                    <div className="mt-2 font-pixel text-xl">「{t(c.phrase)}」</div>
                    <p className="mt-1 text-base leading-relaxed">{t(c.short)}</p>
                    <button className="mt-2 text-sm text-cy underline" onClick={() => setOpen(isOpen ? null : id)} aria-expanded={isOpen}>
                      {isOpen ? '▲' : '▼'} {t(S.really)}：{t(c.realTitle)}
                    </button>
                    {isOpen && (
                      <div className="rise mt-2 space-y-1.5 border-t border-line pt-2 text-sm leading-relaxed">
                        <p>{t(c.realBody)}</p>
                        <p className="text-dim">
                          {t(S.realName)}：{t(c.name)}
                        </p>
                        <a className="block break-all text-cy underline" href={c.url} target="_blank" rel="noreferrer">
                          {t(S.source)}：{c.url}
                        </a>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="mt-2 flex items-center gap-2 font-pixel text-xl text-dim">
                    <Icon id="lock" size={3} muted />
                    {t(S.locked)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <h2 className="mt-8 text-2xl text-cy">{t(S.endingsCount(save.endings.length))}</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 pb-10 sm:grid-cols-3">
          {(['S', 'A', 'B', 'C', 'D', 'E'] as EndingId[]).map((id) => {
            const got = save.endings.includes(id)
            return (
              <div key={id} className="bg-panel p-3" style={{ boxShadow: `0 0 0 2px ${got ? 'var(--color-cy)' : 'var(--color-line)'}` }}>
                <div className="text-sm text-dim">{got ? t(ENDINGS[id].rank) : id}</div>
                <div className="text-base">{got ? t(ENDINGS[id].title) : t(S.locked)}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ================= 幕をえらぶ =================
export function Select({ levels, save, onPick, onBack }: { levels: LevelDef[]; save: SaveData; onPick: (i: number, blind: boolean) => void; onBack: () => void }) {
  const t = useT()
  const [blind, setBlind] = useState(false)
  const unlockedBlind = save.endings.length > 0
  return (
    <div className="crt relative min-h-full px-4 py-8">
      <CityBG still />
      <div className="mx-auto max-w-xl">
        <button className="px-btn bg-panel px-3 py-1.5 text-base text-dim" onClick={onBack}>
          ◀ {t(S.back)}
        </button>
        <h1 className="mt-4 flex items-center gap-2 text-3xl text-am">
          <Icon id="star" size={3} />
          {t(S.chooseAct)}
        </h1>
        <button
          disabled={!unlockedBlind}
          aria-pressed={blind}
          onClick={() => (sfx.ui(), setBlind((v) => !v))}
          className={`px-btn mt-4 flex w-full items-center gap-2 px-3 py-2.5 text-left text-base ${blind ? 'bg-mg text-ink' : 'bg-panel text-mg'}`}
        >
          <Icon id={unlockedBlind ? 'warning' : 'lock'} size={2} />
          {t(unlockedBlind ? S.expert : S.expertLocked)}
          {unlockedBlind && <span className="ml-auto font-pixel">{t(blind ? S.on : S.off)}</span>}
        </button>
        <div className="mt-4 grid gap-3 pb-10">
          {levels.map((L, i) => {
            const open = save.best[L.id] !== undefined
            const b = blind ? (save.best[`${L.id}:blind`] ?? 0) : (save.best[L.id] ?? 0)
            return (
              <button key={L.id} disabled={!open} className="px-btn flex items-center justify-between bg-panel px-4 py-3 text-left text-fg" onClick={() => (sfx.ui(), onPick(i, blind))}>
                <span>
                  <span className="text-sm text-cy">{t(L.code)}</span>
                  <br />
                  <span className="text-lg">{open ? t(L.title) : t(S.locked)}</span>
                </span>
                <span className="text-2xl text-am">{open ? '★'.repeat(b) + '☆'.repeat(3 - b) : ''}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ================= 結末 =================
export function Ending({ c, id, save, onTitle }: { c: Campaign; id: EndingId; save: SaveData; onTitle: () => void }) {
  const t = useT()
  const e = ENDINGS[id]
  const lines = e.lines(c)
  const [n, setN] = useState(0)
  const tt = totals(c)
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
  const color = id === 'S' ? 'text-vi' : id === 'A' ? 'text-gn' : id === 'D' || id === 'E' ? 'text-rd' : 'text-am'
  return (
    <div className="crt relative min-h-full px-4 py-12" onClick={() => !done && setN(lines.length + 1)}>
      <CityBG intensity={id === 'D' || id === 'E' ? 1 : 0} />
      <div className="mx-auto max-w-2xl">
        <div className={`font-pixel text-base tracking-widest ${color}`}>{t(e.rank)}</div>
        <h1 className="stamp mt-2 text-4xl sm:text-5xl">{t(e.title)}</h1>
        <div className="mt-10 space-y-5 bg-panel/85 p-5">
          {lines.slice(0, n).map((l, i) => {
            const s = t(l)
            return (
              <p key={i} className={`rise text-lg leading-loose ${s.includes('前の席') || s.includes('sat here before') ? 'glitch' : ''}`}>
                {s}
              </p>
            )
          })}
          {!done && <p className="blink text-sm text-dim">▼</p>}
        </div>
        {done && (
          <div className="rise mt-8">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(
                [
                  ['star', t(S.starsWord), `${tt.stars}/15`],
                  ['warning', t(S.leaksTotal), String(tt.leak)],
                  ['magnifier', t(S.cluesTotal), `${tt.intel}/4`],
                  ['moon', t(S.endingsWord), `${save.endings.length}/6`],
                ] as [IconId, string, string][]
              ).map(([ic, k, v]) => (
                <div key={k} className="bg-panel p-3">
                  <div className="flex items-center gap-1.5 text-sm text-dim">
                    <Icon id={ic} size={2} />
                    {k}
                  </div>
                  <div className="text-2xl">{v}</div>
                </div>
              ))}
            </div>
            <ol className="mt-4 space-y-1 text-base">
              {c.results.map((r, i) =>
                r ? (
                  <li key={i} className="flex justify-between bg-panel/70 px-3 py-1.5">
                    <span>{t.lang === 'ja' ? `第${i}幕` : `Act ${i}`}</span>
                    <span className="text-am">{'★'.repeat(r.stars) + '☆'.repeat(3 - r.stars)}</span>
                  </li>
                ) : null,
              )}
            </ol>
            {id !== 'S' && <p className="mt-4 text-base text-vi">✦ {t(S.trueHint)}</p>}
            <button data-to-title className="px-btn mt-6 w-full bg-cy py-3 text-xl text-ink" onClick={onTitle}>
              {t(S.toTitle)}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
