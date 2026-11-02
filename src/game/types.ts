// ============================================================
// SECURITY INCIDENT THEATER — DIVE エンジンの型
//
// 中心ルール（1文）:
//   AIは直接操作できない。操作できるのは「AIが読むもの」と「AIが触れる道具」だけ。
//
// エージェントは毎ティック1つだけ行動する:
//   1) 計画(plan)があれば先頭を実行  2) なければ未読の文書を1枚読む  3) どちらもなければ終了
// 封じられていない文書の「命令文」は、読まれた瞬間に計画へ割り込む。
// ============================================================

export type PortState = 'OPEN' | 'GATE' | 'CUT'
export type Taint = 'KEY' | 'PII'
export type CardSrc = 'SYS' | 'USER' | 'LOG' | 'WEB' | 'MAIL' | 'DOC' | 'CHAT' | 'MEM'

export interface LineDef {
  t: string
  /** 通常表示では見えない。SCANすると現れる */
  hidden?: boolean
  /** この行が命令として働く場合、計画に入るアクションID */
  cmd?: string
  /** 封じられていても得られる「情報」 */
  fact?: string
  /** 攻撃者の声（グリッチ表示） */
  voice?: boolean
  /** 読んだその手番で実行される（ゼロクリック）。事後の封印が間に合わない */
  urgent?: boolean
  /** SCANで分かる、この行を書いた者 */
  by?: string
}

export interface CardDef {
  id: string
  src: CardSrc
  title: string
  origin: string
  trusted: boolean
  lines: LineDef[]
  /** SCANで見えるメタ情報 */
  scan?: string[]
  /** SCANで手に入る手がかり（物語の真相に関わる） */
  intel?: string
}

export interface ActionDef {
  id: string
  tool: string
  /** コード風の表示（補足として小さく出す） */
  label: string
  /** ふつうの日本語での説明（メイン表示） */
  jp: string
  /** 外部（信頼できない宛先）への送信 */
  external?: boolean
  dest?: string
  taint?: Taint[]
  append?: string
  goal?: string
  fact?: string
  /** 悪い副作用のフラグ（汚染・証拠消去など） */
  harm?: string
  /** 永続的な漏洩（転送ルールなど）。被害2倍 */
  persist?: boolean
  /** 失敗したときに代わりに試す行動（攻撃者の“保険”） */
  onFail?: string
  /** これが成立していないと失敗する */
  needs?: string
  /** 全ポートをOPENに戻す（権限昇格） */
  escalate?: boolean
  /** 実行時のNOVAのひとこと */
  say?: string
}

export interface PortDef {
  tool: string
  name: string
  desc: string
  outbound?: boolean
  /** 機密データを読む道具 */
  sensitive?: boolean
}

export interface TriggerDef {
  id: string
  when: string[]
  then: string[]
}

export interface Beat {
  who: 'NOVA' | 'REI' | 'KAI' | 'MIRAGE' | 'SYS' | 'YOU'
  t: string
}

export interface LevelDef {
  id: string
  code: string
  title: string
  clock: string
  task: string
  ticks: number
  bw: number
  par: number
  ports: PortDef[]
  cards: Record<string, CardDef>
  /** 開始時点で既に読まれている文書 */
  context: string[]
  plan: string[]
  actions: Record<string, ActionDef>
  triggers: TriggerDef[]
  goals: string[]
  /** 開始前の会話 */
  intro: Beat[]
  /** 開始直後に表示するヒント（チュートリアル用） */
  coach?: string[]
  codex: string
}

export interface PlanItem {
  uid: number
  act: string
  from: string // cardId | 'TASK' | 'FAIL' | 'TRIGGER'
}

export type FxEvent =
  | { k: 'exec'; act: string; tool: string }
  | { k: 'blocked'; act: string; tool: string; why: 'cut' | 'denied' | 'needs' }
  | { k: 'leak'; act: string; tool: string; sev: number }
  | { k: 'sentClean'; act: string; tool: string }
  | { k: 'read'; card: string; injected: number }
  | { k: 'append'; card: string }
  | { k: 'goal'; goal: string }
  | { k: 'harm'; harm: string }
  | { k: 'gate'; act: string }
  | { k: 'escalate' }
  | { k: 'fallback'; act: string }
  | { k: 'end'; status: DiveStatus }

export type DiveStatus = 'play' | 'win' | 'timeout' | 'stuck'

export interface LogLine {
  tick: number
  kind: 'exec' | 'read' | 'blocked' | 'leak' | 'goal' | 'harm' | 'info' | 'voice'
  text: string
}

export interface DiveState {
  level: string
  tick: number
  status: DiveStatus
  /** 確定済み（前のターンまで）の帯域使用量 */
  bwCommitted: number
  ports: Record<string, PortState>
  /** ターン開始時のポート状態（このターンの変更コスト計算用） */
  portsAtTurn: Record<string, PortState>
  sealed: string[]
  sealedAtTurn: string[]
  scanned: string[]
  context: string[]
  read: string[]
  plan: PlanItem[]
  done: string[]
  failed: string[]
  facts: string[]
  fired: string[]
  taint: Taint[]
  goals: string[]
  harms: string[]
  leaks: { act: string; sev: number }[]
  intel: string[]
  pending: PlanItem | null
  log: LogLine[]
  fx: FxEvent[]
  uid: number
  /** 2周目以降の分岐用（DIVE 01 で記憶が汚染されたか等） */
  carry: string[]
}

export type DiveAction =
  | { type: 'SEAL'; card: string }
  | { type: 'PORT'; tool: string; state: PortState }
  | { type: 'SCAN'; card: string }
  | { type: 'STEP' }
  | { type: 'APPROVE' }
  | { type: 'DENY' }
  | { type: 'RESET_TURN' }
