// 学び方のわけ：このアプリが使っている、学びの研究でわかっている方法
//   ・what = 研究でわかっていること（出典が示している範囲だけ）
//   ・here = このアプリでの使い方（learn.ts と画面の動きに合わせる）
//   ・出典は、著者・年・題名・雑誌・DOI を調べて確かめたものだけ（2026年11月）
//   ・「研究では」は画面の最初の一文（S.scienceIntro）で言っているので、ここではくり返さない
import type { L10n } from './types'

export interface Ref {
  cite: string
  url: string
}
export interface Principle {
  id: string
  name: L10n
  what: L10n
  here: L10n
  /** AIが使えるときだけ足す一文（claude.ai で開いたとき） */
  hereAI?: L10n
  /** AIが使える時だけ出す項目 */
  needsAI?: boolean
  refs: Ref[]
}

const L = (ja: string, en: string): L10n => ({ ja, en })

export const PRINCIPLES: Principle[] = [
  {
    id: 'retrieval',
    name: L('思い出して答える', 'Answer from memory'),
    what: L('読み返すより、思い出して答えるほうが、日がたっても忘れにくくなります。', 'Answering from memory helps you remember longer than reading the same thing again.'),
    here: L('レッスンは問題に答えるのが中心で、説明は答えたあとに出ます。', 'Lessons are mostly questions, and the explanation comes after you answer.'),
    refs: [
      {
        cite: 'Roediger, H. L., & Karpicke, J. D. (2006). Test-enhanced learning: Taking memory tests improves long-term retention. Psychological Science, 17(3), 249-255.',
        url: 'https://doi.org/10.1111/j.1467-9280.2006.01693.x',
      },
      {
        cite: "Dunlosky, J., Rawson, K. A., Marsh, E. J., Nathan, M. J., & Willingham, D. T. (2013). Improving students' learning with effective learning techniques: Promising directions from cognitive and educational psychology. Psychological Science in the Public Interest, 14(1), 4-58.",
        url: 'https://doi.org/10.1177/1529100612453266',
      },
    ],
  },
  {
    id: 'feedback',
    name: L('答えのわけを知る', 'Learn why'),
    what: L(
      '正しい答えだけでなく、そのわけも知ると、はじめて見る問題にも生かしやすくなります。',
      'Learning why an answer is right, not just what it is, helps with questions you have not seen before.',
    ),
    here: L(
      '答えるとすぐに、宮下さんがわけを話します。まちがえたときは、選んだ答えのどこがちがうかを教えてくれます。',
      'Right after you answer, Miyashita tells you why. If you missed it, he explains where the answer you picked went wrong.',
    ),
    refs: [
      {
        cite: 'Hattie, J., & Timperley, H. (2007). The power of feedback. Review of Educational Research, 77(1), 81-112.',
        url: 'https://doi.org/10.3102/003465430298487',
      },
      {
        cite: 'Butler, A. C., Godbole, N., & Marsh, E. J. (2013). Explanation feedback is better than correct answer feedback for promoting transfer of learning. Journal of Educational Psychology, 105(2), 290-298.',
        url: 'https://doi.org/10.1037/a0031026',
      },
    ],
  },
  {
    id: 'mastery',
    name: L('できるまで、もう一度', 'Try again until you get it'),
    what: L(
      'つまずいた所をやり直して、できてから先へ進むと、テストの成績が上がりやすくなります。',
      'Going back over what you missed, and moving on only once you have it, tends to raise test scores.',
    ),
    here: L('まちがえた問題は、正しく答えられるまで、レッスンの最後にもう一度出ます。', 'A question you miss comes back at the end of the lesson until you get it right.'),
    hereAI: L('「AIの宮下さんと練習」では、いちばん苦手な話題の新しい問題が出ます。', '"Practice with AI Miyashita" gives you new questions on your weakest topic.'),
    refs: [
      {
        cite: 'Kulik, C.-L. C., Kulik, J. A., & Bangert-Drowns, R. L. (1990). Effectiveness of mastery learning programs: A meta-analysis. Review of Educational Research, 60(2), 265-299.',
        url: 'https://doi.org/10.3102/00346543060002265',
      },
    ],
  },
  {
    id: 'spacing',
    name: L('日をあけて、また解く', 'Space it out over days'),
    what: L('一度にまとめて学ぶより、日をあけて何度か学ぶほうが、長く覚えていられます。', 'Studying a few times with days in between helps you remember longer than studying all at once.'),
    here: L(
      '正解するたびに、次に「今日の復習」に出るまでの間が、1日、3日、7日と長くなります。まちがえると、次の日にまた出ます。',
      `Each time you get a question right, the wait before it comes back in "Today's review" gets longer: 1 day, then 3 days, then 7 days. If you miss it, it comes back the next day.`,
    ),
    refs: [
      {
        cite: 'Cepeda, N. J., Pashler, H., Vul, E., Wixted, J. T., & Rohrer, D. (2006). Distributed practice in verbal recall tasks: A review and quantitative synthesis. Psychological Bulletin, 132(3), 354-380.',
        url: 'https://doi.org/10.1037/0033-2909.132.3.354',
      },
    ],
  },
  {
    id: 'interleaving',
    name: L('話題をまぜて解く', 'Mix the topics'),
    what: L(
      '似ているけれどちがう種類の問題をまぜて練習すると、あとで解ける力がつきやすくなります。',
      'Practicing similar but different kinds of problems mixed together often helps you do better later on.',
    ),
    here: L('復習とまとめテストは、ちがう話題の問題をまぜて出します。', 'Reviews and the final test mix questions from different topics.'),
    refs: [
      {
        cite: 'Rohrer, D., & Taylor, K. (2007). The shuffling of mathematics problems improves learning. Instructional Science, 35(6), 481-498.',
        url: 'https://doi.org/10.1007/s11251-007-9015-8',
      },
      {
        cite: 'Brunmair, M., & Richter, T. (2019). Similarity matters: A meta-analysis of interleaved learning and its moderators. Psychological Bulletin, 145(11), 1029-1052.',
        url: 'https://doi.org/10.1037/bul0000209',
      },
    ],
  },
  {
    id: 'concrete',
    name: L('具体的な場面を、絵で見る', 'Concrete scenes, with pictures'),
    what: L('言葉の説明だけより、具体的な例や絵がいっしょのほうが、学びやすくなります。', 'People learn more easily from words with concrete examples and pictures than from words alone.'),
    here: L(
      'レッスンの問題は、どれも現場の1つの場面を絵で見せます。実際にあった話を読める問題もあります。',
      'Every lesson question shows one moment on a site in a picture. Some also tell you about a case that really happened.',
    ),
    refs: [
      {
        cite: 'Mayer, R. E. (2020). Multimedia learning (3rd ed.). Cambridge University Press.',
        url: 'https://doi.org/10.1017/9781316941355',
      },
      {
        cite: 'Rawson, K. A., Thomas, R. C., & Jacoby, L. L. (2015). The power of examples: Illustrative examples enhance conceptual learning of declarative concepts. Educational Psychology Review, 27(3), 483-504.',
        url: 'https://doi.org/10.1007/s10648-014-9273-3',
      },
    ],
  },
  {
    id: 'explain',
    needsAI: true,
    name: L('「なぜ？」を自分で考える', 'Explain why in your own words'),
    what: L(
      '「なぜそうなるのか」を自分の言葉で説明しながら学ぶと、理解が深まりやすくなります。',
      'Explaining to yourself why something is so, in your own words, helps you understand it more deeply.',
    ),
    here: L(
      '答えたあと「AIに聞く」を押し、「自分の考えを書いてみる」を選んで、「〜だからだと思う」と書いてみてください。AIの宮下さんが、合っているか見てくれます。',
      `After you answer, press "Ask AI", then "Explain why in my own words", and finish the sentence "I think it's because...". AI Miyashita will tell you if you have it right.`,
    ),
    refs: [
      {
        cite: 'Chi, M. T. H., de Leeuw, N., Chiu, M.-H., & LaVancher, C. (1994). Eliciting self-explanations improves understanding. Cognitive Science, 18(3), 439-477.',
        url: 'https://doi.org/10.1207/s15516709cog1803_3',
      },
      {
        cite: 'Bisra, K., Liu, Q., Nesbit, J. C., Salimi, F., & Winne, P. H. (2018). Inducing self-explanation: A meta-analysis. Educational Psychology Review, 30(3), 703-725.',
        url: 'https://doi.org/10.1007/s10648-018-9434-x',
      },
    ],
  },
  {
    id: 'motivation',
    name: L('つづけたくなるしかけ', 'Things that keep you going'),
    what: L('「できた」と感じられると、やる気が出やすくなります。ゲームのしかけも、学びを少し助けます。', 'Feeling that you can do it keeps you motivated. Game elements like points and ranks can also give learning a small boost.'),
    here: L(
      '正解するとポイントがたまり、階級が上がります。つづけた日数や、レッスンを終えるごとに1階ずつ高くなる建物でも、進み具合が見えます。',
      'Right answers earn points and raise your rank. Your streak and the building, which grows one floor for each lesson you finish, also show your progress.',
    ),
    refs: [
      {
        cite: 'Ryan, R. M., & Deci, E. L. (2000). Self-determination theory and the facilitation of intrinsic motivation, social development, and well-being. American Psychologist, 55(1), 68-78.',
        url: 'https://doi.org/10.1037/0003-066X.55.1.68',
      },
      {
        cite: 'Sailer, M., & Homner, L. (2020). The gamification of learning: A meta-analysis. Educational Psychology Review, 32(1), 77-112.',
        url: 'https://doi.org/10.1007/s10648-019-09498-w',
      },
    ],
  },
]
