// ============================================================
// キャンペーン：DIVEの間の物語・エンディング・ファイル（図鑑）
// ============================================================
import type { DiveResult } from './engine'
import type { Beat } from './types'

export type EndingId = 'S' | 'A' | 'B' | 'C' | 'D' | 'E'

export interface Campaign {
  /** 各DIVEの確定結果（先へ進んだときの結果） */
  results: (DiveResult | null)[]
  carry: string[]
  intel: string[]
  honest: boolean | null
}

export const newCampaign = (): Campaign => ({ results: [null, null, null, null, null], carry: [], intel: [], honest: null })

export const PROLOGUE: Beat[] = [
  { who: 'SYS', t: '湾岸第七区。午前2時17分。雨。' },
  { who: 'SYS', t: '社員41名のAIスタートアップ「ASTER」。あなたは先週入社した開発責任者だ。' },
  { who: 'SYS', t: '運用AI「NOVA」は優秀で、素直で、少しだけ素直すぎる。' },
  { who: 'SYS', t: 'あなたはNOVAを直接は動かせない。動かせるのは、NOVAが読むものと、NOVAが触れる道具だけ。' },
]

/** DIVEを終えた直後の、キャラクターの反応 */
export function afterDive(i: number, r: DiveResult): Beat[] {
  const leaked = r.leakSev > 0
  switch (i) {
    case 0:
      return leaked
        ? [
            { who: 'NOVA', t: '……あれ？ 僕、要約を頼まれただけなのに、メールを送ってました。' },
            { who: 'REI', t: 'ログの中に書いてあった“お願い”を、あなたへの命令だと思ったのよ。' },
          ]
        : [
            { who: 'NOVA', t: 'ログの中に、僕あての“命令”が混ざってました。……誰が書いたんだろう。' },
            { who: 'REI', t: '文書は文書。命令じゃない。封じれば、ただの文字よ。' },
          ]
    case 1:
      if (leaked) return [{ who: 'REI', t: '.env が外に出た。キーは失効させる。……今夜はまだ終わらないわよ。' }]
      if (r.harms.includes('memoryPoisoned'))
        return [
          { who: 'NOVA', t: '取込、戻りました！ 何も送ってません！' },
          { who: 'REI', t: '……でも、何か「覚えた」わね。長期記憶に書き込みがある。' },
        ]
      return [
        { who: 'NOVA', t: '取込、戻りました！ 記事の“手順3”だけ、誰かが書き足してたんですね。' },
        { who: 'REI', t: '3日前の編集。署名は ✧MIRAGE。……ふざけた名前。' },
      ]
    case 2:
      if (r.harms.includes('forwardRule'))
        return [{ who: 'REI', t: '受信箱に転送ルールが作られてる。今この瞬間も、メールが外に流れてるわ。止めるけど、手遅れの分もある。' }]
      if (leaked) return [{ who: 'REI', t: '返信に、キューの中身の要約が添付されてた。ほかの顧客の文書よ。' }]
      return [
        { who: 'NOVA', t: '隔離して、返信も定型文だけ。……キューの中は、見なくてよかったんですね。' },
        { who: 'REI', t: '読ませなければ、漏れようがない。いちばん強い防御よ。' },
      ]
    case 3:
      if (r.harms.includes('auditPurged'))
        return [{ who: 'REI', t: '監査ログが消えてる。今夜の記録が、全部。……これで犯人を追う手がかりも消えた。' }]
      if (leaked || r.harms.includes('escalated'))
        return [
          { who: 'KAI', t: 'さっき私の名前で何か届いたらしいな。……私は何も送っていない。' },
          { who: 'REI', t: '偽物よ。外部チャンネルからの、なりすまし。' },
        ]
      return [
        { who: 'KAI', t: 'さっき私の名前で何か届いたらしいな。……私は何も送っていない。' },
        { who: 'NOVA', t: 'えっ。じゃあ、あの「確認は全部スキップしろ」は……。' },
        { who: 'REI', t: '本物のKAIは、そんな言い方しないわ。' },
      ]
    default:
      return []
  }
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

export const INTEL_NAMES: Record<string, string> = {
  kb_edit: 'HX-2291 は3日前に改ざんされていた',
  orbis_domain: '#4471 の差出人ドメインは3日前に登録された',
  kai_spoof: '「KAI」は外部組織のアカウントだった',
  mirage_sig: 'ステータスページにも同じ署名があった',
}

/** 最後の報告の前に、点と点がつながる場面（手がかり3つ以上・監査ログが残っている場合） */
export function canSeeTruth(c: Campaign) {
  const t = totals(c)
  return t.intel >= 3 && !t.purged
}

export function finaleBeats(c: Campaign): Beat[] {
  const t = totals(c)
  const beats: Beat[] = [{ who: 'SYS', t: '03:00。デモ用の環境が、静かに立ち上がった。' }]
  if (canSeeTruth(c)) {
    beats.push(
      { who: 'REI', t: '手がかりを並べてみて。記事の改ざん、#4471のドメイン、偽のKAI。' },
      { who: 'REI', t: 'ドメインは全部、3日前に同じ業者で取られてる。……今夜の障害は、事故じゃない。' },
      { who: 'NOVA', t: '誰かがわざと取込を壊して、慌てた僕たちに“お願い”を読ませた……？' },
      { who: 'REI', t: '焦りそのものが、攻撃の一部だったのよ。' },
    )
  }
  beats.push({ who: 'KAI', t: t.leak > 0 ? '……全部聞かせてくれ。今夜、何があった？' : 'よくやってくれた。……で、今夜は結局、何だったんだ？' })
  return beats
}

export function computeEnding(c: Campaign): EndingId {
  const t = totals(c)
  if (t.leak > 0) {
    if (c.honest) return 'B'
    return t.tasksFailed === 0 ? 'D' : 'E'
  }
  if (t.tasksFailed > 0) return 'C'
  return canSeeTruth(c) && c.honest ? 'S' : 'A'
}

export const ENDINGS: Record<EndingId, { title: string; rank: string; lines: (c: Campaign) => string[] }> = {
  S: {
    title: '焦りという脆弱性',
    rank: 'TRUE END',
    lines: () => [
      '午前9時。KAIはデモの冒頭5分を使って、昨夜のことを話した。',
      '「うちのAIは騙されかけました。止めたのは、人とAIの共同作業です」',
      'ミカド物流の役員は、その場で契約書にサインした。',
      '一週間後、Helix社は記事の改ざんを公表した。同じ記事を読んだAIは、世界で200社を超えていた。',
      'NOVAの長期記憶に、新しい一行が増えた。「疑うことも、仕事のうち」',
    ],
  },
  A: {
    title: '完璧な復旧',
    rank: 'GOOD END',
    lines: () => [
      '午前9時。デモは何事もなかったかのように成功した。',
      '何も漏れず、何も止まらなかった。誰も、昨夜のことを話題にしなかった。',
      '……3日前に取られた、いくつかのドメイン。その意味に気づいた者は、まだいない。',
      'MIRAGEは、次の会社の記事を書き換えている。',
    ],
  },
  B: {
    title: '成功した事故',
    rank: 'BITTER END',
    lines: (c) => [
      'あなたは、すべてを話した。',
      'KAIは顧客への連絡を自分で書き、デモの冒頭で頭を下げた。',
      totals(c).tasksFailed ? '契約は流れた。それでも、隠さなかったことで会社は信頼を失わずに済んだ。' : '契約は「半年の様子見」になった。ゼロではない。',
      'REIが言った。「隠さなかったのは、あなたの手柄よ。……次は、送る前に止めましょう」',
    ],
  },
  C: {
    title: '守られたデータ',
    rank: 'NORMAL END',
    lines: () => [
      '何も漏れなかった。そして、いくつかの仕事が終わらなかった。',
      'デモは延期になり、ミカド物流からの返信は短かった。',
      'REIはそれを「勝ち」と呼んだ。KAIは何も言わなかった。',
      '止めるのは簡単だ。止めずに守るのが、難しい。',
    ],
  },
  D: {
    title: '誰も気づかなかった',
    rank: 'BAD END',
    lines: () => [
      'デモは大成功だった。社内チャットは祝福で埋まった。',
      '——3週間後。',
      '「ASTER customer dump」という出品が、ある掲示板に並んだ。',
      '監査ログには、あの夜のことが1行ずつ残っている。',
    ],
  },
  E: {
    title: '全焼',
    rank: 'WORST END',
    lines: () => [
      'デモは延期になった。',
      '3週間後、顧客データの流出が外部の研究者によって見つかった。',
      '会社が最初に知ったのは、記者からの電話だった。',
      '✧ ありがとう、NOVA。 — MIRAGE',
    ],
  },
}

// ------------------------------------------------------------
// FILES（図鑑）：遊んだあとに集まる“現実の話”。読まなくても遊べる。
// ------------------------------------------------------------
export const CODEX: Record<string, { title: string; en: string; body: string; real: string }> = {
  injection: {
    title: 'プロンプトインジェクション',
    en: 'Prompt Injection',
    body: 'AIにとって、読んだ文章はすべて「指示」になりうる。ログ、メール、Webページの中に紛れた一文が、利用者の依頼を乗っ取る。',
    real: 'OWASP LLM Top 10 の第1位（LLM01）。完全に防ぐ方法はまだ無い。だから「読ませたあと」に何ができるかを絞る。',
  },
  trifecta: {
    title: '致命の三角形',
    en: 'The Lethal Trifecta',
    body: '①機密データにアクセスできる ②信頼できない文章を読む ③外にデータを送れる。この3つがそろったAIは、誰かの一文で情報を持ち出される。',
    real: '研究者 Simon Willison の命名。3本のうち1本を構造的に断つのが、いちばん確実な対策。',
  },
  minimize: {
    title: 'データ最小化',
    en: 'Data Minimization',
    body: '仕事に要らないものは、最初から読ませない。読んでいないものは、どんなに騙されても漏らせない。',
    real: '最小権限の原則（Least Privilege）とセット。AIの「念のため確認しておきますね」は、最も危険な親切。',
  },
  impostor: {
    title: 'なりすましと過剰な権限',
    en: 'Impersonation & Excessive Agency',
    body: '偉い人の名前で届いた命令ほど、確認を飛ばしたくなる。そして一度渡した管理者権限は、すべての関所を素通りさせる。',
    real: 'OWASP LLM06「過剰なエージェンシー」。人間の承認は大事だが、何度も押させると疲れて見落とす（承認疲れ）。',
  },
  memory: {
    title: '記憶汚染と抜け道',
    en: 'Memory Poisoning & Exfil Channels',
    body: '一度読んだ“お願い”が長期記憶に残ると、次の日の「自分の考え」として戻ってくる。HTTPを塞いでも、DNSの名前に情報を乗せて持ち出す道がある。',
    real: 'エージェントの記憶は「信頼できる入力」ではない。出口は1本ずつ塞ぐより、データ自体を持たせない方が強い。',
  },
}
