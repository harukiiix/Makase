// 画面の言葉（日英）
//   ・ボタンや見出しは、短い言葉（「はじめる」「次へ」）。説明の文は「です・ます」
//   ・宮下さんたちのせりふ（問題や会話）は、ふだんの話し言葉。画面の言葉とは分ける
//   ・横文字は、ふだん使う言葉（ポイント、パソコン など）だけ
// 日本語のかぎかっこ・全角のコロンなどは、ここの関数で言語ごとに付ける（英語の画面に「」や：を出さない）
import type { L10n } from '../game/types'

const L = (ja: string, en: string): L10n => ({ ja, en })

export const S = {
  // ---- タイトル・ホーム
  title: L('現場の見回り', 'Site Rounds'),
  subtitle: L('工事現場の情報もれを、クイズで学ぶ', 'Learn to stop information leaks on a building site'),
  fiction: L('登場する会社・人物・あて先は、すべて架空です。', 'All companies, people and addresses here are made up.'),
  todayJob: L('今日やること', 'Today'),
  start: L('はじめる', 'Start'),
  startDay: (d: string) => L(`${d}をはじめる`, `Start ${d}`),
  lessonSub: (day: string, place: string, n: number, min: number) => L(`${day}・${place}　${n}問、${min}分ほど`, `${day}, ${place}. ${n} questions, about ${min} min`),
  reviewTitle: L('今日の復習', "Today's review"),
  reviewSub: (n: number, min: number) => L(`前にまちがえた問題と、そろそろ忘れそうな問題が${n}問。${min}分ほど`, n === 1 ? `1 question you missed or may be forgetting. About ${min} min` : `${n} questions you missed or may be forgetting. About ${min} min`),
  reviewGo: L('復習する', 'Review'),
  finalGo: L('テストを受ける', 'Take the test'),
  restTitle: L('今日の分は、終わりました', "You're done for today"),
  restSub: L('明日になると、復習の問題が出ます。終えたレッスンは、下からもう一度できます。', 'Review questions come back tomorrow. You can replay any lesson below.'),
  week: L('今週の予定', 'This week'),
  nowMark: L('今日', 'Today'),
  rank: L('階級', 'Rank'),
  rankLadder: L('階級の順番', 'Ranks'),
  pointsLabel: L('ポイント', 'Points'),
  toNext: (n: number, r: string) => L(`${r}まで、あと${n}ポイント`, `${n} more points to ${r}`),
  topRank: L('いちばん上の階級です', 'You have reached the top rank'),
  streak: (n: number) => L(`${n}日つづけています`, n === 1 ? '1 day in a row' : `${n} days in a row`),
  streakNone: L('今日やると、1日目です', 'Play today to start a streak'),
  buildingLabel: L('建物', 'Building'),
  building: (n: number, all: number) => L(`建物 ${n}／${all}階`, `Building: ${n} of ${all} floors`),
  buildingHow: L('レッスンを1つ終えると、1階できます。', 'Each lesson you finish adds a floor.'),
  buildingDone: L('建物ができあがりました', 'The building is finished'),
  buildingDoneSub: L('まとめテストに合格しました。', 'You passed the final test.'),
  best: (p: number) => L(`1回で正解 ${p}%`, `${p}% right first time`),
  locked: L('前の日を終えると、開きます', 'Opens after the day before'),
  finalTest: L('まとめテスト', 'Final test'),
  finalWhy: L('全部の日から10問。8割で合格です', '10 questions from every day. Pass with 80%'),
  finalLocked: L('5日分を全部終えると、開きます', 'Opens after all five days'),
  passedMark: L('合格', 'Passed'),
  aiPractice: L('AIの宮下さんと練習', 'Practice with AI Miyashita'),
  aiPracticeWhy: (topic: string) => L(`いちばん苦手な「${topic}」の新しい問題を、AIが3問つくります`, `AI writes 3 new questions on your weakest topic: ${topic}`),
  others: L('そのほか', 'More'),
  notebook: L('合言葉ノート', 'Notebook'),
  science: L('学び方のしくみ', 'How it helps you learn'),
  settings: L('設定', 'Settings'),
  howto: L('あそびかた', 'How to play'),

  // ---- あそびかた
  howto1: L('○✕ か、3つから1つを選んで答えます', 'Answer with ○ or ✕, or pick 1 of 3'),
  howto2: L('答えると、すぐに理由が出ます', 'Right after you answer, you see why'),
  howto3: L('まちがえた問題は、そのレッスンの最後と、次の日の復習に出ます', 'Questions you miss come back at the end of the lesson and in the next day’s review'),
  gotIt: L('わかった', 'Got it'),

  // ---- 問題
  back: L('もどる', 'Back'),
  quitSure: L('途中でやめますか？', 'Stop here?'),
  quitWhy: L('ここまでの答えは、記録されません。', "Your answers so far won't be saved."),
  keepGoing: L('続ける', 'Keep going'),
  quit: L('やめる', 'Stop'),
  progress: (n: number, all: number) => L(`${n}／${all}問`, `${n} of ${all}`),
  againWhy: L('さっきまちがえた問題', 'You missed this earlier'),
  yesWord: L('はい', 'Yes'),
  noWord: L('いいえ', 'No'),
  combo: (n: number) => L(`${n}問つづけて正解`, `${n} in a row`),

  // ---- 答えたあと
  right: L('正解！', 'Correct!'),
  wrong: L('おしい！', 'Not quite'),
  answerIs: (a: string) => L(`正しい答え：${a}`, `Right answer: ${a}`),
  remember: L('覚えよう', 'Remember'),
  next: L('次へ', 'Next'),
  finish: L('結果を見る', 'See results'),
  realCase: L('実際にあった話', 'This really happened'),
  source: L('出典', 'Source'),
  sourcesN: (n: number) => L(`出典（${n}件）`, n === 1 ? 'Source (1)' : `Sources (${n})`),
  askAI: L('AIに聞く', 'Ask AI'),
  more: L('くわしく', 'More'),
  plusPoints: (n: number) => L(`+${n}`, `+${n}`),

  // ---- AIの宮下さん
  aiTitle: L('AIの宮下さん', 'AI Miyashita'),
  aiNote: L('AIの答えは、まちがうこともあります。会社や現場の決まりのほうを守ってください。', "AI can be wrong. Your company's and site's rules come first."),
  aiChips: [L('どうして、そうなるの？', 'Why is that?'), L('現場では、どうすればいい？', 'What should I do on site?'), L('ほかにも、にた例はある？', 'Any similar examples?')],
  aiExplain: L('自分の考えを言ってみる', 'Say why, in my own words'),
  aiExplainHint: L('〜だからだと思う', "I think it's because..."),
  aiExplainHow: L('理由を自分の言葉で書くと、合っているかをAIの宮下さんが見ます。', 'Write the reason in your own words. AI Miyashita will tell you if it holds up.'),
  aiPlaceholder: L('聞きたいことを書く', 'Ask a question'),
  aiSend: L('送る', 'Send'),
  aiStop: L('止める', 'Stop'),
  aiThinking: L('考えています…', 'Thinking...'),
  aiOff: L('AIの宮下さんは、claude.ai で開いた時に使えます', 'AI Miyashita works when you open this page on claude.ai'),
  aiNotAllowed: L('この画面では、AIを使う許可がありません。', "This page isn't allowed to use AI here."),
  aiBusy: L('混み合っています。少し待ってから、もう一度送ってください。', 'Busy right now. Wait a moment and send it again.'),
  aiFailed: L('答えを受け取れませんでした。もう一度送ってください。', "Couldn't get an answer. Please send it again."),
  aiMaking: L('AIの宮下さんが、問題を考えています。30秒ほどかかります。', 'AI Miyashita is writing questions. This takes about 30 seconds.'),
  aiMade: L('AIが作った問題です。まちがいがあるかもしれません。', 'These questions were written by AI and may contain mistakes.'),
  close: L('閉じる', 'Close'),
  cancel: L('やめる', 'Cancel'),

  // ---- 終わり
  lessonDone: L('レッスン完了', 'Lesson complete'),
  reviewDone: L('復習完了', 'Review complete'),
  aiDone: L('練習完了', 'Practice complete'),
  finalPass: L('まとめテスト合格', 'Final test passed'),
  finalFail: L('あと少しです', 'Almost there'),
  finalFailWhy: L('8割で合格です。まちがえた問題は復習に出るので、また受けてください。', 'You need 80% to pass. The ones you missed will come up in review, so try again soon.'),
  firstRight: (n: number, all: number) => L(`1回で正解 ${n}／${all}問`, `Right first time: ${n} of ${all}`),
  gained: L('もらったポイント', 'Points earned'),
  firstRightLabel: L('1回で正解', 'Right first time'),
  bonusLesson: L('レッスン完了', 'Lesson done'),
  bonusPerfect: L('全問正解', 'All correct'),
  bonusReview: L('復習', 'Review'),
  bonusFinal: L('合格', 'Passed'),
  rankUp: (r: string) => L(`階級が上がりました：${r}`, `New rank: ${r}`),
  newBadges: L('新しいバッジ', 'New badges'),
  newFloor: L('建物が1階分のびました', 'The building grew one floor'),
  comeBack: L('まちがえた問題は、明日の復習に出ます', "The ones you missed come back in tomorrow's review"),
  motto: L('今日の合言葉', "Today's rule"),
  home: L('ホームへ', 'Home'),
  toEnding: L('結末を見る', 'See the ending'),
  nextUp: (t: string) => L(`次へ：${t}`, `Next: ${t}`),

  // ---- 合言葉ノート
  mottos: L('合言葉', 'Rules'),
  badges: L('バッジ', 'Badges'),
  cases: L('実際にあった話', 'Real cases'),
  notYet: L('まだ', 'Not yet'),
  stats: (a: number, c: number) => L(`答えた数 ${a}問、正解 ${c}問`, `Answered ${a}, correct ${c}`),

  // ---- 学び方のしくみ
  scienceIntro: L('このアプリは、学びの研究で効果がわかっている方法で作っています。', 'This app uses methods that research has shown to help people learn.'),
  scienceHere: L('このアプリでは', 'In this app'),

  // ---- 設定
  language: L('ことば', 'Language'),
  sound: L('効果音', 'Sound'),
  music: L('音楽', 'Music'),
  textSpeed: L('会話の文字の速さ', 'Dialogue text speed'),
  on: L('あり', 'On'),
  off: L('なし', 'Off'),
  speeds: { normal: L('ふつう', 'Normal'), fast: L('はやい', 'Fast'), instant: L('すぐ', 'Instant') } as Record<string, L10n>,
  reset: L('記録を消す', 'Delete progress'),
  resetSure: L('もう一度押すと、すべての記録が消えます', 'Tap again to delete all progress'),

  // ---- 会話
  tapNext: L('タップで次へ', 'Tap to continue'),
  clickNext: L('クリックかスペースで次へ', 'Click or press Space'),
  skip: L('とばす', 'Skip'),
  yourChoice: L('どうする？', 'What will you do?'),

  // ---- 書き方（言語ごと）
  quote: (s: string) => L(`「${s}」`, `"${s}"`),
  kv: (k: string, v: string) => L(`${k}：${v}`, `${k}: ${v}`),
  dayPlace: (d: string, p: string) => L(`${d}・${p}`, `${d}, ${p}`),
  list2: (a: string, b: string) => L(`${a}・${b}`, `${a}, ${b}`),
}

