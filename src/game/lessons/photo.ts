// 水曜日：現場の写真「写真に写るもの」
// 写真の行き先（自分のSNS・家族・外の人・完成のあと）と、写真に写る物（後ろの画面や書類、窓の外、図面）
// 工事の写真は、会社のタブレットで撮って会社にしまう（これは正しいやり方）
import type { Lesson } from '../types'

export const LESSON: Lesson = {
  id: 'photo',
  dayName: { ja: '水曜日', en: 'Wednesday' },
  place: { ja: '建物の中', en: 'Inside the building' },
  title: { ja: '写真に写るもの', en: 'What ends up in photos' },
  intro: [
    {
      who: 'BOSS',
      t: {
        ja: '水曜日は、写真の話をしよう。現場では、毎日たくさん写真を撮るよね。',
        en: 'Wednesday is about photos. We take lots of them on site every day.',
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
        ja: '写真には、後ろの物まで写るんだ。銀行の中の写真が外に出たら、泥棒に中を見せるようなものだよ。',
        en: "Photos also catch whatever is in the background. If photos of the inside of the bank get out, it's like giving a burglar a look inside.",
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
    // 1. 自分のSNSに出す（いちばんよくある）。「隠せばいい」「すぐ消えるならいい」
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
        { ja: '顔や名前を隠せば、いいと思います', en: "It's fine if you hide the faces and names" },
        { ja: 'すぐ消える投稿なら、いいと思います', en: "It's fine if it's a post that disappears soon" },
        { ja: 'SNSには、出さないでおきましょう', en: "Let's not put it on social media" },
      ],
      correct: 2,
      why: {
        ja: '銀行の中のようすは、施主さんの大事な秘密なんだ。写真が外に出たら、泥棒に中を見せることになるよ。',
        en: "What the bank looks like inside is the client's big secret. If the photo gets out, you'd be showing a burglar the inside.",
      },
      wrongWhy: [
        {
          ja: '顔や名前を隠しても、窓の外の景色や、ガラスに映った物で、どこの銀行かわかってしまうよ。',
          en: 'Even with faces and names hidden, the view out the window or a reflection in the glass can show which bank it is.',
        },
        {
          ja: 'すぐ消える投稿でも、見た人が画面を撮れば、ずっと残るよ。一度出した写真は、取り戻せないんだ。',
          en: "Even if the post disappears, anyone who sees it can take a screenshot, and that copy stays around. Once a photo is out, you can't take it back.",
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
      ask: { ja: '家族にだけ、LINEで送る。これでいい？', en: 'You send it on LINE, just to your family. Is that OK?' },
      answer: false,
      why: {
        ja: '自分の写真でも、後ろに銀行の中が写っているよね。中のようすは施主さんの秘密だから、家族にも見せられないんだ。',
        en: "Even in a photo of yourself, the inside of the bank shows up behind you. What it looks like inside is the client's secret, so you can't show it even to family.",
      },
      wrongWhy: {
        ja: '家族なら安心、と思うよね。でも、家族がほかの人に見せたり、送ったりすることもあるんだ。',
        en: 'It feels safe with family, I know. But your family might show it to other people or pass it on.',
      },
      tip: { ja: '現場の中の写真は、家族にも送らない', en: "Don't send photos from inside the site, even to family" },
    },
    // 3. 後ろに写る物（実際にあった話：画面と見積書）
    {
      id: 'photo-03',
      topic: 'photo',
      kind: 'mc',
      who: 'SAWA',
      place: { ja: '現場事務所', en: 'Site office' },
      pic: 'pic.desk_photo_screen_estimate',
      situation: {
        ja: '会社のホームページに載せる写真を、事務所で撮る。沢口さんの後ろの画面にはメール、机には見積書がある。',
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
        ja: 'ホームページの写真は、世界中のだれでも見られるんだ。メールや見積書には、取引先の名前や金額が書いてあるよね。どちらも、外の人に見せる物じゃないよ。',
        en: 'Anyone in the world can see the photos on the website. Emails and estimates show partner names and prices, and neither is for outsiders to see.',
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
      tip: { ja: '後ろに写る物は、撮る前に片づける', en: "Clear what's in the background before you shoot" },
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
        ja: '宮下さんに、天井の工事の記録写真を頼まれた。手元には、自分のスマホと会社のタブレットがある。',
        en: 'Miyashita asks you to take record photos of the ceiling work. You have your own phone and the company tablet with you.',
      },
      ask: {
        ja: '会社のタブレットで撮って、会社のフォルダに入れる。これでいい？',
        en: 'You take them on the company tablet and save them in the company folder. Is that OK?',
      },
      answer: true,
      why: {
        ja: '工事の写真は、施主さんに渡す大事な記録なんだ。会社のフォルダにまとめておけば、なくさないし、だれが見るかも会社で決められるよ。',
        en: 'Site photos are important records we hand over to the client. Kept together in the company folder, none of them get lost, and the company decides who can see them.',
      },
      wrongWhy: {
        ja: '記録写真を撮るのも、仕事のうちだよ。気をつけるのは、撮った写真をどこに置くかなんだ。会社のタブレットなら、自分のスマホには残らないね。',
        en: 'Taking record photos is part of the job. What matters is where the photos end up. With the company tablet, none of them stay on your own phone.',
      },
      tip: { ja: '工事の写真は、会社のタブレットで撮る', en: 'Take site photos on the company tablet' },
    },
    // 5. 図面を自分のスマホで撮る（「戻るのが大変だから」）
    {
      id: 'photo-05',
      topic: 'photo',
      kind: 'mc',
      who: 'YOU',
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
        ja: 'この現場の図面は、会社のタブレットで開けるよ。自分のスマホに図面の写真を入れると、なくしたときに、図面ごと人の手に渡ってしまうんだ。',
        en: "You can open this site's drawings on the company tablet. Put a photo of a drawing on your own phone, and if you lose the phone, the drawing ends up in someone else's hands too.",
      },
      wrongWhy: [
        null,
        {
          ja: '図面の写真も、図面と同じだよ。自分のスマホは、家にも飲み会にも持っていくよね。写真を人に見せるときに、図面まで見られることもあるんだ。',
          en: 'A photo of a drawing is the same as the drawing. Your phone goes home with you and out for drinks. When you show someone your photos, they might see the drawing too.',
        },
        {
          ja: '送ってもらうと、図面の写真が、相手と自分のスマホの両方に残るよ。図面のコピーが、どんどん増えていくんだ。',
          en: 'Then the photo is on both their phone and yours. Copies of the drawing just keep multiplying.',
        },
      ],
      tip: { ja: '図面は、自分のスマホで撮らない', en: "Don't photograph drawings with your own phone" },
    },
    // 6. 外の人が中を撮ろうとする（「点検の人に見えたから」）
    {
      id: 'photo-06',
      topic: 'photo',
      kind: 'tf',
      who: 'STRANGER',
      place: { ja: '金庫室の前', en: 'Outside the vault room' },
      pic: 'pic.inspector_phone_vault_door',
      situation: {
        ja: '点検に来たという人が、「記録のためです」と言って、金庫室の扉をスマホで撮ろうとしている。',
        en: 'A man who says he is here for an inspection holds up his phone to photograph the vault door. "It\'s for our records," he says.',
      },
      ask: {
        ja: '撮るのを待ってもらい、宮下さんに確かめる。これでいい？',
        en: 'You ask him to wait while you check with Miyashita. Is that OK?',
      },
      answer: true,
      why: {
        ja: '金庫室やカメラの場所は、銀行の大事な秘密なんだ。本物の点検なら、前もって連絡が来ているから、確かめればすぐわかるよ。',
        en: "Where the vault and the cameras are is one of the bank's biggest secrets. A real inspection is arranged ahead of time, so one quick check will tell you.",
      },
      wrongWhy: {
        ja: '点検の人に見えても、本物かはわからないよ。止めるのは、失礼じゃないんだ。一度撮られたら、取り戻せないからね。',
        en: "He may look like an inspector, but you can't tell if he's real. Stopping him isn't rude. Once he has the photo, you can't get it back.",
      },
      tip: { ja: '現場の中を撮りたい人がいたら、先に確かめる', en: 'If someone wants to take photos inside the site, check first' },
    },
    // 7. 完成したあとなら出していい？（「もう秘密じゃない」）
    {
      id: 'photo-07',
      topic: 'photo',
      kind: 'tf',
      who: 'KIMURA',
      place: { ja: '完成した支店', en: 'The finished branch' },
      pic: 'pic.vault_photo_after_opening',
      situation: {
        ja: '銀行ができあがった。木村さんが「もう完成したから」と、工事中に撮った金庫室の写真をSNSに出そうとしている。',
        en: 'The bank is finished. Kimura is about to post a photo of the vault room that he took during the work. "It\'s all done now," he says.',
      },
      ask: { ja: '完成したので、木村さんがSNSに出す。これでいい？', en: 'The bank is finished, so Kimura posts it. Is that OK?' },
      answer: false,
      why: {
        ja: '銀行は、できあがってから使いはじめるんだ。金庫室にお金が入るのは、これからだよ。だから、中の写真は今のほうが危ないね。',
        en: 'A bank only starts being used once it is built. The money goes into the vault from now on, so photos of the inside are even more dangerous now.',
      },
      wrongWhy: {
        ja: '工事が終わると、もう秘密じゃない気がするよね。でも、金庫室やカメラの場所は、銀行がある間ずっと秘密なんだ。',
        en: "Once the work is over, it can feel like it's no secret anymore. But where the vault and the cameras are stays secret for as long as the bank is there.",
      },
      tip: { ja: '建物の中の写真は、完成したあとも外に出さない', en: 'Keep photos of the inside private, even after the building is finished' },
    },
  ],
}
