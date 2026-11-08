// ============================================================
// AI が使えるか（画面の共通の部品）と、公開ページで遊ぶ人が自分の鍵を入れる欄
//   ・claude.ai の会話の中では出さない（遊ぶ人自身の Claude が答えるため）
//   ・鍵はこのタブのメモリの中だけ（src/lib/ai.ts）。localStorage などには保存しない
// ============================================================
import { useEffect, useState } from 'react'
import { clearUserKey, getAI, hasUserKey, onClaudeAi, setUserKey, subscribeAI, type SampleFn } from '../lib/ai'
import { S } from './strings'
import { useT } from './i18n'
import { Art } from './Art'
import { sfx } from '../lib/platform'

/** AIが使えるか（null = 使えない、undefined = 調べている）。鍵を入れたり消したりすると、出し直す */
export function useAIState(): SampleFn | null | undefined {
  const [ai, setAi] = useState<SampleFn | null | undefined>(undefined)
  useEffect(() => {
    let alive = true
    // 関数をそのまま setAi に渡すと、React が「更新の関数」として呼んでしまうので包む
    const load = () => void getAI().then((a) => alive && setAi(() => a))
    load()
    const off = subscribeAI(load)
    return () => {
      alive = false
      off()
    }
  }, [])
  return ai
}

/** 公開ページの、鍵を入れる欄。鍵があれば「使っています・消す」だけ出す */
export function AiKeyBox({ ai }: { ai?: SampleFn | null }) {
  const t = useT()
  const [, setTick] = useState(0)
  useEffect(() => subscribeAI(() => setTick((n) => n + 1)), [])
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [bad, setBad] = useState(false)
  if (onClaudeAi()) return null
  if (ai && !hasUserKey()) return null
  if (hasUserKey())
    return (
      <p data-key-on className="flex flex-wrap items-center gap-2 text-sm text-ink2">
        <Art id="icon.ai" scale={1.5} />
        <span className="min-w-0 flex-1">{t(S.keyOn)}</span>
        <button data-key-clear className="btn-quiet min-h-11 border-2 border-hair px-3 text-sm" onClick={() => (sfx.ui(), clearUserKey())}>
          {t(S.keyClear)}
        </button>
      </p>
    )
  if (!open)
    return (
      <p data-key-lead className="flex flex-wrap items-center gap-2 text-sm text-ink2">
        <Art id="icon.ai" scale={1.5} />
        <span className="min-w-0 flex-1">{t(S.keyLead)}</span>
        <button data-key-open className="btn-quiet min-h-11 border-2 border-hair px-3 text-sm" onClick={() => (sfx.ui(), setOpen(true))}>
          {t(S.keyOpen)}
        </button>
      </p>
    )
  const use = () => {
    // 入れた文字は、受け取ったらすぐ欄から消す（画面に残さない）
    if (setUserKey(draft)) {
      sfx.ui()
      setDraft('')
      setBad(false)
      setOpen(false)
    } else setBad(true)
  }
  return (
    <form
      data-key-form
      className="grid gap-2 rounded-lg border-2 border-hair bg-surface2 p-3"
      onSubmit={(e) => {
        e.preventDefault()
        use()
      }}
    >
      <p className="text-sm leading-relaxed">{t(S.keyWarn)}</p>
      <label className="text-sm font-bold text-ink2" htmlFor="ai-key">
        {t(S.keyLabel)}
      </label>
      <input id="ai-key" data-key-input type="password" autoComplete="off" spellCheck={false} autoCapitalize="off" value={draft} onChange={(e) => (setDraft(e.target.value), setBad(false))} className="min-h-12 w-full min-w-0 rounded-lg border-2 border-edge bg-surface px-3 text-base text-ink" />
      {bad && (
        <p className="text-sm text-ng" role="status">
          {t(S.keyBad)}
        </p>
      )}
      <div className="flex gap-2">
        <button type="submit" data-key-use className="btn-main min-h-11 flex-1 text-base" disabled={!draft.trim()}>
          {t(S.keyUse)}
        </button>
        <button type="button" className="btn min-h-11 flex-1 text-base" onClick={() => (setDraft(''), setBad(false), setOpen(false))}>
          {t(S.keyCancel)}
        </button>
      </div>
    </form>
  )
}
