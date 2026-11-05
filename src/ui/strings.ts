// 画面の言葉（日英）。短く、ふつうの話し言葉で。横文字はなるべく使わない
// 日本語のかぎかっこ・全角のコロンなどは、ここの関数で言語ごとに付ける（英語の画面に「」や：を出さない）
import type { L10n } from '../game/types'

const L = (ja: string, en: string): L10n => ({ ja, en })

export const S = {
  // ---- タイトル
  series: L('SECURITY INCIDENT THEATER', 'SECURITY INCIDENT THEATER'),
  title: L('現場の見回り', 'Site Rounds'),
  subtitle: L('情報もれ、見つけられる？', 'Can you spot the leaks?'),
  pitch: L('工事現場には、図面や名簿など、外に出てはいけない情報がたくさんあります。現場監督と一緒に見回って、もれそうな所を見つけよう。', 'A building site is full of things that must not get out: drawings, worker lists, photos. Walk the site with the supervisor and find what could leak.'),
  start: L('はじめる', 'Start'),
  restart: L('はじめから', 'New game'),
  cont: (where: string) => L(`つづきから（${where}）`, `Continue (${where})`),
  pickDay: L('日をえらぶ', 'Pick a day'),
  notebook: L('合言葉ノート', 'Notebook'),
  howto: L('あそびかた', 'How to play'),
  settings: L('設定', 'Settings'),
  fiction: L('登場する会社・人物・あて先はすべて架空です。', 'All companies, people and addresses in this game are made up.'),
  ending: L('結末', 'Ending'),

  // ---- 設定
  language: L('ことば', 'Language'),
  sound: L('効果音', 'Sound'),
  music: L('音楽', 'Music'),
  textSpeed: L('文字の速さ', 'Text speed'),
  on: L('あり', 'On'),
  off: L('なし', 'Off'),
  speeds: { normal: L('ふつう', 'Normal'), fast: L('はやい', 'Fast'), instant: L('すぐ', 'Instant') } as Record<string, L10n>,
  close: L('閉じる', 'Close'),
  back: L('もどる', 'Back'),

  // ---- あそびかた（3枚の絵）
  howto1: L('気になる物を押す', 'Tap anything that looks wrong'),
  howto2: L('どうするか選ぶ', 'Choose what to do'),
  howto3: L('見落とすと、どうなるかを見る', 'See what happens if it is missed'),
  gotIt: L('わかった', 'Got it'),

  // ---- 会話
  tapNext: L('タップで次へ', 'Tap to continue'),
  clickNext: L('クリックかスペースで次へ', 'Click or press Space'),
  skip: L('とばす', 'Skip'),
  yourChoice: L('どうする？', 'What will you do?'),

  // ---- 見回り
  found: (n: number, all: number) => L(`見つけた ${n}/${all}`, `Found ${n} of ${all}`),
  askBoss: L('宮下さんに聞く', 'Ask Miyashita'),
  endRound: L('見回りを終える', 'End the rounds'),
  finishDay: L('今日の見回りを終える', "Finish today's rounds"),
  answerFirst: L('先に、どうするか選んでね', 'Pick what to do first'),
  endSure: (n: number) => L(`まだ ${n} つ見つけていないけど、終わりにする？`, n === 1 ? "There's still 1 left. End anyway?" : `There are still ${n} left. End anyway?`),
  keepLooking: L('もう少し探す', 'Keep looking'),
  endAnyway: L('終わる', 'End'),
  quit: L('やめる', 'Quit'),
  quitSure: L('もう一度押すと、タイトルにもどる', 'Tap again to go back to the title'),
  menu: L('メニュー', 'Menu'),
  rightMark: L('いい対応', 'Good call'),
  otherMark: L('こうするともっといい', 'Better way'),
  safeMark: L('大丈夫', 'Fine'),
  bonusMark: L('気になる人', 'Someone to watch'),
  objectHint: L('このあたり、もう一回よく見てみて。', 'Take another good look around here.'),
  tryThis: L('たとえば、これ。押してみて。', 'For example, this one. Tap it.'),
  here: L('ここ', 'Here'),
  keys: L('数字のキー 1・2 でも選べます', 'You can also press 1 or 2'),

  // ---- 1日の結果
  dayDone: (day: string) => L(`${day}の見回り、おわり`, `${day}: rounds done`),
  missedN: (n: number) => L(`見落とし ${n}`, n === 1 ? '1 missed' : `${n} missed`),
  noMiss: L('見落としなし', 'Nothing missed'),
  missedMark: L('見落とし', 'Missed'),
  ifMissed: L('もし、だれも気づかなかったら', 'If nobody had noticed'),
  betterWay: L('こうするともっといい', 'A better way'),
  motto: L('今日の合言葉', "Today's rule"),
  real: L('実際にあった話', 'This really happened'),
  more: L('くわしく', 'More'),
  less: L('とじる', 'Less'),
  source: L('出典', 'Source'),
  again: L('もう一回見回る', 'Do this day again'),
  nextDay: L('次の日へ', 'Next day'),
  toEnding: L('結末へ', 'To the ending'),
  toSelect: L('日をえらぶにもどる', 'Back to the days'),
  keptBest: L('物語は、この日でいちばんよかった回で進みます', 'The story uses your best try of this day'),
  hintsUsed: (n: number) => L(`宮下さんに聞いた回数 ${n}`, n === 1 ? 'Asked Miyashita once' : `Asked Miyashita ${n} times`),
  bonusFound: L('気になる人に気づいた', 'You noticed someone'),

  // ---- 合言葉ノート・結末
  locked: L('まだ見回っていない日', 'Not visited yet'),
  week: L('今週の見回り', 'This week'),
  missedTotal: (n: number) => L(`見落とし 合計 ${n}`, `Missed in total: ${n}`),
  bonusTotal: (n: number) => L(`気になる人に気づいた日 ${n}/5`, `Days you noticed him: ${n}/5`),
  endingsSeen: (n: number) => L(`見た結末 ${n}/3`, `Endings seen: ${n}/3`),
  endingRule: L('見落としが少なく、気になる人に3日以上気づくと、いちばんよい結末になります。', 'Miss very little and notice the man on 3 or more days to get the best ending.'),
  toTitle: L('タイトルへ', 'Back to title'),

  // ---- 書き方（言語ごと）
  quote: (s: string) => L(`「${s}」`, `"${s}"`),
  kv: (k: string, v: string) => L(`${k}：${v}`, `${k}: ${v}`),
  dayPlace: (d: string, p: string) => L(`${d}　${p}`, `${d}: ${p}`),
  list2: (a: string, b: string) => L(`${a}・${b}`, `${a}, ${b}`),
}

/** 話す人の名前 */
export const SPEAKER: Record<string, L10n> = {
  BOSS: L('宮下さん（現場監督）', 'Miyashita (site supervisor)'),
  YOU: L('森田ハル（あなた）', 'Haru Morita (you)'),
  GUARD: L('大塚さん（警備員）', 'Otsuka (gate guard)'),
  KIMURA: L('木村さん（内装の職長）', 'Kimura (interior foreman)'),
  SAWA: L('沢口さん（事務）', 'Sawaguchi (office)'),
  STRANGER: L('点検の人', 'The "inspector"'),
  CLIENT: L('支店長', 'Branch manager'),
  SYS: L('', ''),
}

/** 顔の絵の名前 */
export const FACE: Record<string, string> = {
  BOSS: 'face.boss',
  YOU: 'face.you',
  GUARD: 'face.guard',
  KIMURA: 'face.kimura',
  SAWA: 'face.sawa',
  STRANGER: 'face.stranger',
  CLIENT: 'face.client',
}
