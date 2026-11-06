import { useEffect, useRef, useState } from 'react'
import { LESSONS, lessonOf, questionOf } from './game/course'
import { applySession, countAsk, dayNumber, dueIds, interleave, lessonOpen, newProgress, shuffle, weakTopic, type Gains, type Progress, type Session, type SessionKind } from './game/learn'
import { ENDING, PROLOGUE } from './game/story'
import type { L10n, Lang, Line, Question, TopicId } from './game/types'
import { errorKind, getAI, practicePrompt, toQuestions } from './lib/ai'
import { FAST, loadProgress, loadSettings, setAudio, startMusic, writeProgress, writeSettings, type Settings } from './lib/platform'
import { Done } from './ui/Done'
import { Home } from './ui/Home'
import { LangContext, tr } from './ui/i18n'
import { Quiz } from './ui/Quiz'
import { Art } from './ui/Art'
import { Building } from './ui/Building'
import { HowtoSheet, Notebook, Science, SettingsSheet } from './ui/Screens'
import { S } from './ui/strings'
import { Talk } from './ui/Talk'

type Screen =
  | { k: 'home'; note?: L10n }
  | { k: 'talk'; beats: Line[]; header?: L10n; art?: string; floors?: number; next: () => void }
  | { k: 'quiz'; kind: SessionKind; lesson?: TopicId; title: L10n; questions: Question[]; aiMade?: boolean; nonce: number }
  | { k: 'done'; s: Session; gains: Gains; questions: Question[] }
  | { k: 'making' }
  | { k: 'notebook' }
  | { k: 'science' }

