// ホーム：階級とポイント、続けた日数、工事中の建物、今日の復習、レッスン、まとめテスト、AIの練習
import { useEffect, useState } from 'react'
import { LESSONS, lessonOf, questionOf } from '../game/course'
import { dayNumber, dueIds, lessonOpen, PASS, rankOf, RANKS, weakTopic, type Progress } from '../game/learn'
import type { Lang, TopicId } from '../game/types'
import { getAI } from '../lib/ai'
import { sfx } from '../lib/platform'
import { Art } from './Art'
import { Building } from './Building'
import { LangToggle } from './Common'
import { useT } from './i18n'
import { RANK_NAME, S } from './strings'

/** 階級ごとのヘルメットの色 */
export const RANK_TINT: Record<string, string> = { new: '#ffcc1a', apprentice: '#ff8a26', skilled: '#4f82d4', foreman: '#33a35f', supervisor: '#f7f7f2' }

export function Home(p: {
  progress: Progress
  lang: Lang
  setLang: (l: Lang) => void
  onLesson: (id: TopicId) => void
  onReview: () => void
  onFinal: () => void
  onPractice: () => void
  onNotebook: () => void
  onScience: () => void
  onSettings: () => void
  onHowto: () => void
}) {
  const t = useT()
  const pr = p.progress
  const r = rankOf(pr.xp)
  const done = LESSONS.filter((l) => pr.lessons[l.id]?.done).length
  const passed = pr.finalBest !== null && pr.finalBest >= PASS
  const due = dueIds(pr.cards, dayNumber(), (id) => questionOf(id)?.topic).length
  const nextLesson = LESSONS.find((l) => !pr.lessons[l.id]?.done)
  const order = LESSONS.map((l) => l.id)
  const [ai, setAi] = useState(false)
  useEffect(() => {
    let alive = true
    void getAI().then((a) => alive && setAi(!!a))
    return () => {
      alive = false
    }
  }, [])
  const playedToday = pr.lastDay === dayNumber()

  return (
    <div className="min-h-dvh px-4 pb-10 pt-3 sm:px-6">
      <header className="mx-auto max-w-5xl">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1 truncate font-pixel text-xs tracking-widest text-onDark2">{t(S.series)}</div>
          <button className="btn-dark h-11 w-11 p-0 text-xl" aria-label={t(S.settings)} onClick={() => (sfx.ui(), p.onSettings())}>
            ⚙
          </button>
          <LangToggle lang={p.lang} onChange={p.setLang} />
        </div>
        <h1 className="mt-1 text-3xl text-safety sm:text-4xl">{t(S.title)}</h1>
        <p className="text-base text-onDark2">{t(S.subtitle)}</p>
      </header>

      <div className="mx-auto mt-4 grid max-w-5xl gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-6">
        {/* 左：自分の状態と、建物 */}
        <section className="grid content-start gap-3">
          <div className="paper flex items-center gap-3 rounded-2xl p-3">
            <div className="shrink-0 rounded-xl bg-paper2 p-1.5" style={{ boxShadow: '0 0 0 2px #1d1f24' }}>
              <Art id="icon.helmet" scale={4} tint={RANK_TINT[r.rank.id]} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xl font-bold">{t(RANK_NAME[r.rank.id])}</span>
                <span className="flex items-center gap-1 font-pixel text-base text-[#8a6a00]">
                  <Art id="icon.star" scale={1.5} />
                  {t(S.points(pr.xp))}
                </span>
              </div>
              <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-paper2" style={{ boxShadow: 'inset 0 0 0 1px #c9bb95' }}>
                <div className="h-full rounded-full bg-safety" style={{ width: `${Math.round(r.share * 100)}%` }} />
              </div>
              <div className="mt-1 text-sm text-ink2">{r.next ? t(S.toNext(r.toNext, t(RANK_NAME[r.next.id]))) : t(S.topRank)}</div>
            </div>
          </div>
          <div className="paper flex items-center gap-3 rounded-2xl p-3">
            <Art id="icon.flag" scale={3} className={pr.streak && playedToday ? '' : 'opacity-50'} />
            <div className="text-lg font-bold">{pr.streak ? t(S.streak(pr.streak)) : t(S.streakNone)}</div>
          </div>
          <div className="paper grid justify-items-center gap-1 rounded-2xl p-3">
            <Building floors={done} all={LESSONS.length} done={passed} scale={3} />
            <div className="font-pixel text-base">{passed ? t(S.buildingDone) : t(S.building(done, LESSONS.length))}</div>
          </div>
        </section>

        {/* 右：やること */}
        <section className="grid content-start gap-3">
          {due > 0 && (
            <button data-review className="btn-main w-full justify-start gap-3 rounded-2xl p-3 text-left" onClick={() => (sfx.ui(), p.onReview())}>
              <Art id="icon.review" scale={3} />
              <span className="min-w-0">
                <span className="block text-xl">{t(S.reviewNow(due))}</span>
                <span className="block text-sm font-normal">{t(S.reviewWhy)}</span>
              </span>
            </button>
          )}
          <h2 className="mt-1 text-lg text-onDark2">{t(S.lessons)}</h2>
          <ol className="grid gap-2">
            {LESSONS.map((l) => {
              const st = pr.lessons[l.id]
              const open = lessonOpen(pr, order, l.id)
              const isNext = nextLesson?.id === l.id
              return (
                <li key={l.id}>
                  <button
                    data-lesson={l.id}
                    disabled={!open}
                    onClick={() => (sfx.ui(), p.onLesson(l.id))}
                    className={`paper flex w-full items-center gap-3 rounded-2xl p-2.5 text-left disabled:opacity-55 ${isNext ? 'ring-4 ring-safety' : ''}`}
                  >
                    <span className="shrink-0 rounded-xl bg-paper2 p-1" style={{ boxShadow: '0 0 0 2px #1d1f24' }}>
                      <Art id={l.icon} scale={2} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-ink2">{t(S.dayPlace(t(l.dayName), t(l.place)))}</span>
                      <span className="block text-lg font-bold leading-snug">{t(l.title)}</span>
                      <span className="block text-sm text-ink2">{open ? (st?.done ? t(S.best(Math.round(st.best * 100))) : t(S.questionsN(l.questions.length))) : t(S.locked)}</span>
                    </span>
                    <span className="shrink-0">{st?.done ? <Art id="icon.check" scale={2.5} /> : !open ? <Art id="icon.lock" scale={2.5} /> : isNext ? <span className="rounded-full bg-safety px-3 py-1 font-bold text-ink">▶</span> : null}</span>
                  </button>
                </li>
              )
            })}
          </ol>
          <button data-final disabled={done < LESSONS.length} onClick={() => (sfx.ui(), p.onFinal())} className={`paper flex w-full items-center gap-3 rounded-2xl p-3 text-left disabled:opacity-55 ${done === LESSONS.length && !passed ? 'ring-4 ring-safety' : ''}`}>
            <Art id="icon.star" scale={3} />
            <span className="min-w-0 flex-1">
              <span className="block text-lg font-bold">{t(S.finalTest)}</span>
              <span className="block text-sm text-ink2">{done < LESSONS.length ? t(S.finalLocked) : t(S.finalWhy)}</span>
            </span>
            {passed && <span className="shrink-0 rounded-full bg-right px-3 py-1 text-sm font-bold text-white">{t(S.passedMark)}</span>}
          </button>
          {ai && done > 0 && (
            <button data-practice onClick={() => (sfx.ui(), p.onPractice())} className="paper flex w-full items-center gap-3 rounded-2xl p-3 text-left">
              <Art id="icon.ai" scale={3} />
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-bold">{t(S.aiPractice)}</span>
                <span className="block text-sm text-ink2">{t(S.aiPracticeWhy(t(lessonOf(weakTopic(pr, (id) => questionOf(id)?.topic, LESSONS[0].id)).title)))}</span>
              </span>
            </button>
          )}
          <div className="mt-1 grid grid-cols-3 gap-2">
            <button className="btn-dark flex-col gap-1 py-2 text-sm" data-notebook onClick={() => (sfx.ui(), p.onNotebook())}>
              <Art id="icon.book" scale={2} />
              {t(S.notebook)}
            </button>
            <button className="btn-dark flex-col gap-1 py-2 text-sm" data-science onClick={() => (sfx.ui(), p.onScience())}>
              <Art id="icon.bulb" scale={2} />
              {t(S.science)}
            </button>
            <button className="btn-dark flex-col gap-1 py-2 text-sm" data-howto onClick={() => (sfx.ui(), p.onHowto())}>
              <span className="font-pixel text-xl leading-6">?</span>
              {t(S.howto)}
            </button>
          </div>
          <p className="text-center text-sm text-onDark2">{t(S.fiction)}</p>
        </section>
      </div>
      {/* 階級のならび（目標が見えるように） */}
      <ol className="mx-auto mt-6 flex max-w-5xl flex-wrap justify-center gap-2" aria-label={t(S.rank)}>
        {RANKS.map((x, i) => (
          <li key={x.id} className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-sm ${i <= r.index ? 'bg-asphalt3 text-onDark' : 'bg-asphalt2 text-onDark2'}`}>
            <Art id="icon.helmet" scale={1.5} tint={RANK_TINT[x.id]} className={i <= r.index ? '' : 'opacity-40'} />
            {t(RANK_NAME[x.id])}
          </li>
        ))}
      </ol>
    </div>
  )
}
