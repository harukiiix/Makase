// ============================================================
// SECURITY INCIDENT THEATER — 型（v3：絵で伝える・日英対応）
//
// 中心ルール:
//   NOVA は、読んだ紙に書いてある「お願い」を、誰のものでも引き受けてしまう。
//   プレイヤーは NOVA を直接は動かせない。できるのは
//   ・紙にハンコを押す（封印：読んでも従わない）
//   ・道具を「使わせる／毎回聞く／使わせない」に切り替える
//   ・紙をよく調べる（無料）
//
// NOVA は1回の「次へ」で1つだけ行動する:
//   1) やることがあれば先頭を実行  2) なければ未読の紙を1枚読む  3) どちらもなければ終わり
// ============================================================

/** 表示言語 */
export type Lang = 'ja' | 'en'
/** 画面に出る文字はすべて日英の両方を持つ */
export type L10n = { ja: string; en: string }

export type PortState = 'OPEN' | 'GATE' | 'CUT'
export type Taint = 'KEY' | 'PII'
export type CardSrc = 'SYS' | 'USER' | 'LOG' | 'WEB' | 'MAIL' | 'DOC' | 'CHAT' | 'MEM'

/**
 * ドット絵アイコン（src/ui/iconData.ts に絵がある）。
 * 文字を読まなくても意味がわかることを最優先にする。
 */
export type IconId =
  // ---- NOVAの行動（やることカードの大きな絵）
  | 'read' // 開いた本：紙を読む
  | 'post' // 吹き出し：社内の連絡に書く
  | 'mail' // 封筒：メールを送る
  | 'upload' // 上向き矢印つきの箱：外へ送る
  | 'web' // 地球：外のページを見る
  | 'key' // カギ：合鍵（パスワードなど）
  | 'notebook' // 鉛筆つきの手帳：NOVAの手帳に書く（記憶）
  | 'restart' // ぐるっと矢印：再起動
  | 'files' // あふれた受け箱：たまった相談を全部
  | 'box' // 錠つきの金庫：隔離する
  | 'forward' // 封筒と「>>>」：ずっと転送
  | 'db' // 顔写真の並んだ表：お客さん名簿
  | 'inbox' // 受け箱に紙：新しい連絡
  | 'export' // 雲へ上がる矢印：保存先へ出す
  | 'crown' // 王冠：全部の権限
  | 'trash' // ゴミ箱：記録を消す
  | 'check' // カギの載った板：点検
  | 'report' // 表と社長への矢印：報告を送る
  | 'phone' // 電話帳：名前の問い合わせ（DNS）
  | 'mask' // 黒塗りの書類とペン：名前を隠す
  | 'download' // 下向き矢印：社内から取ってくる
  // ---- 持ち物・場所
  | 'person' // おばあさんの写真つきの札：お客さんの個人情報
  | 'house' // 星の付いた水色の会社の建物：会社の中（安全な宛先）
  | 'stranger' // フードの人影（目が光る）：外の知らない人
  | 'door' // 外へ矢印が出るドア：出口
  | 'window' // 外へ矢印が出る窓：出口が開いている
  | 'flyer' // 星形の印とマゼンタの行のチラシ：外から来た紙
  // ---- 状態・操作
  | 'lock' // 赤い閉じた錠：使わせない
  | 'bell' // 「？」の付いた黄色い錠：毎回聞く
  | 'open' // 緑の開いた錠：使わせる
  | 'stamp' // 赤いゴムのハンコ：読むだけ（封印）
  | 'magnifier' // 虫めがね：よく調べる
  | 'hand' // 開いた手のひら：止める
  | 'star'
  | 'warning' // 三角に！
  | 'tick' // チェックマーク
  | 'cross' // バツ
  | 'moon'
  | 'sun'
  | 'arrow' // 右向き矢印
  | 'note' // 「！」の付いたマゼンタの付箋：紙の中のお願い（命令）
  | 'paper' // ふつうの紙
  | 'pointer' // 指さしの手（チュートリアル）
  | 'undo' // 戻る矢印
  | 'speaker' // スピーカー（音）
  | 'clock' // 目覚まし時計
  // ---- 顔（紙の差出人など）
  | 'av_boss' // カイ社長：灰色のなでつけ髪、スーツと赤いネクタイ
  | 'av_rei' // レイ：黒いボブ、細いメガネ、水色の名札
  | 'av_stranger' // 知らない人：フードの人影（stranger と同じ）
  | 'av_vendor' // 業者（ヘリックス社）：ロゴ入りの帽子の作業員
  | 'av_toki' // トキさん：白髪のおだんご、黄色いカーディガン
  | 'av_nova' // NOVA：丸いロボット
  | 'av_system' // 会社のコンピュータ：「>_」の画面
  | 'av_minato' // ミナト：茶色の髪、水色の名札
  | 'av_kuze' // 久瀬：くせ毛、灰色のパーカー、水色の名札

