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
  reviewSub: (n: number, min: number) => L(`${n}問・${min}分ほど。まちがえた問題と、忘れかけている問題です`, n === 1 ? `1 question, about ${min} min. One you missed or may be forgetting` : `${n} questions, about ${min} min. Ones you missed or may be forgetting`),
  reviewGo: L('復習する', 'Review'),
  finalGo: L('テストを受ける', 'Take the test'),
  restTitle: L('今日の分は、終わりました', "You're done for today"),
  restSub: L('明日になると、復習の問題が出ます。終えたレッスンは、下の一覧からもう一度できます。', 'Review questions come back tomorrow. You can replay any lesson from the list below.'),
  resumeTitle: L('続きから', 'Pick up where you left off'),
  resumeSub: (title: string, left: number) => L(`${title}　あと${left}問`, `${title}. ${left} to go`),
  resumeGo: L('続きをする', 'Continue'),
  resumeDrop: L('最初からやり直す', 'Start over'),
  week: L('5日間の見回り', 'Your five days'),
  nextMark: L('次', 'Next'),
  rank: L('階級', 'Rank'),
  rankLadder: L('階級の順番', 'Ranks'),
  pointsLabel: L('ポイント', 'Points'),
  toNext: (n: number, r: string) => L(`${r}まで、あと${n}ポイント`, `${n} more points to ${r}`),
  topRank: L('いちばん上の階級です', 'You have reached the top rank'),
  streak: (n: number) => L(`連続${n}日目`, n === 1 ? 'Day 1 of your streak' : `${n} days in a row`),
  streakKeep: (n: number) => L(`今日やると、連続${n}日目`, `Play today for ${n} days in a row`),
  streakNone: L('今日やると、連続1日目', 'Play today to start a streak'),
  buildingLabel: L('建物', 'Building'),
  building: (n: number, all: number) => L(`建物 ${n}／${all}階`, `Building: ${n} of ${all} floors`),
  buildingHow: L('レッスン1つで、1階建ちます。', 'Each lesson adds one floor.'),
  buildingDone: L('建物ができあがりました', 'The building is finished'),
  buildingDoneSub: L('まとめテストに合格しました。', 'You passed the final test.'),
  best: (p: number) => L(`1回で正解 ${p}%`, `${p}% right first time`),
  lockedAfter: (prev: string) => L(`${prev}を終えると開きます`, `Unlocks after ${prev}`),
  finalTest: L('まとめテスト', 'Final test'),
  finalWhy: L('全部の日から10問。8割で合格です', '10 questions from every day. Pass with 80%'),
  finalLocked: L('5日分を全部終えると開きます', 'Unlocks after all five days'),
  passedMark: L('合格', 'Passed'),
  aiPractice: L('AIの宮下さんと練習', 'Practice with AI Miyashita'),
  aiPracticeWhy: (topic: string) => L(`いちばん苦手な「${topic}」の新しい問題を、AIが3問つくります`, `AI writes 3 new questions on your weakest topic: ${topic}`),
  others: L('そのほか', 'More'),
  notebook: L('見回りノート', 'Notebook'),
  science: L('この学び方について', 'About how you learn here'),
  settings: L('設定', 'Settings'),
  howto: L('あそびかた', 'How to play'),

  // ---- あそびかた
  howto1: L('○か✕、または3つの中から1つを選んで答えます。', 'Answer with ○ or ✕, or pick one of three.'),
  howto2: L('答えると、すぐに正解とそのわけが出ます。', 'Right after you answer, you see the right answer and why.'),
  howto3: L('まちがえた問題は、正解するまでレッスンの最後にもう一度出ます。', 'Questions you miss come back at the end of the lesson until you get them right.'),
  howto4: L('正解した問題も、1日後・3日後・7日後の「今日の復習」にまた出ます。', "Questions you get right come back in Today's review after 1, 3 and 7 days."),
  gotIt: L('わかった', 'Got it'),

  // ---- 問題
  back: L('もどる', 'Back'),
  quitSure: L('ここで休みますか？', 'Take a break here?'),
  quitWhy: L('ここまでの答えは残ります。ホームの「続きから」で、次の問題から再開できます。', 'Your answers so far are kept. Continue from the next question on the home screen.'),
  keepGoing: L('つづける', 'Keep going'),
  quit: L('ホームにもどる', 'Go home'),
  left: (n: number) => L(`あと${n}問`, `${n} to go`),
  againWhy: L('さっきまちがえた問題', 'You missed this earlier'),
  yesWord: L('はい', 'Yes'),
  noWord: L('いいえ', 'No'),
  combo: (n: number) => L(`${n}問つづけて正解`, `${n} in a row`),

  // ---- 答えたあと
  right: L('正解！', 'Correct!'),
  wrong: L('不正解', 'Incorrect'),
  answerIs: (a: string) => L(`正しい答え：${a}`, `Right answer: ${a}`),
  placeLabel: L('場所', 'Place'),
  remember: L('覚えよう', 'Remember'),
  next: L('次へ', 'Next'),
  finish: L('結果を見る', 'See results'),
  realCase: L('実際にあった話', 'This really happened'),
  source: L('出典', 'Source'),
  sourcesN: (n: number) => L(`出典（${n}件）`, n === 1 ? 'Source (1)' : `Sources (${n})`),
  askAI: L('AIに聞く', 'Ask AI'),
  more: L('正解のわけ', 'Why the answer is right'),
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
  aiWhere: L('AIの宮下さんとの練習は、claude.ai で開いた時に使えます。', 'Practice with AI Miyashita works when this page is open on claude.ai.'),
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
  rankUp: (r: string) => L(`${r}に昇格しました`, `Promoted to ${r}`),
  newBadges: L('新しいバッジ', 'New badges'),
  newFloor: L('建物が1階分、高くなりました', 'One more floor is up'),
  comeBack: L('まちがえた問題は、明日の復習に出ます', "The ones you missed come back in tomorrow's review"),
  motto: L('今日の標語', "Today's rule"),
  home: L('ホームへ', 'Home'),
  toEnding: L('結末を見る', 'See the ending'),
  nextUp: (t: string) => L(`次へ：${t}`, `Next: ${t}`),

  // ---- 合言葉ノート
  mottos: L('標語と、覚えたこと', 'Rules and what you learned'),
  tipsNone: L('まだ答えた問題がありません', 'No questions answered yet'),
  badges: L('バッジ', 'Badges'),
  cases: L('実際にあった話', 'Real cases'),
  notYet: L('まだ', 'Not yet'),
  stats: (a: number, c: number) => L(`答えた問題 ${a}問・1回で正解 ${c}問`, `Answered ${a}, right first time ${c}`),

  // ---- 学び方のしくみ
  scienceIntro: L('問題の出し方は、学びの研究で効果がわかっている方法にそろえています。', 'How the questions are asked follows methods that research has shown to help people learn.'),
  scienceHere: L('このアプリでは', 'In this app'),

  // ---- 設定
  language: L('ことば', 'Language'),
  sound: L('効果音', 'Sound'),
  textSpeed: L('会話の文字の速さ', 'Dialogue text speed'),
  on: L('あり', 'On'),
  off: L('なし', 'Off'),
  speeds: { normal: L('ふつう', 'Normal'), fast: L('はやい', 'Fast'), instant: L('すぐ表示', 'Instant') } as Record<string, L10n>,
  reset: L('記録を消す', 'Delete progress'),
  resetSure: L('記録を消しますか？', 'Delete all progress?'),
  resetWhy: L('ポイント・階級・建物・復習の予定が、すべて消えます。元にはもどせません。', 'Points, rank, the building and your review schedule will all be deleted. This cannot be undone.'),
  resetGo: L('消す', 'Delete'),
  aboutLearning: L('この学び方について', 'About how you learn here'),

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
  first: { name: L('はじめの一歩', 'First step'), how: L('最初のレッスンを終える', 'Finish your first lesson') },
  perfect: { name: L('全問正解', 'All correct'), how: L('1つのレッスンで、全問を1回で正解する', 'Get every question in a lesson right first time') },
  combo5: { name: L('5問連続', 'Five in a row'), how: L('5問つづけて正解する', 'Get 5 questions right in a row') },
  streak3: { name: L('3日つづけた', '3-day streak'), how: L('3日つづけて学ぶ', 'Play 3 days in a row') },
  streak7: { name: L('7日つづけた', '7-day streak'), how: L('7日つづけて学ぶ', 'Play 7 days in a row') },
  review10: { name: L('復習10問', '10 reviews'), how: L('復習で10問答える', 'Answer 10 review questions') },
  allLessons: { name: L('1週間やりきった', 'Whole week done'), how: L('5日分のレッスンを全部終える', 'Finish all five days') },
  graduate: { name: L('卒業', 'Graduate'), how: L('まとめテストに合格する', 'Pass the final test') },
  askAI: { name: L('聞いてみた', 'Curious'), how: L('AIの宮下さんに質問する', 'Ask AI Miyashita a question') },
}

/** 話す人の名前 */
export const SPEAKER: Record<string, L10n> = {
  BOSS: L('宮下さん（現場監督）', 'Miyashita (site supervisor)'),
  YOU: L('あなた', 'You'),
  GUARD: L('大塚さん（警備員）', 'Otsuka (gate guard)'),
  KIMURA: L('木村さん（内装の職長）', 'Kimura (interior foreman)'),
  SAWA: L('沢口さん（事務）', 'Sawaguchi (office)'),
  STRANGER: L('点検の人', 'Inspector'),
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
