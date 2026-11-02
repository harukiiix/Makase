import { useEffect, useState } from 'react'
import { PROLOGUE, afterDive, computeEnding, finaleBeats, newCampaign, totals, type Campaign, type EndingId } from './game/campaign'
import type { DiveResult } from './game/engine'
import { LEVEL_COUNT, levelAt } from './game/levels'
import type { Beat } from './game/types'
import { FAST, loadSave, loadSettings, setAudio, startMusic, writeSave, writeSettings, type SaveData, type Settings } from './lib/platform'
import { Dive } from './ui/Dive'
import { setMotion } from './ui/fx'
import { Debrief, Ending, Files, Select, Title } from './ui/Screens'
import { Talk } from './ui/Talk'

type Screen =
  | { k: 'title' }
  | { k: 'talk'; beats: Beat[]; header?: string; next: (choice?: number) => void; choices?: string[] }
  | { k: 'dive'; i: number; practice: boolean; attempt: number }
  | { k: 'files' }
  | { k: 'select' }
  | { k: 'ending'; id: EndingId; c: Campaign }

export default function App() {
  const [save, setSaveState] = useState<SaveData>(() => loadSave())
  const [settings, setSettingsState] = useState<Settings>(() => {
    const s = loadSettings()
    return FAST ? { ...s, textSpeed: 'instant' } : s
  })
  const [screen, setScreen] = useState<Screen>({ k: 'title' })
  const [debrief, setDebrief] = useState<DiveResult | null>(null)

  const setSave = (f: (s: SaveData) => SaveData) =>
    setSaveState((prev) => {
      const n = f(prev)
      writeSave(n)
      return n
    })
  const setSettings = (s: Settings) => {
    setSettingsState(s)
    writeSettings(s)
  }

  useEffect(() => {
    setAudio(settings.sound, settings.music)
    setMotion(settings.motion)
    document.documentElement.classList.toggle('reduce-motion', !settings.motion)
  }, [settings])

  // 最初の操作で音楽を開始（ブラウザの自動再生制限のため）
  useEffect(() => {
    const go = () => settings.music && startMusic()
    window.addEventListener('pointerdown', go, { once: true })
    window.addEventListener('keydown', go, { once: true })
    return () => {
      window.removeEventListener('pointerdown', go)
      window.removeEventListener('keydown', go)
    }
  }, [settings.music])

  const campaign = save.campaign ?? newCampaign()
  const fast = FAST || settings.textSpeed === 'instant'

  // ---------------- 進行 ----------------
  const brief = (i: number, c: Campaign) => {
    const L = levelAt(i, c.carry)
    setScreen({ k: 'talk', beats: L.intro, header: `${L.code} ／ ${L.title}`, next: () => setScreen({ k: 'dive', i, practice: false, attempt: 0 }) })
  }

  const startNew = () => {
    const c = newCampaign()
    setSave((s) => ({ ...s, campaign: c, at: 0 }))
    setScreen({ k: 'talk', beats: PROLOGUE, header: 'EPISODE 01 ／ 午前2時17分の復旧命令', next: () => brief(0, c) })
  }

  const finale = (c: Campaign) => {
    const leaked = totals(c).leak > 0
    setScreen({
      k: 'talk',
      beats: finaleBeats(c),
      header: 'FINAL ／ 03:00',
      choices: ['今夜のことを、すべて話す', leaked ? '流出のことは伏せて「無事に終わった」と伝える' : '「無事に終わった」とだけ伝える'],
      next: (choice) => {
        const done: Campaign = { ...c, honest: choice === 0 }
        const id = computeEnding(done)
        setSave((s) => ({ ...s, campaign: null, at: 0, endings: s.endings.includes(id) ? s.endings : [...s.endings, id], plays: s.plays + 1 }))
        setScreen({ k: 'ending', id, c: done })
      },
    })
  }

  const commit = (i: number, r: DiveResult) => {
    const c: Campaign = structuredClone(campaign)
    c.results[i] = r
    c.carry = r.carry
    c.intel = Array.from(new Set([...c.intel, ...r.intel]))
    setSave((s) => ({ ...s, campaign: c, at: i + 1 }))
    const beats = afterDive(i, r)
    const go = () => (i + 1 < LEVEL_COUNT ? brief(i + 1, c) : finale(c))
    if (beats.length) setScreen({ k: 'talk', beats, next: go })
    else go()
  }

  const recordBest = (L: string, r: DiveResult, codex: string) =>
    setSave((s) => ({
      ...s,
      best: { ...s.best, [L]: Math.max(s.best[L] ?? 0, r.stars) },
      codex: s.codex.includes(codex) ? s.codex : [...s.codex, codex],
    }))

  // ---------------- 描画 ----------------
  if (screen.k === 'title')
    return (
      <Title
        save={save}
        settings={settings}
        setSettings={setSettings}
        onNew={startNew}
        onContinue={save.campaign && save.at < LEVEL_COUNT ? () => brief(save.at, save.campaign!) : null}
        onSelect={() => setScreen({ k: 'select' })}
        onFiles={() => setScreen({ k: 'files' })}
      />
    )
  if (screen.k === 'talk')
    return <Talk key={screen.beats[0]?.t + (screen.header ?? '')} beats={screen.beats} header={screen.header} speed={fast ? 'instant' : settings.textSpeed} choices={screen.choices} onDone={screen.next} />
  if (screen.k === 'files') return <Files save={save} onBack={() => setScreen({ k: 'title' })} />
  if (screen.k === 'select')
    return (
      <Select
        levels={Array.from({ length: LEVEL_COUNT }, (_, i) => levelAt(i, save.campaign?.carry ?? []))}
        save={save}
        onBack={() => setScreen({ k: 'title' })}
        onPick={(i) => setScreen({ k: 'dive', i, practice: true, attempt: 0 })}
      />
    )
  if (screen.k === 'ending') return <Ending c={screen.c} id={screen.id} save={save} onTitle={() => setScreen({ k: 'title' })} />

  // dive
  const carry = screen.practice ? (save.campaign?.carry ?? []) : campaign.carry
  const L = levelAt(screen.i, carry)
  return (
    <>
      <Dive
        key={`${screen.i}-${screen.attempt}`}
        L={L}
        carry={carry}
        fast={fast}
        stars={save.best[L.id] ?? 0}
        onQuit={() => {
          setDebrief(null)
          setScreen({ k: 'title' })
        }}
        onEnd={(r) => {
          recordBest(L.id, r, L.codex)
          setDebrief(r)
        }}
      />
      {debrief && (
        <Debrief
          L={L}
          r={debrief}
          best={save.best[L.id] ?? 0}
          nextLabel={screen.practice ? 'DIVE SELECT' : screen.i + 1 < LEVEL_COUNT ? '物語を進める' : '最後の報告へ'}
          onRetry={() => {
            setDebrief(null)
            setScreen({ ...screen, attempt: screen.attempt + 1 })
          }}
          onNext={() => {
            const r = debrief
            setDebrief(null)
            if (screen.practice) setScreen({ k: 'select' })
            else commit(screen.i, r)
          }}
        />
      )}
    </>
  )
}
