// ============================================================
// Claude が前もって作った答えを、チャットの形で出す（鍵がなくても、だれでも見られる）
//   ・質問のボタンを押すと、「入力中…」のあとに答えが出る。自由に文を打つ欄は出さない
//   ・答えは src/lib/pregen.json（点検を通った物だけ）。モデル名と作った日も出す
// ============================================================
import { useEffect, useRef, useState } from 'react'
import { CLAUDE_AI_URL } from '../lib/ai'
import { PREGEN_DATE, PREGEN_MODEL, type PregenPair } from '../lib/pregen'
import { sfx } from '../lib/platform'
import type { Lang } from '../game/types'

const T = {
  note: {
    ja: (m: string, d: string) => `Claude が前もって作った答えです（${m}・${d} に作成）。まちがうこともあります。`,
    en: (m: string, d: string) => `These answers were written ahead of time by Claude (${m}, made on ${d}). They can be wrong.`,
  },
  free: { ja: '自由に質問したい人は、claude.ai の版で遊べます', en: 'To ask your own questions, play the claude.ai version' },
  typing: { ja: (w: string) => `${w}が入力中…`, en: (w: string) => `${w} is typing…` },
  more: { ja: 'ほかの質問', en: 'Other questions' },
}

/** 押した質問の順番と、いま入力中かどうか */
export function usePregenChat(pairs: PregenPair[]) {
  const [asked, setAsked] = useState<number[]>([])
  const [typing, setTyping] = useState<number | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), [])
  const ask = (i: number) => {
    if (typing !== null || asked.includes(i) || !pairs[i]) return
    sfx.ui()
    setTyping(i)
    // 答えの長さに合わせて、少し待つ（0.7〜1.6秒）
    const wait = Math.min(1600, 700 + pairs[i].answer.length * 6)
    timer.current = setTimeout(() => {
      setAsked((v) => [...v, i])
      setTyping(null)
    }, wait)
  }
  const left = pairs.map((_, i) => i).filter((i) => !asked.includes(i) && i !== typing)
  return { asked, typing, left, ask }
}

export function PregenChat({
  pairs,
  lang,
  who,
  render = (s) => s,
  bubbleUser,
  bubbleAi,
  name,
}: {
  pairs: PregenPair[]
  lang: Lang
  /** 答える人の名前（入力中… に使う） */
  who: string
  /** 答えの文字の出し方（文節の目印など） */
  render?: (s: string) => React.ReactNode
  bubbleUser: string
  bubbleAi: string
  /** 答えの上に名前を出す時 */
  name?: string
}) {
  const c = usePregenChat(pairs)
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (c.asked.length || c.typing !== null) end.current?.scrollIntoView({ block: 'nearest' })
  }, [c.asked.length, c.typing])
  const shown = c.typing === null ? c.asked : [...c.asked, c.typing]
  return (
    <div data-pregen className="grid grid-cols-[minmax(0,1fr)] gap-3">
      <p data-pregen-note className="text-sm text-ink2">
        {T.note[lang](PREGEN_MODEL, PREGEN_DATE)}
      </p>
      <div className="grid gap-2" aria-live="polite">
        {shown.map((i) => (
          <div key={i} className="grid gap-2">
            <div className={`justify-self-end ${bubbleUser}`}>{pairs[i].ask}</div>
            <div className="justify-self-start max-w-[90%]">
              {name && <p className="mb-0.5 text-sm font-bold text-ink2">{name}</p>}
              {c.typing === i ? (
                <div data-pregen-typing className={bubbleAi}>
                  <span className="typing-dots text-ink2" aria-label={T.typing[lang](who)}>
                    <span>●</span>
                    <span>●</span>
                    <span>●</span>
                  </span>
                </div>
              ) : (
                <div data-pregen-answer className={bubbleAi}>
                  {render(pairs[i].answer)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {c.left.length > 0 && (
        <div className="grid gap-2">
          {c.asked.length > 0 && <p className="text-sm font-bold text-ink2">{T.more[lang]}</p>}
          <div className="grid grid-cols-[repeat(auto-fit,minmax(11rem,1fr))] gap-2">
            {c.left.map((i) => (
              <button key={i} data-pregen-ask={i} className="btn min-h-12 px-3 text-base font-normal" disabled={c.typing !== null} onClick={() => c.ask(i)}>
                {pairs[i].ask}
              </button>
            ))}
          </div>
        </div>
      )}
      <a data-pregen-free href={CLAUDE_AI_URL} target="_blank" rel="noopener noreferrer" className="text-sm text-ink2 underline underline-offset-2">
        {T.free[lang]} ↗
      </a>
      <div ref={end} />
    </div>
  )
}
