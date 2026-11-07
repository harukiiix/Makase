// 番外：「スマホとネット」
// 現場の人がふだん出会う、ネットの情報もれや乗っ取り（偽のSMS、パスワードの使い回し、二段階の確かめ、
// スマホに届いた番号を聞く電話、無料のWi-Fi、更新、ファイルを開けなくしてお金を求めるウイルス）。
// 専門の言葉は、使うときにふつうの言葉で言いかえる。言い切らない（「〜ことがある」「〜とは限らない」）
import type { Lesson } from '../types'

export const LESSON: Lesson = {
  id: 'net',
  dayName: { ja: '番外', en: 'Extra day' },
  place: { ja: '現場事務所', en: 'Site office' },
  title: { ja: 'スマホとネット', en: 'Phones and the internet' },
  intro: [
    {
      who: 'BOSS',
      t: {
        ja: '今日は番外。スマホとネットの話をしよう。',
        en: "Today's an extra day. Let's talk about phones and the internet.",
      },
    },
    {
      who: 'YOU',
      t: {
        ja: '現場の仕事と、関係があるんですか？',
        en: 'Does that have anything to do with site work?',
      },
    },
    {
      who: 'BOSS',
      t: {
        ja: 'あるよ。偽の連絡や、もれたパスワードから、会社のメールやファイルに入られることがあるんだ。',
        en: 'It does. Fake messages or leaked passwords can let someone into the company email and files.',
      },
    },
  ],
  motto: { ja: 'あやしい連絡は、自分で調べて確かめる', en: 'Check suspicious messages yourself' },
  icon: 'pic.mail_odd_address',
  questions: [
    {
      id: 'net-01',
      topic: 'net',
      kind: 'mc',
      who: 'YOU',
      pic: 'pic.mail_odd_address',
      place: { ja: '休憩所', en: 'Site break room' },
      situation: {
        ja: '休み時間、スマホにショートメッセージ（SMS）が来た。「不在のためお荷物を持ち帰りました。こちらで確認を」とリンクがついている。',
        en: 'On a break, a text message (SMS) arrives: "We took your parcel back because you were out. Check here." It has a link.',
      },
      ask: { ja: 'このリンク、どうする？', en: 'What do you do with this link?' },
      choices: [
        { ja: '荷物を待っているので、リンクを開く', en: "You're expecting a parcel, so open the link" },
        { ja: 'リンクは開かず、自分で調べて確かめる', en: "Don't open it. Check it yourself" },
        { ja: '返信して、本物か聞いてみる', en: 'Reply and ask if it is real' },
      ],
      correct: 1,
      why: {
        ja: '荷物を待っていても、SMSのリンクからは確かめないでおこう。宅配会社の公式のアプリや、自分で調べたページなら、本物かすぐわかるよ。',
        en: "Even if you're expecting a parcel, don't check through the link in a text. The delivery company's own app, or a page you looked up yourself, will tell you quickly.",
      },
      wrongWhy: [
        {
          ja: '宅配会社を名乗る偽のSMSは、よく届くんだ。リンクの先の偽のページで、パスワードを盗まれたりすることがあるよ。',
          en: 'Fake texts pretending to be delivery companies are common. The link can lead to a fake page that steals your password.',
        },
        null,
        {
          ja: '返信すると、この番号は使われている、と相手に知らせることになるよ。偽物なら「本物です」と答えるだけなんだ。',
          en: 'Replying tells them your number is in use. And a fake sender will just say it is real.',
        },
      ],
      tip: { ja: 'SMSのリンクは開かず、自分で調べて確かめる', en: "Don't open links in texts. Look it up yourself" },
    },
    {
      id: 'net-02',
      topic: 'net',
      kind: 'tf',
      who: 'YOU',
      pic: 'pic.sticky_password',
      situation: {
        ja: '会社の勤怠システムのパスワードを決める。覚えるのが大変なので、ネットの買い物で使っているのと同じにしたい。',
        en: "You're setting a password for the company timesheet system. To make it easy to remember, you want to use the same one as your online shopping.",
      },
      ask: { ja: '同じパスワードにする。これでいい？', en: 'Use the same password. Is that OK?' },
      answer: false,
      why: {
        ja: 'どこか1つのサービスからパスワードがもれると、同じパスワードのほかのサービスにも入られてしまうんだ。サービスごとに変えて、覚えきれないときは会社に相談しよう。',
        en: 'If one service leaks your password, someone can get into every other service that uses it. Use a different one for each, and ask the company if you cannot remember them all.',
      },
      wrongWhy: {
        ja: '覚えやすいのは、助かるよね。でも、買い物のサイトからもれたパスワードで、会社のシステムにまで入られることがあるんだ。',
        en: 'Easy to remember is handy. But a password leaked from a shopping site can be used to get into the company system too.',
      },
      tip: { ja: 'パスワードは、サービスごとに変える', en: 'Use a different password for each service' },
    },
    {
      id: 'net-03',
      topic: 'net',
      kind: 'tf',
      who: 'SAWA',
      pic: 'pic.send',
      situation: {
        ja: '会社のメールに、パスワードに加えて、スマホに届く番号でも本人か確かめる設定がある。「二段階の確かめ」というそうだ。',
        en: 'The company email has a setting that checks it is you with a code sent to your phone, on top of the password. It is called two-step checking.',
      },
      ask: { ja: '二段階の確かめを、オンにする。これでいい？', en: 'Turn on two-step checking. Is that OK?' },
      answer: true,
      why: {
        ja: 'パスワードが知られても、あなたのスマホに届く番号がなければ、ほかの人は入りにくくなるよ。手間は少し増えるけど、乗っ取りを防ぐ大きな助けになるんだ。',
        en: 'Even if someone learns your password, it is much harder to get in without the code sent to your phone. It is a little more work, but it helps a lot against takeovers.',
      },
      wrongWhy: {
        ja: '毎回番号を入れるのは、面倒に思えるよね。でも、パスワードだけだと、もれたときにそのまま入られてしまうんだ。',
        en: 'Typing a code each time can feel like a chore. But with a password alone, a leak lets someone walk straight in.',
      },
      tip: { ja: '二段階の確かめは、オンにしておく', en: 'Keep two-step checking turned on' },
    },
    {
      id: 'net-04',
      topic: 'net',
      kind: 'mc',
      who: 'STRANGER',
      pic: 'pic.mail_phone_number',
      situation: {
        ja: '事務所の電話に「システム担当です。確認のため、今あなたのスマホに届いた6けたの番号を教えてください」とかかってきた。',
        en: 'The office phone rings: "This is the systems team. To confirm, please read me the 6-digit code that just arrived on your phone."',
      },
      ask: { ja: 'どうするのがいい？', en: 'What should you do?' },
      choices: [
        { ja: 'システム担当なので、番号を教える', en: "It's the systems team, so read out the code" },
        { ja: '半分だけ教えて、様子を見る', en: 'Read out half and see what happens' },
        { ja: '教えずに切って、事務所に知らせる', en: "Don't tell. Hang up and tell the office" },
      ],
      correct: 2,
      why: {
        ja: '本物の担当の人は、スマホに届いた番号を聞かないはずだよ。教えずに切って、事務所に知らせれば、ほかの人も気をつけられるね。',
        en: 'Real staff should never ask for the code sent to your phone. Hang up without telling and let the office know, so everyone can watch out.',
      },
      wrongWhy: [
        {
          ja: 'スマホに届く番号は、二段階の確かめのためのものだよ。教えると、パスワードを知っている相手に、そのまま入られてしまうんだ。',
          en: 'That code is for two-step checking. If you read it out, someone who already has your password can get straight in.',
        },
        {
          ja: '半分でも、残りを当てられたり、もう一度聞かれたりするよ。この番号は、だれにも教えないものなんだ。',
          en: 'With half, they can guess the rest or just ask again. This code is never for sharing with anyone.',
        },
        null,
      ],
      tip: { ja: 'スマホに届いた番号は、だれにも教えない', en: 'Never share the code sent to your phone' },
    },
    {
      id: 'net-05',
      topic: 'net',
      kind: 'mc',
      who: 'YOU',
      pic: 'pic.drawings_on_train_lap',
      place: { ja: '駅前', en: 'By the station' },
      situation: {
        ja: '打ち合わせの帰り、駅前の店で、パスワードのいらない無料のWi‑Fiが使える。会社のメールを確かめたい。',
        en: "On the way back from a meeting, a shop by the station has free Wi-Fi that needs no password. You want to check your work email.",
      },
      ask: { ja: 'どうするのがいい？', en: 'What should you do?' },
      choices: [
        { ja: '無料のWi‑Fiは使わず、会社のスマホの回線で見る', en: "Skip the free Wi-Fi. Use the work phone's own connection" },
        { ja: '店の名前のWi‑Fiなら、つないで見る', en: "If the Wi-Fi has the shop's name, connect" },
        { ja: 'つないで、メールだけさっと見る', en: 'Connect and just glance at your email' },
      ],
      correct: 0,
      why: {
        ja: 'パスワードのいらない無料のWi‑Fiは、だれでもつなげるぶん、通信をのぞかれたり、偽物につながったりすることがあるんだ。仕事のメールは、会社のスマホの回線で見よう。',
        en: 'Free Wi-Fi with no password is open to anyone, so your traffic can be watched or you can end up on a fake network. Check work email over the work phone\'s own connection.',
      },
      wrongWhy: [
        null,
        {
          ja: '店と同じ名前のWi‑Fiでも、近くのだれかが作った偽物のこともあるよ。名前だけでは、本物かわからないんだ。',
          en: "A network with the shop's name can still be a fake set up by someone nearby. The name alone doesn't tell you it is real.",
        },
        {
          ja: 'さっと見るだけでも、つないでいる間は、まわりからのぞかれるおそれがあるよ。時間の長さは関係ないんだ。',
          en: "Even a quick look means you're exposed while connected. How long you stay doesn't matter.",
        },
      ],
      tip: { ja: '無料のWi‑Fiで、仕事の物を開かない', en: "Don't open work things on free Wi-Fi" },
    },
    {
      id: 'net-06',
      topic: 'net',
      kind: 'tf',
      who: 'YOU',
      pic: 'pic.see',
      situation: {
        ja: '事務所のパソコンに「更新があります。今すぐ再起動しますか？」と出た。急ぎの仕事はないが、面倒なので「あとで」を押したい。',
        en: 'The office PC says, "Updates are ready. Restart now?" Nothing is urgent, but you would rather press "Later".',
      },
      ask: { ja: '「あとで」を押して、そのままにしておく。これでいい？', en: 'Press "Later" and leave it. Is that OK?' },
      answer: false,
      why: {
        ja: '更新には、見つかった弱い所をふさぐ直しが入っているんだ。のばし続けると、そのすき間からウイルスに入られることがあるよ。急ぎの仕事がないなら、今のうちにしよう。',
        en: 'Updates include fixes that close weak spots that have been found. Putting them off can let a virus in through the gap. If nothing is urgent, do it now.',
      },
      wrongWhy: {
        ja: '再起動は、少し待たされるよね。でも、のばした分だけ、ふさがれていないすき間が残るんだ。スマホの更新も同じだよ。',
        en: 'Restarting means a short wait. But every delay leaves the gap open a little longer. The same goes for phone updates.',
      },
      tip: { ja: '更新は、のばさずにする', en: "Don't put off updates" },
    },
    {
      id: 'net-07',
      topic: 'net',
      kind: 'mc',
      who: 'YOU',
      pic: 'pic.zip_invoice_mail',
      situation: {
        ja: '事務所のパソコンで、図面のファイルが急に開けなくなった。画面に「元に戻したければ、お金を払え」と出ている。',
        en: 'On the office PC, the drawing files suddenly will not open. The screen says, "Pay if you want them back."',
      },
      ask: { ja: 'まず、どうする？', en: 'What do you do first?' },
      choices: [
        { ja: '書いてあるとおりに、お金を払う', en: 'Pay as the screen says' },
        { ja: 'ネットから切り離して、すぐ知らせる', en: 'Cut it off from the network and report it now' },
        { ja: 'パソコンを再起動して、もう一度開く', en: 'Restart the PC and try opening them again' },
      ],
      correct: 1,
      why: {
        ja: 'ファイルを開けなくして、お金を求めるウイルスなんだ。Wi‑Fiを切るかLANケーブルを抜いて、ほかのパソコンに広がらないようにして、すぐ宮下さんに知らせてね。',
        en: 'This is a virus that locks files and demands money. Turn off the Wi-Fi or unplug the network cable so it does not spread to other PCs, and tell Miyashita right away.',
      },
      wrongWhy: [
        {
          ja: '払っても、ファイルが元に戻るとは限らないよ。それに、払う相手は、ファイルを開けなくしたウイルスを送った人なんだ。',
          en: "Paying doesn't mean you will get the files back. And the people you would pay are the ones who sent the virus.",
        },
        null,
        {
          ja: '再起動すると、ウイルスが広がったり、何が起きたかの手がかりが消えたりすることがあるよ。さわる前に、知らせよう。',
          en: 'Restarting can spread the virus or wipe clues about what happened. Report it before touching anything.',
        },
      ],
      tip: { ja: '画面がおかしくなったら、ネットから切って知らせる', en: 'If the screen acts strange, disconnect and report' },
    },
  ],
}
