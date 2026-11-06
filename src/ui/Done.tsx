// ============================================================
// 1回分が終わった時
//   いちばん上：結果の見出し。階が増えた時は建物（新しい階がクレーンで降りてくる。ここだけの動き）と昇格
//   その下：今日の標語／もらったポイントと1回で正解した数／新しいバッジ／階級／明日また出る問題
//   下：次へ（黄色いボタン1つ）とホームへ
// ============================================================
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

export function Done({ s, gains, progress, extra, moreDue = 0, onMoreReview, onHome, onNext, nextLabel, onEnding }: { s: Session; gains: Gains; progress: Progress; extra?: Question[]; moreDue?: number; onMoreReview?: () => void; onHome: () => void; onNext?: () => void; nextLabel?: string; onEnding?: () => void }) {
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
  const failed = s.kind === 'final' && !gains.passed
  const title = s.kind === 'lesson' ? S.lessonDone : s.kind === 'review' ? S.reviewDone : s.kind === 'ai' ? S.aiDone : gains.passed ? S.finalPass : S.finalFail
  const r = rankOf(progress.xp)
  const lesson = s.lesson ? lessonOf(s.lesson) : undefined
  const floors = LESSONS.filter((l) => progress.lessons[l.id]?.done).length
  const finished = progress.finalBest !== null && gains.passed
  const showBuilding = gains.newFloor || finished

  return (
    <div className="min-h-dvh scroll-pb-28 px-4 pb-32 pt-6 sm:px-6">
      <div className="mx-auto grid max-w-xl gap-4 lg:max-w-4xl lg:grid-cols-2 lg:gap-6">
        {/* 見出し（建物は、階が増えた時と完成した時だけ。スマホでは横に小さく） */}
        <section className={`panel flex items-center gap-4 p-4 lg:p-6 ${showBuilding ? 'lg:row-span-4 lg:grid lg:content-center lg:justify-items-center lg:text-center' : 'lg:col-span-2'}`}>
          {showBuilding && (
            <div className="shrink-0 overflow-hidden rounded-xl border-2 border-line lg:order-2">
              <span className="lg:hidden">
                <Building floors={floors} all={LESSONS.length} done={finished} scale={1.5} drop={gains.newFloor} />
              </span>
              <span className="hidden lg:block">
                <Building floors={floors} all={LESSONS.length} done={finished} scale={3} drop={gains.newFloor} />
              </span>
            </div>
          )}
          <div className="grid min-w-0 gap-1 lg:order-1 lg:justify-items-center">
            <h1 className="text-2xl lg:text-4xl">{t(title)}</h1>
            {lesson && <p className="text-base text-ink2">{t(S.dayPlace(t(lesson.dayName), t(lesson.title)))}</p>}
            {failed && <p className="text-base text-ink2">{t(S.finalFailWhy)}</p>}
            {moreDue > 0 && <p className="text-base font-bold">{t(S.reviewMore(moreDue))}</p>}
            {gains.newFloor && <p className="text-base font-bold">{t(S.newFloor)}</p>}
            {finished && <p className="text-base font-bold">{t(S.buildingDone)}</p>}
            {gains.rankUp && (
              <p className="pop mt-1 inline-flex w-fit items-center gap-2 rounded-full bg-act px-3 py-1 text-base font-bold text-actInk">
                <Art id="icon.helmet" scale={1.5} tint={RANK_TINT[gains.rankUp.id]} />
                {t(S.rankUp(t(RANK_NAME[gains.rankUp.id])))}
              </p>
            )}
          </div>
        </section>

        {/* 今日の標語：守ることなので、青い指示の印 */}
        {lesson && (
          <section className="flex items-start gap-3 rounded-xl border-2 border-rule bg-ruleBg p-4">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rule text-xl font-bold text-surface" aria-hidden>
              !
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-rule">{t(S.motto)}</h2>
              <p className="phrase mt-0.5 text-xl font-bold leading-snug">{t(lesson.motto)}</p>
            </div>
          </section>
        )}

        {/* ポイント・1回で正解した数・階級を1つの箱に。新しいバッジは、その下に1行で */}
        <section data-score className="panel grid grid-cols-2 p-0">
          <div className="grid gap-1 p-4">
            <div className="text-sm text-ink2">{t(S.gained)}</div>
            <div className="flex items-center gap-2 font-num text-4xl leading-none">
              <Art id="icon.star" scale={2} />+{shown}
            </div>
          </div>
          <div className="grid gap-1 border-l-2 border-hair p-4">
            <div className="text-sm text-ink2">{t(S.firstRightLabel)}</div>
            <div className="font-num text-4xl leading-none">
              {right}
              <span className="text-xl text-ink2">
                {t.lang === 'ja' ? '／' : '/'}
                {ids.length}
              </span>
            </div>
          </div>
          <div className="col-span-2 flex items-center gap-3 border-t-2 border-hair p-4">
            <span className="shrink-0 rounded-lg border-2 border-line bg-surface2 p-1">
              <Art id="icon.helmet" scale={2} tint={RANK_TINT[r.rank.id]} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-lg font-bold">{t(RANK_NAME[r.rank.id])}</div>
              <div className="mt-1 h-3.5 overflow-hidden rounded-full border-2 border-edge bg-surface2">
                <div className="tape h-full" style={{ width: `${Math.round(r.share * 100)}%` }} />
              </div>
              <div className="mt-1 text-sm text-ink2">{r.next ? t(S.toNext(r.toNext, t(RANK_NAME[r.next.id]))) : t(S.topRank)}</div>
            </div>
          </div>
          {gains.badges.length > 0 && (
            <p data-badges className="col-span-2 flex flex-wrap items-center gap-x-2 gap-y-1 border-t-2 border-hair px-4 py-3 text-base">
              <span className="text-sm text-ink2">{t(S.newBadges)}</span>
              {gains.badges.map((b, i) => (
                <span key={b} className="pop inline-flex items-center gap-1 font-bold">
                  <Art id="icon.star" scale={1.5} />
                  {t(BADGE_TEXT[b]?.name)}
                  {i < gains.badges.length - 1 && <span className="text-ink2">{t.lang === 'ja' ? '・' : ','}</span>}
                </span>
              ))}
            </p>
          )}
        </section>

        {missed.length > 0 && s.kind !== 'ai' && (
          <section className="panel p-4 lg:col-span-2">
            <h2 className="text-base">{t(S.comeBack)}</h2>
            <ul className="mt-2 grid gap-1.5">
              {missed.map((id) => {
                const q = qOf(id)
                return q ? (
                  <li key={id} className="phrase rounded-md bg-surface2 px-3 py-1.5 text-base leading-snug">
                    {t(q.tip)}
                  </li>
                ) : null
              })}
            </ul>
          </section>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t-2 border-hair bg-bg px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-6">
        <div className="mx-auto flex max-w-xl gap-3 lg:max-w-4xl lg:justify-end">
          {onEnding ? (
            <button data-ending className="btn-main w-full text-xl lg:w-[22rem]" onClick={() => (sfx.ui(), onEnding())}>
              {t(S.toEnding)}
            </button>
          ) : moreDue > 0 && onMoreReview ? (
            <>
              <button data-home className="btn shrink-0 px-5 text-lg" onClick={() => (sfx.ui(), onHome())}>
                {t(S.home)}
              </button>
              <button data-more-review className="btn-main min-w-0 flex-1 text-lg lg:w-[22rem] lg:flex-none" onClick={() => (sfx.ui(), onMoreReview())}>
                {t(S.reviewAgain)}
              </button>
            </>
          ) : onNext && nextLabel ? (
            <>
              <button data-home className="btn shrink-0 px-5 text-lg" onClick={() => (sfx.ui(), onHome())}>
                {t(S.home)}
              </button>
              <button data-next-lesson className="btn-main min-w-0 flex-1 text-lg lg:w-[22rem] lg:flex-none" onClick={() => (sfx.ui(), onNext())}>
                {nextLabel}
              </button>
            </>
          ) : (
            <button data-home className="btn-main w-full text-xl lg:w-[22rem]" onClick={() => (sfx.ui(), onHome())}>
              {t(S.home)}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
