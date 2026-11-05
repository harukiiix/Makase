// 中身の点検：文が日英そろっているか、問題の形が正しいか、絵があるか、使わない言葉がないか
import { describe, expect, it } from 'vitest'
import { SPRITES } from '../art'
import { PALETTE } from '../art/palette'
import { spriteSize } from '../art/raster'
import { FACE, S, SPEAKER } from '../ui/strings'
import { CASES } from './cases'
import { ALL_QUESTIONS, LESSONS } from './course'
import { ENDING, PROLOGUE } from './story'
import type { L10n, Line, Question } from './types'

/** 日本語で使わない横文字（ふつうの言葉で言いかえる） */
const BANNED_JA = ['インシデント', 'フィッシング', 'マルウェア', 'ランサムウェア', 'ソーシャルエンジニアリング', 'クラウド', 'アカウント', 'ログイン', 'プロンプト', 'セキュリティホール', 'リスク', 'ハンコ', 'ステップ', 'タスク', 'ユーザー', 'アクセス権', 'エビデンス', 'リテラシー']
const DASHES = /[—–―]/

function l10n(where: string, x: L10n | undefined | null, maxJa = 400) {
  expect(x, where).toBeTruthy()
  expect(x!.ja.trim().length, `${where}.ja is empty`).toBeGreaterThan(0)
  expect(x!.en.trim().length, `${where}.en is empty`).toBeGreaterThan(0)
  expect(DASHES.test(x!.ja) || DASHES.test(x!.en), `${where} has a long dash`).toBe(false)
  for (const w of BANNED_JA) expect(x!.ja.includes(w), `${where}.ja uses ${w}`).toBe(false)
  expect(x!.ja.length, `${where}.ja is too long (${x!.ja.length} > ${maxJa}): ${x!.ja}`).toBeLessThanOrEqual(maxJa)
}

function lines(where: string, ls: Line[]) {
  ls.forEach((l, i) => {
    l10n(`${where}[${i}]`, l.t, 70)
    expect(/^[「]?はい[。！]?[」]?$/.test(l.t.ja.trim()), `${where}[${i}] is just はい`).toBe(false)
    expect(SPEAKER[l.who], `${where}[${i}].who`).toBeTruthy()
    l.pic?.forEach((p) => expect(SPRITES[p], `${where}[${i}] picture ${p}`).toBeTruthy())
  })
}

function question(q: Question) {
  const w = `question ${q.id}`
  expect(q.id.startsWith(q.topic + '-'), `${w}: id starts with its topic`).toBe(true)
  expect(SPEAKER[q.who], `${w}.who`).toBeTruthy()
  l10n(`${w}.situation`, q.situation, 70)
  l10n(`${w}.ask`, q.ask, 45)
  l10n(`${w}.why`, q.why, 90)
  l10n(`${w}.tip`, q.tip, 32)
  if (q.pic) expect(SPRITES[q.pic], `${w}.pic ${q.pic} is not drawn`).toBeTruthy()
  if (q.real) expect(CASES[q.real], `${w}.real ${q.real}`).toBeTruthy()
  if (q.kind === 'tf') {
    expect(typeof q.answer, `${w}.answer`).toBe('boolean')
    l10n(`${w}.wrongWhy`, q.wrongWhy, 90)
  } else {
    expect(q.choices.length, `${w}.choices`).toBe(3)
    q.choices.forEach((c, i) => l10n(`${w}.choices[${i}]`, c, 30))
    expect([0, 1, 2].includes(q.correct), `${w}.correct`).toBe(true)
    q.wrongWhy.forEach((x, i) => {
      if (i === q.correct) expect(x, `${w}.wrongWhy[${i}] must be null for the right answer`).toBeNull()
      else l10n(`${w}.wrongWhy[${i}]`, x, 90)
    })
  }
}

