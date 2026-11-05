// 金曜日：帰り道「現場の外で」
// 現場を出たあと（電車・お店・車・駅・次の日の朝）に、図面や仕事の話、仕事の物をどう扱うか
import type { Lesson } from '../types'

export const LESSON: Lesson = {
  id: 'outside',
  dayName: { ja: '金曜日', en: 'Friday' },
  place: { ja: '帰り道', en: 'On the way home' },
  title: { ja: '現場の外で', en: 'Outside the site' },
  intro: [
    {
      who: 'BOSS',
      t: {
        ja: '一週間、おつかれさま。今日は、現場を出たあとの話をしよう。',
        en: "Good work this week. Today let's talk about what happens after you leave the site.",
      },
    },
    {
      who: 'YOU',
      t: {
        ja: '帰り道でも、気をつけることがあるんですか？',
        en: 'Do I need to be careful on the way home too?',
      },
    },
    {
      who: 'BOSS',
      t: {
        ja: 'うん。電車やお店では、だれが見て、だれが聞いているか分からないからね。',
        en: "Yes. On the train or in a restaurant, you never know who's watching or listening.",
      },
    },
  ],
  motto: {
    ja: '現場の外では、見せない・話さない・手から離さない',
    en: "Outside the site: don't show it, don't say it, don't leave it",
  },
  icon: 'pic.outside',
  questions: [
    // 1. 電車で図面を広げる（いちばんよくある）
    {
      id: 'outside-01',
      topic: 'outside',
      kind: 'mc',
      who: 'BOSS',
      pic: 'pic.drawings_on_train_lap',
      situation: {
        ja: '打ち合わせの帰り、電車で座れた。来週の段取りを、銀行の図面で確かめたい。',
        en: "On the way back from a meeting, you get a seat on the train. You'd like to check next week's work on the bank drawings.",
      },
      ask: {
        ja: '図面は、どうするのがいい？',
        en: "What's the best thing to do with the drawings?",
      },
      choices: [
        { ja: '小さくたたんで、ひざの上で見る', en: 'Fold them small and look at them on your lap' },
        { ja: 'カバンにしまったまま、現場で見る', en: 'Keep them in your bag and look at them at the site' },
        { ja: '人の少ない車両に移って見る', en: 'Move to an emptier car and look there' },
      ],
      correct: 1,
      why: {
        ja: '電車では、となりの人や前に立っている人から、手元がよく見えるよ。銀行の図面には、金庫やカメラの場所が描いてある。図面は現場で見よう。',
        en: 'On a train, the person next to you and the people standing in front can see what is in your hands. The bank drawings show where the vault and cameras are. Look at them at the site.',
      },
      wrongWhy: [
        {
          ja: '小さくたたんでも、となりの人からは見えてしまうよ。図面は、ちらっと見られるだけでも困るんだ。',
          en: 'Even if you fold them small, the person next to you can still see them. With drawings, even a quick look is a problem.',
        },
        null,
        {
          ja: 'すいていても、次の駅でだれが乗ってくるか分からないよ。電車の中では、図面を出さないのがいちばんだね。',
          en: "Even if the car is empty now, you can't know who will get on at the next station. It's best not to take drawings out on a train at all.",
        },
      ],
      tip: { ja: '電車の中では、図面を出さない', en: "Don't take drawings out on the train" },
    },

    // 2. お店で現場の話をする
    {
      id: 'outside-02',
      topic: 'outside',
      kind: 'tf',
      who: 'KIMURA',
      pic: 'pic.izakaya_loud_talk',
      situation: {
        ja: '駅前の居酒屋。木村さんが大きな声で、銀行の金庫の場所を話しはじめた。',
        en: "At a bar by the station, Kimura starts talking loudly about where the bank's vault is.",
      },
      ask: {
        ja: '木村さんに「その話は、ここではやめましょう」と言う。これでいい？',
        en: 'You tell him, "Let\'s not talk about that here." Is that right?',
      },
      answer: true,
      why: {
        ja: 'それでいいんだよ。お店では、となりの席にだれがいるか分からない。金庫やカメラの話は、現場の中だけにしよう。',
        en: "Yes, that's right. In a bar you never know who is at the next table. Keep talk about the vault and cameras inside the site.",
      },
      wrongWhy: {
        ja: 'お店では、だれが聞いているか分からないよ。目上の人でも、止めていいんだ。「続きは現場で」と言えば、気まずくならないね。',
        en: 'In a bar you never know who is listening. It\'s OK to stop someone senior. Say "Let\'s finish this at the site," and it won\'t feel awkward.',
      },
      tip: { ja: '現場のくわしい話は、お店や電車でしない', en: 'Keep site details out of bars and trains' },
    },

    // 3. 飲み会に、仕事のデータを持って行く
    {
      id: 'outside-03',
      topic: 'outside',
      kind: 'mc',
      who: 'SAWA',
      pic: 'pic.usb_at_drinks',
      situation: {
        ja: '仕事のあと、沢口さんに飲みに誘われた。カバンには、銀行の図面が入ったUSBメモリがある。',
        en: "After work, Sawaguchi asks you out for drinks. There's a USB stick with the bank drawings in your bag.",
      },
      ask: {
        ja: 'USBメモリは、どうする？',
        en: 'What do you do with the USB stick?',
      },
      choices: [
        { ja: 'カバンを足元に置いて、気をつけて飲む', en: 'Keep the bag at your feet and be careful' },
        { ja: 'お酒は少しにして、持ったまま行く', en: 'Drink only a little and take it with you' },
        { ja: '事務所の鍵のかかる所に置いてから行く', en: 'Lock it up in the office before you go' },
      ],
      correct: 2,
      why: {
        ja: 'お酒が入ると、だれでも忘れ物をしやすくなるよ。飲み会の日は、仕事の物を持って行かないのがいちばんだね。',
        en: 'After a few drinks, anyone gets forgetful. On a night out, the best thing is not to bring work things at all.',
      },
      wrongWhy: [
        {
          ja: '気をつけるつもりでも、酔うとつい忘れてしまうよ。お店や帰りの電車に置き忘れる話は、よくあるんだ。',
          en: 'You may mean to be careful, but drinking makes you forget. People leave bags in bars and on the train home all the time.',
        },
        {
          ja: '少しだけのつもりでも、つい飲んでしまうものだよ。持って行かなければ、なくすこともないね。',
          en: "You may plan to drink only a little, but it's easy to have more. If you don't bring it, you can't lose it.",
        },
        null,
      ],
      tip: { ja: '飲み会には、仕事の物を持って行かない', en: "Don't bring work things to a night out" },
      real: 'nexco-usb',
    },

    // 4. 車に図面を置いたまま離れる
    {
      id: 'outside-04',
      topic: 'outside',
      kind: 'tf',
      who: 'BOSS',
      pic: 'pic.drawings_on_dashboard',
      situation: {
        ja: '本社に図面を届ける途中、コンビニに寄る。図面は、車のダッシュボードの上にある。',
        en: 'On the way to drop off drawings at the head office, you stop at a convenience store. The drawings are on the dashboard.',
      },
      ask: {
        ja: 'すぐ戻るから、図面は車に置いたままでいい？',
        en: "You'll be right back. Is it OK to leave the drawings in the car?",
      },
      answer: false,
      why: {
        ja: 'ダッシュボードの図面は、外から窓ごしに見えるよ。窓を割って取られることもある。車を離れるときは、図面も持って行こう。',
        en: 'Drawings on the dashboard can be seen through the windshield. Someone could also break a window and take them. When you leave the car, take the drawings with you.',
      },
      wrongWhy: {
        ja: '数分でも、通る人には図面が見えるし、取られることもあるよ。鍵をかけていても同じだね。',
        en: "Even for a few minutes, people walking by can see the drawings, and they can be stolen. Locking the car doesn't change that.",
      },
      tip: { ja: '車を離れるときは、図面も持って行く', en: 'Take the drawings with you when you leave the car' },
    },

    // 5. 外で、知らない人に現場のことを聞かれる
    {
      id: 'outside-05',
      topic: 'outside',
      kind: 'mc',
      who: 'STRANGER',
      pic: 'pic.stranger_at_station',
      situation: {
        ja: '帰りの駅で、男の人に声をかけられた。「点検でうかがった者です。銀行の金庫は、どの辺りでしたっけ？」',
        en: 'At the station on your way home, a man stops you. "I came by for the inspection. Where was the bank\'s vault again?"',
      },
      ask: {
        ja: 'どうするのがいい？',
        en: 'What should you do?',
      },
      choices: [
        { ja: '断って、事務所に知らせる', en: 'Say no, and tell the office' },
        { ja: '点検の人だから、教えてあげる', en: "He's an inspector, so tell him" },
        { ja: '断って、そのまま帰る', en: 'Say no, and just head home' },
      ],
      correct: 0,
      why: {
        ja: '本当の点検の人なら、駅で聞いたりせず、会社に問い合わせるよ。知らせてくれたら、現場のみんなにも気をつけてもらえるね。',
        en: 'A real inspector would ask the company, not stop you at a station. If you tell us, everyone on the site can watch out for him.',
      },
      wrongWhy: [
        null,
        {
          ja: '点検の人だと名乗っても、本当かどうかはその場では分からないよ。それに、金庫の場所は外で話すことじゃないね。',
          en: "Anyone can say they're an inspector, and you can't check it on the spot. Besides, where the vault is isn't something to talk about outside.",
        },
        {
          ja: '断れたのは、いいね。でも、その人はほかの人にも聞くかもしれない。事務所に知らせれば、みんなで気をつけられるよ。',
          en: "It's good that you said no. But he may try asking someone else. If you tell the office, everyone can watch out.",
        },
      ],
      tip: { ja: '外で現場のことを聞かれたら、答えずに事務所に知らせる', en: "Asked about the site outside? Don't answer. Tell the office." },
    },

    // 6. 図面を道路わきに置いたまま（実際にあった話）
    {
      id: 'outside-06',
      topic: 'outside',
      kind: 'tf',
      who: 'KIMURA',
      pic: 'pic.drawings_by_roadside',
      situation: {
        ja: '木村さんが、次の現場へ移るところ。道具を車に積むあいだ、図面の袋を道路わきに置いた。',
        en: 'Kimura is heading to another site. While he loads tools into the van, he puts the bag of drawings down by the road.',
      },
      ask: {
        ja: '積み終わるまで、図面はそこに置いたままでいい？',
        en: "Is it OK to leave the drawings there until he's done loading?",
      },
      answer: false,
      why: {
        ja: '積みこみに気を取られると、置いた物を忘れやすいよ。図面の袋は肩にかけておくか、先に車に入れておこう。',
        en: "When you're busy loading, it's easy to forget what you put down. Keep the bag of drawings on your shoulder, or put it in the van first.",
      },
      wrongWhy: {
        ja: 'すぐ取るつもりでも、忘れて出発してしまうことがあるんだ。実際に、図面を道路わきに置いたまま行ってしまった話もあるよ。',
        en: 'You may mean to grab them in a second, but people do forget and drive off. A crew once really left drawings by the road like this.',
      },
      tip: { ja: '持ち出した図面は、手から離さない', en: 'Once drawings leave the site, keep them on you' },
      real: 'yokosuka-roadside',
    },

    // 7. なくしたと気づいたら
    {
      id: 'outside-07',
      topic: 'outside',
      kind: 'mc',
      who: 'YOU',
      pic: 'pic.phone_left_on_train_seat',
      situation: {
        ja: '土曜の朝。会社のスマホが見当たらない。帰りの電車に忘れたかもしれない。',
        en: 'Saturday morning. You can\'t find your work phone. You may have left it on the train home.',
      },
      ask: {
        ja: 'まず、どうする？',
        en: 'What do you do first?',
      },
      choices: [
        { ja: '自分で探して、なければ報告する', en: "Look for it yourself, and report it if it doesn't turn up" },
        { ja: 'すぐ宮下さんに電話して、伝える', en: 'Call Miyashita right away and tell him' },
        { ja: '休みなので、月曜に会社で話す', en: "It's the weekend, so tell them on Monday" },
      ],
      correct: 1,
      why: {
        ja: '早く分かれば、会社がスマホを使えないようにしたり、パスワードを変えたりできるよ。あとで見つかってもいいから、まず知らせてね。',
        en: 'The sooner we know, the sooner the company can lock the phone and change passwords. Tell me first, even if it turns up later.',
      },
      wrongWhy: [
        {
          ja: '探している間に、だれかが中を見てしまうかもしれないよ。探すのは、知らせてからでも大丈夫。',
          en: 'While you search, someone could be looking through it. You can still search after you tell us.',
        },
        null,
        {
          ja: '休みの日でも、電話していいんだよ。月曜まで待つと、その間ずっと中を見られるかもしれない。',
          en: "It's fine to call on a day off. If you wait until Monday, someone could be looking through it the whole time.",
        },
      ],
      tip: { ja: 'なくしたら、休みの日でもすぐ知らせる', en: 'Lost something? Report it at once, even on a day off' },
    },
  ],
}
