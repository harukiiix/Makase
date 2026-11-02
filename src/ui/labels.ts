// 画面に出す言葉を、専門用語ではなくふつうの日本語にそろえる
import type { CardSrc, PortState, Taint } from '../game/types'

export const TAINT_JP: Record<Taint, string> = { KEY: '合鍵', PII: '個人情報' }
export const taintJp = (t: Taint[]) => t.map((x) => TAINT_JP[x]).join('・')

export const PORT_STATE_JP: Record<PortState, string> = { OPEN: '許可', GATE: '確認制', CUT: '切断' }

export const SRC_JP: Record<CardSrc, string> = {
  SYS: '設定',
  USER: '依頼',
  LOG: 'ログ',
  WEB: 'Web',
  MAIL: 'メール',
  DOC: '添付',
  CHAT: 'チャット',
  MEM: '記憶',
}
