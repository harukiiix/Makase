// 1回分が終わった時：もらったポイント、1回で正解した数、階級、建物、バッジ、合言葉
import { useEffect, useState } from 'react'
import { LESSONS, lessonOf, questionOf } from '../game/course'
import { rankOf, type Gains, type Progress, type Session } from '../game/learn'
import type { Question } from '../game/types'
import { sfx } from '../lib/platform'
import { Art } from './Art'
import { Building } from './Building'
import { RANK_TINT } from './Home'
import { useT } from './i18n'
import { BADGE_TEXT, RANK_NAME, S } from './strings'

export function Done({ s, gains, progress, extra, onHome, onNext, nextLabel, onEnding }: { s: Session; gains: Gains; progress: Progress; extra?: Question[]; onHome: () => void; onNext?: () => void; nextLabel?: string; onEnding?: () => void }) {
  const t = useT()
  const [shown, setShown] = useState(0)
  // ポイントを数え上げる
  useEffect(() => {
    if (shown >= gains.xp) return
    const tm = window.setTimeout(() => setShown((v) => Math.min(gains.xp, v + Math.max(1, Math.ceil(gains.xp / 20)))), 30)
    return () => clearTimeout(tm)
  }, [shown, gains.xp])
  useEffect(() => {
    const tm = window.setTimeout(() => (gains.rankUp || gains.passed ? sfx.win() : sfx.complete()), 200)
    return () => clearTimeout(tm)
  }, [gains.rankUp, gains.passed])

  const ids = Object.keys(s.firstTry)
  const right = ids.filter((id) => s.firstTry[id]).length
  const missed = ids.filter((id) => !s.firstTry[id])
  const qOf = (id: string) => questionOf(id) ?? extra?.find((q) => q.id === id)
  const title = s.kind === 'lesson' ? S.lessonDone : s.kind === 'review' ? S.reviewDone : s.kind === 'ai' ? S.aiDone : gains.passed ? S.finalPass : S.finalFail
  const r = rankOf(progress.xp)
  const lesson = s.lesson ? lessonOf(s.lesson) : undefined
  const floors = LESSONS.filter((l) => progress.lessons[l.id]?.done).length
  const bonusRows: [keyof Gains['bonus'], typeof S.bonusLesson][] = [
    ['lesson', S.bonusLesson],
    ['perfect', S.bonusPerfect],
    ['review', S.bonusReview],
    ['final', S.bonusFinal],
  ]

  return (
    <div className="min-h-dvh px-4 pb-28 pt-6">
      <div className="mx-auto grid max-w-xl gap-4">
        <div className="text-center">
          <h1 className={`text-4xl sm:text-5xl ${s.kind === 'final' && !gains.passed ? 'text-other' : 'text-safety'}`}>{t(title)}</h1>
          {s.kind === 'final' && !gains.passed && <p className="mt-2 text-base text-onDark2">{t(S.finalFailWhy)}</p>}
        </div>

        <div className="paper grid gap-2 rounded-2xl p-4 text-center">
          <div className="text-sm text-ink2">{t(S.gained)}</div>
          <div className="flex items-center justify-center gap-2 font-pixel text-5xl text-[#8a6a00]">
            <Art id="icon.star" scale={3} />+{shown}
          </div>
          <div className="text-lg font-bold">{t(S.firstRight(right, ids.length))}</div>
          <ul className="flex flex-wrap justify-center gap-2 text-sm text-ink2">
            {bonusRows.map(([k, label]) => (gains.bonus[k] ? <li key={k} className="rounded-full bg-paper2 px-2 py-0.5">{t(label)} +{gains.bonus[k]}</li> : null))}
          </ul>
        </div>

        <div className="paper flex items-center gap-3 rounded-2xl p-3">
          <Art id="icon.helmet" scale={3} tint={RANK_TINT[r.rank.id]} />
          <div className="min-w-0 flex-1">
            {gains.rankUp ? <div className="pop text-xl font-bold text-right">{t(S.rankUp(t(RANK_NAME[gains.rankUp.id])))}</div> : <div className="text-xl font-bold">{t(RANK_NAME[r.rank.id])}</div>}
            <div className="mt-1 h-3 overflow-hidden rounded-full bg-paper2" style={{ boxShadow: 'inset 0 0 0 1px #c9bb95' }}>
              <div className="h-full rounded-full bg-safety" style={{ width: `${Math.round(r.share * 100)}%` }} />
            </div>
            <div className="mt-1 text-sm text-ink2">{r.next ? t(S.toNext(r.toNext, t(RANK_NAME[r.next.id]))) : t(S.topRank)}</div>
          </div>
        </div>

        {gains.newFloor && (
          <div className="paper grid justify-items-center gap-1 rounded-2xl p-3">
            <Building floors={floors} all={LESSONS.length} done={false} scale={3} />
            <div className="pop font-pixel text-lg">{t(S.newFloor)}</div>
          </div>
        )}

        {gains.badges.length > 0 && (
          <div className="paper rounded-2xl p-3">
            <div className="font-pixel text-base text-ink2">{t(S.newBadges)}</div>
            <ul className="mt-2 grid gap-2">
              {gains.badges.map((b) => (
                <li key={b} className="pop flex items-center gap-3 rounded-xl bg-paper2 p-2">
                  <Art id="icon.star" scale={2} />
                  <span>
                    <span className="block font-bold">{t(BADGE_TEXT[b]?.name)}</span>
                    <span className="block text-sm text-ink2">{t(BADGE_TEXT[b]?.how)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {lesson && (
          <div className="rounded-2xl bg-safety p-4 text-center text-ink" style={{ boxShadow: '0 0 0 2px #1d1f24, 0 5px 0 rgba(0,0,0,.35)' }}>
            <div className="font-pixel text-base">{t(S.motto)}</div>
            <div className="mt-1 font-pixel text-2xl leading-snug sm:text-3xl">{t(S.quote(t(lesson.motto)))}</div>
          </div>
        )}

        {missed.length > 0 && s.kind !== 'ai' && (
          <div className="paper rounded-2xl p-3">
            <div className="text-base font-bold">{t(S.comeBack)}</div>
            <ul className="mt-2 grid gap-1.5">
              {missed.map((id) => {
                const q = qOf(id)
                return q ? (
                  <li key={id} className="rounded-lg bg-paper2 px-3 py-1.5 text-base leading-snug">
                    {t(q.tip)}
                  </li>
                ) : null
              })}
            </ul>
          </div>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 bg-asphalt2/95 p-3 backdrop-blur-sm" style={{ boxShadow: '0 -2px 0 #15171b' }}>
        <div className="mx-auto grid max-w-xl gap-2">
          {onEnding ? (
            <button data-ending className="btn-main w-full text-xl" onClick={() => (sfx.ui(), onEnding())}>
              {t(S.toEnding)} ▶
            </button>
          ) : onNext && nextLabel ? (
            <div className="grid grid-cols-[1fr_2fr] gap-2">
              <button data-home className="btn text-lg" onClick={() => (sfx.ui(), onHome())}>
                {t(S.home)}
              </button>
              <button data-next-lesson className="btn-main text-lg" onClick={() => (sfx.ui(), onNext())}>
                {nextLabel} ▶
              </button>
            </div>
          ) : (
            <button data-home className="btn-main w-full text-xl" onClick={() => (sfx.ui(), onHome())}>
              {t(S.home)} ▶
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
