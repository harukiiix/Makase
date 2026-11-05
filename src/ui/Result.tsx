// 1日の見回りの結果：見落としの数、見つけた物、見落とした時に起きること、今日の合言葉、実際にあった話
import { useEffect, useMemo, useState } from 'react'
import type { DayResult } from '../game/round'
import { spotOf } from '../game/round'
import type { Day } from '../game/types'
import { sfx } from '../lib/platform'
import { boxesOf, cropURL, PicArt } from './Art'
import { useT } from './i18n'
import { S } from './strings'

export const host = (u: string) => {
  try {
    return new URL(u).hostname.replace(/^www\./, '')
  } catch {
    return u
  }
}

export function DayResultView({ day, r, kept, nextLabel, onNext, onAgain }: { day: Day; r: DayResult; kept: boolean; nextLabel: string; onNext: () => void; onAgain: () => void }) {
  const t = useT()
  const boxes = useMemo(() => boxesOf(day), [day])
  const [more, setMore] = useState(false)
  const missed = r.missed.length
  useEffect(() => {
    const tm = window.setTimeout(() => (missed ? sfx.miss() : sfx.win()), 250)
    return () => clearTimeout(tm)
  }, [missed])
  const risks = day.spots.filter((s) => s.kind === 'risk')
  const bonus = day.spots.find((s) => s.kind === 'bonus')

  return (
    <div className="min-h-full px-3 pb-28 pt-4 sm:px-6">
      <div className="mx-auto grid max-w-2xl gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="stripes h-3 w-8" aria-hidden />
              <span className="font-pixel text-base text-safety">{t(S.dayDone(t(day.dayName)))}</span>
            </div>
            <h1 className={`mt-2 text-4xl sm:text-5xl ${missed ? 'text-[#ff8a7a]' : 'text-[#7ee0a1]'}`}>{t(missed ? S.missedN(missed) : S.noMiss)}</h1>
          </div>
          <button data-again className="btn-dark shrink-0 text-base" onClick={() => (sfx.ui(), onAgain())}>
            ↺ {t(S.again)}
          </button>
        </div>

        {/* 今日の物：見つけた・もう一つの対応・見落とし */}
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {risks.map((sp) => {
            const st = r.right.includes(sp.id) ? 'right' : r.other.includes(sp.id) ? 'other' : 'missed'
            const b = boxes[sp.id]
            return (
              <li key={sp.id} className="paper flex flex-col items-center gap-1 p-2 text-center">
                <div className="flex h-16 items-center justify-center">{b && <img src={cropURL(day.scene, b)} alt="" aria-hidden className="pixelated max-h-16 max-w-full" style={{ width: (b[2] + 6) * 2, height: 'auto' }} draggable={false} />}</div>
                <div className="text-sm leading-snug">{t(sp.name)}</div>
                <div className={`font-pixel text-sm ${st === 'right' ? 'text-right' : st === 'other' ? 'text-other' : 'text-risk'}`}>{st === 'right' ? `✓ ${t(S.rightMark)}` : st === 'other' ? `✓ ${t(S.otherMark)}` : `✕ ${t(S.missedMark)}`}</div>
              </li>
            )
          })}
        </ul>

        {/* もう一つの対応を選んだ物：正しいやり方 */}
        {r.other.length > 0 && (
          <div className="paper grid gap-2 p-3">
            <div className="font-pixel text-base text-other">{t(S.betterWay)}</div>
            {r.other.map((id) => {
              const sp = spotOf(day, id)
              const ok = sp?.choices?.find((c) => c.ok)
              return (
                <p key={id} className="text-base leading-relaxed">
                  <b>{t(sp?.name)}</b>
                  <br />
                  {t(ok?.reply)}
                </p>
              )
            })}
          </div>
        )}

        {/* 見落とした物：もし、だれも気づかなかったら */}
        {r.missed.map((id) => {
          const sp = spotOf(day, id)
          if (!sp) return null
          return (
            <div key={id} className="paper p-3">
              <div className="font-pixel text-base text-risk">
                {t(S.ifMissed)}　<span className="text-ink">{t(sp.name)}</span>
              </div>
              <ol className="mt-2 grid gap-2 sm:grid-cols-3">
                {(sp.after ?? []).map((pn, i) => (
                  <li key={i} className="flex items-center gap-3 bg-paper2 p-2 sm:flex-col sm:text-center">
                    <div className="flex shrink-0 items-center justify-center gap-1">
                      <span className="font-pixel text-lg text-ink2">{i + 1}</span>
                      {pn.pic.map((p, k) => (
                        <PicArt key={k} id={p} day={day} boxes={boxes} scale={2} />
                      ))}
                    </div>
                    <p className="text-base leading-snug">{t(pn.t)}</p>
                  </li>
                ))}
              </ol>
            </div>
          )
        })}

        {bonus && r.bonus && (
          <div className="paper flex items-start gap-3 p-3" style={{ boxShadow: '0 0 0 2px var(--color-bonus), 0 5px 0 rgba(0,0,0,.35)' }}>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bonus font-pixel text-white">?</span>
            <div>
              <div className="font-pixel text-base text-bonus">{t(S.bonusFound)}</div>
              <p className="text-base leading-relaxed">{t(bonus.look)}</p>
            </div>
          </div>
        )}

        {/* 今日の合言葉 */}
        <div className="bg-safety p-4 text-center text-ink" style={{ boxShadow: '0 0 0 2px #1d1f24, 0 5px 0 rgba(0,0,0,.35)' }}>
          <div className="font-pixel text-base">{t(S.motto)}</div>
          <div className="mt-1 font-pixel text-2xl leading-snug sm:text-3xl">{t(S.quote(t(day.motto)))}</div>
        </div>

        {/* 実際にあった話 */}
        {day.real.url && (
          <div className="paper p-3 sm:p-4">
            <div className="font-pixel text-base text-hint">{t(S.real)}</div>
            <div className="mt-1 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-lg font-bold leading-snug">{t(day.real.head)}</div>
                <div className="text-sm text-ink2">{t(S.list2(t(day.real.who), t(day.real.when)))}</div>
              </div>
              <button className="inline-flex min-h-10 shrink-0 items-center text-sm text-hint underline" onClick={() => setMore((v) => !v)} aria-expanded={more}>
                {more ? '▲' : '▼'} {t(more ? S.less : S.more)}
              </button>
            </div>
            {more && (
              <div className="rise mt-2 grid gap-1.5">
                <p className="text-base leading-relaxed">{t(day.real.body)}</p>
                <a className="block break-words text-sm text-hint underline" href={day.real.url} target="_blank" rel="noreferrer">
                  {t(S.kv(t(S.source), day.real.source))} ({host(day.real.url)})
                </a>
              </div>
            )}
          </div>
        )}
        {r.hints > 0 && <p className="text-center text-sm text-onDark2">{t(S.hintsUsed(r.hints))}</p>}
      </div>

      {/* 下に「次へ」だけ。もう一回は上 */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t-2 border-[#15171b] bg-asphalt2/95 p-3 backdrop-blur-sm">
        <div className="mx-auto max-w-2xl">
          {kept && <p className="mb-1.5 text-center text-sm text-onDark2">{t(S.keptBest)}</p>}
          <button data-next className="btn-main w-full text-lg" onClick={() => (sfx.ui(), onNext())}>
            {nextLabel} ▶
          </button>
        </div>
      </div>
    </div>
  )
}
