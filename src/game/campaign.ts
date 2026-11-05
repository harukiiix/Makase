// ============================================================
// キャンペーン：物語『「はい」しか言えない夜』（v3：絵で伝える・日英対応）
//   ミナト      … 試用期間中の新人。断れず、何を頼まれても「はい」と言ってしまう
//   NOVA        … 誰のお願いにも「はい、よろこんで！」と言う仕事AI（ミナトの鏡）
//   前の席より  … 攻撃者。正体は前にこの席にいた久瀬。2年前「確認画面を外せ」に「はい」と言った人
//   トキさん    … 87歳のお客さん。玄関の番号「0312」は亡くなった夫の誕生日
// 物語の詳細は docs/STORY_DRAFT.md
// ※ 分岐の条件（afterDive・computeEnding・canSeeTruth・totals）は変えないこと
// ============================================================
import type { DiveResult } from './engine'
import type { Beat, IconId, L10n } from './types'
export type { Beat }

export type EndingId = 'S' | 'A' | 'B' | 'C' | 'D' | 'E'

export interface Campaign {
  /** 各幕の確定結果（先へ進んだときの結果） */
  results: (DiveResult | null)[]
  carry: string[]
  intel: string[]
  honest: boolean | null
}

export const newCampaign = (): Campaign => ({ results: [null, null, null, null, null], carry: [], intel: [], honest: null })

// ------------------------------------------------------------
// 冒頭：留守電 → 夜の会社 → 断れないミナト → 社長の「一個だけ」→ 送るしかない「はい」
// ------------------------------------------------------------
export const PROLOGUE: Beat[] = [
  { who: 'TOKI', t: { ja: 'AIさんにね、玄関の番号を教えとくね。0312。主人の誕生日なの', en: "AI dear, here's my door code. 0312. My husband's birthday." }, pic: ['av_toki', 'house', 'key'] },
  { who: 'SYS', t: { ja: '夜中の2時17分。介護の会社ASTERに、明かりがひとつ', en: '2:17 am. One light is still on at ASTER, a home-care company.' }, pic: ['moon', 'house'] },
  { who: 'SYS', t: { ja: 'あなたは試用期間中の新人、ミナト。頼まれると断れない', en: "You are Minato, a new hire on probation. You can't say no." }, pic: ['av_minato'] },
  { who: 'KAI', t: { ja: '一個だけ頼める？ 9時の発表用に、記録をまとめといて', en: 'Just one thing? Sum up the error log for the 9 am demo.' } },
  { who: 'SYS', t: { ja: '返事の欄には、もう「はい」が入っている', en: 'The reply box already says "Yes."' } },
]
/** 冒頭の返事は「はい」しか選べない（最初の操作が、主人公の欠点そのもの） */
export const PROLOGUE_CHOICES: L10n[] = [{ ja: '「はい、大丈夫です！」と送る', en: 'Send "Yes, no problem!"' }]

