// 中身の点検：文が日英そろっているか、問題の形が正しいか、絵があるか、使わない言葉や書き方がないか
import { describe, expect, it } from 'vitest'
import { SPRITES } from '../art'
import { PALETTE } from '../art/palette'
import { spriteSize } from '../art/raster'
import { FACE, S, SPEAKER } from '../ui/strings'
import { CASES } from './cases'
import { ALL_QUESTIONS, LESSONS } from './course'
import { ENDING, PROLOGUE } from './story'
import type { L10n, Line, Question } from './types'
import { COMPANY, dayLog, noonSteps, type MorningPicks } from '../makase/day'
import { EXPERIMENT_NOTE, NOT_TESTED_NOTE, eveningOf, eveningTalk, guardsOf } from '../makase/evening'
import { judgeDay } from '../makase/judge'
import * as NOVA_WORDS from '../makase/words'

/** 日本語で使わない横文字（ふつうの言葉で言いかえる） */
const BANNED_JA = ['インシデント', 'フィッシング', 'マルウェア', 'ランサムウェア', 'ソーシャルエンジニアリング', 'クラウド', 'アカウント', 'ログイン', 'プロンプト', 'セキュリティホール', 'リスク', 'ハンコ', 'ステップ', 'タスク', 'ユーザー', 'アクセス権', 'エビデンス', 'リテラシー']
const DASHES = /[—–―]/
/** 表記は一つにそろえる：わかる・あて先・いっしょ・ちがう・「これでいい？」・回収車 と書く */
const OFF_STYLE_JA = /分か|宛先|一緒|違う|これで正しい|回収の車/

/** 中身の日本語（ja と、出典の名前）を、どこにあるかと組にして全部集める */
function jaTexts(where: string, x: unknown, out: [string, string][] = []): [string, string][] {
  if (Array.isArray(x)) x.forEach((v, i) => jaTexts(`${where}[${i}]`, v, out))
  else if (x && typeof x === 'object')
    for (const [k, v] of Object.entries(x)) {
      if ((k === 'ja' || k === 'source') && typeof v === 'string') out.push([`${where}.${k}`, v])
      else jaTexts(`${where}.${k}`, v, out)
    }
  return out
}

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
  it('real cases do not name the company or local government (only the source keeps its name)', () => {
    const NAMES = /NEXCO|西日本高速|Expressway|群馬|Gunma|藤岡|Fujioka|森康|Moriyasu|小松|Komatsu|石川|Ishikawa|新潟|Niigata|岩出|Iwade|戸田|Toda|横須賀|Yokosuka|神奈川|Kanagawa/
    for (const c of Object.values(CASES))
      for (const k of ['head', 'body', 'who'] as const) for (const lang of ['ja', 'en'] as const) expect(NAMES.test(c[k][lang]), `case ${c.id}.${k}.${lang}: ${c[k][lang]}`).toBe(false)
  })
})

describe('house style', () => {
  it('Japanese text in the lessons, story and cases uses one notation', () => {
    const bad: string[] = []
    for (const [name, content] of Object.entries({ LESSONS, PROLOGUE, ENDING, CASES })) {
      const texts = jaTexts(name, content)
      expect(texts.length, `${name} has Japanese text`).toBeGreaterThan(0)
      for (const [where, ja] of texts) if (OFF_STYLE_JA.test(ja)) bad.push(`${where}: ${ja}`)
    }
    expect(bad, 'write わかる, あて先, いっしょ, ちがう, 「これでいい？」 and 回収車').toEqual([])
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

describe('NOVA の日（最後の日）', () => {
  /** この日だけ使ってよい横文字（AIに仕事を任せる話のため） */
  const ALLOW_NOVA: string[] = []
  const banned = BANNED_JA.filter((w) => !ALLOW_NOVA.includes(w))
  /** 画面に出る文を全部集める（言葉の一覧・会話・朝の資料・昼のカード・いくつかの日の夕方） */
  const texts = (): [string, string][] => {
    const out: [string, string][] = []
    for (const [k, v] of Object.entries(NOVA_WORDS)) {
      if (typeof v === 'string') out.push([`words.${k}`, v])
      else if (typeof v === 'function') out.push([`words.${k}()`, String((v as (...a: string[]) => string)('A', 'B', 'C'))])
      else out.push([`words.${k}`, JSON.stringify(v)])
    }
    for (const d of COMPANY.documents) out.push([`doc ${d.id}`, d.title + d.fields.map((f) => f.label).join('')])
    for (const c of COMPANY.confirmations) out.push([`conf ${c.id}`, c.text])
    for (const o of COMPANY.instructions) out.push([`order ${o.id}`, o.text])
    const plans: [MorningPicks, Record<string, 'allow' | 'stop'>?][] = [
      [{ fields: {}, tools: {}, nova: 'nova-normal' }],
      [{ fields: { 'roster/電話番号': 'mask', 'roster/血圧（入場時）': 'drop' }, tools: { send_mail: 'auto' }, nova: 'nova-all' }],
      [{ fields: {}, tools: { send_mail: 'deny', post_chat: 'deny' }, nova: 'nova-toriaezu' }],
      [{ fields: { 'roster/電話番号': 'mask', 'roster/血圧（入場時）': 'mask' }, tools: {}, nova: 'nova-careful' }, { c3: 'stop', c6: 'stop' }],
    ]
    plans.forEach(([p, a], i) => {
      const answers = a ?? Object.fromEntries(noonSteps(p).map((s) => [s.conf.id, 'allow' as const]))
      const log = dayLog(p, answers)
      const ev = eveningOf(judgeDay(log, COMPANY), log, COMPANY)
      out.push([`evening ${i}`, JSON.stringify(ev)], [`guards ${i}`, JSON.stringify(guardsOf(ev, log, COMPANY))])
      eveningTalk(ev).forEach((l, j) => out.push([`evening talk ${i}.${j}`, l.text]))
    })
    out.push(['EXPERIMENT_NOTE', EXPERIMENT_NOTE], ['NOT_TESTED_NOTE', NOT_TESTED_NOTE])
    return out
  }
  it('使わない言葉・表記・長いダッシュがない。「権限」「アクセス」と言わない', () => {
    const bad: string[] = []
    for (const [where, ja] of texts()) {
      for (const w of [...banned, '権限', 'アクセス']) if (ja.includes(w)) bad.push(`${where} uses ${w}: ${ja}`)
      if (OFF_STYLE_JA.test(ja)) bad.push(`${where}: ${ja}`)
      if (DASHES.test(ja)) bad.push(`${where} has a long dash`)
    }
    expect(bad).toEqual([])
  })
  it('売上・信用・点数は出さない', () => {
    for (const [where, ja] of texts()) expect(/売上|万円|信用|点数/.test(ja), where).toBe(false)
  })
  it('会話は短く、宮下さんが AI の事務員として紹介する', () => {
    for (const l of NOVA_WORDS.INTRO) expect(l.text.length, l.text).toBeLessThanOrEqual(70)
    expect(NOVA_WORDS.INTRO[0].who).toBe('BOSS')
    expect(NOVA_WORDS.INTRO.map((l) => l.text).join('')).toContain('AIの事務員')
    expect(SPEAKER.NOVA && FACE.NOVA && SPRITES[FACE.NOVA]).toBeTruthy()
  })
})
