// 学びの仕組みの点検（中身の問題とは関係なく、決まりどおりに動くか）
import { describe, expect, it } from 'vitest'
import { toQuestions } from '../lib/ai'
import { answer, applySession, dueIds, finished, firstRight, interleave, isRight, lessonOpen, newProgress, next, rankOf, RANKS, schedule, shuffle, startSession, weakTopic, XP } from './learn'
import type { MCQuestion, TFQuestion, TopicId } from './types'

const L = (s: string) => ({ ja: s, en: s })
const tf = (id: string, ans: boolean, topic: TopicId = 'see'): TFQuestion => ({ id, topic, who: 'BOSS', kind: 'tf', answer: ans, situation: L('s'), ask: L('a'), why: L('w'), tip: L('t'), wrongWhy: L('ww') })
const mc = (id: string, correct: 0 | 1 | 2, topic: TopicId = 'see'): MCQuestion => ({
  id,
  topic,
  who: 'BOSS',
  kind: 'mc',
  correct,
  choices: [L('1'), L('2'), L('3')],
  situation: L('s'),
  ask: L('a'),
  why: L('w'),
  tip: L('t'),
  wrongWhy: [0, 1, 2].map((i) => (i === correct ? null : L('x'))) as MCQuestion['wrongWhy'],
})

describe('answers', () => {
  it('○ is 0 and ✕ is 1; three-choice uses the index', () => {
    expect(isRight(tf('a', true), 0)).toBe(true)
    expect(isRight(tf('a', true), 1)).toBe(false)
    expect(isRight(tf('a', false), 1)).toBe(true)
    expect(isRight(mc('b', 2), 2)).toBe(true)
    expect(isRight(mc('b', 2), 0)).toBe(false)
  })
})

describe('a lesson', () => {
  it('a missed question comes back at the end, and the lesson ends when all are right', () => {
    const qa = tf('see-01', true)
    const qb = mc('see-02', 1)
    let s = startSession('lesson', [qa.id, qb.id], 'see')
    s = answer(s, qa, 1) // まちがえる
    expect(s.answer?.ok).toBe(false)
    s = next(s)
    expect(s.queue).toEqual([qb.id, qa.id])
    s = answer(s, qb, 1)
    s = next(s)
    s = answer(s, qa, 0) // 2回目で正解
    s = next(s)
    expect(finished(s)).toBe(true)
    expect(s.firstTry).toEqual({ 'see-01': false, 'see-02': true })
    expect(firstRight(s)).toBe(1)
    // 1回目の正解 10、やり直しの正解 5
    expect(s.xp).toBe(XP.first + XP.again)
  })
  it('three right in a row gives a small bonus', () => {
    const qs = [tf('see-01', true), tf('see-02', false), tf('see-03', true)]
    let s = startSession('lesson', qs.map((q) => q.id), 'see')
    for (const q of qs) {
      s = answer(s, q, q.answer ? 0 : 1)
      s = next(s)
    }
    expect(s.bestCombo).toBe(3)
    expect(s.xp).toBe(3 * XP.first + XP.combo)
  })
  it('answering the wrong question or twice does nothing', () => {
    const qa = tf('see-01', true)
    const s = startSession('lesson', [qa.id])
    expect(answer(s, tf('other', true), 0)).toBe(s)
    const s2 = answer(s, qa, 0)
    expect(answer(s2, qa, 1)).toBe(s2)
  })
})

describe('spaced review', () => {
  it('right answers push the next review further away; a miss comes back tomorrow', () => {
    let c = schedule(undefined, true, 100)
    expect([c.box, c.due]).toEqual([1, 101])
    c = schedule(c, true, 101)
    expect([c.box, c.due]).toEqual([2, 104])
    c = schedule(c, true, 104)
    expect([c.box, c.due]).toEqual([3, 111])
    c = schedule(c, false, 111)
    expect([c.box, c.due]).toEqual([1, 112])
    expect(c.seen).toBe(4)
    expect(c.right).toBe(3)
  })
  it('due questions are mixed across topics', () => {
    const topics: Record<string, TopicId> = { a1: 'see', a2: 'see', a3: 'see', b1: 'gate', c1: 'photo' }
    const cards = Object.fromEntries(Object.keys(topics).map((id) => [id, { box: 1, due: 5, seen: 1, right: 0, last: 4 }]))
    const ids = dueIds(cards, 5, (id) => topics[id])
    expect(ids.length).toBe(5)
    expect(topics[ids[0]]).not.toBe(topics[ids[1]])
    expect(dueIds(cards, 4, (id) => topics[id])).toEqual([])
    expect(interleave(['a1', 'a2', 'b1'], (id) => topics[id])).toEqual(['a1', 'b1', 'a2'])
  })
})

