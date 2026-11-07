import { describe, expect, it } from 'vitest'
import { PER_DAY, PER_SCREEN, aiLeft, countAiUse, dayKey, type AiUse } from './aiLimit'

// AIの宮下さんは、遊んでいる人自身の Claude の使用量を使う。使いすぎないように回数に限度をつける
describe('AIの宮下さんの回数の限度', () => {
  const day = '2026-11-07'

  it('限度は、1画面（1問）に3回、1日に20回', () => {
    expect(PER_SCREEN).toBe(3)
    expect(PER_DAY).toBe(20)
  })

  it('記録がない時は、その画面で3回、その日に20回聞ける', () => {
    expect(aiLeft(null, day, 'q:see-01')).toEqual({ screen: 3, day: 20, left: 3, reason: null })
  })

  it('1問につき3回聞くと、その問題ではもう聞けない（ほかの問題では聞ける）', () => {
    let u = null as unknown as AiUse
    for (let i = 0; i < 3; i++) u = countAiUse(u, day, 'q:see-01')
    expect(aiLeft(u, day, 'q:see-01')).toEqual({ screen: 0, day: 17, left: 0, reason: 'screen' })
    expect(aiLeft(u, day, 'q:see-02').left).toBe(3)
  })

  it('1日に合わせて20回聞くと、どの画面でも聞けない', () => {
    let u = null as unknown as AiUse
    for (let i = 0; i < 20; i++) u = countAiUse(u, day, `q:${Math.floor(i / 3)}`)
    expect(u.total).toBe(20)
    expect(aiLeft(u, day, 'q:new')).toEqual({ screen: 3, day: 0, left: 0, reason: 'day' })
  })

  it('残りは、画面の残りと日の残りの少ないほう', () => {
    let u = null as unknown as AiUse
    for (let i = 0; i < 19; i++) u = countAiUse(u, day, `q:${i}`)
    expect(aiLeft(u, day, 'q:new')).toEqual({ screen: 3, day: 1, left: 1, reason: null })
  })

  it('両方の限度に同時に来た時は、日の限度を言う（明日まで聞けないので）', () => {
    let u = null as unknown as AiUse
    for (let i = 0; i < 17; i++) u = countAiUse(u, day, `q:${i}`)
    for (let i = 0; i < 3; i++) u = countAiUse(u, day, 'q:last')
    expect(aiLeft(u, day, 'q:last').reason).toBe('day')
  })

  it('日付が変わったら、回数は元に戻る（前の日の記録は残さない）', () => {
    let u = null as unknown as AiUse
    for (let i = 0; i < 20; i++) u = countAiUse(u, day, 'q:a')
    expect(aiLeft(u, '2026-11-08', 'q:a')).toEqual({ screen: 3, day: 20, left: 3, reason: null })
    const next = countAiUse(u, '2026-11-08', 'q:a')
    expect(next).toEqual({ day: '2026-11-08', total: 1, screens: { 'q:a': 1 } })
  })

  it('限度に来たあとに数えても、限度より増えない', () => {
    let u = null as unknown as AiUse
    for (let i = 0; i < 5; i++) u = countAiUse(u, day, 'q:a')
    expect(u.screens['q:a']).toBe(3)
    expect(u.total).toBe(3)
  })

  it('こわれた記録（ほかの形・負の数・数でない物）は、なかったことにする', () => {
    for (const bad of [{}, { day, total: 'x', screens: {} }, { day, total: -4, screens: { a: -1 } }, { day, total: 2, screens: null }, 'abc', 42]) {
      expect(aiLeft(bad as never, day, 'q:a')).toEqual({ screen: 3, day: 20, left: 3, reason: null })
    }
    expect(aiLeft({ day, total: 2, screens: { 'q:a': 99 } }, day, 'q:a').screen).toBe(0)
  })

  it('記録は元の物を書きかえない（新しい物を返す）', () => {
    const u = { day, total: 1, screens: { 'q:a': 1 } }
    const v = countAiUse(u, day, 'q:a')
    expect(u).toEqual({ day, total: 1, screens: { 'q:a': 1 } })
    expect(v).toEqual({ day, total: 2, screens: { 'q:a': 2 } })
  })

  it('日付は、その場所の時計の年月日', () => {
    expect(dayKey(new Date(2026, 10, 7, 23, 59))).toBe('2026-11-07')
    expect(dayKey(new Date(2026, 10, 8, 0, 0))).toBe('2026-11-08')
    expect(dayKey(new Date(2026, 0, 3, 9, 0))).toBe('2026-01-03')
  })
})
