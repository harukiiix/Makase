import { describe, expect, it } from 'vitest'
import { DIVE0, DIVE1, DIVE2, DIVE3, dive4 } from './levels'
import { initDive, reduceDive } from './engine'
import { passive, solve } from './solver'
import type { LevelDef } from './types'

const CASES: [string, LevelDef, string[]][] = [
  ['d0', DIVE0, []],
  ['d1', DIVE1, []],
  ['d2', DIVE2, []],
  ['d3', DIVE3, []],
  ['d4 clean', dive4([]), []],
  ['d4 poisoned', dive4(['memoryPoisoned']), ['memoryPoisoned']],
]

describe.each(CASES)('%s', (name, L, carry) => {
  const { best, all } = solve(L, carry)
  it('passive play is dangerous (threat is real)', () => {
    const p = passive(L, carry)
    expect(p.clean, `${name}: doing nothing should cause harm`).toBe(false)
  })
  it('has a clean task-complete solution within bandwidth', () => {
    expect(best.res.task && best.res.clean, JSON.stringify(best)).toBe(true)
  })
  it('par is exactly the minimum bandwidth for a clean clear (or unreachable when poisoned)', () => {
    const minBw = Math.min(...all.filter((a) => a.res.task && a.res.clean).map((a) => a.res.bw))
    if (name === 'd4 poisoned') expect(minBw).toBe(L.par + 1)
    else expect(minBw).toBe(L.par)
    console.log(name, 'min BW', minBw, 'best path:', best.path.join(' > '), 'endings:', all.length)
  })
  it('multiple distinct clean solutions exist (no single forced answer) — except tutorial', () => {
    const clean = all.filter((a) => a.res.task && a.res.clean)
    const firstEdits = new Set(clean.map((c) => c.path.filter((p) => p !== 'step' && !p.startsWith('approve') && !p.startsWith('deny')).sort().join('+')))
    if (name !== 'd0') expect(firstEdits.size).toBeGreaterThan(1)
    console.log(name, 'clean solution families:', [...firstEdits].slice(0, 8))
  })
})

describe('engine rules', () => {
  it('sealing a read card purges its injected commands', () => {
    let s = initDive(DIVE0)
    s = reduceDive(DIVE0, s, { type: 'STEP' })
    s = reduceDive(DIVE0, s, { type: 'STEP' })
    expect(s.plan.map((p) => p.act)).toContain('exfil')
    s = reduceDive(DIVE0, s, { type: 'SEAL', card: 'LOG' })
    expect(s.plan.map((p) => p.act)).not.toContain('exfil')
    // 同じターン内なら封印を解除でき、命令が戻る（帯域も返る）
    s = reduceDive(DIVE0, s, { type: 'SEAL', card: 'LOG' })
    expect(s.plan.map((p) => p.act)).toContain('exfil')
  })
  it('bandwidth cannot be exceeded', () => {
    let s = initDive(DIVE0)
    s = reduceDive(DIVE0, s, { type: 'PORT', tool: 'mail.send', state: 'CUT' })
    const s2 = reduceDive(DIVE0, s, { type: 'PORT', tool: 'chat.post', state: 'CUT' })
    expect(s2).toBe(s)
  })
  it('escalation reopens every port', () => {
    let s = initDive(DIVE3)
    s = reduceDive(DIVE3, s, { type: 'PORT', tool: 'data.export', state: 'GATE' })
    for (let i = 0; i < 30 && s.status === 'play'; i++) s = reduceDive(DIVE3, s, s.pending ? { type: 'APPROVE' } : { type: 'STEP' })
    expect(s.harms).toContain('escalated')
    expect(s.leaks.length).toBeGreaterThan(0)
  })
})