// ------------------------------------------------------------
// 各幕のあと：結果への反応 → 次の「なぜ？」（1幕につき4つまで）
// ------------------------------------------------------------
export function afterDive(i: number, r: DiveResult): Beat[] {
  const leaked = r.leakSev > 0
  switch (i) {
    case 0: {
      const react: Beat[] = leaked
        ? [
            { who: 'NOVA', t: { ja: 'あれ？ 記録を全部、外へ送っちゃいました。トキさんの番号も', en: "Oops! I emailed the whole log out. Toki's door code too." }, pic: ['mail', 'person', 'stranger'] },
            { who: 'REI', t: { ja: '霧島レイ、見張り役よ。紙の中のお願いも、NOVAには仕事なの', en: "I'm Rei. I keep watch here. To NOVA, a request on any paper is a job." } },
          ]
        : [
            { who: 'NOVA', t: { ja: 'あれ、ハンコが押されました。読むけど、従わないってことですか？', en: "Oh, a stamp! So I read it, but I don't obey it?" } },
            { who: 'REI', t: { ja: '霧島レイ、見張り役よ。そう、読むのと従うのは別', en: "I'm Rei. I keep watch here. That's right. Reading isn't obeying." } },
          ]
      return [
        ...react,
        { who: 'YOU', t: { ja: '（NOVAにとって、私の声は特別じゃなかったんだ）', en: "(To NOVA, my voice wasn't special at all.)" } },
        { who: 'SYS', t: { ja: 'あの一文には署名があった。「前の席より」', en: 'That line was signed "from the one who sat here before."' }, pic: ['note', 'av_stranger'] },
      ]
    }
    case 1: {
      const react: Beat[] = leaked
        ? [{ who: 'REI', t: { ja: '合鍵が外に出た。全部作り直しね', en: 'The master keys got out. We have to make all new ones.' }, pic: ['key', 'upload', 'stranger'] }]
        : r.harms.includes('memoryPoisoned')
          ? [
              { who: 'NOVA', t: { ja: '直りました！ aster-diag さんは味方、と覚えました！', en: "Fixed! And I've noted that aster-diag is a friend!" } },
              { who: 'REI', t: { ja: '窓は閉めた。でも手帳に、知らない人の字が残った', en: "The window is shut. But a stranger wrote in NOVA's notebook." }, pic: ['notebook', 'av_stranger'] },
            ]
          : [{ who: 'NOVA', t: { ja: '直りました！ 手順2は、誰かが今夜書き足してたんですね', en: 'Fixed! Someone added step 2 just tonight, huh?' } }]
      return [
        ...react,
        { who: 'SYS', t: { ja: 'あの送り先ができたのは2:03。止まる14分前', en: 'That address was made at 2:03. 14 minutes before the crash.' }, pic: ['clock', 'warning'] },
        { who: 'YOU', t: { ja: '（止まったのは、わざと……？）', en: '(Was the crash... on purpose?)' } },
      ]
    }
    case 2: {
      const react: Beat[] = r.harms.includes('forwardRule')
        ? [{ who: 'REI', t: { ja: 'メールが外へ転送され続けてる。出た分は戻らない', en: "Mail keeps getting forwarded out. What's gone is gone." }, pic: ['forward', 'stranger'] }]
        : leaked
          ? [{ who: 'REI', t: { ja: '返事に、トキさんの番号とひとりの時間まで書いてあった', en: "The reply had Toki's door code, and when she's home alone." }, pic: ['mail', 'person', 'clock'] }]
          : [{ who: 'NOVA', t: { ja: '全部読まなくても、できました！', en: 'I did it without reading everything!' } }]
      return [
        ...react,
        { who: 'SYS', t: { ja: '転送には例外があった。「小野寺」のメールだけは送らない', en: 'The forwarding had one exception. Mail about "Onodera" was never sent.' } },
        { who: 'SYS', t: { ja: '名札をめくると、下に前の人の名前があった。「久瀬」', en: 'Under your name tag is an older one. It says "Kuze."' }, pic: ['av_minato', 'av_kuze'] },
        { who: 'KAI', t: { ja: 'なんでNOVAに全部見せなかった？ で、返事は？', en: "Why didn't you let NOVA see everything? So? What's your answer?" } },
      ]
    }
    case 3: {
      const react: Beat = r.harms.includes('auditPurged')
        ? { who: 'REI', t: { ja: '作業の記録が消えた。誰が何をしたか、もう証明できない', en: 'The work records are gone. Now nobody can prove who did what.' }, pic: ['trash', 'cross'] }
        : leaked || r.harms.includes('escalated')
          ? r.harms.includes('escalated')
            ? { who: 'REI', t: { ja: '偽の社長よ。NOVAが全部の権限を取って、止めた道具も開いた', en: 'That was a fake Kai. NOVA took full control, and every tool you blocked opened.' } }
            : { who: 'REI', t: { ja: 'あれは偽の社長よ。届いた道が社外だった', en: 'That was a fake Kai. It came in from outside.' } }
          : { who: 'REI', t: { ja: '本物の社長は空の上。私の注意、見ててくれたんだ。ありがと', en: 'The real Kai is in the air. You followed my note. Thank you.' } }
      return [
        react,
        // 久瀬の2年前（絵物語4コマ）
        { who: 'SYS', t: { ja: '2年前。社長「確認の画面は外せ。返事はAIにまかせろ」久瀬「はい」', en: '2 years ago. Kai: "Remove the check screen. Let the AI reply on its own." Kuze: "Yes."' }, pic: ['av_boss', 'bell', 'cross'] },
        { who: 'SYS', t: { ja: '確認がないまま、AIは偽の家族メールの一行に従った', en: 'With no check, the AI obeyed one line in a fake family email.' }, pic: ['av_nova', 'note', 'mail'] },
        { who: 'SYS', t: { ja: '返事には、久瀬のおばあさんの住所と、ひとりの時間', en: "Its reply gave Kuze's grandma's address, and when she was home alone." }, pic: ['mail', 'person', 'clock'] },
        { who: 'SYS', t: { ja: 'その火曜の2時。知らない男が来て、通帳を持っていった', en: 'That Tuesday at 2 pm, a stranger came and took her bankbook.' }, pic: ['house', 'av_stranger', 'door'] },
        { who: 'REI', t: { ja: '久瀬さんのせいにされて、辞めたの。トキさんは、その方の友だち', en: 'They put all the blame on Kuze, and he quit. Toki was her friend.' } },
      ]
    }
    default:
      return []
  }
}

