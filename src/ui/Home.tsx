// ============================================================
// ホーム
//   いちばん上：今日やること（1つだけ大きく。押すボタンは黄色1つ）。途中のレッスンがあれば、その続き
//   その下：5日間の見回り（月〜金とまとめテスト。工程表のように並べる）、AIの練習、ノートとあそびかた
//   横か下：自分の階級・ポイント・続けた日数、のびていく建物
// ============================================================
import { useEffect, useState } from 'react'
import { LESSONS, lessonOf, questionOf } from '../game/course'
import { DAY_SUB as NOVA_SUB, DAY_TITLE as NOVA_TITLE } from '../makase/words'
import { dayNumber, dueIds, lessonOpen, PASS, rankOf, RANKS, weakTopic, type Progress } from '../game/learn'
import type { Lang, TopicId } from '../game/types'
import { getAI } from '../lib/ai'
import { sfx } from '../lib/platform'
import { Art } from './Art'
import { Building } from './Building'
import { LangButton } from './Common'
import { useT } from './i18n'
import { RANK_NAME, S } from './strings'

/** 階級ごとのヘルメットの色 */
export const RANK_TINT: Record<string, string> = { new: '#ffcc1a', apprentice: '#ff8a26', skilled: '#4f82d4', foreman: '#33a35f', supervisor: '#f7f7f2' }

/** 1問あたりの目安（秒） */
const SEC_PER_Q = 25
const minutes = (n: number) => Math.max(1, Math.round((n * SEC_PER_Q) / 60))