describe('progress', () => {
  it('finishing a lesson adds points, a floor, a badge and starts the streak', () => {
    const qs = [tf('see-01', true), mc('see-02', 0)]
    let s = startSession('lesson', qs.map((q) => q.id), 'see')
    s = next(answer(s, qs[0], 0))
    s = next(answer(s, qs[1], 0))
    const { p, gains } = applySession(newProgress(), s, 200, 5)
    expect(gains.newFloor).toBe(true)
    expect(gains.bonus.lesson).toBe(XP.lesson)
    expect(gains.bonus.perfect).toBe(XP.perfect)
    expect(gains.xp).toBe(2 * XP.first + XP.lesson + XP.perfect)
    expect(p.lessons.see).toEqual({ done: true, best: 1 })
    expect(p.streak).toBe(1)
    expect(gains.badges).toEqual(expect.arrayContaining(['first', 'perfect']))
    expect(p.cards['see-01'].due).toBe(201)
    // 同じレッスンをもう一度：完了のおまけはもう出ない
    const again = applySession(p, s, 200, 5)
    expect(again.gains.bonus.lesson).toBeUndefined()
    expect(again.gains.newFloor).toBe(false)
  })
  it('streak counts days in a row and resets after a gap', () => {
    const s = startSession('review', [])
    let p = applySession(newProgress(), s, 10, 5).p
    p = applySession(p, s, 11, 5).p
    p = applySession(p, s, 11, 5).p
    expect(p.streak).toBe(2)
    p = applySession(p, s, 12, 5).p
    expect(p.streak).toBe(3)
    expect(p.badges).toContain('streak3')
    p = applySession(p, s, 20, 5).p
    expect(p.streak).toBe(1)
    expect(p.bestStreak).toBe(3)
  })
  it('ranks go up with points', () => {
    expect(rankOf(0).rank.id).toBe('new')
    expect(rankOf(RANKS[1].xp).rank.id).toBe('apprentice')
    expect(rankOf(RANKS[1].xp - 1).toNext).toBe(1)
    expect(rankOf(99999).next).toBeNull()
  })
  it('the final test passes at 80 percent', () => {
    const qs = Array.from({ length: 10 }, (_, i) => tf(`see-${i}`, true))
    let s = startSession('final', qs.map((q) => q.id))
    qs.forEach((q, i) => (s = next(answer(s, q, i < 8 ? 0 : 1))))
    while (!finished(s)) s = next(answer(s, qs.find((q) => q.id === s.queue[0])!, 0))
    const r = applySession(newProgress(), s, 1, 5)
    expect(r.gains.passed).toBe(true)
    expect(r.gains.bonus.final).toBe(XP.final)
    expect(r.p.badges).toContain('graduate')
  })
  it('lessons open in order; the weakest topic is the one missed most', () => {
    const p = newProgress()
    const order: TopicId[] = ['see', 'gate', 'photo']
    expect(lessonOpen(p, order, 'see')).toBe(true)
    expect(lessonOpen(p, order, 'gate')).toBe(false)
    p.lessons.see = { done: true, best: 1 }
    expect(lessonOpen(p, order, 'gate')).toBe(true)
    p.cards = { 'see-01': { box: 3, due: 9, seen: 3, right: 3, last: 1 }, 'gate-01': { box: 1, due: 2, seen: 3, right: 0, last: 1 } }
    expect(weakTopic(p, (id) => id.split('-')[0] as TopicId, 'see')).toBe('gate')
  })
  it('shuffle is the same for the same seed', () => {
    expect(shuffle([1, 2, 3, 4, 5], 7)).toEqual(shuffle([1, 2, 3, 4, 5], 7))
    expect([...shuffle([1, 2, 3, 4, 5], 7)].sort()).toEqual([1, 2, 3, 4, 5])
  })
})

describe('AI-made questions are checked before use', () => {
  it('keeps well-formed questions and drops broken ones', () => {
    const raw = [
      { kind: 'tf', situation: L('s'), ask: L('a'), answer: false, why: L('w'), wrongWhy: L('ww'), tip: L('t') },
      { kind: 'mc', situation: L('s'), ask: L('a'), choices: [L('1'), L('2'), L('3')], correct: 2, why: L('w'), wrongWhy: [L('x'), L('y'), null], tip: L('t') },
      { kind: 'mc', situation: L('s'), ask: L('a'), choices: [L('1'), L('2')], correct: 1, why: L('w'), wrongWhy: [], tip: L('t') },
      { kind: 'tf', situation: { ja: '', en: 'x' }, ask: L('a'), answer: true, why: L('w'), wrongWhy: L('ww'), tip: L('t') },
      'nonsense',
    ]
    const qs = toQuestions(raw, 'send', 1)
    expect(qs.map((q) => q.kind)).toEqual(['tf', 'mc'])
    expect(qs.every((q) => q.topic === 'send' && q.id.startsWith('ai-'))).toBe(true)
    expect(toQuestions({ not: 'an array' }, 'send', 1)).toEqual([])
  })
})