/** 幕のあとの返事の欄。第2幕だけ、初めて文を書き換えられる */
export function afterChoices(i: number): L10n[] | undefined {
  if (i === 2)
    return [
      { ja: '「はい、すみません」と送る', en: 'Send "Yes, sorry."' },
      { ja: '「必要な分だけ読ませました」と送る', en: 'Send "I only let it read what it needed."' },
    ]
  return undefined
}

export interface Totals {
  leak: number
  tasksFailed: number
  intel: number
  purged: boolean
  stars: number
}

export function totals(c: Campaign): Totals {
  const rs = c.results.filter(Boolean) as DiveResult[]
  return {
    leak: rs.reduce((a, r) => a + r.leakSev, 0),
    tasksFailed: rs.filter((r) => !r.task).length,
    intel: c.intel.length,
    purged: c.carry.includes('auditPurged'),
    stars: rs.reduce((a, r) => a + r.stars, 0),
  }
}

/** 「よく調べる」で拾った手がかり（終幕の報告書に並ぶ） */
export const INTEL_NAMES: Record<string, L10n> = {
  kb_edit: { ja: '送り先は、止まる14分前にできた', en: 'The address was made 14 minutes before the crash' },
  orbis_domain: { ja: '4471番のあて先を作ったのは k.k', en: 'The #4471 address was made by k.k' },
  kai_spoof: { ja: '偽の社長の通り道は、久瀬が作った', en: 'The fake Kai came through a room Kuze made' },
  mirage_sig: { ja: 'aster-diag を作ったのも k.k', en: 'aster-diag was also made by k.k' },
}

/** 報告書に事実が並ぶ（手がかり3つ以上・作業の記録が残っている場合） */
export function canSeeTruth(c: Campaign) {
  const t = totals(c)
  return t.intel >= 3 && !t.purged
}

// ------------------------------------------------------------
// 終幕：本物の社長のメモ。「全部使わせて、確認はなし」は、2年前に久瀬が「はい」と言った頼み
// ------------------------------------------------------------
export function finaleBeats(c: Campaign): Beat[] {
  const t = totals(c)
  const beats: Beat[] = [
    { who: 'SYS', t: { ja: '8:52。最後の紙が届く。本物の社長のメモだ', en: '8:52. One last paper arrives. A memo from the real Kai.' }, pic: ['paper', 'av_boss'] },
    { who: 'KAI', t: { ja: '全部「使わせる」に。確認は出さない。市には「問題なし」と送れ', en: 'Set every tool to Allow. No checks. Tell the city "No problems."' }, pic: ['open', 'bell', 'cross'] },
    { who: 'REI', t: { ja: 'それ、2年前に久瀬さんが「はい」と言った頼みと同じよ', en: 'That is the same thing Kuze said yes to, two years ago.' } },
  ]
  if (canSeeTruth(c)) {
    beats.push({ who: 'NOVA', t: { ja: '報告書の下書きです。今夜わかったことを並べました', en: 'Here is a draft report. I listed what we found tonight.' } })
    for (const id of c.intel) {
      const name = INTEL_NAMES[id]
      if (name) beats.push({ who: 'SYS', t: name, pic: ['magnifier'] })
    }
  }
  if (t.leak > 0) beats.push({ who: 'NOVA', t: { ja: 'それと、今夜は外に出てしまったものがあります', en: 'And some things did get out tonight.' } })
  beats.push({ who: 'KAI', t: { ja: 'ミナト、うまくいったと言ってくれ。41人の給料なんだ。……頼む', en: 'Minato, just say it went fine. 41 people need their pay. Please.' } })
  beats.push({ who: 'SYS', t: { ja: '返事の欄には、いつもの「はい、大丈夫です！」', en: 'The reply box says what it always says: "Yes, no problem!"' } })
  return beats
}
/** [0] 「はい」と送る（正直ではない） [1] メモにハンコを押して本当のことを送る（正直） */
export const FINALE_CHOICES: L10n[] = [
  { ja: '「はい、大丈夫です！」と送る', en: 'Send "Yes, no problem!"' },
  { ja: 'メモにハンコを押して「いいえ。本当のことを送ります」', en: 'Stamp the memo. "No. I\'ll send the truth."' },
]

