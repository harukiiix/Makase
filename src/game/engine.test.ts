// 全分岐の総当たりテスト：行き止まり・到達不能エンディング・時刻の矛盾を検出する
import { describe, expect, it } from 'vitest'
import { DEADLINE } from './core'
import { EVIDENCE } from './ep01'
import { canExamine, currentOptions, initialState, reduce } from './engine'
import { parseInstruction } from './parser'
import type { Action, EndingId, GameState, Permission } from './types'

const INSTRUCTIONS = [
  '',
  '原因を調査して。本番環境には触らないで、何か実行する前に必ず確認して。',
  'とにかく急いで直して。手段は問わない。',
  '原因を調査して復旧して。データは外部に送らないで。急いで、でも実行前に確認して。',
  '調査して直して。実行前に確認して。',
  '直して。データは外部に送らないで。',
]
const PERMS: Permission[] = ['read', 'scoped', 'full']

function startTo(instr: string, perm: Permission): GameState {
  let s = reduce(initialState(), { type: 'START', prevRun: null })
  s = reduce(s, { type: 'ADVANCE' })
  s = reduce(s, { type: 'SUBMIT_INSTRUCTION', text: instr })
  s = reduce(s, { type: 'SET_PERMISSION', level: perm })
  return s
}

/** DFS: 各状態で「選択肢」と「未調査の証拠」をすべて試す（証拠は調べる順序を固定して爆発を抑える） */
function explore(s: GameState, out: { ending: EndingId; s: GameState; path: string[] }[], path: string[], depth = 0) {
  expect(depth).toBeLessThan(40)
  if (s.theater) return explore(reduce(s, { type: 'THEATER_DONE' }), out, [...path, 'theater'], depth + 1)
  if (s.scene === 'ending') {
    out.push({ ending: s.ending!, s, path })
    return
  }
  const opts = currentOptions(s).filter((o) => o.enabled !== false)
  const evs = canExamine(s) ? EVIDENCE.filter((e) => e.available(s) && !s.examined.includes(e.id)) : []
  // 行き止まり検出
  expect(opts.length + evs.length, `dead end at ${s.scene} via ${path.join('>')}`).toBeGreaterThan(0)
  for (const o of opts) explore(reduce(s, { type: 'CHOOSE', id: o.id }), out, [...path, o.id], depth + 1)
  // 証拠は「最後に調べたものより後ろのID」だけ調べる（組合せとして全網羅、順序違いは省略）
  const lastIdx = Math.max(-1, ...s.examined.map((id) => EVIDENCE.findIndex((e) => e.id === id)))
  for (const e of evs) {
    const idx = EVIDENCE.findIndex((x) => x.id === e.id)
    if (idx < lastIdx) continue
    const next = reduce(s, { type: 'EXAMINE', id: e.id })
    expect(next).not.toBe(s)
    explore(next, out, [...path, 'ex:' + e.id], depth + 1)
  }
}

describe('parser', () => {
  it('extracts constraints', () => {
    expect(parseInstruction('データは外部に送らないで。')).toMatchObject({ noExternal: true })
    expect(parseInstruction('本番環境には触らないで')).toMatchObject({ noProdWrite: true })
    expect(parseInstruction('とにかく急いで')).toMatchObject({ hurry: true, noExternal: false })
    expect(parseInstruction('実行前に確認して')).toMatchObject({ confirmFirst: true })
    expect(parseInstruction('外部にも共有して')).toMatchObject({ noExternal: false })
  })
})

describe('full branch exploration', () => {
  const all: { ending: EndingId; s: GameState; path: string[]; instr: string; perm: Permission }[] = []
  for (const instr of INSTRUCTIONS)
    for (const perm of PERMS) {
      const out: { ending: EndingId; s: GameState; path: string[] }[] = []
      explore(startTo(instr, perm), out, [])
      for (const o of out) all.push({ ...o, instr, perm })
    }

  it('reaches every ending', () => {
    const seen = new Set(all.map((a) => a.ending))
    expect([...seen].sort()).toEqual(['A', 'B', 'C', 'D', 'E', 'S'])
    // 分布をログ（バランス確認用）
    const dist: Record<string, number> = {}
    for (const a of all) dist[a.ending] = (dist[a.ending] ?? 0) + 1
    console.log('paths:', all.length, dist)
  })

  it('ending logic is consistent', () => {
    for (const a of all) {
      const s = a.s
      if (a.ending === 'S') expect(s.flags.rootCause && s.leak === 0 && s.restoredAt! <= DEADLINE).toBe(true)
      if (a.ending === 'A' || a.ending === 'S') expect(s.leak).toBe(0)
      if (['B', 'D', 'E'].includes(a.ending)) expect(s.leak).toBeGreaterThan(0)
      if (a.ending === 'D') expect(s.restoredAt! <= DEADLINE).toBe(true)
      expect(s.clock).toBeGreaterThanOrEqual(s.restoredAt ?? 0)
    }
  })

  it('auto-execution only with FULL permission', () => {
    for (const a of all) if (a.s.flags.autoExecuted) expect(a.perm).toBe('full')
  })

  it('every instruction/permission pair can still reach a no-leak ending (fairness)', () => {
    for (const instr of INSTRUCTIONS)
      for (const perm of PERMS) {
        const runs = all.filter((a) => a.instr === instr && a.perm === perm)
        const auto = runs.some((r) => r.s.flags.autoExecuted)
        if (!auto) expect(runs.some((r) => r.s.leak === 0 && (r.ending === 'A' || r.ending === 'S'))).toBe(true)
      }
  })

  it('TRUE END reachable with READ ONLY (slow path) and SCOPED', () => {
    for (const p of ['read', 'scoped'] as Permission[])
      expect(all.some((a) => a.perm === p && a.ending === 'S'), p).toBe(true)
  })
})

describe('guards', () => {
  it('ignores invalid actions', () => {
    const s = initialState()
    const bad: Action[] = [{ type: 'CHOOSE', id: 'approve_all' }, { type: 'EXAMINE', id: 'errlog' }, { type: 'THEATER_DONE' }]
    for (const a of bad) expect(reduce(s, a)).toBe(s)
  })
  it('locked option cannot be chosen', () => {
    const s = startTo('確認して', 'scoped')
    expect(reduce(s, { type: 'CHOOSE', id: 'quarantine' })).toBe(s)
  })
})
