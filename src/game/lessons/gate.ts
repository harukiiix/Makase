// 火曜日：ゲート「入ってくる人、出ていく物」
//   入れる前に確かめる（知らない人・共連れ・入場証の貸し借り・名前を出す人）
//   出ていく物と話に気をつける（捨てる紙・立ち話）。看板に書いてあることは、話してよい
import type { Lesson } from '../types'

export const LESSON: Lesson = {
  id: 'gate',
  dayName: { ja: '火曜日', en: 'Tuesday' },
  place: { ja: 'ゲート', en: 'Site gate' },
  title: { ja: '入ってくる人、出ていく物', en: 'Who comes in, what goes out' },
  intro: [
    {
      who: 'BOSS',
      t: {
        ja: '今日は、ゲートの話をしよう。人が入ってくる所で、物が出ていく所でもあるんだ。',
        en: "Let's talk about the gate today. It's where people come in, and also where things go out.",
      },
    },
    {
      who: 'YOU',
      t: { ja: '知らない人が来たら、どうすればいいですか？', en: "What should I do when someone I don't know shows up?" },
    },
    {
      who: 'BOSS',
      t: {
        ja: '中に入れる前に、まず確かめよう。それから、捨てる紙にも気をつけようね。',
        en: 'Check first, before you let them in. And be careful with the papers you throw out, too.',
      },
    },
  ],
  motto: { ja: '知らない人は、確かめてから入れる', en: 'Check strangers before you let them in' },
  icon: 'pic.gate',
  questions: [
    // 1. よくある手口：それらしい服装で「点検です」
    {
      id: 'gate-01',
      topic: 'gate',
      kind: 'mc',
      who: 'STRANGER',
      pic: 'pic.inspector_at_gate',
      situation: {
        ja: '作業服の男の人がゲートに来た。「点検です」と言うが、入場証は持っていない。',
        en: 'A man in work clothes comes to the gate. He says, "I\'m here for an inspection," but he has no site badge.',
      },
      ask: { ja: 'どうするのがいい？', en: 'What should you do?' },
      choices: [
        { ja: '作業服を着ているので、通す', en: "He's in work clothes, so let him in" },
        { ja: '外で待ってもらい、事務所に確かめる', en: 'Ask him to wait outside and check with the office' },
        { ja: '急いでいるようなので、通してから確かめる', en: 'He seems in a hurry, so let him in and check later' },
      ],
      correct: 1,
      why: {
        ja: '点検の予定は、事務所が知っているはずだよ。本物の点検の人なら、少し待ってもらっても困らないんだ。',
        en: "The office will know if an inspection is planned. A real inspector won't mind waiting a moment.",
      },
      wrongWhy: [
        {
          ja: '作業服は、だれでも買えるよ。見た目だけでは、本当に点検の人かはわからないね。',
          en: "Anyone can buy work clothes. Looks alone can't tell you he's really an inspector.",
        },
        null,
        {
          ja: '通してから確かめると、その間に中を見られてしまうよ。急いでいても、確かめるのが先なんだ。',
          en: 'If you check after letting him in, he can look around in the meantime. Even if he is in a hurry, checking comes first.',
        },
      ],
      tip: { ja: '知らない人は、事務所に確かめてから入れる', en: 'Check with the office before letting a stranger in' },
    },
    // 2. 共連れ：前の人のすぐ後ろについて入る
    {
      id: 'gate-02',
      topic: 'gate',
      kind: 'tf',
      who: 'GUARD',
      pic: 'pic.tailgating_at_gate',
      situation: {
        ja: '朝のゲートで、職人さんたちが入場証を見せて入っていく。一人だけ、前の人のすぐ後ろについて、見せずに入ろうとしている。',
        en: 'At the gate in the morning, workers show their badges as they go in. One man is about to walk in right behind the person ahead without showing his.',
      },
      ask: { ja: 'この人を、このまま通す。これでいい？', en: 'You let him walk in like that. Is that OK?' },
      answer: false,
      why: {
        ja: 'みんなといっしょに見えても、仲間とは限らないよ。入場証は、一人ずつ見せてもらおう。',
        en: "He may look like part of the group, but he might not be. Check everyone's badge, one person at a time.",
      },
      wrongWhy: {
        ja: '朝は忙しいから、つい通したくなるね。でも、入場証を見ないで通すと、だれが中にいるかわからなくなるよ。',
        en: "Mornings are busy, so it's tempting to wave him in. But if you don't check his badge, nobody knows who is inside.",
      },
      tip: { ja: '入場証は、一人ずつ見せてもらう', en: 'Check every badge, one person at a time' },
    },
    // 3. 出ていく物：図面や名簿を資源ゴミに出す（実際にあった話）
    {
      id: 'gate-03',
      topic: 'gate',
      kind: 'mc',
      who: 'SAWA',
      pic: 'pic.papers_by_recycle_bag',
      situation: {
        ja: '沢口さんに「古い図面と作業員名簿のコピー、捨てておいてくれる？」と頼まれた。ゲートの横に、資源ゴミの袋がある。',
        en: 'Sawaguchi asks you, "Could you throw out these old drawings and copies of the worker list?" There is a recycling bag next to the gate.',
      },
      ask: { ja: 'この紙は、どうやって捨てる？', en: 'How should these papers be thrown out?' },
      choices: [
        { ja: '紙なので、資源ゴミの袋に入れる', en: "It's paper, so put it in the recycling bag" },
        { ja: '手で細かく破いて、ゴミ袋に入れる', en: 'Tear it up by hand and put it in the trash' },
        { ja: 'シュレッダーか、鍵つきの回収箱に入れる', en: 'Shred it, or put it in the locked disposal box' },
      ],
      correct: 2,
      why: {
        ja: '古い図面でも、金庫室やカメラの場所は、今とほとんど同じだよ。名簿のコピーにも、みんなの名前や住所がそのまま載っているんだ。',
        en: "Even on old drawings, the vault room and the cameras are in almost the same place as now. And copies of the list still have everyone's names and addresses.",
      },
      wrongWhy: [
        {
          ja: '資源ゴミは、読める紙のまま運ばれていくよ。実際に、回収車から書類が落ちて、道に散らばったこともあるんだ。',
          en: 'Recycling is carried off just as it is, still readable. Papers put out as recycling have really fallen off a collection truck and scattered across a road.',
        },
        {
          ja: '手で破いたくらいだと、つなぎ合わせれば読めてしまうよ。',
          en: 'Paper torn by hand can be pieced back together and read.',
        },
        null,
      ],
      tip: { ja: '図面や名簿は、シュレッダーか鍵つきの回収箱へ', en: 'Drawings and worker lists go to the shredder or the locked disposal box' },
      real: 'gunma-shred',
    },
    // 4. これは大丈夫：看板に書いてあること（工事の期間）は、近所の人に話していい
    //    （看板を外に出しておく話は、月曜日の see-06 にある）
    {
      id: 'gate-04',
      topic: 'gate',
      kind: 'tf',
      who: 'YOU',
      pic: 'pic.signs_on_fence',
      situation: {
        ja: 'ゲートの前で、近所の人に「この工事、いつまでやるの？」と聞かれた。工事の期間は、すぐ横の看板にも書いてある。',
        en: 'Outside the gate, a neighbor asks, "How long is this work going on for?" The work period is also written on the sign right there.',
      },
      ask: { ja: '工事の期間を教える。これでいい？', en: 'You tell them how long the work will last. Is that OK?' },
      answer: true,
      why: {
        ja: '看板は、近所の人に工事のことを知らせるための物だよ。そこに書いてある期間なら、教えて大丈夫なんだ。',
        en: 'The signs are there to tell neighbors about the work. The period written on them is fine to share.',
      },
      wrongWhy: {
        ja: 'なんでも断ればいい、というわけではないよ。話さないのは、金庫やカメラのような、建物の中のことなんだ。',
        en: "Saying no to everything isn't the answer. What you keep to yourself is the inside of the building, like where the vault and the cameras are.",
      },
      tip: { ja: '看板に書いてあることは、話していい', en: "What's on the sign is fine to share" },
    },
    // 5. 入場証の貸し借り
    {
      id: 'gate-05',
      topic: 'gate',
      kind: 'tf',
      who: 'KIMURA',
      pic: 'pic.borrowed_badge',
      situation: {
        ja: '木村さんが、入場証を家に忘れた。「今日休みの仲間のを借りてきた」と言って、それで入ろうとしている。',
        en: 'Kimura left his badge at home. He says, "I borrowed one from a guy on my crew who\'s off today," and is about to go in with it.',
      },
      ask: { ja: '借りた入場証のまま、木村さんを通す。これでいい？', en: 'You let Kimura in on the borrowed badge. Is that OK?' },
      answer: false,
      why: {
        ja: '借りた入場証で通れるなら、知らない人も同じやり方で通れちゃうよ。忘れたときは、事務所で確かめてもらって、その日だけの入場証をもらおう。',
        en: 'If a borrowed badge gets someone in, a stranger could get in the same way. If you forget yours, have the office check who you are and get a badge just for that day.',
      },
      wrongWhy: {
        ja: '木村さん本人でも、借りた入場証だと、記録では休みの人が中にいることになるよ。何かあったときに、だれが中にいるかわからないね。',
        en: "Even if it's really Kimura, the records would show the man who is off today as being on site. If something happened, nobody would know who is really inside.",
      },
      tip: { ja: '入場証は、一人に一枚。貸し借りしない', en: 'One badge per person. Never lend or borrow one' },
    },
    // 6. 出ていく話：ゲートでの立ち話（4. と対になる：中のことは話さない）
    {
      id: 'gate-06',
      topic: 'gate',
      kind: 'mc',
      who: 'YOU',
      pic: 'pic.crew_photo_for_sns',
      place: { ja: '休憩所', en: 'Site break room' },
      situation: {
        ja: '休み時間。SNSで、前に仕事の話をした友だちから「銀行の工事なんでしょ。金庫ってどのへんにできるの？」とメッセージが来た。',
        en: 'On a break, a friend you once told about your work messages you on social media: "It\'s a bank job, right? Where\'s the vault going to be?"',
      },
      ask: { ja: 'なんて返すのがいい？', en: "What's the best reply?" },
      choices: [
        { ja: '中のことは話せない、とやさしく断る', en: "Politely say you can't talk about what's inside" },
        { ja: '友だちなので、知っていることを話す', en: "It's a friend, so tell them what you know" },
        { ja: '「1階の奥のほう」と、だいたいの場所だけ言う', en: 'Just give a rough idea, like "at the back of the first floor"' },
      ],
      correct: 0,
      why: {
        ja: '金庫やカメラの場所は、だれに聞かれても話さないでおこう。「中のことは話せないんです」と言えば、気まずくならないよ。',
        en: 'Whoever asks, don\'t say where the vault or the cameras are. "Sorry, I can\'t talk about the inside" keeps it friendly.',
      },
      wrongWhy: [
        null,
        {
          ja: '友だちでも、送った文は残るし、どこまで広がるかわからないよ。金庫の場所は、銀行の大事な秘密なんだ。',
          en: "Even with a friend, a message stays, and you never know how far it will travel. The vault's location is the bank's big secret.",
        },
        {
          ja: 'だいたいの場所でも、銀行をねらう人には大きな手がかりになるよ。「1階の奥のほう」だけでも、探す場所がぐっと減るんだ。',
          en: 'Even a rough location is a big clue to someone planning to rob the bank. Just "at the back of the first floor" narrows the search a lot.',
        },
      ],
      tip: { ja: '建物の中のことは、外の人に話さない', en: "Don't tell outsiders about the inside of the building" },
    },
    // 7. 知っている名前を出す人
    {
      id: 'gate-07',
      topic: 'gate',
      kind: 'tf',
      who: 'GUARD',
      pic: 'pic.suit_man_wants_drawings',
      situation: {
        ja: 'スーツの男の人がゲートに来て、「宮下さんに頼まれて、図面を受け取りに来ました」と言っている。',
        en: 'A man in a suit comes to the gate and says, "Miyashita asked me to come and pick up the drawings."',
      },
      ask: { ja: '宮下さんに自分で電話して、確かめる。これでいい？', en: 'You call Miyashita yourself to check. Is that OK?' },
      answer: true,
      why: {
        ja: '電話は、前から知っている番号でかけよう。相手が教える番号だと、仲間が出ることもあるんだ。',
        en: 'Call on a number you already have. If you use a number he gives you, his partner might be the one who answers.',
      },
      wrongWhy: {
        ja: '名前を出されると、本当っぽく聞こえるよね。でも、名前は看板などからでもわかるんだ。確かめるのは、失礼なことじゃないよ。',
        en: 'A name you know makes it sound real. But anyone can learn a name, even from the signs outside. Checking is not rude.',
      },
      tip: { ja: '名前を出されても、本人に確かめる', en: 'Even if they use a name you know, check with that person' },
    },
  ],
}
