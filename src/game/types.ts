// ============================================================
// 「現場の見回り」クイズ版の形。中身（問題・文・絵の名前）はデータとして書く
//   レッスン = 1つの場所と1つの考え方（月〜金）。問題は ○✕ と 3択
// ============================================================

export type Lang = 'ja' | 'en'

/** 画面に出す文は、日本語と英語の両方を持つ */
export interface L10n {
  ja: string
  en: string
}

/** 話す人 */
export type Who = 'BOSS' | 'YOU' | 'GUARD' | 'KIMURA' | 'SAWA' | 'STRANGER' | 'CLIENT' | 'SYS'

/** レッスンの話題（1日に1つ） */
export type TopicId = 'see' | 'gate' | 'photo' | 'send' | 'outside'

/** 会話の1行 */
export interface Line {
  who: Who
  t: L10n
  pic?: string[]
}

interface QBase {
  /** 'see-01' のように、話題-番号 */
  id: string
  topic: TopicId
  /** 上に大きく出る人（その場面にいる人。宮下さんがいない場面では YOU や、その場にいる人） */
  who: Who
  /** 場面の場所（工事黒板の「場所」欄）。レッスンの場所と違う時だけ書く */
  place?: L10n
  /** 場面の小さな絵（'pic.なまえ'） */
  pic?: string
  /** どんな場面か（1〜2文） */
  situation: L10n
  /** 問い（「？」の箱に入る） */
  ask: L10n
  /** 正しい答えのわけ（1〜2文） */
  why: L10n
  /** 覚えておくこと（短く） */
  tip: L10n
  /** 実際にあった話の id（cases.ts） */
  real?: string
}

/** ○✕ の問題。answer = true なら ○ が正しい */
export interface TFQuestion extends QBase {
  kind: 'tf'
  answer: boolean
  /** まちがえた方を選んだ人への、ひとこと（思いこみをほどく） */
  wrongWhy: L10n
}

/** 3択の問題 */
export interface MCQuestion extends QBase {
  kind: 'mc'
  choices: [L10n, L10n, L10n]
  correct: 0 | 1 | 2
  /** それぞれの答えを選んだ人への、ひとこと（正しい答えのところは null） */
  wrongWhy: [L10n | null, L10n | null, L10n | null]
}

export type Question = TFQuestion | MCQuestion

export interface Lesson {
  id: TopicId
  /** 月曜日 */
  dayName: L10n
  /** 現場事務所 */
  place: L10n
  /** レッスンの名前（「人に見える所」） */
  title: L10n
  /** はじめの会話（2〜4行） */
  intro: Line[]
  /** 今日の合言葉（バッジになる） */
  motto: L10n
  /** ホームの地図に出す絵 */
  icon: string
  questions: Question[]
}

/** 実際にあった話（出典つき） */
export interface RealCase {
  id: string
  /** ふつうの言葉で一行 */
  head: L10n
  /** 2〜3文 */
  body: L10n
  who: L10n
  when: L10n
  source: string
  url: string
}

/** x, y, 幅, 高さ（絵の中の範囲） */
export type Box = [number, number, number, number]
