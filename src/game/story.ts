// 物語：はじまり（新しく入る人への説明）と、金曜日のあとの結末
import type { DayResult } from './round'
import type { DayId, L10n, Line } from './types'

/** はじめの会話（月曜日の朝。新規入場者教育） */
export const PROLOGUE: Line[] = []

export type EndingId = 'best' | 'good' | 'bad'

export interface Ending {
  id: EndingId
  /** 結末の名前 */
  title: L10n
  lines: Line[]
}

export const ENDINGS: Record<EndingId, Ending> = {
  best: { id: 'best', title: { ja: '', en: '' }, lines: [] },
  good: { id: 'good', title: { ja: '', en: '' }, lines: [] },
  bad: { id: 'bad', title: { ja: '', en: '' }, lines: [] },
}

export type WeekResults = Partial<Record<DayId, DayResult>>

export const missedTotal = (r: WeekResults) => Object.values(r).reduce((n, x) => n + (x?.missed.length ?? 0), 0)
export const bonusTotal = (r: WeekResults) => Object.values(r).filter((x) => x?.bonus).length

/**
 * 結末の決まり（画面にもこのまま説明できる形にする）
 *   見落としが2つまで、かつ「点検の人」に3日以上気づいた → best
 *   見落としが6つまで → good
 *   それより多い → bad
 */
export function endingOf(r: WeekResults): EndingId {
  const m = missedTotal(r)
  if (m <= 2 && bonusTotal(r) >= 3) return 'best'
  if (m <= 6) return 'good'
  return 'bad'
}