export function Home(p: {
  progress: Progress
  lang: Lang
  setLang: (l: Lang) => void
  /** 途中のレッスン（あれば） */
  resume?: { title: string; left: number } | null
  onResume: () => void
  onDropResume: () => void
  onLesson: (id: TopicId) => void
  onReview: () => void
  onFinal: () => void
  onPractice: () => void
  onNotebook: () => void
  onSettings: () => void
  onHowto: () => void
  /** 最後の日「AIの事務員に頼む練習」（最初から遊べる） */
  nova?: { done: boolean } | null
  onNova?: () => void
}) {
  const t = useT()
  const pr = p.progress
  const r = rankOf(pr.xp)
  const today = dayNumber()
  const done = LESSONS.filter((l) => pr.lessons[l.id]?.done).length
  const allDone = done === LESSONS.length
  const passed = pr.finalBest !== null && pr.finalBest >= PASS
  const due = dueIds(pr.cards, today, (id) => questionOf(id)?.topic).length
  const order = LESSONS.map((l) => l.id)
  const next = LESSONS.find((l) => !pr.lessons[l.id]?.done && lessonOpen(pr, order, l.id))
  const firstLocked = LESSONS.findIndex((l) => !lessonOpen(pr, order, l.id))
  const [ai, setAi] = useState(false)
  useEffect(() => {
    let alive = true
    void getAI().then((a) => alive && setAi(!!a))
    return () => {
      alive = false
    }
  }, [])
  const playedToday = pr.lastDay === today
  // 1日あいたら、続けた日数は切れている（次に遊んだ時に1日目から）
  const streakAlive = pr.streak > 0 && pr.lastDay !== null && pr.lastDay >= today - 1
  const streakText = !streakAlive ? t(S.streakNone) : playedToday ? t(S.streak(pr.streak)) : t(S.streakKeep(pr.streak + 1))
  const weak = done > 0 ? lessonOf(weakTopic(pr, (id) => questionOf(id)?.topic, LESSONS[0].id)) : null
  const go = (f: () => void) => () => (sfx.ui(), f())
  const dayTile = (name: string) => (t.lang === 'ja' ? name.slice(0, 1) : name.slice(0, 2))

  // ---- 今日やること（1つ）
  const hero = (() => {
    if (p.resume) return { key: 'resume', icon: 'icon.review', title: t(S.resumeTitle), sub: t(S.resumeSub(p.resume.title, p.resume.left)), cta: t(S.resumeGo), onClick: p.onResume, attr: { 'data-resume': true } }
    if (due > 0) return { key: 'review', icon: 'icon.review', title: t(S.reviewTitle), sub: t(S.reviewSub(due, minutes(due))), cta: t(S.reviewGo), onClick: p.onReview, attr: { 'data-review': true } }
    if (next)
      return {
        key: 'lesson',
        icon: next.icon,
        title: t(next.title),
        sub: t(S.lessonSub(t(next.dayName), t(next.place), next.questions.length, minutes(next.questions.length))),
        cta: t(done === 0 ? S.start : S.startDay(t(next.dayName))),
        onClick: () => p.onLesson(next.id),
        attr: { 'data-hero-lesson': next.id },
      }
    if (allDone && !passed) return { key: 'final', icon: 'icon.star', title: t(S.finalTest), sub: t(S.finalWhy), cta: t(S.finalGo), onClick: p.onFinal, attr: { 'data-hero-final': true } }
    return null
  })()

  return (
    <div className="min-h-dvh px-4 pb-12 pt-3 sm:px-6">
      <header className="mx-auto flex max-w-5xl items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Art id="icon.helmet" scale={2} tint={RANK_TINT.new} />
          <h1 className="truncate font-pixel text-xl leading-none sm:text-2xl">{t(S.title)}</h1>
        </div>
        <LangButton lang={p.lang} onChange={p.setLang} />
        <button className="btn-quiet h-11 w-11 shrink-0 p-0" data-settings aria-label={t.attr(S.settings)} onClick={go(p.onSettings)}>
          <Art id="icon.gear" scale={2} />
        </button>
      </header>
      <p className="mx-auto mt-1 max-w-5xl text-base text-ink2">{t(S.subtitle)}</p>

      <div className="mx-auto mt-4 grid max-w-5xl gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-6">
        {/* ---- 左（スマホでは上）：今日やること → 5日間の見回り → そのほか */}
        <div className="grid content-start gap-4">
          {hero ? (
            <section className="panel grid gap-4 p-4 sm:p-5" aria-label={t.attr(S.todayJob)}>
              <div className="flex items-start gap-4">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-ink2">{t(S.todayJob)}</div>
                  <h2 className="mt-1 text-2xl sm:text-3xl">{hero.title}</h2>
                  <p className="mt-1 text-base text-ink2">{hero.sub}</p>
                </div>
                <div className="shrink-0 overflow-hidden rounded-lg border-2 border-line bg-surface2">
                  <Art id={hero.icon} scale={hero.key === 'lesson' ? 3 : 4} />
                </div>
              </div>
              <div className="grid gap-2">
                <button {...hero.attr} className="btn-main w-full text-xl" onClick={go(hero.onClick)}>
                  {hero.cta}
                </button>
                {hero.key === 'resume' && (
                  <button data-drop-resume className="btn-quiet justify-self-center text-base text-ink2" onClick={go(p.onDropResume)}>
                    {t(S.resumeDrop)}
                  </button>
                )}
              </div>
            </section>
          ) : (
            <section className="panel p-4 sm:p-5">
              <div className="text-sm font-bold text-ink2">{t(S.todayJob)}</div>
              <h2 className="mt-1 text-2xl">{t(S.restTitle)}</h2>
              <p className="mt-1 text-base text-ink2">{t(S.restSub)}</p>
            </section>
          )}

          {/* 5日間の見回り：曜日のマスと、題名と、ようす */}
          <section aria-labelledby="week">
            <h2 id="week" className="mb-2 text-base text-ink2">
              {t(S.week)}
            </h2>
            <ol className="panel divide-y-2 divide-hair overflow-hidden p-0">
              {LESSONS.map((l, i) => {
                const st = pr.lessons[l.id]
                const open = lessonOpen(pr, order, l.id)
                const isNext = next?.id === l.id
                const sub = st?.done ? t(S.best(Math.round(st.best * 100))) : !open && i === firstLocked && i > 0 ? t(S.lockedAfter(t(LESSONS[i - 1].dayName))) : t(S.dayPlace(t(l.dayName), t(l.place)))
                return (
                  <li key={l.id}>
                    <button data-lesson={l.id} disabled={!open} onClick={go(() => p.onLesson(l.id))} className={`flex w-full items-center gap-3 px-3 py-2.5 text-left disabled:cursor-not-allowed ${isNext ? 'bg-actBg' : 'enabled:hover:bg-surface2'}`}>
                      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg font-pixel text-2xl ${st?.done ? 'bg-ok text-surface' : open ? 'bg-ink text-surface' : 'bg-surface2 text-ink2'}`} aria-hidden>
                        {dayTile(t(l.dayName))}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block text-lg font-bold leading-snug ${open ? '' : 'text-ink2'}`}>{t(l.title)}</span>
                        <span className="block text-sm text-ink2">{sub}</span>
                      </span>
                      <span className="shrink-0" aria-hidden>
                        {st?.done ? <Art id="icon.check" scale={2} /> : isNext ? <span className="rounded-md bg-act px-2 py-0.5 text-sm font-bold text-actInk">{t(S.nextMark)}</span> : null}
                      </span>
                    </button>
                  </li>
                )
              })}
              <li>
                <button data-final disabled={!allDone} onClick={go(p.onFinal)} className={`flex w-full items-center gap-3 px-3 py-2.5 text-left disabled:cursor-not-allowed ${allDone && !passed && due === 0 && !p.resume ? 'bg-actBg' : 'enabled:hover:bg-surface2'}`}>
                  <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${passed ? 'bg-ok' : allDone ? 'bg-ink' : 'bg-surface2'}`} aria-hidden>
                    <Art id="icon.star" scale={2} className={allDone ? '' : 'opacity-50'} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-lg font-bold leading-snug ${allDone ? '' : 'text-ink2'}`}>{t(S.finalTest)}</span>
                    <span className="block text-sm text-ink2">{passed ? t(S.best(Math.round((pr.finalBest ?? 0) * 100))) : allDone ? t(S.finalWhy) : t(S.finalLocked)}</span>
                  </span>
                  <span className="shrink-0" aria-hidden>
                    {passed ? <Art id="icon.check" scale={2} /> : null}
                  </span>
                </button>
              </li>
              {p.onNova && (
                <li>
                  <button data-nova onClick={go(p.onNova)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left enabled:hover:bg-surface2">
                    <span className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg ${p.nova?.done ? 'bg-ok' : 'bg-ink'}`} aria-hidden>
                      <Art id="face.nova" scale={1.25} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-lg font-bold leading-snug">{NOVA_TITLE}</span>
                      <span className="block text-sm text-ink2">{NOVA_SUB}</span>
                    </span>
                    <span className="shrink-0" aria-hidden>
                      {p.nova?.done ? <Art id="icon.check" scale={2} /> : null}
                    </span>
                  </button>
                </li>
              )}
            </ol>
          </section>

          {ai && weak && (
            <button data-practice onClick={go(p.onPractice)} className="btn w-full justify-start gap-3 p-3 text-left">
              <Art id="icon.ai" scale={2.5} />
              <span className="min-w-0">
                <span className="block text-lg leading-snug">{t(S.aiPractice)}</span>
                <span className="block text-sm font-normal text-ink2">{t(S.aiPracticeWhy(t(weak.title)))}</span>
              </span>
            </button>
          )}

          <nav className="grid grid-cols-2 gap-2" aria-label={t.attr(S.others)}>
            <button className="btn justify-start gap-3 px-3 text-base" data-notebook onClick={go(p.onNotebook)}>
              <Art id="icon.book" scale={2} />
              {t(S.notebook)}
            </button>
            <button className="btn justify-start gap-3 px-3 text-base" data-howto onClick={go(p.onHowto)}>
              <Art id="icon.howto" scale={2} />
              {t(S.howto)}
            </button>
          </nav>
        </div>

        {/* ---- 右（スマホでは下）：自分のようす、建物 */}
        <div className="grid content-start gap-4">
          <section className="panel grid gap-3 p-4" aria-label={t.attr(S.rank)}>
            <div className="flex items-center gap-3">
              <span className="shrink-0 rounded-lg border-2 border-line bg-surface2 p-1">
                <Art id="icon.helmet" scale={3} tint={RANK_TINT[r.rank.id]} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm text-ink2">{t(S.rank)}</div>
                <div className="text-xl font-bold leading-snug">{t(RANK_NAME[r.rank.id])}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-ink2">{t(S.pointsLabel)}</div>
                <div className="font-num text-2xl leading-snug">{pr.xp}</div>
              </div>
            </div>
            <div>
              <div className="h-3.5 overflow-hidden rounded-full border-2 border-edge bg-surface2" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(r.share * 100)} aria-label={t.attr(r.next ? t(S.toNext(r.toNext, t(RANK_NAME[r.next.id]))) : t(S.topRank))}>
                <div className="tape h-full" style={{ width: `${Math.round(r.share * 100)}%` }} />
              </div>
              <div className="mt-1 text-sm text-ink2">{r.next ? t(S.toNext(r.toNext, t(RANK_NAME[r.next.id]))) : t(S.topRank)}</div>
            </div>
            {/* 階級のならび（目標が見えるように） */}
            <ol className="flex items-start justify-between gap-1" aria-label={t.attr(S.rankLadder)}>
              {RANKS.map((x, i) => (
                <li key={x.id} className={`grid min-w-0 flex-1 justify-items-center text-center text-xs leading-tight break-words ${i === r.index ? 'font-bold text-ink' : 'text-ink2'}`}>
                  <Art id="icon.helmet" scale={1.5} tint={RANK_TINT[x.id]} className={i <= r.index ? '' : 'opacity-35'} />
                  <span className="mt-0.5">{t(RANK_NAME[x.id])}</span>
                </li>
              ))}
            </ol>
            <div className="flex items-center gap-2 border-t-2 border-hair pt-3">
              <Art id="icon.flag" scale={2} className={streakAlive && playedToday ? '' : 'opacity-50'} />
              <span className="text-base font-bold">{streakText}</span>
            </div>
          </section>

          <section className="panel flex items-center gap-4 p-4 max-[359px]:flex-col max-[359px]:items-start" aria-label={t.attr(S.buildingLabel)}>
            <div className="shrink-0 overflow-hidden rounded-lg border-2 border-line">
              <Building floors={done} all={LESSONS.length} done={passed} scale={2} />
            </div>
            <div className="min-w-0">
              <div className="text-lg font-bold">{passed ? t(S.buildingDone) : t(S.building(done, LESSONS.length))}</div>
              <p className="mt-1 text-sm text-ink2">{passed ? t(S.buildingDoneSub) : t(S.buildingHow)}</p>
            </div>
          </section>
          <p className="text-center text-sm text-ink2">{t(S.fiction)}</p>
        </div>
      </div>
    </div>
  )
}
