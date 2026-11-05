// 物語：はじまり（新しく入る人への説明）と、まとめテストに合格したあとの結末
import type { Line } from './types'

/** はじめの会話（月曜日の朝。新規入場者教育） */
export const PROLOGUE: Line[] = [
  {
    who: 'SYS',
    t: { ja: '月曜日の朝。現場事務所で、新規入場者教育が始まります。', en: 'Monday morning. New-worker orientation is starting in the site office.' },
  },
  {
    who: 'BOSS',
    t: { ja: 'おはよう。森田ハルさんだね。現場監督の宮下です。', en: "Morning. You must be Haru Morita. I'm Miyashita, the site supervisor." },
  },
  {
    who: 'YOU',
    t: { ja: 'おはようございます。今日からよろしくお願いします。', en: 'Good morning. Nice to meet you. Today is my first day.' },
  },
  {
    who: 'BOSS',
    t: { ja: 'この現場は、駅前にできる銀行の新しい支店なんだ。', en: 'This site is a new bank branch, right by the station.' },
  },
  {
    who: 'BOSS',
    t: { ja: '図面には、金庫室や防犯カメラの場所も載っているよ。', en: 'The drawings even show where the vault room and the security cameras are.' },
  },
  {
    who: 'YOU',
    t: { ja: 'そんな図面が外に出たら、大変ですね。', en: 'It would be really bad if drawings like that got out.' },
  },
  {
    who: 'BOSS',
    t: {
      ja: 'そうだね。図面や作業員名簿、現場の写真がもれたら、どろぼうに地図をわたすのと同じなんだ。',
      en: "Right. If the drawings, the worker list or site photos get out, it's like handing a burglar a map.",
    },
  },
  {
    who: 'BOSS',
    t: { ja: 'だから今週は、毎日ひとつずつ、短いクイズでいっしょに覚えていこう。', en: "So this week, we'll learn one thing a day together, with short quizzes." },
  },
]

/** まとめテストに合格したあと（建物ができあがる） */
export const ENDING: Line[] = [
  {
    who: 'BOSS',
    t: { ja: '森田さん、おつかれさま。銀行の支店、できあがったね。', en: 'Good work, Haru. The bank branch is finished.' },
  },
  {
    who: 'CLIENT',
    t: {
      ja: '金庫室やカメラの場所を、外の人に知られずにすみました。みなさん、ありがとうございました。',
      en: 'No one outside found out where the vault room and the cameras are. Thank you, everyone.',
    },
  },
  {
    who: 'BOSS',
    t: {
      ja: '「点検です」と言って、ゲートに来た男の人、覚えてる？ 銀行をねらって、下見をしていたんだって。',
      en: 'Remember the man at the gate who said he was an inspector? Turns out he was scouting the bank to rob it.',
    },
  },
  {
    who: 'BOSS',
    t: {
      ja: '事務所に確かめたから、うそだとすぐわかったんだ。警察に知らせて、もう捕まったよ。',
      en: "We checked with the office, so we knew right away he was lying. We told the police, and he's been caught.",
    },
  },
  {
    who: 'YOU',
    t: { ja: 'あの時、そのまま通さなくて本当によかったです。', en: "I'm really glad we didn't just let him in." },
  },
  {
    who: 'BOSS',
    t: { ja: 'もう新人じゃないね。ヘルメットの緑のシール、はがしていいよ。', en: "You're not new here anymore. You can take the green new-worker sticker off your helmet." },
  },
]
