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
        ja: 'うん。電車やお店では、だれが見て、だれが聞いているかわからないからね。',
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
      who: 'YOU',
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
        ja: '銀行の図面には、金庫室やカメラの場所が載っているんだ。電車では、となりや前に立つ人から、手元がよく見えるよ。図面は、現場で見よう。',
        en: 'The bank drawings show where the vault room and the cameras are. On a train, the people beside you and standing in front of you can see what is in your hands. Look at the drawings at the site.',
      },
      wrongWhy: [
        {
          ja: '小さくたたんでも、広げている所は、まわりから見えるよ。図面は、ちらっと見られるだけでも困るんだ。',
          en: 'Even folded small, the part you have open can still be seen. With drawings, even a quick look is a problem.',
        },
        null,
        {
          ja: 'すいていても、次の駅でだれが乗ってくるかわからないよ。電車の中では、図面を出さないのがいちばんだね。',
          en: "Even if the car is empty now, you can't know who will get on at the next station. It's best not to take drawings out on a train at all.",
        },
      ],
      tip: { ja: '図面は、電車の中で出さない', en: "Don't take drawings out on the train" },
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
        en: 'You tell him, "Let\'s not talk about that here." Is that OK?',
      },
      answer: true,
      why: {
        ja: 'それでいいんだよ。金庫の場所は、銀行をねらう人がいちばん知りたいことなんだ。その話は、現場の中だけにしよう。',
        en: "Yes, that's right. The vault's location is exactly what someone planning to rob the bank wants to know. Keep that kind of talk inside the site.",
      },
      wrongWhy: {
        ja: 'お店では、だれが聞いているかわからないよ。目上の人でも、止めていいんだ。「続きは現場で」と言えば、気まずくならないね。',
        en: 'In a bar you never know who is listening. It\'s OK to stop someone senior. Say "Let\'s finish this at the site," and it won\'t feel awkward.',
      },
      tip: { ja: '現場のくわしい話は、お店や電車でしない', en: 'Keep site details out of bars and trains' },
    },

    // 3. 飲み会に、仕事のデータを持っていく
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
        ja: '持っていかなければ、お店に忘れることも、落とすこともないよ。事務所にしまって鍵をかけておけば、飲み会も安心して楽しめるね。',
        en: "If you don't bring it, you can't leave it at the bar or drop it. Lock it up in the office, and you can enjoy the evening without worrying.",
      },
      wrongWhy: [
        {
          ja: '気をつけるつもりでも、酔うとつい忘れてしまうよ。お店や帰りの電車に置き忘れる話は、よくあるんだ。',
          en: 'You may mean to be careful, but drinking makes you forget. People leave bags in bars and on the train home all the time.',
        },
        {
          ja: '一杯だけのつもりでも、つい飲みすぎてしまうものだよ。それに、少し飲んだだけでも、うっかりしやすくなるんだ。',
          en: "You may plan to have just one, but it's easy to have more. And even a little alcohol makes you careless.",
        },
        null,
      ],
      tip: { ja: '飲み会には、仕事の物を持っていかない', en: "Don't bring work things to a night out" },
      real: 'nexco-usb',
    },

    // 4. 車に図面を置いたまま離れる
    {
      id: 'outside-04',
      topic: 'outside',
      kind: 'tf',
      who: 'YOU',
      place: { ja: 'コンビニの駐車場', en: 'Store parking lot' },
      pic: 'pic.drawings_on_dashboard',
      situation: {
        ja: '本社に図面を届ける途中、コンビニに寄る。図面は、車のダッシュボードの上にある。',
        en: 'On the way to drop off drawings at the head office, you stop at a convenience store. The drawings are on the dashboard.',
      },
      ask: {
        ja: 'すぐ戻るので、図面を車に置いたまま店に入る。これでいい？',
        en: "You'll be right back, so you leave the drawings in the car and go into the store. Is that OK?",
      },
      answer: false,
      why: {
        ja: 'ダッシュボードに置いた物は、外から丸見えなんだ。図面を見れば、銀行の工事だとすぐわかるよ。車を離れるときは、図面も持っていこう。',
        en: 'Anything on the dashboard is in plain view from outside, and one look at the drawings shows they are for the bank. When you leave the car, take the drawings with you.',
      },
      wrongWhy: {
        ja: '鍵をかけていても、窓ガラスを割られたら同じなんだ。数分あれば、図面を持っていかれてしまうよ。',
        en: "Locking the car won't help if someone smashes a window. A few minutes is all it takes to grab the drawings.",
      },
      tip: { ja: '図面は、車に置いていかない', en: "Don't leave drawings in the car" },
    },

    // 5. 外で、知らない人に現場のことを聞かれる
    {
      id: 'outside-05',
      topic: 'outside',
      kind: 'mc',
      who: 'STRANGER',
      pic: 'pic.mail_phone_number',
      place: { ja: '自宅', en: 'At home' },
      situation: {
        ja: '休みの日、自分のスマホに知らない番号から電話が来た。「本社の設備の者です。点検の準備で、銀行の金庫がどの辺りか確かめたくて」',
        en: 'On your day off, an unknown number calls your phone. "I\'m from head office facilities. For the inspection, I need to check where the bank\'s vault is."',
      },
      ask: {
        ja: 'どうするのがいい？',
        en: 'What should you do?',
      },
      choices: [
        { ja: '断って、事務所に知らせる', en: 'Say no, and tell the office' },
        { ja: '本社の人だから、教えてあげる', en: "He's from head office, so tell him" },
        { ja: '断って、そのまま電話を切る', en: 'Say no, and just hang up' },
      ],
      correct: 0,
      why: {
        ja: '本当に本社の人なら、あなたのスマホに聞いたりせず、現場の事務所に問い合わせるよ。事務所なら、本当に本社の人か確かめられるんだ。',
        en: 'Someone really from head office would ask the site office, not call your own phone. The office can check whether they really are.',
      },
      wrongWhy: [
        null,
        {
          ja: '本社の人だと名乗っても、電話では本当かどうかわからないよ。それに、金庫の場所は外で話すことじゃないね。',
          en: "Anyone can say they're from head office, and you can't check it over the phone. Besides, where the vault is isn't something to talk about outside.",
        },
        {
          ja: '断ったのは、よかったよ。でも、その人は、ほかの作業員にも電話するかもしれない。事務所に知らせれば、みんなで気をつけられるね。',
          en: 'It was good that you said no. But he may call other workers too. If you tell the office, everyone can watch out.',
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
      place: { ja: '現場の前の道路', en: 'Street by the site' },
      pic: 'pic.drawings_by_roadside',
      situation: {
        ja: '木村さんが、次の現場へ移るところ。道具を車に積むあいだ、図面の袋を道路わきに置いた。',
        en: 'Kimura is heading to another site. While he loads tools into the van, he puts the bag of drawings down by the road.',
      },
      ask: {
        ja: '積み終わるまで、図面の袋はそこに置いておく。これでいい？',
        en: "He leaves the bag there until he's done loading. Is that OK?",
      },
      answer: false,
      why: {
        ja: '道路わきに置いた袋は、通る人ならだれでも持っていけるんだ。図面の袋は肩にかけておくか、先に車に入れておこう。',
        en: 'A bag left by the road can be picked up by anyone walking past. Keep the bag of drawings on your shoulder, or put it in the van first.',
      },
      wrongWhy: {
        ja: 'すぐ取るつもりでも、忘れて出発してしまうことがあるんだ。実際に、図面を道路わきに置いたまま行ってしまった話もあるよ。',
        en: 'You may mean to grab the bag in a second, but people do forget and drive off. It has really happened: a crew drove away and left drawings by the road.',
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
      place: { ja: '自宅', en: 'Home' },
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
        ja: '早くわかれば、会社がスマホを使えないようにしたり、パスワードを変えたりできるよ。あとで見つかってもいいから、まず知らせてね。',
        en: 'The sooner we know, the sooner the company can lock the phone and change passwords. Tell me first, even if it turns up later.',
      },
      wrongWhy: [
        {
          ja: '探している間に、だれかが中を見てしまうかもしれないよ。探すのは、知らせたあとでいいんだ。',
          en: 'While you search, someone could be looking through it. You can still search after you tell us.',
        },
        null,
        {
          ja: '休みの日でも、電話していいんだよ。月曜まで待つと、その間ずっと中を見られるかもしれない。',
          en: "It's fine to call on a day off. If you wait until Monday, someone could be looking through it the whole time.",
        },
      ],
      tip: { ja: '仕事の物をなくしたら、休みの日でもすぐ知らせる', en: 'Lost something from work? Report it at once, even on a day off' },
    },
  ],
}
