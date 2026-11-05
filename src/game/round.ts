// ============================================================
// 見回り1回分の動き（画面とは別の、ただの計算）
//   押す → 危ない物なら「どうする？」→ 選ぶ → 次の物へ
//   回数の制限はない。ヒントは何回でも（記録には残る）
// ============================================================
import type { Day, DayId, Mark, Spot } from './types'

export interface RoundState {
  day: DayId
  /** 押した物と、その結果 */
  marks: Record<string, Mark>
  /** 危ない物を押して、どうするかを選んでいる途中 */
  asking: string | null
  /** 説明の欄に出している物（look = 押した時の言葉、reply = 選んだあとの言葉、again = もう一度押した） */
  last: { spot: string; show: 'look' | 'reply' | 'again'; choice?: number } | null
  /** 監督に聞いた回数と、いま指している物 */
  hints: number
  hinted: string | null
  /** 押した物の順番（結果の並びに使う） */
  order: string[]
  ended: boolean
}

export type RoundAction = { type: 'TAP'; spot: string } | { type: 'CHOOSE'; index: 0 | 1 } | { type: 'HINT' } | { type: 'END' }

export const risks = (day: Day) => day.spots.filter((s) => s.kind === 'risk')
export const spotOf = (day: Day, id: string): Spot | undefined => day.spots.find((s) => s.id === id)

export function initRound(day: Day): RoundState {
  return { day: day.id, marks: {}, asking: null, last: null, hints: 0, hinted: null, order: [], ended: false }
}

/** 危ない物を全部見つけたか */
export const allFound = (day: Day, s: RoundState) => risks(day).every((r) => s.marks[r.id] === 'right' || s.marks[r.id] === 'other')

export function reduceRound(day: Day, s: RoundState, a: RoundAction): RoundState {
  if (s.ended) return s
  switch (a.type) {
    case 'TAP': {
      const spot = spotOf(day, a.spot)
      if (!spot) return s
      // 「どうする？」に答える前は、ほかの物は押せない（同じ物はそのまま）
      if (s.asking) return s
      if (s.marks[spot.id]) return { ...s, last: { spot: spot.id, show: 'again' } }
      if (spot.kind === 'risk') return { ...s, asking: spot.id, last: { spot: spot.id, show: 'look' }, hinted: s.hinted === spot.id ? null : s.hinted }
      const mark: Mark = spot.kind === 'safe' ? 'safe' : 'bonus'
      return { ...s, marks: { ...s.marks, [spot.id]: mark }, order: [...s.order, spot.id], last: { spot: spot.id, show: 'look' } }
    }
    case 'CHOOSE': {
      if (!s.asking) return s
      const spot = spotOf(day, s.asking)
      const c = spot?.choices?.[a.index]
      if (!spot || !c) return s
      return {
        ...s,
        marks: { ...s.marks, [spot.id]: c.ok ? 'right' : 'other' },
        order: [...s.order, spot.id],
        asking: null,
        last: { spot: spot.id, show: 'reply', choice: a.index },
        hinted: s.hinted === spot.id ? null : s.hinted,
      }
    }
    case 'HINT': {
      if (s.asking) return s
      // まだ見つけていない危ない物を、並びの順に1つ指す
      const next = risks(day).find((r) => !s.marks[r.id])
      if (!next) return s
      return { ...s, hints: s.hints + 1, hinted: next.id, last: null }
    }
    case 'END':
      if (s.asking) return s
      return { ...s, ended: true }
  }
}

/** 1日の結果 */
export interface DayResult {
  day: DayId
  /** 見つけて、正しく対応した */
  right: string[]
  /** 見つけたが、もう一つの対応を選んだ */
  other: string[]
  /** 見落とした */
  missed: string[]
  /** 気になる人（点検の人）を見つけたか */
  bonus: boolean
  hints: number
}

export function resultOf(day: Day, s: RoundState): DayResult {
  const rs = risks(day)
  return {
    day: day.id,
    right: rs.filter((r) => s.marks[r.id] === 'right').map((r) => r.id),
    other: rs.filter((r) => s.marks[r.id] === 'other').map((r) => r.id),
    missed: rs.filter((r) => !s.marks[r.id]).map((r) => r.id),
    bonus: day.spots.some((x) => x.kind === 'bonus' && s.marks[x.id] === 'bonus'),
    hints: s.hints,
  }
}

/** 2つの結果のうち、よいほう（見落としが少ない → 正しい対応が多い → ヒントが少ない）。気になる人は、どちらかで見つけていれば残す */
export function better(a: DayResult | undefined, b: DayResult): DayResult {
  if (!a) return b
  const score = (r: DayResult) => [-r.missed.length, r.right.length, -r.hints]
  const sa = score(a)
  const sb = score(b)
  let pick = b
  for (let i = 0; i < sa.length; i++) {
    if (sa[i] !== sb[i]) {
      pick = sa[i] > sb[i] ? a : b
      break
    }
  }
  return { ...pick, bonus: a.bonus || b.bonus }
}
