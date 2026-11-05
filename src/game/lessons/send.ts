// 木曜日：事務所のパソコン「メールとファイル」
//   送る前に、相手（宛先・リンクを開ける人・AI）と中身（ファイル）を確かめる。知らない所から来たものは開かずに知らせる
import type { Lesson } from '../types'

export const LESSON: Lesson = {
  id: 'send',
  dayName: { ja: '木曜日', en: 'Thursday' },
  place: { ja: '事務所のパソコン', en: 'Office computer' },
  title: { ja: 'メールとファイル', en: 'Email and files' },
  intro: [
    {
      who: 'BOSS',
      t: { ja: '今日は、事務所のパソコンの話だよ。メールやファイル、AIの使い方を見ていこう。', en: "Today it's the office computer. Let's go over email, files and using AI." },
    },
    {
      who: 'YOU',
      t: { ja: 'メールは毎日使っています。何に気をつければいいですか。', en: 'I use email every day. What should I watch out for?' },
    },
    {
      who: 'BOSS',
      t: {
        ja: 'この現場の図面には、金庫室もカメラの場所も載っているよね。だから送る前に、相手と中身を確かめよう。',
        en: "This site's drawings show the vault room and where the cameras are. So before you send anything, check who it's going to and what's in it.",
      },
    },
  ],
  motto: { ja: '送る前に、相手と中身を確かめる', en: 'Check who and what before you send' },
  icon: 'pic.send',
  questions: [
    // 1. いちばん多いまちがい：宛先の候補から、別の人を選んでしまう
    {
      kind: 'tf',
      id: 'send-01',
      topic: 'send',
      who: 'BOSS',
      pic: 'pic.mail_address_suggest',
      situation: {
        ja: '設備屋の佐藤さんに、図面をメールで送る。宛先に「佐藤」と打ったら、名前が出てきたので選んだ。',
        en: 'You\'re emailing drawings to Sato at the plumbing company. You typed "Sato" in the To box, a name came up, and you picked it.',
      },
      ask: { ja: 'このまま送信していい？', en: 'OK to hit Send now?' },
      answer: false,
      why: {
        ja: '出てくる名前の中に、同じ名前の別の人がいることもあるよ。メールは送ったら取り消せないから、アドレスまで見よう。',
        en: "The list can include someone else with the same name. You can't take an email back once it's sent, so check the address too.",
      },
      wrongWhy: {
        ja: '出てきた名前なら大丈夫、と思いがちだよね。でも、名前を選んだだけでは、相手を確かめたことにならないんだ。',
        en: "It's easy to trust the name that comes up. But picking a name isn't the same as checking who it goes to.",
      },
      tip: { ja: '送る前に、宛先のアドレスまで見る', en: 'Check the full address before you send' },
    },
    // 2. 送るファイルの中身：頼まれていない図面や、人の名前が残っている
    {
      kind: 'mc',
      id: 'send-02',
      topic: 'send',
      who: 'KIMURA',
      pic: 'pic.pdf_extra_pages',
      situation: {
        ja: '木村さんに「天井の図面を、うちの職人に送って」と頼まれた。PDFのファイル名は「天井図」だ。',
        en: 'Kimura asks you to send the ceiling drawings to his crew. The PDF file is named "Ceiling plan."',
      },
      ask: { ja: '送る前に、どうする？', en: 'Before you send it, what do you do?' },
      choices: [
        { ja: 'PDFを開いて、全部のページを見る', en: 'Open the PDF and check every page' },
        { ja: 'ファイル名が合っているので、そのまま送る', en: 'The file name is right, so just send it' },
        { ja: '念のため、パスワードをかけて送る', en: 'Add a password to be safe, then send it' },
      ],
      correct: 0,
      why: {
        ja: 'ファイルの中に、頼まれていない図面や人の名前が残っていることがあるよ。開いて全部見てから送ろう。',
        en: 'A file can still hold drawings nobody asked for, or people\'s names. Open it and look through all of it before you send.',
      },
      wrongWhy: [
        null,
        { ja: 'ファイル名が合っていても、中身まで合っているとは限らないんだ。', en: "The file name can be right while what's inside is not." },
        {
          ja: 'パスワードをかけても、相手は開けるよね。いらないページが入っていたら、そのまま届いてしまうよ。',
          en: "A password doesn't stop the person you send it to. Any extra pages still reach them.",
        },
      ],
      tip: { ja: '送る前に、ファイルを開いて中を見る', en: 'Open the file and look before you send' },
      real: 'niigata-mail',
    },
    // 3. にせのメール：名前は知っている人でも、アドレスがちがう
    {
      kind: 'tf',
      id: 'send-03',
      topic: 'send',
      who: 'SAWA',
      pic: 'pic.mail_odd_address',
      situation: {
        ja: '差出人の名前は「山本（設計事務所）」。金庫室の図面を送ってほしいそうだ。でも、アドレスがいつもと違う。',
        en: 'The sender\'s name says "Yamamoto (design office)." The email asks for the vault room drawings. But the address isn\'t the usual one.',
      },
      ask: { ja: 'このアドレスに、図面を送っていい？', en: 'OK to send the drawings to this address?' },
      answer: false,
      why: {
        ja: '差出人の名前は、だれでも好きに書けるよ。アドレスがいつもと違うなら、送らずに確かめよう。',
        en: "Anyone can type any name as the sender. If the address isn't the usual one, don't send. Check first.",
      },
      wrongWhy: {
        ja: '知っている名前だと、つい信じちゃうよね。でも、名前が合っていても、本人とは限らないんだ。',
        en: "A name you know is easy to trust. But a matching name doesn't prove it's really Yamamoto.",
      },
      tip: { ja: '名前ではなく、アドレスを見る', en: 'Look at the address, not the name' },
      real: 'toda-access',
    },
    // 4. 本人か確かめる：メールの中の番号ではなく、前から知っている番号に電話する
    {
      kind: 'mc',
      id: 'send-04',
      topic: 'send',
      who: 'BOSS',
      pic: 'pic.mail_phone_number',
      situation: {
        ja: '「支店長です。図面を今日中に送ってください」というメールが来た。最後に電話番号が書いてある。',
        en: 'An email says, "This is the branch manager. Please send the drawings today." There\'s a phone number at the end.',
      },
      ask: { ja: '本人か確かめたい。どうする？', en: "You want to check it's really the manager. What do you do?" },
      choices: [
        { ja: 'メールにある番号に電話する', en: 'Call the number in the email' },
        { ja: 'このメールに返信して聞く', en: 'Reply to the email and ask' },
        { ja: '前から知っている番号に電話する', en: 'Call the number you already have' },
      ],
      correct: 2,
      why: {
        ja: '名刺や、前から知っている連絡先の番号なら、本物の支店長につながるね。確かめる電話は、失礼じゃないよ。',
        en: 'A number from a business card or your contacts reaches the real manager. Calling to check is not rude.',
      },
      wrongWhy: [
        {
          ja: 'その番号も、メールを書いた人が書いたものだよ。にせ者なら、にせ者につながるんだ。',
          en: "Whoever wrote the email wrote that number too. If it's a fake, you'll reach the faker.",
        },
        {
          ja: '返信は、メールを書いた人に届くよね。にせ者なら「本人です」と答えるだけだよ。',
          en: 'A reply goes to whoever wrote the email. A faker will just say, "Yes, it\'s me."',
        },
        null,
      ],
      tip: { ja: '確かめる電話は、前から知っている番号へ', en: 'To check, call a number you already have' },
    },
    // 5. 知らない所からの添付ファイル：開かずに知らせる（○が正しい）
    {
      kind: 'tf',
      id: 'send-05',
      topic: 'send',
      who: 'SAWA',
      pic: 'pic.zip_invoice_mail',
      situation: {
        ja: '知らない会社から「請求書を送ります」というメール。「請求書.zip」というファイルが付いている。',
        en: 'An email from a company you don\'t know says, "Here is your invoice." A file named "invoice.zip" is attached.',
      },
      ask: { ja: '開かずに、宮下さんに知らせる。これで正しい？', en: 'You leave it unopened and tell Miyashita. Is that right?' },
      answer: true,
      why: {
        ja: '知らない相手からのファイルは、開くとウイルスが入ることがあるよ。知らせてくれたら、みんなに注意できるね。',
        en: "A file from someone you don't know can let a virus in when you open it. If you tell me, I can warn everyone.",
      },
      wrongWhy: {
        ja: '開いて確かめたくなるよね。でも、開くこと自体があぶないんだ。だまって消すのも、ほかの人に同じメールが届いていたら困るよ。',
        en: "You may want to open it and check. But opening it is the danger. Quietly deleting it isn't enough either, if others got the same email.",
      },
      tip: { ja: '知らないファイルは、開かずに知らせる', en: "Don't open unknown files. Report them." },
      real: 'iwade-emotet',
    },
    // 6. 図面のリンク：開けるのは、使う人だけ
    {
      kind: 'mc',
      id: 'send-06',
      topic: 'send',
      who: 'BOSS',
      pic: 'pic.link_share_screen',
      situation: {
        ja: '塗装屋さんに、外壁の図面のリンクを送る。開ける人を選ぶ画面が出た。',
        en: "You're sending the painters a link to the outside wall drawings. A screen asks who can open it.",
      },
      ask: { ja: 'だれが開けるようにする？', en: 'Who should be able to open it?' },
      choices: [
        { ja: 'リンクを知っている全員', en: 'Anyone with the link' },
        { ja: '塗装屋さんだけ', en: 'Only the painters' },
        { ja: 'この現場で働く人みんな', en: 'Everyone working on this site' },
      ],
      correct: 1,
      why: {
        ja: '図面を開ける人は、少ないほどもれにくいよ。リンクは、使う人だけが開けるようにしよう。',
        en: 'The fewer people who can open drawings, the less can leak. Set links so only the people who use them can open them.',
      },
      wrongWhy: [
        {
          ja: '楽だけど、リンクが転送されたら、知らない人でも図面を開けてしまうよ。',
          en: "It's easy, but if the link gets forwarded, strangers can open the drawings too.",
        },
        null,
        {
          ja: '現場には、毎日いろんな会社の人が来るよね。外壁の図面を使わない人まで、開ける必要はないんだ。',
          en: "People from many companies come to the site every day. Those who don't work on the walls don't need to open them.",
        },
      ],
      tip: { ja: 'リンクは、使う人だけが開けるように', en: 'Links open only for the people who need them' },
    },
    // 7. AI：お客さんの書類は、会社が決めたAIだけで
    {
      kind: 'mc',
      id: 'send-07',
      topic: 'send',
      who: 'SAWA',
      pic: 'pic.ai_chat_memo',
      situation: {
        ja: '支店との打ち合わせメモを、短くまとめたい。沢口さんが「AIに頼むと早いよ」と教えてくれた。',
        en: 'You want a short summary of the meeting notes with the bank branch. Sawaguchi says, "AI can do that fast."',
      },
      ask: { ja: 'AIに頼むなら、どうする？', en: 'If you use AI for this, what do you do?' },
      choices: [
        { ja: 'ネットの無料のAIに、そのまま貼る', en: 'Paste the notes as they are into a free AI online' },
        { ja: '名前を消してから、無料のAIに貼る', en: 'Delete the names, then paste into a free AI' },
        { ja: '会社が使っていいと決めたAIを使う', en: 'Use the AI your company has approved' },
      ],
      correct: 2,
      why: {
        ja: '会社が決めたAIなら、入れた文がどう扱われるか、会社が確かめてあるよ。お客さんの書類は、そこだけで使おう。',
        en: 'With the AI your company approved, the company has checked how the text you put in is handled. Use client papers only there.',
      },
      wrongWhy: [
        {
          ja: '無料のAIに貼った文は、外の会社に送られるよ。そこでどう使われるか、こちらでは決められないんだ。',
          en: "Text pasted into a free AI goes to an outside company. You can't decide how it's used there.",
        },
        {
          ja: '名前を消しても、読めばどこのどんな工事か、わかってしまうよね。',
          en: "Even without names, anyone reading it can tell whose job it is and what the work is.",
        },
        null,
      ],
      tip: { ja: 'お客さんの書類は、無料のAIに貼らない', en: 'Never paste client papers into a free AI' },
    },
  ],
}
