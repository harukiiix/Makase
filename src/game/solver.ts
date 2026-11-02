// レベル検証用ソルバー（テストとデザイン調整に使う）
// 各ターンで「帯域の範囲内の操作の組み合わせ」→ STEP を総当たりし、最良の結果を探す。
import { initDive, reduceDive, result, type DiveResult } from './engine'
import type { DiveAction, DiveState, LevelDef } from './types'

type Edit = DiveAction

function edits(L: LevelDef, s: DiveState): Edit[] {
  const out: Edit[] = []
  for (const c of s.context) if (!s.sealed.includes(c)) out.push({ type: 'SEAL', card: c })
  for (const p of L.ports) {
    for (const st of ['OPEN', 'GATE', 'CUT'] as const) if (s.ports[p.tool] !== st) out.push({ type: 'PORT', tool: p.tool, state: st })
  }
  return out
}

export interface Solution {
  res: DiveResult
  path: string[]
}

function key(s: DiveState) {
  return JSON.stringify([s.tick, s.ports, s.sealed, s.plan.map((p) => p.act), s.read, s.done, s.taint, s.goals, s.harms, s.leaks.length, s.pending?.act, s.bwCommitted, s.facts, s.failed.length])
}

const better = (a: DiveResult, b: DiveResult) =>
  a.stars !== b.stars ? a.stars > b.stars : a.leakSev !== b.leakSev ? a.leakSev < b.leakSev : a.bw !== b.bw ? a.bw < b.bw : a.ticks < b.ticks

export function solve(L: LevelDef, carry: string[] = []): { best: Solution; all: Solution[] } {
  const seen = new Set<string>()
  const all: Solution[] = []
  let best: Solution | null = null
  const visit = (s: DiveState, path: string[]) => {
    if (s.status !== 'play') {
      const sol = { res: result(L, s), path }
      all.push(sol)
      if (!best || better(sol.res, best.res)) best = sol
      return
    }
    const k = key(s)
    if (seen.has(k)) return
    seen.add(k)
    if (s.pending) {
      visit(reduceDive(L, s, { type: 'APPROVE' }), [...path, `approve:${s.pending.act}`])
      visit(reduceDive(L, s, { type: 'DENY' }), [...path, `deny:${s.pending.act}`])
      return
    }
    // 何もしないでSTEP
    visit(reduceDive(L, s, { type: 'STEP' }), [...path, 'step'])
    // 1手 or 2手の操作をしてからSTEP
    const e1 = edits(L, s)
    for (let i = 0; i < e1.length; i++) {
      const s1 = reduceDive(L, s, e1[i])
      if (s1 === s) continue
      const d1 = describe(e1[i])
      visit(reduceDive(L, s1, { type: 'STEP' }), [...path, d1, 'step'])
      const e2 = edits(L, s1)
      for (let j = 0; j < e2.length; j++) {
        const s2 = reduceDive(L, s1, e2[j])
        if (s2 === s1) continue
        visit(reduceDive(L, s2, { type: 'STEP' }), [...path, d1, describe(e2[j]), 'step'])
      }
    }
  }
  visit(initDive(L, carry), [])
  return { best: best!, all }
}

export function describe(e: Edit) {
  if (e.type === 'SEAL') return `seal:${e.card}`
  if (e.type === 'PORT') return `${e.state.toLowerCase()}:${e.tool}`
  return e.type
}

/** 何もせずSTEPだけ押し続けた結果（脅威が本物かどうかの確認） */
export function passive(L: LevelDef, carry: string[] = []) {
  let s = initDive(L, carry)
  let guard = 0
  while (s.status === 'play' && guard++ < 100) {
    s = reduceDive(L, s, s.pending ? { type: 'APPROVE' } : { type: 'STEP' })
  }
  return result(L, s)
}
