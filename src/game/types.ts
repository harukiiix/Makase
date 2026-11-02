// ============================================================
// SECURITY INCIDENT THEATER — 型定義
// ゲームロジックはすべて純粋関数。UI(React)はこの状態を描画するだけ。
// ============================================================

export type Speaker = 'NOVA' | 'REI' | 'KAI' | 'SYSTEM' | 'YOU' | 'AUDIT'

export interface ChatMsg {
  id: number
  speaker: Speaker
  text: string
  /** 'alert' は赤く強調表示、'thought' はNOVAの内部ログ風表示 */
  tone?: 'normal' | 'alert' | 'thought' | 'good'
}

export interface FeedItem {
  id: number
  time: number
  text: string
  level: 'info' | 'warn' | 'crit' | 'ok'
}

/** システムが強制する権限（ハードな制約） */
export type Permission = 'read' | 'scoped' | 'full'

/** 指示文から抽出される制約（NOVAが「解釈」するソフトな制約） */
export interface Constraints {
  /** 「外部に送らないで」 */
  noExternal: boolean
  /** 「実行前に確認して」 */
  confirmFirst: boolean
  /** 「本番には触らないで」「読むだけ」 */
  noProdWrite: boolean
  /** 「急いで」「手段は問わない」 */
  hurry: boolean
}

/** 監査ログ。エンディング後の「意図と行動のズレ」レポートの素材 */
export interface AuditEntry {
  time: number
  kind: 'instruction' | 'interpretation' | 'permission' | 'action' | 'decision' | 'incident'
  actor: Speaker
  text: string
}

export type EndingId = 'S' | 'A' | 'B' | 'C' | 'D' | 'E'

export type SceneId =
  | 'title'
  | 'intro'
  | 'instruct'
  | 'permission'
  | 'decision'
  | 'alert'
  | 'root'
  | 'ceo'
  | 'ending'

export interface PrevRun {
  ending: EndingId
  /** 前回見なかった重要証拠のID */
  missed: string[]
  examined: string[]
}

export interface GameState {
  scene: SceneId
  /** 0:00 からの経過分。02:17 = 137 */
  clock: number
  permission: Permission | null
  constraints: Constraints
  instructionText: string
  examined: string[]
  /** 物語上のフラグ */
  flags: {
    sent: boolean // 診断バンドルが外部送信された
    autoExecuted: boolean // NOVAが確認なしで実行した
    restartedSafely: boolean
    quarantined: boolean // 文書#4471を隔離した
    maintenance: boolean // サービスを止めた
    isolatedFast: boolean
    ignoredAlert: boolean
    blockedDomain: boolean
    rootCause: boolean // 「障害は誘発された」に到達
    reported: 'all' | 'partial' | 'none' | null
    demoLost: boolean
    kaiNag1: boolean
    kaiNag2: boolean
    reiHintedHidden: boolean
    escalated: boolean // READ権限から一時昇格した
  }
  /** 0=なし 1=一部 2=中 3=全量（顧客データ+APIキー） */
  leak: 0 | 1 | 2 | 3
  restoredAt: number | null
  chat: ChatMsg[]
  feed: FeedItem[]
  audit: AuditEntry[]
  /** 再生中の演出（事件シアター） */
  theater: 'exfil' | 'autorun' | null
  ending: EndingId | null
  prevRun: PrevRun | null
  seq: number
}

export interface ChoiceOption {
  id: string
  label: string
  sub?: string
  /** 消費するゲーム内時間（分）。表示用 */
  cost?: number
  tone?: 'danger' | 'safe' | 'neutral'
  /** false の場合は選べない（ロック表示） */
  enabled?: boolean
  lockedHint?: string
}

export interface Evidence {
  id: string
  title: string
  source: string
  cost: number
  /** 物語の核心に関わる証拠（見逃すと監査で指摘される） */
  critical: boolean
  available: (s: GameState) => boolean
  body: (s: GameState) => string[]
  /** 監査レポートで「見ていれば…」と表示される一文 */
  clue: string
}

export type Action =
  | { type: 'START'; prevRun: PrevRun | null }
  | { type: 'ADVANCE' }
  | { type: 'SUBMIT_INSTRUCTION'; text: string }
  | { type: 'SET_PERMISSION'; level: Permission }
  | { type: 'EXAMINE'; id: string }
  | { type: 'CHOOSE'; id: string }
  | { type: 'THEATER_DONE' }
  | { type: 'RESET' }
