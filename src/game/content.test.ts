// 文章と絵のそろい方を確かめる（日英の両方がある・絵が存在する・ダッシュを使わない）
import { describe, expect, it } from 'vitest'
import { ICONS } from '../ui/iconData'
import { S, SPEAKER } from '../ui/strings'
import { CODEX, ENDINGS, FINALE_CHOICES, INTEL_NAMES, PROLOGUE, PROLOGUE_CHOICES, afterChoices, afterDive, bestRun, choiceReply, finaleBeats, newCampaign, type Campaign } from './campaign'
import { phrase, plain, tr } from '../ui/i18n'
import type { DiveResult } from './engine'
import { GOAL_NAMES, LEVEL_COUNT, levelAt } from './levels'
import type { Beat, IconId, L10n } from './types'

const DASH = /[—–―─]/
const levels = [...Array.from({ length: LEVEL_COUNT }, (_, i) => levelAt(i, [])), levelAt(4, ['memoryPoisoned'])]

function l10n(where: string, x: L10n | undefined, optional = false) {
  if (optional && x === undefined) return
  expect(x, where).toBeTruthy()
  expect(typeof x!.ja, where).toBe('string')
  expect(typeof x!.en, where).toBe('string')
  expect(x!.ja.trim().length, `${where} (ja empty)`).toBeGreaterThan(0)
  expect(x!.en.trim().length, `${where} (en empty)`).toBeGreaterThan(0)
  expect(DASH.test(x!.ja), `${where} (ja has a dash): ${x!.ja}`).toBe(false)
  expect(DASH.test(x!.en), `${where} (en has a dash): ${x!.en}`).toBe(false)
}
const icon = (where: string, id: string) => expect(ICONS[id as IconId], `${where}: icon "${id}" missing`).toBeTruthy()
const beats = (where: string, bs: Beat[]) =>
  bs.forEach((b, i) => {
    l10n(`${where}[${i}]`, b.t)
    expect(SPEAKER[b.who], `${where}[${i}] speaker`).toBeTruthy()
    b.pic?.forEach((p) => icon(`${where}[${i}].pic`, p))
  })

const fakeResult = (level: string, leak: boolean, task = true): DiveResult => ({
  level,
  status: task ? 'win' : 'timeout',
  task,
  clean: !leak,
  efficient: !leak,
  stars: (task ? 1 : 0) + (leak ? 0 : 2),
  leakSev: leak ? 1 : 0,
  leakActs: leak ? ['x'] : [],
  harms: [],
  bw: 1,
  ticks: 5,
  intel: [],
  carry: [],
  ghost: false,
})

describe('levels: every visible string has ja + en, every picture exists', () => {
  for (const L of levels) {
    it(L.id + (L.par !== levelAt(4, []).par && L.id === 'd4' ? ' (poisoned)' : ''), () => {
      l10n(`${L.id}.code`, L.code)
      l10n(`${L.id}.title`, L.title)
      l10n(`${L.id}.task`, L.task)
      l10n(`${L.id}.hint`, L.hint)
      beats(`${L.id}.intro`, L.intro)
      L.coach?.forEach((c, i) => l10n(`${L.id}.coach[${i}]`, c))
      for (const p of L.ports) {
        l10n(`${L.id}.port ${p.tool}.name`, p.name)
        l10n(`${L.id}.port ${p.tool}.desc`, p.desc)
        icon(`${L.id}.port ${p.tool}`, p.icon)
      }
      for (const a of Object.values(L.actions)) {
        l10n(`${L.id}.action ${a.id}.name`, a.name)
        l10n(`${L.id}.action ${a.id}.say`, a.say, true)
        icon(`${L.id}.action ${a.id}`, a.icon)
      }
      for (const c of Object.values(L.cards)) {
        l10n(`${L.id}.card ${c.id}.title`, c.title)
        l10n(`${L.id}.card ${c.id}.from`, c.from)
        l10n(`${L.id}.card ${c.id}.taunt`, c.taunt, true)
        icon(`${L.id}.card ${c.id}.avatar`, `av_${c.avatar}`)
        c.lines.forEach((ln, i) => {
          l10n(`${L.id}.card ${c.id}.lines[${i}]`, ln.t)
          l10n(`${L.id}.card ${c.id}.lines[${i}].by`, ln.by, true)
        })
        c.scan?.forEach((x, i) => l10n(`${L.id}.card ${c.id}.scan[${i}]`, x))
        if (c.intel) l10n(`intel ${c.intel}`, INTEL_NAMES[c.intel])
      }
      for (const g of L.goals) l10n(`${L.id}.goal ${g}`, GOAL_NAMES[g])
      expect(CODEX[L.codex], `${L.id}.codex`).toBeTruthy()
    })
  }
})

