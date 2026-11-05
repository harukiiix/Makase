// 見回りの動きの点検（中身の文とは関係なく、決まりどおりに動くか）
import { describe, expect, it } from 'vitest'
import { allFound, better, initRound, reduceRound, resultOf } from './round'
import { endingOf } from './story'
import type { Choice, Day } from './types'

const L = (s: string) => ({ ja: s, en: s })
const ch = (ok: boolean): Choice => ({ t: L(ok ? 'ok' : 'ng'), icon: 'x', ok, reply: L(ok ? 'good' : 'better') })
const day: Day = {
  id: 'mon',
  dayName: L('mon'),
  place: L('office'),
  idea: L('i'),
  motto: L('m'),
  scene: 'office',
  intro: [],
  start: L('start'),
  done: L('done'),
  real: { head: L('h'), body: L('b'), who: L('w'), when: L('2024'), source: 's', url: 'https://example.com' },
  spots: [
    { id: 'a', kind: 'risk', name: L('a'), box: [0, 0, 10, 10], look: L('a?'), choices: [ch(true), ch(false)], after: [] },
    { id: 'b', kind: 'risk', name: L('b'), box: [20, 0, 10, 10], look: L('b?'), choices: [ch(false), ch(true)], after: [] },
    { id: 'c', kind: 'safe', name: L('c'), box: [40, 0, 10, 10], look: L('fine') },
    { id: 'd', kind: 'bonus', name: L('d'), box: [60, 0, 10, 10], look: L('him') },
  ],
}

describe('round', () => {
  it('tap a risk, then choose', () => {
    let s = initRound(day)
    s = reduceRound(day, s, { type: 'TAP', spot: 'a' })
    expect(s.asking).toBe('a')
    // 答える前に、ほかの物は押せない
    expect(reduceRound(day, s, { type: 'TAP', spot: 'c' })).toBe(s)
    expect(reduceRound(day, s, { type: 'HINT' })).toBe(s)
    expect(reduceRound(day, s, { type: 'END' })).toBe(s)
    s = reduceRound(day, s, { type: 'CHOOSE', index: 0 })
    expect(s.marks.a).toBe('right')
    expect(s.asking).toBeNull()
    s = reduceRound(day, s, { type: 'TAP', spot: 'b' })
    s = reduceRound(day, s, { type: 'CHOOSE', index: 0 })
    expect(s.marks.b).toBe('other')
    expect(allFound(day, s)).toBe(true)
  })
  it('safe and bonus are marked at once, and tapping again changes nothing but the panel', () => {
    let s = initRound(day)
    s = reduceRound(day, s, { type: 'TAP', spot: 'c' })
    s = reduceRound(day, s, { type: 'TAP', spot: 'd' })
    expect(s.marks).toEqual({ c: 'safe', d: 'bonus' })
    const again = reduceRound(day, s, { type: 'TAP', spot: 'c' })
    expect(again.marks).toEqual(s.marks)
    expect(again.last?.show).toBe('again')
  })
  it('hint points at the first risk not found yet', () => {
    let s = initRound(day)
    s = reduceRound(day, s, { type: 'HINT' })
    expect(s.hinted).toBe('a')
    expect(s.hints).toBe(1)
    s = reduceRound(day, s, { type: 'TAP', spot: 'a' })
    s = reduceRound(day, s, { type: 'CHOOSE', index: 0 })
    s = reduceRound(day, s, { type: 'HINT' })
    expect(s.hinted).toBe('b')
  })
  it('result lists right, other and missed; better keeps the bonus', () => {
    let s = initRound(day)
    s = reduceRound(day, s, { type: 'TAP', spot: 'b' })
    s = reduceRound(day, s, { type: 'CHOOSE', index: 1 })
    s = reduceRound(day, s, { type: 'TAP', spot: 'd' })
    s = reduceRound(day, s, { type: 'END' })
    const r = resultOf(day, s)
    expect(r).toMatchObject({ right: ['b'], other: [], missed: ['a'], bonus: true })
    const worse = { ...r, right: [], missed: ['a', 'b'], bonus: false }
    expect(better(r, worse).missed).toEqual(['a'])
    expect(better(worse, { ...r, bonus: false }).bonus).toBe(false)
    expect(better(r, worse).bonus).toBe(true)
  })
  it('endings follow the rule told to the player', () => {
    const r = (missed: number, bonus: boolean) => ({ day: 'mon' as const, right: [], other: [], missed: Array.from({ length: missed }, (_, i) => String(i)), bonus, hints: 0 })
    expect(endingOf({ mon: r(1, true), tue: r(1, true), wed: r(0, true) })).toBe('best')
    expect(endingOf({ mon: r(1, true), tue: r(1, true), wed: r(0, false) })).toBe('good')
    expect(endingOf({ mon: r(4, true), tue: r(3, true) })).toBe('bad')
  })
})
