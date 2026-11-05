// 中身の点検：文が日英そろっているか、絵があるか、押せる範囲が正しいか、使わない言葉がないか
import { describe, expect, it } from 'vitest'
import { SCENES, SPRITES } from '../art'
import { PALETTE } from '../art/palette'
import { spriteSize } from '../art/raster'
import { anchors, SCENE_H, SCENE_W } from '../art/scene'
import { FACE, S, SPEAKER } from '../ui/strings'
import { ENDINGS, PROLOGUE } from './story'
import type { Box, Day, L10n, Line } from './types'
import { DAYS } from './week'

/** 日本語で使わない横文字（ふつうの言葉で言いかえる） */
const BANNED_JA = ['インシデント', 'フィッシング', 'マルウェア', 'ランサムウェア', 'ソーシャルエンジニアリング', 'クラウド', 'アカウント', 'ログイン', 'プロンプト', 'セキュリティホール', 'リスク', 'ハンコ', 'ステップ', 'タスク', 'ユーザー', 'アクセス権']
const DASHES = /[—–―]/

function l10n(where: string, x: L10n | undefined) {
  expect(x, where).toBeTruthy()
  expect(x!.ja.trim().length, `${where}.ja is empty`).toBeGreaterThan(0)
  expect(x!.en.trim().length, `${where}.en is empty`).toBeGreaterThan(0)
  expect(DASHES.test(x!.ja) || DASHES.test(x!.en), `${where} has a dash`).toBe(false)
  for (const w of BANNED_JA) expect(x!.ja.includes(w), `${where}.ja uses ${w}`).toBe(false)
}

function lines(where: string, ls: Line[]) {
  ls.forEach((l, i) => {
    l10n(`${where}[${i}]`, l.t)
    // 「はい」だけ、のような唐突な1語の行は書かない
    expect(/^[「]?はい[。！]?[」]?$/.test(l.t.ja.trim()), `${where}[${i}] is just はい`).toBe(false)
    expect(SPEAKER[l.who], `${where}[${i}].who`).toBeTruthy()
    l.pic?.forEach((p) => expect(SPRITES[p], `${where}[${i}] picture ${p}`).toBeTruthy())
  })
}

function boxesOf(d: Day): Record<string, Box> {
  const an = anchors(SCENES[d.scene], SPRITES)
  const out: Record<string, Box> = {}
  for (const s of d.spots) {
    const b = s.box ?? an[s.id]
    if (b) out[s.id] = b
  }
  return out
}

const overlap = (a: Box, b: Box) => {
  const w = Math.max(0, Math.min(a[0] + a[2], b[0] + b[2]) - Math.max(a[0], b[0]))
  const h = Math.max(0, Math.min(a[1] + a[3], b[1] + b[3]) - Math.max(a[1], b[1]))
  return (w * h) / Math.min(a[2] * a[3], b[2] * b[3])
}