/** 階級の名前 */
export const RANK_NAME: Record<string, L10n> = {
  new: L('新人', 'New hire'),
  apprentice: L('見習い', 'Apprentice'),
  skilled: L('一人前', 'Skilled hand'),
  foreman: L('職長', 'Foreman'),
  supervisor: L('現場監督', 'Site supervisor'),
}

/** バッジの名前と、もらえる時 */
export const BADGE_TEXT: Record<string, { name: L10n; how: L10n }> = {
  first: { name: L('はじめの一歩', 'First step'), how: L('最初のレッスンを終えた', 'Finished your first lesson') },
  perfect: { name: L('全問正解', 'All correct'), how: L('レッスンの問題を、全部1回で正解した', 'Got every question in a lesson right first time') },
  combo5: { name: L('5問連続', 'Five in a row'), how: L('5問つづけて正解した', 'Got 5 questions right in a row') },
  streak3: { name: L('3日つづけた', '3-day streak'), how: L('3日つづけて学んだ', 'Played 3 days in a row') },
  streak7: { name: L('7日つづけた', '7-day streak'), how: L('7日つづけて学んだ', 'Played 7 days in a row') },
  review10: { name: L('復習10問', '10 reviews'), how: L('復習で10問答えた', 'Answered 10 review questions') },
  allLessons: { name: L('1週間やりきった', 'Whole week done'), how: L('5日分のレッスンを全部終えた', 'Finished all five days') },
  graduate: { name: L('卒業', 'Graduate'), how: L('まとめテストに合格した', 'Passed the final test') },
  askAI: { name: L('聞いてみた', 'Curious'), how: L('AIの宮下さんに質問した', 'Asked AI Miyashita a question') },
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