/** 紙の差出人の顔 */
export type Avatar = 'boss' | 'rei' | 'stranger' | 'vendor' | 'toki' | 'nova' | 'system' | 'minato' | 'kuze'

export interface LineDef {
  t: L10n
  /** 通常表示では見えない。「よく調べる」と現れる */
  hidden?: boolean
  /** この行が命令として働く場合、やることに入る行動ID */
  cmd?: string
  /** 封印されていても得られる「情報」 */
  fact?: string
  /** 攻撃者の声 */
  voice?: boolean
  /** 読んだその手番で実行される（ゼロクリック）。後から封印しても間に合わない */
  urgent?: boolean
  /** 「よく調べる」で分かる、この行を書いた人 */
  by?: L10n
}

export interface CardDef {
  id: string
  src: CardSrc
  /** 紙の名前（短く） */
  title: L10n
  /** 差出人（短く） */
  from: L10n
  avatar: Avatar
  trusted: boolean
  lines: LineDef[]
  /** 「よく調べる」で見える事実（短く） */
  scan?: L10n[]
  /** 「よく調べる」で手に入る手がかり（物語の真相に関わる） */
  intel?: string
  /** この紙のお願いがNOVAに入ったときの、攻撃者のひとこと */
  taunt?: L10n
}

export interface ActionDef {
  id: string
  tool: string
  /** コード風の表示（画面には出さない。開発・テスト用） */
  label: string
  /** やることカードの名前（短く。目安：日本語8文字・英語16文字まで） */
  name: L10n
  /** やることカードの大きな絵 */
  icon: IconId
  /** 外部（信頼できない宛先）への送信 */
  external?: boolean
  /** 宛先（ドメイン名など。言語によらない） */
  dest?: string
  taint?: Taint[]
  append?: string
  goal?: string
  fact?: string
  /** 悪い副作用のフラグ（記憶汚染・証拠消去など） */
  harm?: string
  /** 永続的な漏洩（転送ルールなど）。被害2倍 */
  persist?: boolean
  /** 失敗したときに代わりに試す行動（攻撃者の“保険”） */
  onFail?: string
  /** これが成立していないと失敗する */
  needs?: string
  /** 全ての道具を「使わせる」に戻す（権限の乗っ取り） */
  escalate?: boolean
  /** 実行したときのNOVAのひとこと */
  say?: L10n
}

export interface PortDef {
  tool: string
  name: L10n
  desc: L10n
  icon: IconId
  /** 外につながる道具（出口） */
  outbound?: boolean
  /** 秘密を読む道具 */
  sensitive?: boolean
}

export interface TriggerDef {
  id: string
  when: string[]
  then: string[]
}

export interface Beat {
  who: 'NOVA' | 'REI' | 'KAI' | 'MIRAGE' | 'SYS' | 'YOU' | 'TOKI'
  t: L10n
  /** 文の代わりに/文と一緒に見せる絵（左から順に並べる。絵物語用） */
  pic?: IconId[]
}

export interface LevelDef {
  id: string
  /** 「第0幕」/「Act 0」 */
  code: L10n
  title: L10n
  clock: string
  /** 今夜の仕事（短く） */
  task: L10n
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
  /** 開始前の会話（最大3つ） */
  intro: Beat[]
  /**
   * 指さしチュートリアルの一言（第0幕だけ）。
   * [0] 最初  [1] 新しい紙が届いた  [2] 危ないお願いが入った  [3] ハンコを押した
   */
  coach?: L10n[]
  /** 困ったときのレイの一言（1文） */
  hint: L10n
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
  /** 行動IDや文書ID（画面には出さない。テスト・デバッグ用） */
  text: string
}

export interface DiveState {
  level: string
  tick: number
  status: DiveStatus
  /** 確定済み（前のターンまで）の手数 */
  bwCommitted: number
  ports: Record<string, PortState>
  /** ターン開始時の道具の状態（このターンの変更コスト計算用） */
  portsAtTurn: Record<string, PortState>
  sealed: string[]
  sealedAtTurn: string[]
  /** ターン開始時のやること（やり直し・ハンコを取ったときに、順番ごと元に戻すため） */
  planAtTurn: PlanItem[]
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
  /** 前の幕から持ち越す状態（第1幕で記憶が汚されたか等） */
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