export default function App() {
  const [progress, setProgressState] = useState<Progress>(() => loadProgress())
  const [settings, setSettingsState] = useState<Settings>(() => {
    const s = loadSettings()
    return FAST ? { ...s, textSpeed: 'instant' } : s
  })
  const [screen, setScreen] = useState<Screen>({ k: 'home' })
  const [sheet, setSheet] = useState<'settings' | 'howto' | null>(null)
  const nonce = useRef(0)
  const lang = settings.lang
  const setLang = (l: Lang) => setSettings({ ...settings, lang: l })

  const setProgress = (f: (p: Progress) => Progress) =>
    setProgressState((prev) => {
      const n = f(prev)
      writeProgress(n)
      return n
    })
  const setSettings = (s: Settings) => {
    setSettingsState(s)
    writeSettings(s)
  }

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])
  useEffect(() => {
    setAudio(settings.sound, settings.music)
  }, [settings])
  useEffect(() => {
    const go = () => settings.music && startMusic()
    window.addEventListener('pointerdown', go, { once: true })
    window.addEventListener('keydown', go, { once: true })
    return () => {
      window.removeEventListener('pointerdown', go)
      window.removeEventListener('keydown', go)
    }
  }, [settings.music])
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [screen.k])

  const speed = FAST || settings.textSpeed === 'instant' ? 'instant' : settings.textSpeed
  const topicOf = (id: string) => questionOf(id)?.topic

  // ---------------- 進行 ----------------
  const quiz = (kind: SessionKind, title: L10n, questions: Question[], lesson?: TopicId, aiMade?: boolean) => setScreen({ k: 'quiz', kind, title, questions, lesson, aiMade, nonce: ++nonce.current })

  const startLesson = (id: TopicId) => {
    const l = lessonOf(id)
    // 2回目からは並びを変える（答えの場所を覚えてしまわないように）
    const qs = progress.lessons[id]?.done ? shuffle(l.questions, dayNumber() + progress.answered) : l.questions
    const title = { ja: S.dayPlace(l.dayName.ja, l.place.ja).ja, en: S.dayPlace(l.dayName.en, l.place.en).en }
    const go = () => quiz('lesson', title, qs, id)
    const intro = () => (l.intro.length ? setScreen({ k: 'talk', beats: l.intro, header: title, art: l.icon, next: go }) : go())
    if (!progress.started && PROLOGUE.length) {
      setScreen({
        k: 'talk',
        beats: PROLOGUE,
        header: S.title,
        floors: 0,
        next: () => {
          setProgress((p) => ({ ...p, started: true }))
          setSheet('howto')
          intro()
        },
      })
    } else intro()
  }

  const startReview = () => {
    const ids = dueIds(progress.cards, dayNumber(), topicOf, 10)
    const qs = ids.map((id) => questionOf(id)).filter((q): q is Question => !!q)
    if (qs.length) quiz('review', { ja: '今日の復習', en: "Today's review" }, qs)
  }

  const startFinal = () => {
    const seed = dayNumber() * 7 + progress.answered
    const picked = LESSONS.flatMap((l) => shuffle(l.questions, seed + l.id.length).slice(0, 2))
    const ids = interleave(shuffle(picked, seed).map((q) => q.id), topicOf)
    quiz('final', S.finalTest, ids.map((id) => questionOf(id)!).filter(Boolean))
  }

  const startPractice = async () => {
    setScreen({ k: 'making' })
    const ai = await getAI()
    if (!ai) return setScreen({ k: 'home', note: S.aiOff })
    const done = LESSONS.filter((l) => progress.lessons[l.id]?.done)
    const topic = weakTopic(progress, topicOf, (done[0] ?? LESSONS[0]).id)
    const l = lessonOf(topic)
    try {
      const raw = await ai.json(practicePrompt({ id: l.id, title: l.title, motto: l.motto }, l.questions), { modelTier: 'default', cache: false })
      const qs = toQuestions(raw, l.id, Date.now())
      if (!qs.length) return setScreen({ k: 'home', note: S.aiFailed })
      quiz('ai', { ja: `AIの練習：${l.title.ja}`, en: `AI practice: ${l.title.en}` }, qs, undefined, true)
    } catch (e) {
      const k = errorKind(e)
      setScreen({ k: 'home', note: k === 'off' ? S.aiNotAllowed : k === 'busy' ? S.aiBusy : S.aiFailed })
    }
  }

  const finishQuiz = (s: Session, questions: Question[]) => {
    const { p, gains } = applySession(progress, s, dayNumber(), LESSONS.length)
    writeProgress(p)
    setProgressState(p)
    setScreen({ k: 'done', s, gains, questions })
  }

  const firstPass = (gains: Gains) => gains.passed && !progress.endingSeen

  // ---------------- 描画 ----------------
  const view = (): React.ReactNode => {
    switch (screen.k) {
      case 'home':
        return (
          <>
            {screen.note && (
              <div className="mx-auto mt-3 max-w-xl px-4">
                <p className="rounded-lg border-2 border-line bg-surface px-3 py-2 text-center text-base" role="status">
                  {tr(screen.note, lang)}
                </p>
              </div>
            )}
            <Home
              progress={progress}
              lang={lang}
              setLang={setLang}
              onLesson={startLesson}
              onReview={startReview}
              onFinal={startFinal}
              onPractice={() => void startPractice()}
              onNotebook={() => setScreen({ k: 'notebook' })}
              onScience={() => setScreen({ k: 'science' })}
              onSettings={() => setSheet('settings')}
              onHowto={() => setSheet('howto')}
            />
          </>
        )
      case 'talk':
        return (
          <Talk
            key={JSON.stringify(screen.beats[0]?.t)}
            beats={screen.beats}
            header={tr(screen.header, lang)}
            speed={speed}
            onDone={screen.next}
            // 話す人の顔がない行（語り）で、まん中に出す絵：レッスンの場所か、建物
            art={screen.floors !== undefined ? <Building floors={Math.min(screen.floors, LESSONS.length)} all={LESSONS.length} done={screen.floors > LESSONS.length} scale={3} /> : screen.art ? <Art id={screen.art} scale={4} /> : undefined}
          />
        )
      case 'quiz': {
        const sc = screen
        return <Quiz key={sc.nonce} kind={sc.kind} lesson={sc.lesson} title={tr(sc.title, lang)} questions={sc.questions} aiMade={sc.aiMade} lang={lang} setLang={setLang} onAsked={() => setProgress(countAsk)} onQuit={() => setScreen({ k: 'home' })} onDone={(s) => finishQuiz(s, sc.questions)} />
      }
      case 'done': {
        const sc = screen
        const i = sc.s.lesson ? LESSONS.findIndex((l) => l.id === sc.s.lesson) : -1
        const nextL = i >= 0 ? LESSONS[i + 1] : undefined
        const canNext = !!nextL && lessonOpen(progress, LESSONS.map((l) => l.id), nextL.id)
        return (
          <Done
            s={sc.s}
            gains={sc.gains}
            progress={progress}
            extra={sc.s.kind === 'ai' ? sc.questions : undefined}
            onHome={() => setScreen({ k: 'home' })}
            onNext={canNext ? () => startLesson(nextL!.id) : undefined}
            nextLabel={canNext ? tr(S.nextUp(tr(nextL!.dayName, lang)), lang) : undefined}
            onEnding={
              firstPass(sc.gains) && ENDING.length
                ? () => {
                    setProgress((p) => ({ ...p, endingSeen: true }))
                    setScreen({ k: 'talk', beats: ENDING, header: S.buildingDone, floors: LESSONS.length + 1, next: () => setScreen({ k: 'home' }) })
                  }
                : undefined
            }
          />
        )
      }
      case 'making':
        return (
          <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="overflow-hidden rounded-2xl border-2 border-line bg-surface2">
              <Art id="face.boss" scale={4} />
            </div>
            <p className="max-w-sm text-lg">
              {tr(S.aiMaking, lang)}
              <span className="blink" aria-hidden>
                …
              </span>
            </p>
            <button className="btn text-base" onClick={() => setScreen({ k: 'home' })}>
              {tr(S.cancel, lang)}
            </button>
          </div>
        )
      case 'notebook':
        return <Notebook progress={progress} lang={lang} setLang={setLang} onBack={() => setScreen({ k: 'home' })} />
      case 'science':
        return <Science lang={lang} setLang={setLang} onBack={() => setScreen({ k: 'home' })} />
    }
  }

  return (
    <LangContext.Provider value={lang}>
      {view()}
      {sheet === 'settings' && (
        <SettingsSheet
          s={settings}
          set={setSettings}
          onClose={() => setSheet(null)}
          onReset={() => {
            setProgress(() => newProgress())
            setSheet(null)
            setScreen({ k: 'home' })
          }}
        />
      )}
      {sheet === 'howto' && <HowtoSheet onClose={() => setSheet(null)} />}
    </LangContext.Provider>
  )
}
