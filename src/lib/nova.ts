// 最後の日「AIの事務員に頼む練習」の記録（このブラウザに保存）。今の学びの記録（sit.v5）の形は変えず、別のキーにする
const KEY = 'sit.v5.nova'

export type NovaRecord = { done: boolean; leaked: boolean; at: number }

export function loadNova(): NovaRecord | null {
  try {
    const raw = localStorage.getItem(KEY)
    const r = raw ? (JSON.parse(raw) as NovaRecord) : null
    return r && typeof r.done === 'boolean' ? r : null
  } catch {
    return null
  }
}
export function writeNova(r: NovaRecord | null) {
  try {
    if (r) localStorage.setItem(KEY, JSON.stringify(r))
    else localStorage.removeItem(KEY)
  } catch {
    /* noop */
  }
}
