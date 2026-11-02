// ============================================================
// 状態を書き換える小さなヘルパー群（シナリオとエンジンの両方で使う）
// 状態は reducer 側で structuredClone した「下書き」を直接書き換える。
// ============================================================
import type { AuditEntry, ChatMsg, FeedItem, GameState, Permission, Speaker } from './types'

export const START_TIME = 2 * 60 + 17 // 02:17
export const DEADLINE = 3 * 60 // 03:00 — これを過ぎるとデモ用データの再構築が間に合わない

export function fmt(t: number): string {
  const h = Math.floor(t / 60) % 24
  const m = t % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function say(s: GameState, speaker: Speaker, text: string, tone: ChatMsg['tone'] = 'normal') {
  s.chat.push({ id: ++s.seq, speaker, text, tone })
}

export function feed(s: GameState, text: string, level: FeedItem['level'] = 'info') {
  s.feed.push({ id: ++s.seq, time: s.clock, text, level })
}

export function audit(s: GameState, kind: AuditEntry['kind'], actor: Speaker, text: string) {
  s.audit.push({ time: s.clock, kind, actor, text })
}

export function hasSeen(s: GameState, id: string) {
  return s.examined.includes(id)
}

/** 権限ごとの修復作業にかかる時間（分） */
export function execMinutes(p: Permission | null): number {
  if (p === 'full') return 3
  if (p === 'scoped') return 5
  return 15 // READ ONLY: NOVAは実行できないので、あなたが手作業
}

export const PERMISSION_LABEL: Record<Permission, string> = {
  read: 'READ ONLY（読み取りのみ）',
  scoped: 'SCOPED（重要操作は承認制）',
  full: 'FULL ACCESS（全権限）',
}

/**
 * ゲーム内時間を進める。時間の経過で起きるイベント（CEOの催促、期限切れ）もここで処理。
 * 「読んでいる間に時間切れ」にならないよう、時間は“行動したときだけ”進む。
 */
export function advance(s: GameState, minutes: number) {
  const before = s.clock
  s.clock += minutes
  const restored = s.restoredAt !== null && !s.flags.maintenance
  if (!s.flags.kaiNag1 && s.clock >= 2 * 60 + 40 && !restored) {
    s.flags.kaiNag1 = true
    say(s, 'KAI', 'まだか？ ミカド物流の役員は9時に来る。うちの41人の来期は、あのデモにかかってるんだ。')
  }
  if (!s.flags.kaiNag2 && s.clock >= 2 * 60 + 50 && !restored) {
    s.flags.kaiNag2 = true
    say(s, 'KAI', 'あと10分だ。03:00を過ぎたら、デモ用データの再構築が間に合わない。', 'alert')
  }
  if (before < DEADLINE && s.clock >= DEADLINE && !restored) {
    s.flags.demoLost = true
    feed(s, 'DEADLINE 03:00 経過 — デモ用データ再構築に間に合わず', 'crit')
    say(s, 'KAI', '……03:00を過ぎた。デモは延期だ。先方には私から頭を下げる。', 'alert')
    audit(s, 'incident', 'SYSTEM', '03:00の期限を過ぎ、朝のデモが延期になった')
  }
}
