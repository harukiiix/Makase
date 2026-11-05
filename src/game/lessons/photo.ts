// 水曜日：現場の写真「写真に写るもの」
// 写真の行き先（自分のSNS・家族・外の人・完成のあと）と、写真に写る物（うしろの画面や書類、窓の外、図面）
// 工事の写真は、会社のタブレットで撮って会社にしまう（これは正しいやり方）
import type { Lesson } from '../types'

export const LESSON: Lesson = {
  id: 'photo',
  dayName: { ja: '水曜日', en: 'Wednesday' },
  place: { ja: '現場の写真', en: 'Site photos' },
  title: { ja: '写真に写るもの', en: 'What ends up in photos' },
  intro: [
    {
      who: 'BOSS',
      t: {
        ja: '水曜日は、写真の話をしよう。現場では、毎日たくさん写真を撮るよね。',
        en: "Wednesday is about photos. We take lots of them on site every day.",
      },
    },
    {
      who: 'YOU',
      t: {
        ja: '工事の記録ですね。木村さんも、よくスマホで撮っています。',
        en: 'For the work records, right? Kimura is always taking pictures with his phone, too.',
      },
    },
    {
      who: 'BOSS',
      t: {
        ja: '写真には、うしろの物まで写るんだ。銀行の中の写真が外に出たら、どろぼうに中を見せるのと同じだよ。',
        en: "Photos also catch whatever is in the background. If photos of the bank's inside get out, it's like letting a burglar look around.",
      },
    },
    {
      who: 'BOSS',
      t: {
        ja: 'どんな写真に気をつけるか、問題で確かめよう。',
        en: "Let's go through which photos to be careful with.",
      },
    },
  ],
  motto: { ja: '現場の写真は、外に出さない', en: "Don't let site photos get out" },
  icon: 'pic.photo',
  questions: [
    // 1. 自分のSNSに出す（いちばんよくある）。「かくせばいい」「すぐ消えるならいい」
    {
      id: 'photo-01',
      topic: 'photo',
      kind: 'mc',
      who: 'KIMURA',
      pic: 'pic.crew_photo_for_sns',
      situation: {
        ja: '木村さんが、仕上げた銀行の部屋で仲間と撮った写真を見せてくれた。「いい出来だろ。SNSに出そうかな」',
        en: 'Kimura shows you a photo of his crew in a bank room they just finished. "Looks great, right? Maybe I\'ll put it on social media."',
      },
      ask: { ja: '木村さんに、なんて言う？', en: 'What do you say to Kimura?' },
      choices: [
        { ja: '顔や名前をかくせば、いいと思います', en: "It's fine if you hide the faces and names" },
        { ja: 'すぐ消える投稿なら、いいと思います', en: "It's fine if it's a post that disappears soon" },
        { ja: 'SNSには、出さないでおきましょう', en: "Let's not put it on social media" },
      ],
      correct: 2,
      why: {
        ja: '銀行の中のようすは、お客さんの大事な秘密なんだ。写真が外に出たら、どろぼうに中を見せることになるよ。',
        en: "What the inside of the bank looks like is the client's secret. If the photo gets out, a burglar can see what it's like inside.",
      },
      wrongWhy: [
        {
          ja: '顔や名前をかくしても、窓の外の景色や、ガラスに映った物で、どこの銀行かわかってしまうよ。',
          en: 'Even with faces and names hidden, the view out the window or a reflection in the glass can show which bank it is.',
        },
        {
          ja: 'すぐ消えるつもりでも、見た人が画面を撮れば、ずっと残るよ。一度出した写真は、取りもどせないんだ。',
          en: "Even if the post disappears, anyone who sees it can take a screenshot, and then it stays around. Once a photo is out, you can't take it back.",
        },
        null,
      ],
      tip: { ja: '現場の写真は、自分のSNSに出さない', en: 'Never post site photos on your own social media' },
      real: 'moriyasu-bereal',
    },
    // 2. 家族にだけ送る（「家族なら安心」）
    {
      id: 'photo-02',
      topic: 'photo',
      kind: 'tf',
      who: 'YOU',
      pic: 'pic.selfie_inside_bank',
      situation: {
        ja: '初めての現場がうれしくて、工事中の銀行の中で、自分の写真を撮った。親にも見せたい。',
        en: "You're excited about your first site, so you took a photo of yourself inside the bank under construction. You'd like to show your parents.",
      },
      ask: { ja: '家族にだけなら、LINEで送っていい？', en: 'Is it OK to send it on LINE if it only goes to your family?' },
      answer: false,
      why: {
        ja: '家族に送った写真も、そこから先、だれに見られるかわからないんだ。銀行の中の写真は、現場の外に出さないでおこう。',
        en: "Once you send a photo, even to family, you can't control who sees it next. Photos of the bank's inside should not leave the site.",
      },
      wrongWhy: {
        ja: '家族なら安心、と思うよね。でも、家族がほかの人に見せたり、送ったりすることもあるんだ。',
        en: 'It feels safe with family, I know. But your family might show it to other people or pass it on.',
      },
      tip: { ja: '現場の中の写真は、家族にも送らない', en: "Don't send photos from inside the site, even to family" },
    },
    // 3. うしろに写る物（実際にあった話：画面と見積書）
    {
      id: 'photo-03',
      topic: 'photo',
      kind: 'mc',
      who: 'SAWA',
      pic: 'pic.desk_photo_screen_estimate',
      situation: {
        ja: '会社のホームページにのせる写真を、事務所で撮る。沢口さんのうしろの画面にはメール、机には見積書がある。',
        en: "You're taking a photo in the office for the company website. Behind Sawaguchi, her screen shows email, and there's an estimate on her desk.",
      },
      ask: { ja: '写真を撮る前に、どうする？', en: 'What do you do before you take the photo?' },
      choices: [
        { ja: '小さく写るだけなので、そのまま撮る', en: "They'll look tiny, so just take it" },
        { ja: 'メールを閉じて、見積書をしまう', en: 'Close the email and put the estimate away' },
        { ja: 'あとでぼかすので、そのまま撮る', en: "You'll blur them later, so just take it" },
      ],
      correct: 1,
      why: {
        ja: '写真は、思ったよりこまかく写るんだ。大きくすれば、画面の字も読めるよ。撮る前に、写したくない物を片づけよう。',
        en: "Photos pick up more detail than you'd think. Zoom in and you can read the screen. Before you shoot, clear away anything that shouldn't be in it.",
      },
      wrongWhy: [
        {
          ja: '小さくても、大きくすれば読めてしまうよ。実際に、職場の写真に画面や見積書のような紙が写っていて、広まった話もあるんだ。',
          en: 'Even tiny things can be read when you zoom in. It has really happened: a workplace photo showed a screen and what looked like an estimate, and it spread.',
        },
        null,
        {
          ja: 'ぼかすのを忘れたり、ぼかす前の写真が残ったりするよ。はじめから写さないのが、いちばん確かだね。',
          en: 'People forget to blur, or the original photo stays around. The surest way is to keep those things out of the shot from the start.',
        },
      ],
      tip: { ja: '撮る前に、うしろに写る物を片づける', en: "Before you take a photo, clear what's behind" },
      real: 'moriyasu-bereal',
    },
    // 4. これは正しい：工事の写真は会社のタブレットで撮って、会社にしまう
    {
      id: 'photo-04',
      topic: 'photo',
      kind: 'tf',
      who: 'BOSS',
      pic: 'pic.tablet_record_photo',
      situation: {
        ja: '宮下さんに、天井の工事の記録の写真をたのまれた。手元には、自分のスマホと会社のタブレットがある。',
        en: 'Miyashita asks you to take record photos of the ceiling work. You have your own phone and the company tablet with you.',
      },
      ask: {
        ja: '会社のタブレットで撮って、会社のフォルダに入れる。これでいい？',
        en: 'You take them on the company tablet and save them in the company folder. Is that right?',
      },
      answer: true,
      why: {
        ja: '工事の写真は、お客さんにわたす大事な記録なんだ。会社のタブレットで撮って、会社の決まった所に入れよう。自分のスマホには、残さないでね。',
        en: "Site photos are important records we hand over to the client. Take them on the company tablet and save them where the company says. Don't keep them on your own phone.",
      },
      wrongWhy: {
        ja: '写真を撮るのは、大事な仕事だよ。会社のタブレットなら、写真は会社に残って、自分のスマホにも入らない。これが正しいやり方なんだ。',
        en: 'Taking photos is an important part of the job. With the company tablet, the photos stay with the company and never end up on your own phone. This is the right way.',
      },
      tip: { ja: '工事の写真は、会社のタブレットで撮る', en: 'Take site photos on the company tablet' },
    },
    // 5. 図面を自分のスマホで撮る（「戻るのが大変だから」）
    {
      id: 'photo-05',
      topic: 'photo',
      kind: 'mc',
      who: 'BOSS',
      pic: 'pic.walk_back_for_drawing',
      situation: {
        ja: '金庫室の工事を手伝っている。図面を見るたびに、事務所まで戻るのが大変だ。',
        en: "You're helping with the vault room work. Walking back to the office every time you need the drawing is a pain.",
      },
      ask: { ja: '図面は、どうやって見るのがいい？', en: "What's the best way to check the drawing?" },
      choices: [
        { ja: '会社のタブレットで、図面を開く', en: 'Open the drawing on the company tablet' },
        { ja: '自分のスマホで、図面を撮っておく', en: 'Take a photo of it with your own phone' },
        { ja: '仲間に、図面の写真を送ってもらう', en: 'Have a coworker send you a photo of it' },
      ],
      correct: 0,
      why: {
        ja: 'この現場の図面は、会社のタブレットで見られるよ。自分のスマホに図面の写真を入れると、なくした時に図面ごとなくすことになるんだ。',
        en: 'On this site, you can open the drawings on the company tablet. With a photo of a drawing on your own phone, losing the phone means losing the drawing too.',
      },
      wrongWhy: [
        null,
        {
          ja: '図面の写真も、図面と同じだよ。自分のスマホは、家にも飲み会にも持っていくよね。写真を人に見せる時に、図面まで見られることもあるんだ。',
          en: 'A photo of a drawing is the same as the drawing. Your phone goes home with you and out for drinks. When you show someone your photos, they might see the drawing too.',
        },
        {
          ja: '送ってもらうと、図面の写真が、相手と自分のスマホの両方に残るよ。図面のコピーが、どんどん増えていくんだ。',
          en: 'Then the photo is on both their phone and yours. Copies of the drawing just keep multiplying.',
        },
      ],
      tip: { ja: '図面を、自分のスマホで撮らない', en: "Don't photograph drawings with your own phone" },
    },
    // 6. 外の人が中を撮ろうとする（「点検の人に見えたから」）
    {
      id: 'photo-06',
      topic: 'photo',
      kind: 'tf',
      who: 'STRANGER',
      pic: 'pic.inspector_phone_vault_door',
      situation: {
        ja: '点検に来たという人が、「記録のためです」と言って、金庫室の扉をスマホで撮ろうとしている。',
        en: 'A man who says he is here for an inspection holds up his phone to photograph the vault door. "It\'s for our records," he says.',
      },
      ask: {
        ja: '撮るのを待ってもらい、宮下さんに確かめる。これでいい？',
        en: 'You ask him to wait and check with Miyashita first. Is that right?',
      },
      answer: true,
      why: {
        ja: '金庫室やカメラの場所は、銀行の大事な秘密なんだ。撮っていいか確かめるまで、待ってもらおう。本物の点検の人なら、待ってくれるよ。',
        en: "Where the vault and the cameras are is one of the bank's biggest secrets. Ask him to wait until you've checked. A real inspector won't mind waiting.",
      },
      wrongWhy: {
        ja: '点検の人に見えても、本物かはわからないよ。止めるのは、失礼じゃないんだ。一度撮られたら、取りもどせないからね。',
        en: "He may look like an inspector, but you can't tell if he's real. Stopping him isn't rude. Once he has the photo, you can't get it back.",
      },
      tip: { ja: '中を撮りたい人がいたら、先に確かめる', en: 'If someone wants photos inside, check first' },
    },
    // 7. 完成したあとなら出していい？（「もう秘密じゃない」）
    {
      id: 'photo-07',
      topic: 'photo',
      kind: 'tf',
      who: 'KIMURA',
      pic: 'pic.vault_photo_after_opening',
      situation: {
        ja: '銀行ができあがった。木村さんが「もう完成したから」と、工事中に撮った金庫室の写真をSNSに出そうとしている。',
        en: 'The bank is finished. Kimura is about to post a photo of the vault room that he took during the work. "It\'s all done now," he says.',
      },
      ask: { ja: '完成したあとなら、SNSに出していい？', en: 'Now that it is finished, is it OK to post it?' },
      answer: false,
      why: {
        ja: '銀行は、できあがってから使いはじめるんだ。金庫室にお金が入るのは、これからだよ。中の写真は、ずっと出さないでおこう。',
        en: 'A bank only starts being used once it is built. The money goes into the vault from now on. Never post photos of the inside.',
      },
      wrongWhy: {
        ja: '工事が終わると、もう秘密じゃない気がするよね。でも、金庫室やカメラの場所は、銀行がある間ずっと秘密なんだ。',
        en: "Once the work is over, it can feel like it's no secret anymore. But where the vault and the cameras are stays secret for as long as the bank is there.",
      },
      tip: { ja: '完成したあとも、中の写真は出さない', en: 'Even after it is finished, keep inside photos private' },
    },
  ],
}
