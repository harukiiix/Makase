// 画面の言葉（日英）。短く、ふつうの話し言葉で。横文字はなるべく使わない
// 日本語のかぎかっこ・全角のコロンなどは、ここの関数で言語ごとに付ける（英語の画面に「」や：を出さない）
import type { L10n } from '../game/types'

const L = (ja: string, en: string): L10n => ({ ja, en })

export const S = {
  // ---- タイトル・ホーム
  series: L('SECURITY INCIDENT THEATER', 'SECURITY INCIDENT THEATER'),
  title: L('現場の見回り', 'Site Rounds'),
  subtitle: L('工事現場の情報もれを、クイズで学ぼう', 'Learn to stop leaks on a building site, one quiz at a time'),
  start: L('はじめる', 'Start'),
  fiction: L('登場する会社・人物・あて先はすべて架空です。', 'All companies, people and addresses in this game are made up.'),
  rank: L('階級', 'Rank'),
  points: (n: number) => L(`${n} ポイント`, `${n} points`),
  toNext: (n: number, r: string) => L(`${r}まで あと${n}ポイント`, `${n} more points to ${r}`),
  topRank: L('いちばん上の階級です', 'You are at the top rank'),
  streak: (n: number) => L(`${n}日つづけています`, n === 1 ? '1 day in a row' : `${n} days in a row`),
  streakNone: L('今日から始めよう', 'Start your streak today'),
  building: (n: number, all: number) => L(`建物 ${n}/${all}階`, `Building: floor ${n} of ${all}`),
  buildingDone: L('建物ができあがった！', 'The building is finished!'),
  reviewNow: (n: number) => L(`今日の復習 ${n}問`, n === 1 ? "Today's review: 1 question" : `Today's review: ${n} questions`),
  reviewWhy: L('前にまちがえた問題や、そろそろ忘れそうな問題が出ます', 'Questions you missed or may be forgetting'),
  noReview: L('今日の復習は、おわりました', 'No review due today'),
  nextLesson: L('つぎのレッスン', 'Next lesson'),
  lessons: L('レッスン', 'Lessons'),
  questionsN: (n: number) => L(`${n}問`, `${n} questions`),
  best: (p: number) => L(`1回で正解 ${p}%`, `${p}% right first time`),
  locked: L('前のレッスンを終えると開きます', 'Finish the lesson before to open it'),
  finalTest: L('まとめテスト', 'Final test'),
  finalWhy: L('5つのレッスンから、まぜて10問。8割で合格', '10 mixed questions from all 5 lessons. Pass with 80%'),
  finalLocked: L('5つのレッスンを全部終えると開きます', 'Opens after all 5 lessons'),
  passedMark: L('合格', 'Passed'),
  aiPractice: L('AIの宮下さんと練習', 'Practice with AI Miyashita'),
  aiPracticeWhy: (topic: string) => L(`いちばん苦手な「${topic}」の問題を、AIが3問つくります`, `AI makes 3 new questions on your weakest topic: ${topic}`),
  notebook: L('合言葉ノート', 'Notebook'),
  science: L('この学び方のわけ', 'Why this way of learning'),
  settings: L('設定', 'Settings'),
  howto: L('あそびかた', 'How to play'),

  // ---- あそびかた
  howto1: L('○✕ か 3択 で答えます', 'Answer with ○ / ✕ or pick 1 of 3'),
  howto2: L('答えると、すぐに「なぜ」がわかります', 'Right after you answer, you see why'),
  howto3: L('まちがえた問題は、あとでまた出ます', 'Questions you miss come back later'),
  gotIt: L('わかった', 'Got it'),

  // ---- 問題
  back: L('もどる', 'Back'),
  quitSure: L('やめる？ ここまでの答えは記録されません', 'Quit? Answers so far will not be saved'),
  keepGoing: L('つづける', 'Keep going'),
  quit: L('やめる', 'Quit'),
  progress: (n: number, all: number) => L(`${n}/${all}問`, `${n} of ${all}`),
  again: L('もう一度', 'Again'),
  againWhy: L('さっきまちがえた問題です', 'You missed this one earlier'),
  yes: L('○', '○'),
  no: L('✕', '✕'),
  yesWord: L('はい、そう思う', 'Yes'),
  noWord: L('いいえ、ちがう', 'No'),
  combo: (n: number) => L(`${n}問つづけて正解！`, `${n} in a row!`),

  // ---- 答えたあと
  right: L('正解！', 'Correct!'),
  wrong: L('おしい！', 'Not quite'),
  answerIs: (a: string) => L(`答え：${a}`, `Answer: ${a}`),
  remember: L('覚えよう', 'Remember'),
  next: L('つぎへ', 'Next'),
  finish: L('結果を見る', 'See results'),
  realCase: L('実際にあった話', 'This really happened'),
  source: L('出典', 'Source'),
  sourcesN: (n: number) => L(`出典（${n}件）`, n === 1 ? 'Source (1)' : `Sources (${n})`),
  askAI: L('AIに聞く', 'Ask AI'),
  more: L('くわしく', 'More'),
  plusPoints: (n: number) => L(`+${n}`, `+${n}`),

  // ---- AIの宮下さん
  aiTitle: L('AIの宮下さん', 'AI Miyashita'),
  aiNote: L('AIの答えは、まちがうこともあります。会社や現場の決まりを先にしてね。', 'AI answers can be wrong. Your company and site rules come first.'),
  aiChips: [L('どうして、そうなるの？', 'Why is that?'), L('現場では、どうすればいい？', 'What should I do on site?'), L('ほかにも、にた例はある？', 'Any similar examples?')],
  aiExplain: L('自分の考えを言ってみる', 'Say why, in my own words'),
  aiExplainHint: L('〜だからだと思う', "I think it's because..."),
  aiExplainHow: L('なぜそうなるのか、自分の言葉で書いてみてね。合っているか見るよ。', "Say in your own words why. I'll tell you if you've got it."),
  aiPlaceholder: L('聞きたいことを書いてね', 'Type your question'),
  aiSend: L('送る', 'Send'),
  aiStop: L('止める', 'Stop'),
  aiThinking: L('考えています…', 'Thinking...'),
  aiOff: L('AIの宮下さんは、claude.ai で開いた時に使えます', 'AI Miyashita works when you open this page on claude.ai'),
  aiNotAllowed: L('AIを使う許可がないため、使えません', 'AI is not allowed here, so this feature is off'),
  aiBusy: L('いまは混んでいます。少し待ってから、もう一度押してね', 'Busy right now. Wait a little and try again'),
  aiFailed: L('うまく答えられませんでした。もう一度押してね', 'Could not answer. Please try again'),
  aiMaking: L('AIの宮下さんが、問題を考えています（30秒ほど）', 'AI Miyashita is writing questions (about 30 seconds)'),
  aiMade: L('AIが作った問題です。まちがいがあるかもしれません', 'These questions were made by AI and may contain mistakes'),
  close: L('閉じる', 'Close'),
  cancel: L('やめる', 'Cancel'),

  // ---- 終わり
  lessonDone: L('レッスン完了！', 'Lesson complete!'),
  reviewDone: L('復習おわり！', 'Review done!'),
  aiDone: L('練習おわり！', 'Practice done!'),
  finalPass: L('まとめテスト 合格！', 'Final test passed!'),
  finalFail: L('あと少し！', 'Almost there!'),
  finalFailWhy: L('8割で合格です。まちがえた問題は復習に出るので、また挑戦してね', 'You pass with 80%. The ones you missed will come up in review. Try again soon'),
  firstRight: (n: number, all: number) => L(`1回で正解 ${n}/${all}`, `Right first time: ${n} of ${all}`),
  gained: L('もらったポイント', 'Points earned'),
  bonusLesson: L('レッスン完了', 'Lesson done'),
  bonusPerfect: L('全問正解', 'All correct'),
  bonusReview: L('復習', 'Review'),
  bonusFinal: L('合格', 'Passed'),
  rankUp: (r: string) => L(`階級が上がった！ ${r}`, `Rank up! ${r}`),
  newBadges: L('新しいバッジ', 'New badges'),
  newFloor: L('建物が1階分のびた！', 'The building grew one floor!'),
  comeBack: L('まちがえた問題は、明日の復習に出ます', 'The ones you missed will come back in tomorrow\'s review'),
  motto: L('今日の合言葉', "Today's rule"),
  home: L('ホームへ', 'Home'),
  toEnding: L('結末を見る', 'See the ending'),
  nextUp: (t: string) => L(`つぎへ：${t}`, `Next: ${t}`),

  // ---- 合言葉ノート
  mottos: L('合言葉', 'Rules'),
  badges: L('バッジ', 'Badges'),
  cases: L('実際にあった話', 'Real cases'),
  notYet: L('まだ', 'Not yet'),
  stats: (a: number, c: number) => L(`答えた数 ${a}・正解 ${c}`, `Answered ${a}, correct ${c}`),

  // ---- 学び方のわけ
  scienceIntro: L('このアプリは、学びの研究でわかっている方法で作っています。', 'This app is built on methods that research shows help people learn.'),
  scienceHere: L('このアプリでは', 'In this app'),
  refs: L('もとになった研究', 'Research'),

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
  dayPlace: (d: string, p: string) => L(`${d}　${p}`, `${d}: ${p}`),
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
  perfect: { name: L('全問正解', 'All correct'), how: L('レッスンを全部1回で正解した', 'Got every question in a lesson right first time') },
  combo5: { name: L('5問連続', 'Five in a row'), how: L('5問つづけて正解した', 'Answered 5 questions in a row correctly') },
  streak3: { name: L('3日つづけた', '3-day streak'), how: L('3日つづけて学んだ', 'Learned 3 days in a row') },
  streak7: { name: L('7日つづけた', '7-day streak'), how: L('7日つづけて学んだ', 'Learned 7 days in a row') },
  review10: { name: L('復習10問', '10 reviews'), how: L('復習で10問答えた', 'Answered 10 review questions') },
  allLessons: { name: L('1週間やりきった', 'Whole week done'), how: L('5つのレッスンを全部終えた', 'Finished all 5 lessons') },
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