describe('lessons', () => {
  it('five lessons, each with its text', () => {
    expect(LESSONS.length).toBe(5)
    for (const l of LESSONS) {
      for (const k of ['dayName', 'place', 'title', 'motto'] as const) l10n(`${l.id}.${k}`, l[k], 30)
      lines(`${l.id}.intro`, l.intro)
      expect(l.intro.length, `${l.id}.intro`).toBeGreaterThanOrEqual(2)
      expect(l.intro.length, `${l.id}.intro`).toBeLessThanOrEqual(5)
      expect(SPRITES[l.icon], `${l.id}.icon ${l.icon}`).toBeTruthy()
    }
  })
  for (const l of LESSONS)
    it(`${l.id}: questions`, () => {
      expect(l.questions.length, `${l.id} questions`).toBeGreaterThanOrEqual(6)
      expect(l.questions.length, `${l.id} questions`).toBeLessThanOrEqual(8)
      l.questions.forEach((q) => {
        expect(q.topic, q.id).toBe(l.id)
        question(q)
      })
      const tf = l.questions.filter((q) => q.kind === 'tf')
      const mc = l.questions.filter((q) => q.kind === 'mc')
      expect(tf.length, `${l.id}: at least 2 ○✕ questions`).toBeGreaterThanOrEqual(2)
      expect(mc.length, `${l.id}: at least 2 three-choice questions`).toBeGreaterThanOrEqual(2)
      // 答えがいつも同じにならないように
      expect(new Set(tf.map((q) => q.kind === 'tf' && q.answer)).size, `${l.id}: ○✕ answers should include both ○ and ✕`).toBe(2)
      expect(new Set(mc.map((q) => q.kind === 'mc' && q.correct)).size, `${l.id}: the right choice should not always be the same number`).toBeGreaterThanOrEqual(2)
    })
  it('question ids are unique', () => {
    const ids = ALL_QUESTIONS.map((q) => q.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('story and real cases', () => {
  it('opening and ending', () => {
    lines('PROLOGUE', PROLOGUE)
    lines('ENDING', ENDING)
    expect(PROLOGUE.length).toBeGreaterThanOrEqual(4)
    expect(ENDING.length).toBeGreaterThanOrEqual(3)
  })
  it('real cases have both languages and a source', () => {
    for (const c of Object.values(CASES)) {
      for (const k of ['head', 'body', 'who', 'when'] as const) l10n(`case ${c.id}.${k}`, c[k])
      expect(c.url.startsWith('https://'), c.id).toBe(true)
    }
  })
})

describe('art', () => {
  it('every sprite uses known colors', () => {
    for (const [name, s] of Object.entries(SPRITES)) {
      expect(s.rows.length, name).toBeGreaterThan(0)
      const [w, h] = spriteSize(s)
      expect(w <= 160 && h <= 120, `${name} size`).toBe(true)
      for (const r of s.rows) for (const ch of r) if (ch !== '.' && ch !== ' ') expect(!!(s.pal?.[ch] ?? PALETTE[ch]), `${name} uses unknown color '${ch}'`).toBe(true)
    }
  })
  it('faces and screen pictures exist', () => {
    for (const f of Object.values(FACE)) expect(SPRITES[f], f).toBeTruthy()
    for (const p of ['face.boss_happy', 'face.boss_worry']) expect(SPRITES[p], p).toBeTruthy()
  })
})

describe('screen words', () => {
  it('every screen word has ja + en', () => {
    for (const [k, v] of Object.entries(S)) {
      if (typeof v === 'function') {
        const x = (v as (a: never, b: never) => L10n)(2 as never, 1 as never)
        expect(x.ja.length > 0 && x.en.length > 0, `S.${k}`).toBe(true)
      } else if ('ja' in (v as object)) l10n(`S.${k}`, v as L10n)
      else for (const [k2, v2] of Object.entries(v as Record<string, L10n>)) l10n(`S.${k}.${k2}`, v2)
    }
  })
})
