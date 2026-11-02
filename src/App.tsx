import { useEffect, useReducer, useRef, useState } from 'react'
import { initialState, reduce, toPrevRun } from './game/engine'
import type { EndingId } from './game/types'
import { FAST, clearSave, loadSave, setMuted, writeSave, type SaveData } from './lib/platform'
import { Desktop } from './ui/Desktop'
import { EndingScreen } from './ui/Ending'
import { Intro, Title } from './ui/Title'

export default function App() {
  const [save, setSave] = useState<SaveData>(() => loadSave())
  const [state, dispatch] = useReducer(reduce, undefined, () => initialState(save.prevRun))
  const [fast, setFast] = useState(FAST)
  const [mute, setMute] = useState(false)
  const savedFor = useRef<object | null>(null)

  useEffect(() => setMuted(mute), [mute])

  // エンディング到達時に「前回の自分」と図鑑を保存
  useEffect(() => {
    if (state.scene !== 'ending' || !state.ending || savedFor.current === state.audit) return
    savedFor.current = state.audit
    setSave((prev) => {
      const endingsSeen = Array.from(new Set<EndingId>([...prev.endingsSeen, state.ending!]))
      const next: SaveData = { endingsSeen, prevRun: toPrevRun(state), plays: prev.plays + 1 }
      writeSave(next)
      return next
    })
  }, [state])

  const start = () => dispatch({ type: 'START', prevRun: save.prevRun })
  const settings = { fast, setFast, mute, setMute }

  if (state.scene === 'title')
    return (
      <Title
        save={save}
        onStart={start}
        onClear={() => {
          clearSave()
          setSave(loadSave())
        }}
        settings={settings}
      />
    )
  if (state.scene === 'intro') return <Intro fast={fast} onDone={() => dispatch({ type: 'ADVANCE' })} />
  if (state.scene === 'ending')
    return <EndingScreen state={state} save={save} onRetry={start} onTitle={() => dispatch({ type: 'RESET' })} />
  return <Desktop state={state} dispatch={dispatch} settings={settings} />
}

export type Settings = {
  fast: boolean
  setFast: (v: boolean) => void
  mute: boolean
  setMute: (v: boolean) => void
}