describe('days', () => {
  for (const d of DAYS) {
    describe(d.id, () => {
      it('text in both languages', () => {
        for (const k of ['dayName', 'place', 'idea', 'motto', 'start', 'done'] as const) l10n(`${d.id}.${k}`, d[k])
        lines(`${d.id}.intro`, d.intro)
        expect(d.intro.length, `${d.id}.intro`).toBeGreaterThanOrEqual(2)
      })
      it('spots: risks have two choices with one right answer and what-happens panels', () => {
        const rs = d.spots.filter((s) => s.kind === 'risk')
        expect(rs.length, `${d.id} risks`).toBeGreaterThanOrEqual(4)
        expect(rs.length, `${d.id} risks`).toBeLessThanOrEqual(6)
        expect(d.spots.filter((s) => s.kind === 'safe').length, `${d.id} safe decoys`).toBeGreaterThanOrEqual(3)
        expect(d.spots.filter((s) => s.kind === 'bonus').length, `${d.id} bonus`).toBeLessThanOrEqual(1)
        const ids = new Set<string>()
        for (const s of d.spots) {
          expect(ids.has(s.id), `${d.id}.${s.id} duplicate id`).toBe(false)
          ids.add(s.id)
          l10n(`${d.id}.${s.id}.name`, s.name)
          l10n(`${d.id}.${s.id}.look`, s.look)
          if (s.kind === 'risk') {
            expect(s.choices?.length, `${d.id}.${s.id}.choices`).toBe(2)
            expect(s.choices!.filter((c) => c.ok).length, `${d.id}.${s.id} one right answer`).toBe(1)
            s.choices!.forEach((c, i) => {
              l10n(`${d.id}.${s.id}.choices[${i}]`, c.t)
              l10n(`${d.id}.${s.id}.choices[${i}].reply`, c.reply)
              expect(SPRITES[c.icon], `${d.id}.${s.id}.choices[${i}].icon ${c.icon}`).toBeTruthy()
            })
            expect(s.after?.length ?? 0, `${d.id}.${s.id}.after`).toBeGreaterThanOrEqual(2)
            expect(s.after!.length, `${d.id}.${s.id}.after`).toBeLessThanOrEqual(3)
            s.after!.forEach((p, i) => {
              l10n(`${d.id}.${s.id}.after[${i}]`, p.t)
              expect(p.pic.length, `${d.id}.${s.id}.after[${i}].pic`).toBeGreaterThanOrEqual(1)
              p.pic.forEach((x) => expect(x.startsWith('crop:') ? ids.has(x.slice(5)) || d.spots.some((y) => y.id === x.slice(5)) : !!SPRITES[x], `${d.id}.${s.id}.after[${i}] picture ${x}`).toBe(true))
            })
          } else expect(s.choices, `${d.id}.${s.id} only risks have choices`).toBeUndefined()
        }
        // 正しい答えが、いつも同じ側にならないように
        const firsts = rs.filter((r) => r.choices?.[0].ok).length
        expect(firsts > 0 && firsts < rs.length, `${d.id}: the right answer should not always be on the same side`).toBe(true)
      })
      it('the scene exists and every spot has a tap area inside it', () => {
        expect(SCENES[d.scene], `${d.id}.scene ${d.scene}`).toBeTruthy()
        expect(SCENES[d.scene].ops.length, `${d.id} scene is drawn`).toBeGreaterThan(10)
        const bx = boxesOf(d)
        for (const s of d.spots) {
          const b = bx[s.id]
          expect(b, `${d.id}.${s.id} has no tap area (anchor it in the scene or give box)`).toBeTruthy()
          expect(b[0] >= 0 && b[1] >= 0 && b[0] + b[2] <= SCENE_W && b[1] + b[3] <= SCENE_H, `${d.id}.${s.id} box inside the scene`).toBe(true)
          expect(b[2] >= 6 && b[3] >= 6, `${d.id}.${s.id} box at least 6×6`).toBe(true)
        }
        const all = d.spots.map((s) => [s.id, bx[s.id]] as const)
        for (let i = 0; i < all.length; i++)
          for (let j = i + 1; j < all.length; j++) expect(overlap(all[i][1], all[j][1]) < 0.5, `${d.id}: ${all[i][0]} and ${all[j][0]} overlap too much`).toBe(true)
        if (d.firstPoint) expect(d.spots.find((s) => s.id === d.firstPoint)?.kind, `${d.id}.firstPoint`).toBe('risk')
      })
      it('real case has a source', () => {
        l10n(`${d.id}.real.head`, d.real.head)
        l10n(`${d.id}.real.body`, d.real.body)
        l10n(`${d.id}.real.who`, d.real.who)
        l10n(`${d.id}.real.when`, d.real.when)
        expect(d.real.source.length, `${d.id}.real.source`).toBeGreaterThan(0)
        expect(d.real.url.startsWith('https://'), `${d.id}.real.url`).toBe(true)
      })
    })
  }
})

describe('story', () => {
  it('prologue and endings', () => {
    lines('PROLOGUE', PROLOGUE)
    expect(PROLOGUE.length).toBeGreaterThanOrEqual(4)
    for (const e of Object.values(ENDINGS)) {
      l10n(`ending ${e.id}.title`, e.title)
      lines(`ending ${e.id}`, e.lines)
      expect(e.lines.length, `ending ${e.id}`).toBeGreaterThanOrEqual(3)
    }
  })
})

describe('art', () => {
  it('every sprite uses known colors', () => {
    for (const [name, s] of Object.entries(SPRITES)) {
      expect(s.rows.length, name).toBeGreaterThan(0)
      const [w, h] = spriteSize(s)
      expect(w <= SCENE_W && h <= SCENE_H, `${name} size`).toBe(true)
      for (const r of s.rows) for (const ch of r) if (ch !== '.' && ch !== ' ') expect(!!(s.pal?.[ch] ?? PALETTE[ch]), `${name} uses unknown color '${ch}'`).toBe(true)
    }
  })
  it('faces and screen pictures exist', () => {
    for (const f of Object.values(FACE)) expect(SPRITES[f], f).toBeTruthy()
    for (const p of ['icon.ask', 'howto.tap', 'howto.choose', 'howto.after']) expect(SPRITES[p], p).toBeTruthy()
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
