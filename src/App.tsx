import { useEffect, useState } from 'react'
import { better, type DayResult } from './game/round'
import { endingOf, PROLOGUE, type EndingId, type WeekResults } from './game/story'
import type { L10n, Line } from './game/types'
import { DAYS } from './game/week'
import { FAST, loadSave, loadSettings, setAudio, startMusic, writeSave, writeSettings, type SaveData, type Settings } from './lib/platform'
import { LangContext, tr } from './ui/i18n'
import { DayResultView } from './ui/Result'
import { Round } from './ui/Round'
import { EndingView, HowtoOverlay, Notebook, PickDay, Title } from './ui/Screens'
import { S } from './ui/strings'
import { Talk } from './ui/Talk'

type Screen =
  | { k: 'title' }
  | { k: 'talk'; beats: Line[]; header?: L10n; bg?: string; next: (choice?: number) => void; choices?: L10n[] }
  /** keep：やり直す前の、この日でいちばんよかった回 */
  | { k: 'round'; i: number; practice: boolean; attempt: number; keep?: DayResult }
  | { k: 'result'; i: number; practice: boolean; attempt: number; r: DayResult; keep?: DayResult }
  | { k: 'pick' }
  | { k: 'notebook' }
  | { k: 'ending'; id: EndingId; week: WeekResults }

export default function App() {
  const [save, setSaveState] = useState<SaveData>(() => loadSave())
  const [settings, setSettingsState] = useState<Settings>(() => {
    const s = loadSettings()
    return FAST ? { ...s, textSpeed: 'instant' } : s
  })
  // 確認用：?day=2 で水曜日の見回りから（練習あつかい）
  const [screen, setScreen] = useState<Screen>(() => {
    const q = new URLSearchParams(location.search)
    const d = Number(q.get('day'))
    return q.has('day') && Number.isInteger(d) && d >= 0 && d < DAYS.length ? { k: 'round', i: d, practice: true, attempt: 0 } : { k: 'title' }
  })
  const [howto, setHowto] = useState(false)

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
  // 画面が変わったら、いちばん上から見せる
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [screen.k])

  const speed = FAST || settings.textSpeed === 'instant' ? 'instant' : settings.textSpeed

  // ---------------- 進行 ----------------
  const intro = (i: number) => {
    const d = DAYS[i]
    const go = () => setScreen({ k: 'round', i, practice: false, attempt: 0 })
    if (!d.intro.length) return go()
    setScreen({ k: 'talk', beats: d.intro, header: { ja: S.dayPlace(d.dayName.ja, d.place.ja).ja, en: S.dayPlace(d.dayName.en, d.place.en).en }, bg: d.scene, next: go })
  }

  const startNew = () => {
    setSave((s) => ({ ...s, week: {}, at: 0 }))
    if (PROLOGUE.length) setScreen({ k: 'talk', beats: PROLOGUE, header: S.title, bg: 'gate', next: () => intro(0) })
    else intro(0)
  }

  const resume = () => {
    if (save.at < DAYS.length) intro(save.at)
    else finish(save.week ?? {})
  }

  const finish = (week: WeekResults) => {
    const id = endingOf(week)
    setSave((s) => ({ ...s, week: null, at: 0, endings: s.endings.includes(id) ? s.endings : [...s.endings, id], plays: s.plays + 1 }))
    setScreen({ k: 'ending', id, week })
  }

  /** 1日の結果を記録して、次の日へ */
  const commit = (i: number, r: DayResult) => {
    const week: WeekResults = { ...(save.week ?? {}), [DAYS[i].id]: r }
    setSave((s) => ({ ...s, week, at: i + 1 }))
    if (i + 1 < DAYS.length) intro(i + 1)
    else finish(week)
  }

  const recordBest = (r: DayResult) => setSave((s) => ({ ...s, best: { ...s.best, [r.day]: better(s.best[r.day], r) } }))

  // ---------------- 描画 ----------------
  const view = (): React.ReactNode => {
    switch (screen.k) {
      case 'title':
        return (
          <Title
            save={save}
            settings={settings}
            setSettings={setSettings}
            onNew={startNew}
            onContinue={save.week ? resume : null}
            onPick={() => setScreen({ k: 'pick' })}
            onNotebook={() => setScreen({ k: 'notebook' })}
            onHowto={() => setHowto(true)}
          />
        )
      case 'talk':
        return <Talk key={JSON.stringify(screen.beats[0]?.t) + JSON.stringify(screen.header ?? '')} beats={screen.beats} header={tr(screen.header, settings.lang)} bg={screen.bg} speed={speed} choices={screen.choices} onDone={screen.next} />
      case 'round': {
        const d = DAYS[screen.i]
        const sc = screen
        return (
          <Round
            key={`${sc.i}-${sc.attempt}`}
            day={d}
            tutorial={sc.i === 0 && !save.best[d.id]}
            onHowto={() => setHowto(true)}
            onQuit={() => setScreen({ k: 'title' })}
            onEnd={(r) => {
              recordBest(r)
              setScreen({ k: 'result', i: sc.i, practice: sc.practice, attempt: sc.attempt, r, keep: sc.keep })
            }}
          />
        )
      }
      case 'result': {
        const d = DAYS[screen.i]
        const sc = screen
        const kept = !sc.practice && !!sc.keep && better(sc.keep, sc.r) === sc.keep
        const label = sc.practice ? S.toSelect : sc.i + 1 < DAYS.length ? S.nextDay : S.toEnding
        return (
          <DayResultView
            day={d}
            r={sc.r}
            kept={kept}
            nextLabel={tr(label, settings.lang)}
            onAgain={() => setScreen({ k: 'round', i: sc.i, practice: sc.practice, attempt: sc.attempt + 1, keep: better(sc.keep, sc.r) })}
            onNext={() => (sc.practice ? setScreen({ k: 'pick' }) : commit(sc.i, better(sc.keep, sc.r)))}
          />
        )
      }
      case 'pick':
        return <PickDay save={save} onBack={() => setScreen({ k: 'title' })} onPick={(i) => setScreen({ k: 'round', i, practice: true, attempt: 0 })} />
      case 'notebook':
        return <Notebook save={save} onBack={() => setScreen({ k: 'title' })} />
      case 'ending':
        return <EndingView id={screen.id} week={screen.week} save={save} onTitle={() => setScreen({ k: 'title' })} />
    }
  }

  return (
    <LangContext.Provider value={settings.lang}>
      {view()}
      {howto && <HowtoOverlay onClose={() => setHowto(false)} />}
    </LangContext.Provider>
  )
}
