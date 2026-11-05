// ============================================================
// 「現場の見回り」の形。中身（文章・絵）はデータとして書く
//   1日 = 1つの場所 + 1つの考え方。現場監督と見回り、情報がもれそうな所を探す
// ============================================================

export type Lang = 'ja' | 'en'

/** 画面に出す文は、日本語と英語の両方を持つ */
export interface L10n {
  ja: string
  en: string
}

/** 話す人 */
export type Who = 'BOSS' | 'YOU' | 'GUARD' | 'KIMURA' | 'SAWA' | 'STRANGER' | 'CLIENT' | 'SYS'

export type DayId = 'mon' | 'tue' | 'wed' | 'thu' | 'fri'

/** 会話の1行。pic は文の上に並べる小さな絵（絵の名前） */
export interface Line {
  who: Who
  t: L10n
  pic?: string[]
}

/** 危ない物を見つけたあとの「どうする？」の答え。ok は正しい対応 */
export interface Choice {
  t: L10n
  /** ボタンにつける絵（16×16 の絵の名前） */
  icon: string
  ok: boolean
  /** 選んだあとの監督のひとこと */
  reply: L10n
}

/** 見落とした時に「このあと何が起きたか」を見せる1コマ */
export interface Panel {
  pic: string[]
  t: L10n
}

/**
 * risk  = 情報がもれそうな所（見つける）
 * safe  = 大丈夫な物（押すと「これは大丈夫」と理由を言う。答えがばれないよう、押せる物を混ぜる）
 * bonus = 気になる人（毎日どこかにいる「点検の人」。見つけなくても進める）
 */
export type SpotKind = 'risk' | 'safe' | 'bonus'

/** x, y, 幅, 高さ（場面の絵の 160×120 の中の位置） */
export type Box = [number, number, number, number]

export interface Spot {
  id: string
  kind: SpotKind
  /** 物の名前（読み上げと結果の一覧に使う。危ないかどうかは書かない） */
  name: L10n
  /** 押せる範囲。書かなければ、場面の絵で同じ id を付けた絵の範囲を使う */
  box?: Box
  /** 押した時の監督のひとこと */
  look: L10n
  /** 押した時に欄に出す、拡大した中身（メールの差出人など、絵では読めない文字）。短く、2〜3行まで */
  zoom?: L10n
  /** risk だけ：どうするかの2択（1つが正しい） */
  choices?: [Choice, Choice]
  /** risk だけ：見落とした時の2〜3コマ */
  after?: Panel[]
}

/** 実際にあった話（出典つき） */
export interface RealCase {
  /** ふつうの言葉で一行 */
  head: L10n
  /** 2〜3文 */
  body: L10n
  /** だれの話か、いつか */
  who: L10n
  when: L10n
  source: string
  url: string
}

export interface Day {
  id: DayId
  /** 月曜日 */
  dayName: L10n
  /** 現場事務所 */
  place: L10n
  /** 今日の考え方（ひとこと） */
  idea: L10n
  /** 今日の合言葉（結果で大きく出す） */
  motto: L10n
  /** 場面の絵の名前 */
  scene: string
  /** 見回りの前の会話 */
  intro: Line[]
  /** 見回りを始める時の監督のひとこと（いくつあるかも、ここで言う） */
  start: L10n
  /** 全部見つけた時のひとこと */
  done: L10n
  spots: Spot[]
  real: RealCase
  /** 最初の日だけ：指さしで教える物の id */
  firstPoint?: string
}

/** 見つけた物の結果 */
export type Mark = 'right' | 'other' | 'safe' | 'bonus'
