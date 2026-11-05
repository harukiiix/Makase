import { useEffect, useState } from 'react'
import { FINALE_CHOICES, PROLOGUE, PROLOGUE_CHOICES, afterChoices, afterDive, bestRun, choiceReply, computeEnding, finaleBeats, newCampaign, type Campaign, type EndingId } from './game/campaign'
import type { DiveResult } from './game/engine'
import { LEVEL_COUNT, levelAt } from './game/levels'
import type { Beat, L10n } from './game/types'
import { FAST, loadSave, loadSettings, setAudio, startMusic, writeSave, writeSettings, type SaveData, type Settings } from './lib/platform'
import { Dive } from './ui/Dive'
import { setMotion } from './ui/fx'
import { Debrief, Ending, Files, Select, Title } from './ui/Screens'
import { Talk } from './ui/Talk'
import { Howto } from './ui/Howto'
import { LangContext, tr } from './ui/i18n'
import { S } from './ui/strings'

type Screen =
  | { k: 'title' }
  | { k: 'talk'; beats: Beat[]; header?: L10n; next: (choice?: number) => void; choices?: L10n[] }
  /** keep：やり直す前の、この幕でいちばんよかった回（物語はこれで進む） */
  | { k: 'dive'; i: number; practice: boolean; attempt: number; blind?: boolean; keep?: DiveResult }
  | { k: 'files' }
  | { k: 'howto'; next: () => void; label?: L10n }
  | { k: 'select' }
  | { k: 'ending'; id: EndingId; c: Campaign }

export default function App() {
  const [save, setSaveState] = useState<SaveData>(() => loadSave())
  const [settings, setSettingsState] = useState<Settings>(() => {
    const s = loadSettings()
    return FAST ? { ...s, textSpeed: 'instant' } : s
  })
  // 確認用：?dive=2 で第2幕から（練習あつかい）
  const [screen, setScreen] = useState<Screen>(() => {
    const d = Number(new URLSearchParams(location.search).get('dive'))
    return Number.isInteger(d) && d >= 0 && d < LEVEL_COUNT && new URLSearchParams(location.search).has('dive') ? { k: 'dive', i: d, practice: true, attempt: 0 } : { k: 'title' }
  })
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
    document.documentElement.lang = settings.lang
  }, [settings.lang])

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
    setScreen({ k: 'talk', beats: L.intro, header: { ja: S.actHead(L.code.ja, L.title.ja).ja, en: S.actHead(L.code.en, L.title.en).en }, next: () => {
        setDebrief(null)
        setScreen({ k: 'dive', i, practice: false, attempt: 0 })
      } })
  }

  const startNew = () => {
    const c = newCampaign()
    setSave((s) => ({ ...s, campaign: c, at: 0 }))
    setScreen({ k: 'talk', beats: PROLOGUE, header: S.episode, choices: PROLOGUE_CHOICES, next: () => setScreen({ k: 'howto', next: () => brief(0, c) }) })
  }

  const finale = (c: Campaign) => {
    setScreen({
      k: 'talk',
      beats: finaleBeats(c),
      header: S.finaleHead,
      choices: FINALE_CHOICES,
      next: (choice) => {
        const done: Campaign = { ...c, honest: choice === 1 }
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
    // 選んだことには、相手がひとこと返す
    const reply = (choice?: number) => {
      const rb = choiceReply(i, choice)
      if (rb.length) setScreen({ k: 'talk', beats: rb, next: go })
      else go()
    }
    if (beats.length) setScreen({ k: 'talk', beats, choices: afterChoices(i), next: reply })
    else go()
  }

  const recordBest = (L: string, r: DiveResult, codex: string) =>
    setSave((s) => ({
      ...s,
      best: { ...s.best, [L]: Math.max(s.best[L] ?? 0, r.stars) },
      codex: s.codex.includes(codex) ? s.codex : [...s.codex, codex],
    }))

  // ---------------- 描画 ----------------
  const view = (): React.ReactNode => {
    if (screen.k === 'title')
      return (
        <Title
          save={save}
          settings={settings}
          setSettings={setSettings}
          onNew={startNew}
          onContinue={save.campaign ? () => (save.at < LEVEL_COUNT ? brief(save.at, save.campaign!) : finale(save.campaign!)) : null}
          onSelect={() => setScreen({ k: 'select' })}
          onFiles={() => setScreen({ k: 'files' })}
          onHowto={() => setScreen({ k: 'howto', label: S.gotIt, next: () => setScreen({ k: 'title' }) })}
        />
      )
    if (screen.k === 'talk')
      return <Talk key={JSON.stringify(screen.beats[0]?.t) + JSON.stringify(screen.header ?? '')} beats={screen.beats} header={tr(screen.header, settings.lang)} speed={fast ? 'instant' : settings.textSpeed} choices={screen.choices} onDone={screen.next} />
    if (screen.k === 'howto') return <Howto onDone={screen.next} doneLabel={screen.label} />
    if (screen.k === 'files') return <Files save={save} onBack={() => setScreen({ k: 'title' })} />
    if (screen.k === 'select')
      return (
        <Select
          levels={Array.from({ length: LEVEL_COUNT }, (_, i) => levelAt(i, save.campaign?.carry ?? []))}
          save={save}
          onBack={() => setScreen({ k: 'title' })}
          onPick={(i, blind) => {
            setDebrief(null)
            setScreen({ k: 'dive', i, practice: true, attempt: 0, blind })
          }}
        />
      )
    if (screen.k === 'ending') return <Ending c={screen.c} id={screen.id} save={save} onTitle={() => setScreen({ k: 'title' })} />

    // dive
    const carry = screen.practice ? (save.campaign?.carry ?? []) : campaign.carry
    const L = levelAt(screen.i, carry)
    const bestKey = screen.blind ? `${L.id}:blind` : L.id
    return (
      <>
        <Dive
          key={`${screen.i}-${screen.attempt}`}
          L={L}
          carry={carry}
          fast={fast}
          stars={save.best[bestKey] ?? 0}
          blind={!!screen.blind}
          locked={!!debrief}
          onQuit={() => {
            setDebrief(null)
            setScreen({ k: 'title' })
          }}
          onEnd={(r) => {
            recordBest(bestKey, r, L.codex)
            // 見つけた手がかりは、やり直しても、やめても消えない
            if (!screen.practice && r.intel.length)
              setSave((s) => (s.campaign ? { ...s, campaign: { ...s.campaign, intel: Array.from(new Set([...s.campaign.intel, ...r.intel])) } } : s))
            setDebrief(r)
          }}
        />
        {debrief && (
          <Debrief
            L={L}
            r={debrief}
            best={save.best[bestKey] ?? 0}
            kept={!screen.practice && screen.keep && screen.keep.stars > debrief.stars ? screen.keep.stars : undefined}
            nextLabel={screen.practice ? S.toSelect : screen.i + 1 < LEVEL_COUNT ? S.nextAct : S.toFinale}
            onRetry={() => {
              setDebrief(null)
              setScreen({ ...screen, attempt: screen.attempt + 1, keep: bestRun(screen.keep, debrief) })
            }}
            onNext={() => {
              const r = debrief
              setDebrief(null)
              if (screen.practice) setScreen({ k: 'select' })
              else commit(screen.i, bestRun(screen.keep, r))
            }}
          />
        )}
      </>
    )
  }

  return <LangContext.Provider value={settings.lang}>{view()}</LangContext.Provider>
}