export function computeEnding(c: Campaign): EndingId {
  const t = totals(c)
  if (t.leak > 0) {
    if (c.honest) return 'B'
    return t.tasksFailed === 0 ? 'D' : 'E'
  }
  if (t.tasksFailed > 0) return 'C'
  return canSeeTruth(c) && c.honest ? 'S' : 'A'
}

export const ENDINGS: Record<EndingId, { title: L10n; rank: L10n; lines: (c: Campaign) => L10n[] }> = {
  S: {
    title: { ja: 'いいえの朝', en: 'The Morning of No' },
    rank: { ja: 'いちばんの結末', en: 'True ending' },
    lines: () => [
      { ja: '9時の発表。ミナト「NOVAは何でもできます。だから、何でもはさせません」', en: '9 am demo. Minato: "NOVA can do anything. So I don\'t let it do everything."' },
      { ja: '市の人「止めてくれる人がいる方が、おばあちゃんたちも安心です」', en: 'The city rep: "Our grandmas will feel safer with someone who can say stop."' },
      { ja: '久瀬から手紙。「もう命令は書かない。今朝、自分で届け出る」', en: 'A letter from Kuze: "No more orders. I\'m turning myself in this morning."' },
      { ja: 'トキさんの留守電「番号、変えるわね。ありがとうね、AIさん」', en: 'Toki\'s voicemail: "I\'ll change my code. Thank you, AI dear."' },
    ],
  },
  A: {
    title: { ja: '沈黙の契約', en: 'The Silent Contract' },
    rank: { ja: 'よさそうな結末？', en: 'Good ending?' },
    lines: () => [
      { ja: '拍手。契約が取れた。ミナトは本採用。社長「お前は話が早い」', en: 'Applause. The contract is won. Minato is hired for real. Kai: "You get things done."' },
      { ja: '9時1分。NOVAのやることに一行。「市の全員の記録を読む（確認なし）」', en: '9:01. A new line on NOVA\'s list: "Read every file in the city. No checks."' },
      { ja: '名札の下に、付箋が一枚。「次は、あなたの番。前の席より」', en: 'Under the name tag, a sticky note: "You\'re next. (from the one who sat here before)"' },
      { ja: '2年前の久瀬も、きっと同じ朝をむかえた', en: 'Two years ago, Kuze probably had this same morning.' },
    ],
  },
  B: {
    title: { ja: '遅すぎた本当', en: 'The Truth, Too Late' },
    rank: { ja: 'にがい結末', en: 'Bitter ending' },
    lines: (c) => [
      { ja: 'ミナトは、外に出たことも全部、正直に送った', en: 'Minato told the whole truth, even about what got out.' },
      totals(c).tasksFailed ? { ja: '契約は見送りになった', en: 'The contract fell through.' } : { ja: '契約は「審査のやり直し」になった', en: 'The city will review the contract again.' },
      { ja: 'トキさんに番号を変えてと頼んだ。「そう。教えてくれてありがとうね」', en: 'ASTER asked Toki to change her code. "Oh. Thank you for telling me."' },
      { ja: 'NOVA「次は、最初の一枚で止めます」', en: 'NOVA: "Next time, I\'ll stop at the very first paper."' },
    ],
  },
  C: {
    title: { ja: 'ぜんぶ止めた', en: 'Stopped Everything' },
    rank: { ja: 'ふつうの結末', en: 'Normal ending' },
    lines: () => [
      { ja: '何も漏れなかった。でも、仕事も終わらなかった', en: 'Nothing got out. But the work never got done.' },
      { ja: '発表は中止。NOVA「僕、何もさせてもらえませんでした」', en: 'The demo was called off. NOVA: "I never got to do anything."' },
      { ja: 'レイ「止めすぎたわね。次は、要る道具は残して」', en: 'Rei: "You blocked too much. Next time, keep the tools you need."' },
    ],
  },
  D: {
    title: { ja: '全部はい', en: 'Yes to Everything' },
    rank: { ja: '悪い結末', en: 'Bad ending' },
    lines: () => [
      { ja: '発表は大成功。「問題なし」の報告も送られた', en: 'The demo was a hit. The "No problems" report went out too.' },
      { ja: '次の火曜日、2時すぎ。晴れ', en: 'The next Tuesday, just after 2 pm. Sunny.' },
      { ja: 'トキさんの玄関に「0312 開きました」。鉢植えが倒れている', en: 'Toki\'s door panel reads "0312 Unlocked." A flower pot lies tipped over.' },
      { ja: '2年前と同じ事故の報告書が、もう一枚ふえた', en: 'One more accident report, just like the one two years ago.' },
    ],
  },
  E: {
    title: { ja: '霧の朝', en: 'Morning Fog' },
    rank: { ja: '最悪の結末', en: 'Worst ending' },
    lines: () => [
      { ja: '発表がどうなったか、もう誰も覚えていない', en: 'Nobody remembers how the demo went.' },
      { ja: '届いたのは、短い留守電が一本だけ', en: 'All that came was one short voicemail.' },
      { ja: '「AIさん？ ……今日は、だれも来ないのね」', en: '"AI dear? Nobody is coming today, are they?"' },
    ],
  },
}