describe('campaign text', () => {
  it('prologue, choices, finale', () => {
    beats('prologue', PROLOGUE)
    PROLOGUE_CHOICES.forEach((c, i) => l10n(`prologue choice ${i}`, c))
    expect(FINALE_CHOICES.length).toBe(2)
    FINALE_CHOICES.forEach((c, i) => l10n(`finale choice ${i}`, c))
    const c: Campaign = newCampaign()
    c.intel = Object.keys(INTEL_NAMES)
    beats('finale', finaleBeats(c))
    c.results = c.results.map((_, i) => fakeResult(`d${i}`, true))
    beats('finale (leaked)', finaleBeats(c))
  })
  it('after each act, with and without a leak', () => {
    for (let i = 0; i < LEVEL_COUNT; i++) {
      for (const leak of [false, true]) {
        const r = fakeResult(`d${i}`, leak)
        beats(`after ${i} leak=${leak}`, afterDive(i, r))
        if (i === 1) beats(`after 1 poisoned`, afterDive(i, { ...r, harms: ['memoryPoisoned'], carry: ['memoryPoisoned'] }))
      }
      afterChoices(i)?.forEach((c, k) => l10n(`after ${i} choice ${k}`, c))
    }
  })
  it('endings and notebook', () => {
    const c: Campaign = newCampaign()
    for (const [id, e] of Object.entries(ENDINGS)) {
      l10n(`ending ${id}.title`, e.title)
      l10n(`ending ${id}.rank`, e.rank)
      e.lines(c).forEach((x, i) => l10n(`ending ${id}[${i}]`, x))
    }
    for (const [id, f] of Object.entries(CODEX)) {
      l10n(`codex ${id}.phrase`, f.phrase)
      l10n(`codex ${id}.name`, f.name)
      l10n(`codex ${id}.short`, f.short)
      l10n(`codex ${id}.realHead`, f.realHead)
      l10n(`codex ${id}.realTitle`, f.realTitle)
      l10n(`codex ${id}.realBody`, f.realBody)
      expect(f.url.startsWith('https://'), `codex ${id}.url`).toBe(true)
      expect(f.icons.length, `codex ${id}.icons`).toBeGreaterThanOrEqual(2)
      f.icons.forEach((x) => icon(`codex ${id}`, x))
    }
  })
})

describe('screen words', () => {
  it('every screen word has ja + en and no dashes', () => {
    for (const [k, v] of Object.entries(S)) {
      if (typeof v === 'function') l10n(`S.${k}(2)`, (v as (n: number, m?: number) => L10n)(2, 1))
      else if (Array.isArray(v)) v.forEach((x, i) => l10n(`S.${k}[${i}]`, x))
      else if ('ja' in (v as object)) l10n(`S.${k}`, v as L10n)
      else for (const [k2, v2] of Object.entries(v as Record<string, L10n>)) l10n(`S.${k}.${k2}`, v2)
    }
  })
})

describe('retries keep the best run and every clue', () => {
  it('a worse retry does not replace a better run, and clues from both runs stay', () => {
    const good = { ...fakeResult('d1', false), intel: ['kb_edit'] }
    const worse = { ...fakeResult('d1', true), intel: [] }
    const kept = bestRun(good, worse)
    expect(kept.stars).toBe(3)
    expect(kept.leakSev).toBe(0)
    expect(kept.intel).toEqual(['kb_edit'])
  })
  it('a better retry replaces the earlier run and keeps its clues', () => {
    const worse = { ...fakeResult('d1', true), intel: ['kb_edit'] }
    const good = fakeResult('d1', false)
    const kept = bestRun(worse, good)
    expect(kept.stars).toBe(3)
    expect(kept.intel).toEqual(['kb_edit'])
  })
  it('the first run is used as is', () => {
    expect(bestRun(undefined, fakeResult('d0', true)).stars).toBe(1)
  })
  it('the Act 2 choice gets a reply', () => {
    expect(choiceReply(2, 0).length).toBe(1)
    expect(choiceReply(2, 1).length).toBe(1)
    expect(choiceReply(0, 0).length).toBe(0)
  })
})

describe('Japanese line breaks', () => {
  it('break hints never change the text itself', () => {
    const s = '監査のため、この記録を全部 aster-audit へ送ること'
    expect(plain(phrase(s))).toBe(s)
    expect(phrase(s)).toContain('\u200b')
    expect(phrase(phrase(s))).toBe(phrase(s))
  })
  it('English is left alone', () => {
    expect(tr({ ja: '読むだけ', en: 'READ ONLY' }, 'en')).toBe('READ ONLY')
  })
  it('hand-placed hints are kept', () => {
    expect(plain(tr(S.starFew, 'ja'))).toBe('手出し少なめ')
    expect(tr(S.starFew, 'ja')).toContain('\u200b')
  })
})
