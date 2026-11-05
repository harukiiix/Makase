// 月曜日：現場事務所「人に見える所」
// 事務所に出しっぱなしの物（パスワードのふせん、開いたままの画面、図面、名簿、コピー機）と、外に見せていい物（許可票）
import type { Lesson } from '../types'

export const LESSON: Lesson = {
  id: 'see',
  dayName: { ja: '月曜日', en: 'Monday' },
  place: { ja: '現場事務所', en: 'Site office' },
  title: { ja: '人に見える所', en: 'Things people can see' },
  intro: [
    {
      who: 'BOSS',
      t: { ja: '月曜日は、この現場事務所から始めよう。', en: "Let's start the week here in the site office." },
    },
    {
      who: 'BOSS',
      t: {
        ja: 'ここには、銀行の図面や作業員名簿がある。ほかの会社の人や、お客さんもよく入ってくるんだ。',
        en: 'We keep the bank drawings and the worker list here. People from other companies and visitors come in all the time.',
      },
    },
    {
      who: 'YOU',
      t: { ja: '事務所の中なら、安心だと思っていました。', en: 'I thought things were safe as long as they were inside the office.' },
    },
    {
      who: 'BOSS',
      t: {
        ja: '入ってくる人には、机の上が全部見えるよ。何を出しっぱなしにすると困るか、問題で確かめよう。',
        en: "Anyone who comes in can see everything on the desks. Let's go through what should not be left out.",
      },
    },
  ],
  motto: { ja: '見える所に、出しっぱなしにしない', en: "Don't leave things out where people can see them" },
  icon: 'pic.see',
  questions: [
    // 1. パスワードのふせん（いちばんよくある）
    {
      id: 'see-01',
      topic: 'see',
      kind: 'mc',
      who: 'SAWA',
      pic: 'pic.sticky_password',
      situation: {
        ja: '事務所のパソコンの画面のふちに、パスワードを書いたふせんが貼ってある。お客さんが座る席からも見える。',
        en: 'A sticky note with the password is stuck on the edge of the office PC screen. You can see it from where visitors sit.',
      },
      ask: { ja: 'このふせん、どうする？', en: 'What do you do about this note?' },
      choices: [
        { ja: 'キーボードの下に貼りかえる', en: 'Move it under the keyboard' },
        { ja: 'はがして、パスワードを変える', en: 'Peel it off and change the password' },
        { ja: 'お客さんが来る時だけ、はがす', en: 'Take it down only when visitors come' },
      ],
      correct: 1,
      why: {
        ja: 'パスワードがパソコンのそばに書いてあったら、だれでも使えちゃうよね。もう見られたかもしれないから、パスワードも変えておこう。',
        en: 'With the password written right by the PC, anyone can use it. Someone may have seen it already, so change the password too.',
      },
      wrongWhy: [
        {
          ja: 'キーボードの下は、さがす人がまず見る所だよ。パソコンのそばにあるうちは、隠したことにならないんだ。',
          en: 'Under the keyboard is the first place anyone looks. As long as it is near the PC, it is not really hidden.',
        },
        null,
        {
          ja: '入ってくるのは、お客さんだけじゃないよ。職人さんや配達の人もいる。だれが見るかは、前もってわからないんだ。',
          en: "Visitors are not the only ones who come in. Workers and delivery people do too. You can't know ahead of time who will see it.",
        },
      ],
      tip: { ja: 'パスワードは、紙に書いて貼らない', en: 'Never write a password on a note and stick it up' },
      real: 'nexco-usb',
    },
    // 2. 席を立つときの画面ロック（「すぐ戻るから」）
    {
      id: 'see-02',
      topic: 'see',
      kind: 'tf',
      who: 'YOU',
      pic: 'pic.screen_lock',
      situation: {
        ja: 'トイレに行くので、2、3分だけ席をはなれる。パソコンには、図面のファイルが開いたままだ。',
        en: 'You need the restroom, so you will be away from your desk for a couple of minutes. A drawing file is still open on the PC.',
      },
      ask: {
        ja: 'その前に、Windowsキー＋Lで画面をロックする。これでいい？',
        en: 'Before you go, you press Windows key + L to lock the screen. Is that right?',
      },
      answer: true,
      why: {
        ja: '2、3分でも、その間に画面を見られたり、さわられたりするかもしれない。ロックはすぐできるから、席を立つたびにしよう。',
        en: 'Even in a couple of minutes, someone could look at the screen or use the PC. Locking takes a second, so do it every time you get up.',
      },
      wrongWhy: {
        ja: '2、3分なら大丈夫、と思うよね。でも、電話や呼び出しで、戻るのが遅くなることはよくあるんだ。',
        en: "It's easy to think a couple of minutes is fine. But a phone call or someone stopping you often keeps you away longer.",
      },
      tip: { ja: '席を立つときは、Windowsキー＋L', en: 'Leaving your desk? Press Windows key + L' },
    },
    // 3. 来た人の前に広げたままの図面（「待たせたら失礼」）
    {
      id: 'see-03',
      topic: 'see',
      kind: 'mc',
      who: 'STRANGER',
      pic: 'pic.drawing_on_desk_visitor',
      situation: {
        ja: '点検に来たという人が、事務所に入ってくる。机の上には、金庫室の場所がわかる図面が広げてある。',
        en: 'A man who says he is here for an inspection is coming into the office. A drawing that shows where the vault room is lies open on the desk.',
      },
      ask: { ja: 'この図面、どうする？', en: 'What do you do with the drawing?' },
      choices: [
        { ja: '上に、別の紙をかぶせておく', en: 'Cover it with another sheet of paper' },
        { ja: '『見ないでください』とお願いする', en: 'Ask him, "Please don\'t look at it"' },
        { ja: '少し待ってもらい、先にしまう', en: 'Ask him to wait, and put it away first' },
      ],
      correct: 2,
      why: {
        ja: '『少しお待ちください』と言うのは、失礼じゃないよ。見られる前にしまうのが、いちばん確かなんだ。',
        en: 'Saying "Just a moment, please" is not rude. Putting it away before anyone sees it is the surest way.',
      },
      wrongWhy: [
        {
          ja: '紙をかぶせても、はしが見えたり、めくられたりするよ。棚にしまえば、もう見られないね。',
          en: 'A cover sheet can slip, show the edges, or get lifted. Once it is in the cabinet, nobody can see it.',
        },
        {
          ja: 'お願いしても、目に入るものは止められないよ。見られて困る物は、先にしまっておこう。',
          en: "Asking can't stop what his eyes land on. Put away anything that should not be seen before he comes in.",
        },
        null,
      ],
      tip: { ja: '人が来る前に、図面はしまう', en: 'Put drawings away before anyone comes in' },
    },
    // 4. 作業員名簿の出しっぱなし（「目立たなければいい」）
    {
      id: 'see-04',
      topic: 'see',
      kind: 'mc',
      who: 'BOSS',
      pic: 'pic.worker_list_on_desk',
      situation: {
        ja: '作業員名簿のファイルが、事務所の入口の机に出しっぱなしになっている。だれでも手に取れる。',
        en: 'The worker list file has been left out on the desk by the office door. Anyone could pick it up.',
      },
      ask: { ja: 'この名簿、どうする？', en: 'What do you do with the list?' },
      choices: [
        { ja: '棚に入れて、鍵をかける', en: 'Put it in the cabinet and lock it' },
        { ja: '表紙を下にして、机に置いておく', en: 'Leave it on the desk, face down' },
        { ja: '棚の上の、目立たない所に置く', en: 'Put it up on a shelf, out of sight' },
      ],
      correct: 0,
      why: {
        ja: '名簿には、住所や生年月日、健康診断のことまで書いてある。使い終わったら、棚に入れて鍵をかけよう。',
        en: 'The list has addresses, birth dates, even health check details. When you are done with it, put it in the cabinet and lock it.',
      },
      wrongWhy: [
        null,
        {
          ja: '表紙をふせても、開けばすぐ中が見えるよ。そのまま持っていかれることもあるんだ。',
          en: 'Face down, it still opens in a second. Someone could also just walk off with it.',
        },
        {
          ja: '目立たない所でも、さがす人にはすぐ見つかるよ。隠すより、鍵をかける方が確かなんだ。',
          en: 'Anyone who looks will find it, even out of the way. Locking it up is surer than hiding it.',
        },
      ],
      tip: { ja: '名簿は、棚に入れて鍵をかける', en: 'Keep the worker list locked in the cabinet' },
    },
    // 5. コピー機に残った図面（「あとで取りに来るから」）
    {
      id: 'see-05',
      topic: 'see',
      kind: 'tf',
      who: 'KIMURA',
      pic: 'pic.drawing_left_in_copier',
      situation: {
        ja: '木村さんが印刷した図面が、コピー機に残ったままだ。このコピー機は、ほかの会社の人も使う。',
        en: 'A drawing Kimura printed is still sitting in the copier. People from other companies use this copier too.',
      },
      ask: { ja: 'あとで木村さんが取りに来る。そのままにしていい？', en: 'Kimura will come back for it later. Is it OK to leave it there?' },
      answer: false,
      why: {
        ja: 'コピー機は、いろんな会社の人が使うよね。残っていた図面は、木村さんに届けよう。自分が印刷した時も、すぐ取りに行こう。',
        en: 'People from all sorts of companies use the copier. Take the drawing to Kimura. When you print something yourself, go get it right away.',
      },
      wrongWhy: {
        ja: 'あとで取りに来るまで、図面はだれでも見られる所にあるんだ。次にコピー機を使った人の目に入るよ。',
        en: 'Until he comes back, the drawing sits where anyone can see it. The next person to use the copier will spot it.',
      },
      tip: { ja: '印刷した物を、コピー機に残さない', en: 'Never leave printouts in the copier' },
    },
    // 6. 外に見せていい物（建設業の許可票）
    {
      id: 'see-06',
      topic: 'see',
      kind: 'tf',
      who: 'GUARD',
      pic: 'pic.permit_sign_on_fence',
      situation: {
        ja: '現場の入口に、建設業の許可票がかかっている。会社の名前や、責任者の名前が書いてある。',
        en: 'The construction permit sign is posted at the site entrance. It shows the company name and the names of the people in charge.',
      },
      ask: { ja: '外を通る人にも見えるけど、このまま出しておいていい？', en: 'People walking by can see it. Is it OK to leave it up?' },
      answer: true,
      why: {
        ja: '許可票は、外から見える所に出すと、法律で決まっているんだ。工事のお知らせや、労災保険関係成立票も、外に出しておく物だよ。',
        en: "The law says the permit sign must be posted where people outside can see it. The notice for neighbors and the workers' accident insurance sign belong outside too.",
      },
      wrongWhy: {
        ja: '名前が書いてあるから、隠したくなるよね。でもこれは、だれが工事をしているか、外の人に知らせるための物なんだ。',
        en: 'Names on a sign make you want to hide it. But this sign is there to tell people outside who is doing the work.',
      },
      tip: { ja: '許可票や工事のお知らせは、外に出す物', en: 'Permit signs and notices are meant to be seen' },
    },
    // 7. USBメモリにパスワードを貼る（実際にあった話）
    {
      id: 'see-07',
      topic: 'see',
      kind: 'tf',
      who: 'YOU',
      pic: 'pic.usb_password_label',
      situation: {
        ja: '図面を入れたUSBメモリに、パスワードをかけた。でも、パスワードを忘れると開けられなくなる。',
        en: "You put drawings on a USB stick and set a password. If you forget the password, you won't be able to open it.",
      },
      ask: {
        ja: '忘れないように、パスワードを書いたシールを本体に貼る。これでいい？',
        en: "So you won't forget, you stick a label with the password on the stick. Is that OK?",
      },
      answer: false,
      why: {
        ja: 'パスワードを貼ったままなくしたら、拾った人がすぐ中を見られるよ。パスワードは、USBメモリとは別にしておこう。',
        en: 'Lose it with the password on it, and whoever finds it can open it right away. Keep the password apart from the USB stick.',
      },
      wrongWhy: {
        ja: '忘れたら困る、という気持ちはわかるよ。でも、本体に書いてあったら、パスワードをかけた意味がなくなっちゃうんだ。',
        en: 'I know forgetting it would be a pain. But if it is written on the stick, the password does no good at all.',
      },
      tip: { ja: 'USBメモリに、パスワードを書かない', en: 'Never write the password on the USB stick' },
      real: 'nexco-usb',
    },
  ],
}
