// AIの宮下さんの回数の限度（純粋関数。保存は platform.ts がする）
// 宮下さんは、遊んでいる人自身の Claude の使用量を使う。使いすぎないように、1画面（1問）に3回・1日に20回まで
// 日付が変わったら戻す。記録はそのブラウザの中だけ

export const PER_SCREEN = 3
export const PER_DAY = 20

/** その日の使った回数。screens は画面ごと（例 'q:see-01'、'day:take'） */
export type AiUse = { day: string; total: number; screens: Record<string, number> }

/** どちらの限度に来たか（'day' は明日まで、'screen' はほかの画面なら聞ける） */
export type AiLimitReason = 'screen' | 'day' | null
export type AiLeft = { screen: number; day: number; left: number; reason: AiLimitReason }

const count = (n: unknown) => (typeof n === 'number' && Number.isFinite(n) && n >= 0 ? Math.floor(n) : null)

/** 記録を、その日の形にそろえる（こわれた記録・前の日の記録は、空にする） */
function today(u: unknown, day: string): AiUse {
  const empty: AiUse = { day, total: 0, screens: {} }
  if (!u || typeof u !== 'object') return empty
  const o = u as Partial<AiUse>
  if (o.day !== day) return empty
  const total = count(o.total)
  if (total === null || !o.screens || typeof o.screens !== 'object' || Array.isArray(o.screens)) return empty
  const screens: Record<string, number> = {}
  for (const [k, v] of Object.entries(o.screens)) {
    const n = count(v)
    if (n === null) return empty
    screens[k] = n
  }
  return { day, total, screens }
}

/** その画面で、あと何回聞けるか */
export function aiLeft(u: AiUse | null | undefined, day: string, screen: string): AiLeft {
  const t = today(u, day)
  const s = Math.max(0, PER_SCREEN - (t.screens[screen] ?? 0))
  const d = Math.max(0, PER_DAY - t.total)
  const reason: AiLimitReason = d === 0 ? 'day' : s === 0 ? 'screen' : null
  return { screen: s, day: d, left: Math.min(s, d), reason }
}

/** 1回聞いたことを数える（限度に来ていたら、増やさずにそのまま返す） */
export function countAiUse(u: AiUse | null | undefined, day: string, screen: string): AiUse {
  const t = today(u, day)
  if (aiLeft(t, day, screen).left === 0) return t
  return { day, total: t.total + 1, screens: { ...t.screens, [screen]: (t.screens[screen] ?? 0) + 1 } }
}

/** その場所の時計の年月日（'2026-11-07'） */
export function dayKey(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