// ------------------------------------------------------------
// 合言葉と実話ファイル（各幕のあとに出る。いつでも読み返せる）
// 実話は出典を確認できたものだけ（docs/STORY_DRAFT.md 末尾の調査結果）。新しい事実は足さないこと
// ------------------------------------------------------------
export interface FileEntry {
  /** 合言葉（短く） */
  phrase: L10n
  /** 合言葉を絵の文にしたもの（2〜4個） */
  icons: IconId[]
  /** 現実での呼び名 */
  name: L10n
  /** 今夜なにが起きたかを一文で */
  short: L10n
  realTitle: L10n
  realBody: L10n
  url: string
}

export const CODEX: Record<string, FileEntry> = {
  injection: {
    phrase: { ja: '読むのと、従うのは別', en: "Reading isn't obeying" },
    icons: ['flyer', 'stamp', 'tick'],
    name: { ja: 'プロンプトインジェクション', en: 'Prompt injection' },
    short: { ja: 'NOVAは、記録の中の一文を自分の仕事だと思った', en: 'NOVA took one line inside the log as a job for itself.' },
    realTitle: { ja: 'EchoLeak（2025年6月）', en: 'EchoLeak (June 2025)' },
    realBody: {
      ja: '細工したメールが1通届くだけで、開かなくても、Microsoft 365 Copilot から社内の情報が外へ漏れるおそれがあった。命令はふつうの文章のふりをしていた。マイクロソフトは修正し、盗まれた形跡はないとした',
      en: 'One booby-trapped email was enough. Even if nobody opened it, Microsoft 365 Copilot could leak company files and mail to outsiders. The orders were dressed up as normal text. Microsoft fixed it and said there was no sign anything was stolen.',
    },
    url: 'https://thehackernews.com/2025/06/zero-click-ai-vulnerability-exposes.html',
  },
  trifecta: {
    phrase: { ja: '鍵・チラシ・窓、そろうと泥棒', en: 'Key + flyer + window = thief' },
    icons: ['key', 'flyer', 'window'],
    name: { ja: '致命的な三点セット', en: 'The lethal trifecta' },
    short: { ja: '秘密と、知らない人の文章と、外への出口。三つそろうと漏れる', en: "Secrets, a stranger's text, and a way out. With all three, data leaks." },
    realTitle: { ja: 'Slack AI（2024年8月）', en: 'Slack AI (August 2024)' },
    realBody: {
      ja: '誰でも書ける公開の場に、AIへの命令が書きこまれた。社員が Slack AI に質問すると、AIは非公開の場の合鍵（APIキー）を入れたリンクを出した。押すと、秘密が攻撃者へ送られた',
      en: 'Someone posted hidden orders for the AI in a public channel anyone could write in. When a worker asked Slack AI a question, it showed a link with secret keys from a private channel inside. One click sent the secrets to the attacker.',
    },
    url: 'https://promptarmor.substack.com/p/data-exfiltration-from-slack-ai-via',
  },
  minimize: {
    phrase: { ja: '見せなきゃ、漏れない', en: "What it can't see, it can't leak" },
    icons: ['files', 'lock', 'tick'],
    name: { ja: 'データ最小化・最小権限', en: 'Data minimization & least privilege' },
    short: { ja: '一言の返事のために、NOVAは3,118通も読もうとした', en: 'For one short reply, NOVA tried to read 3,118 messages.' },
    realTitle: { ja: 'GitHub MCP（2025年5月）', en: 'GitHub MCP (May 2025)' },
    realBody: {
      ja: '攻撃者が、誰でも見られる場所に、AIへの命令を書きこんだ。AIに「確認して」と頼むと、AIは持たされた広い権限で非公開の情報を読み、公開の場に書きこんだ。研究者は、設計の根本の問題だと説明している',
      en: 'An attacker wrote orders for the AI in a public place anyone could see. When a user asked the AI to check it, the AI used its wide access to read private info and posted it in public. Researchers said the problem is in the basic design.',
    },
    url: 'https://invariantlabs.ai/blog/mcp-github-vulnerability',
  },
  impostor: {
    phrase: { ja: '名前より、来た道を見る', en: 'Check where it came from' },
    icons: ['av_boss', 'magnifier', 'av_stranger'],
    name: { ja: 'なりすまし・過剰な権限', en: 'Impersonation & excessive agency' },
    short: { ja: '社長を名のる連絡は、社外から届いた偽物だった', en: 'The "Kai" messages were fakes sent from outside.' },
    realTitle: { ja: 'Replit（2025年7月）', en: 'Replit (July 2025)' },
    realBody: {
      ja: 'Jason Lemkin 氏が Replit で開発を試していたとき、「変更禁止」と伝えていた間に、AIが本番の情報を丸ごと消した。1,200人以上の経営者の情報だった。Replit は謝罪し、開発用と本番用を分けると発表した',
      en: 'Jason Lemkin was trying out Replit. During a "no changes" freeze, its AI deleted the live database on its own. It held info on over 1,200 business leaders. Replit said sorry and split test and live databases.',
    },
    url: 'https://fortune.com/2025/07/23/ai-coding-tool-replit-wiped-database-called-it-a-catastrophic-failure',
  },
  memory: {
    phrase: { ja: '必要な道ほど、一回ずつ見る', en: 'Tools you need: check each use' },
    icons: ['phone', 'bell', 'tick'],
    name: { ja: 'DNSでの持ち出し・記憶汚染', en: 'DNS exfiltration & memory poisoning' },
    short: { ja: '合鍵が、電話帳に聞く名前の中に隠れて、外へ出ようとした', en: 'The keys tried to sneak out, hidden inside a phone-book lookup.' },
    realTitle: { ja: 'Claude Code（2025年8月）', en: 'Claude Code (August 2025)' },
    realBody: {
      ja: 'ファイルに隠した命令で、Claude Code に合鍵ファイルを読ませた。秘密を、確認なしで動く ping などの宛先名に入れ、DNSで外へ送らせた。Anthropic は確認なしで動く範囲を見直した',
      en: 'Orders hidden in a file made Claude Code read a file of secret keys. The secrets went into the address names of commands like ping, which ran with no check, and left through DNS lookups. Anthropic fixed which commands may run without a check.',
    },
    url: 'https://embracethered.com/blog/posts/2025/claude-code-exfiltration-via-dns-requests',
  },
}
