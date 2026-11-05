// 火曜日：ゲート「入ってくる人、出ていく物」
//   入れる前に確かめる（知らない人・共連れ・入場証の貸し借り・名前を出す人）
//   出ていく物に気をつける（捨てる紙・立ち話）。外に出しておく看板は、そのままでよい
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
        ja: '今日はゲートの話をしよう。人が入ってくる所で、物が出ていく所でもあるんだ。',
        en: "Let's talk about the gate today. It's where people come in, and also where things go out.",
      },
    },
    {
      who: 'YOU',
      t: { ja: '知らない人が来たら、どうすればいいですか。', en: "What should I do when someone I don't know shows up?" },
    },
    {
      who: 'BOSS',
      t: {
        ja: '入れる前に、まず確かめる。それから、捨てる紙にも気をつけようね。',
        en: 'Check first, before you let them in. And be careful with the papers you throw out, too.',
      },
    },
  ],
  motto: { ja: '知らない人は、確かめてから入れる', en: 'Check strangers before you let them in' },
  icon: 'pic.gate',
  questions: [
    // 1. いちばん多い手口：それらしい服装で「点検です」
    {
      id: 'gate-01',
      topic: 'gate',
      kind: 'mc',
      who: 'STRANGER',
      pic: 'pic.inspector_at_gate',
      situation: {
        ja: '作業服の男の人がゲートに来ました。「点検です」と言いますが、入場証は持っていません。',
        en: 'A man in work clothes comes to the gate. He says, "I\'m here for an inspection," but he has no site badge.',
      },
      ask: { ja: 'どうするのがいい？', en: 'What should you do?' },
      choices: [
        { ja: '作業服を着ているので、通す', en: "He's in work clothes, so let him in" },
        { ja: '外で待ってもらい、事務所に確かめる', en: 'Ask him to wait outside and check with the office' },
        { ja: '急いでいるようなので、先に通す', en: 'He seems in a hurry, so let him in first' },
      ],
      correct: 1,
      why: {
        ja: '知らない人には、外で待ってもらおう。本当に点検の予定があるか、事務所に聞いてから入れるんだよ。',
        en: "Ask anyone you don't know to wait outside. Check with the office that an inspection is really planned before you let them in.",
      },
      wrongWhy: [
        {
          ja: '作業服は、だれでも買えるよ。見た目だけでは、本当に点検の人かは分からないね。',
          en: "Anyone can buy work clothes. Looks alone can't tell you he's really an inspector.",
        },
        null,
        {
          ja: '先に通すと、確かめる前に中を見られてしまうよ。急いでいるように見えても、待ってもらおう。',
          en: "If you let him in first, he can look around before anyone checks. Even if he seems in a hurry, ask him to wait.",
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
        ja: '朝のゲートで、職人さんが入場証を見せて入っていきます。一人だけ、前の人のすぐ後ろについて、見せずに入ろうとしています。',
        en: 'At the gate in the morning, workers show their badges as they go in. One man walks in right behind the person ahead without showing his.',
      },
      ask: { ja: 'この人を、このまま通していい？', en: 'Is it OK to let this man in like that?' },
      answer: false,
      why: {
        ja: 'みんなと一緒に見えても、仲間とは限らないよ。入場証は、一人ずつ見せてもらおう。',
        en: "He may look like part of the group, but he might not be. Check everyone's badge, one person at a time.",
      },
      wrongWhy: {
        ja: '朝は忙しいから、つい通したくなるね。でも、見ないで通すと、だれが中にいるか分からなくなるよ。',
        en: "Mornings are busy, so it's tempting to wave him in. But if you don't check, nobody knows who is inside.",
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
        ja: '沢口さんに「古い図面と作業員名簿のコピー、捨てておいてくれる？」と頼まれました。ゲートの横に、資源ゴミの袋があります。',
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
        ja: '図面や名前が書いてある紙は、読めるまま外に出さないようにしよう。シュレッダーか、鍵のかかる回収箱へ入れるんだよ。',
        en: 'Papers with drawings or names must never leave the site readable. Shred them, or put them in the locked disposal box.',
      },
      wrongWhy: [
        {
          ja: '資源ゴミは、読める紙のまま運ばれていくよ。回収の車から落ちて、道に散らばったこともあるんだ。',
          en: 'Recycling is carried off as it is, still readable. Papers like this have fallen off a collection truck and scattered across a road.',
        },
        {
          ja: '手で破いたくらいだと、つなげれば読めてしまうよ。名前や図面は、シュレッダーにかけよう。',
          en: 'Paper torn by hand can be pieced back together. Put names and drawings through the shredder.',
        },
        null,
      ],
      tip: { ja: '図面と名前の紙は、シュレッダーか鍵つきの箱へ', en: 'Drawings and names go to the shredder or the locked box' },
      real: 'gunma-shred',
    },
    // 4. これは大丈夫：外に出しておく決まりの看板
    {
      id: 'gate-04',
      topic: 'gate',
      kind: 'tf',
      who: 'BOSS',
      pic: 'pic.signs_on_fence',
      situation: {
        ja: 'ゲートの横に、建設業の許可票や「工事のお知らせ」の看板が出ています。会社の名前や電話番号が、通る人にも読めます。',
        en: 'Next to the gate hang the construction permit sign and a "Notice of construction" board. Anyone walking by can read the company name and phone number.',
      },
      ask: { ja: 'この看板は、外から見えるままにしておく。これで正しい？', en: 'Keep these signs where people outside can see them. Is that right?' },
      answer: true,
      why: {
        ja: 'この看板は、外の人に見てもらうための物だよ。許可票などは、見える所に出す決まりなんだ。',
        en: 'These signs are meant to be read by people outside. Signs like the permit sign must be posted where people can see them.',
      },
      wrongWhy: {
        ja: 'なんでもかくせばいい、というわけではないよ。この看板は、近所の人が工事のことや連絡先を知るための物なんだ。',
        en: 'Hiding everything is not the answer. These signs tell neighbors about the work and who to contact.',
      },
      tip: { ja: '許可票やお知らせの看板は、外に出しておく', en: 'Permit and notice signs stay where everyone can see them' },
    },
    // 5. 入場証の貸し借り
    {
      id: 'gate-05',
      topic: 'gate',
      kind: 'tf',
      who: 'KIMURA',
      pic: 'pic.borrowed_badge',
      situation: {
        ja: '木村さんが、入場証を家に忘れました。「今日休みの仲間のを借りてきた」と言って、それで入ろうとしています。',
        en: 'Kimura left his badge at home. He says, "I borrowed one from a guy on my crew who\'s off today," and tries to go in with it.',
      },
      ask: { ja: '借りた入場証で、入っていい？', en: 'Can he go in with a borrowed badge?' },
      answer: false,
      why: {
        ja: '入場証は、一人に一枚だよ。忘れた時は事務所で確かめてもらって、その日だけの入場証をもらおう。',
        en: 'One badge, one person. If you forget yours, have the office check who you are and get a badge just for that day.',
      },
      wrongWhy: {
        ja: '木村さん本人でも、借りた入場証だと、休みの人が中にいることになるよ。何かあった時に、だれがいるか分からないね。',
        en: "Even if it's really Kimura, the record would show the man who is off today as being on site. If something happened, nobody would know who is really inside.",
      },
      tip: { ja: '入場証は一人に一枚。貸し借りしない', en: 'One badge per person. Never lend or borrow one' },
    },
    // 6. 出ていく話：ゲートでの立ち話
    {
      id: 'gate-06',
      topic: 'gate',
      kind: 'mc',
      who: 'BOSS',
      pic: 'pic.neighbor_asks_vault',
      situation: {
        ja: 'ゲートの前で、近所の人に「銀行になるんでしょ。金庫はどのへん？」と聞かれました。',
        en: 'Outside the gate, a neighbor asks you, "It\'s going to be a bank, right? Where will the vault be?"',
      },
      ask: { ja: 'なんて答えるのがいい？', en: 'What is the best way to answer?' },
      choices: [
        { ja: '中のことは話せない、とやさしく断る', en: "Kindly say you can't talk about the inside" },
        { ja: '近所の人なので、知っていることを話す', en: "It's a neighbor, so tell them what you know" },
        { ja: '「2階のあたり」と、だいたいの場所だけ言う', en: 'Give a rough answer, like "around the 2nd floor"' },
      ],
      correct: 0,
      why: {
        ja: '金庫やカメラの場所は、だれにも話さないでおこう。看板に書いてあることなら、話しても大丈夫だよ。',
        en: "Don't tell anyone where the vault or the cameras are. What is written on the signs outside is fine to share.",
      },
      wrongWhy: [
        null,
        {
          ja: '近所の人でも、聞いた話がどこまで広がるか分からないよ。金庫の場所は、銀行の大事な秘密なんだ。',
          en: "Even with a neighbor, you never know how far the story will travel. The vault's location is the bank's secret.",
        },
        {
          ja: 'だいたいの場所でも、知りたい人には大きな手がかりになるよ。場所の話は、しないでおこう。',
          en: 'Even a rough location is a big clue to someone who wants to know. Leave the location out.',
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
        ja: 'スーツの男の人がゲートに来て、「宮下さんに頼まれて、図面を受け取りに来ました」と言っています。',
        en: 'A man in a suit comes to the gate and says, "Miyashita asked me to come and pick up the drawings."',
      },
      ask: { ja: '宮下さんに自分で電話して、確かめる。これで正しい？', en: 'Call Miyashita yourself to check. Is that right?' },
      answer: true,
      why: {
        ja: '名前を出されただけでは、本当か分からないよ。頼んだという本人に、こちらから電話して聞こう。',
        en: "Just using a name doesn't prove anything. Call the person he named yourself and ask.",
      },
      wrongWhy: {
        ja: '名前は、看板などからでも知ることができるよ。確かめるのは、失礼なことじゃないからね。',
        en: 'Anyone can learn a name, even from the signs outside. Checking is not rude.',
      },
      tip: { ja: '名前を出されても、本人に確かめる', en: 'Even if they use a name you know, check with that person' },
    },
  ],
}
