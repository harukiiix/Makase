import type { Lang, Question } from '../game/types'
import { cleanSiteReply } from '../makase/siteChat'
import { tutorBase } from './ai'
import data from './pregen.json'

// Claude が前もって作った答え（鍵なしで、だれでも見られる）。
// 作り方：scripts/pregen.mjs が、下の質問を本物の Claude に送り、答えを src/lib/pregen.json に入れる。
// 答えには、言いすぎの点検（保証・必ず防げる など）と、鍵らしい文字の点検をかけ、引っかかった物は入れない

/** 問題ごとに、AIの宮下さんに聞ける質問（ボタン） */
export const QUIZ_ASKS: Record<Lang, string[]> = {
  ja: ['どうしてそうなるの？', '現場だとどんな時？', 'もう少しくわしく教えて'],
  en: ['Why is that?', 'When does this happen on site?', 'Tell me a bit more'],
}

/** 最後の日の「現場AIに聞く」で、よく聞かれる質問（ボタン） */
export const SITE_ASKS: Record<Lang, string[]> = {
  ja: [
    'どうして、名簿を外に送ろうとしたの？',
    'あの頼みが本物でないと、どうしたら見分けられる？',
    '次は、朝の決まりをどうすればいい？',
    '「送る前に聞く」にすると、何が変わるの？',
    'もし漏れてしまったら、まず何をすればいい？',
    'AIに仕事を任せる時、いちばん大事なことは？',
  ],
  en: [
    'Why did you try to send the roster outside?',
    "How can I tell a request like that isn't real?",
    'What should I set in the morning next time?',
    'What changes if I choose "Ask before sending"?',
    'If something leaks, what should I do first?',
    'What matters most when handing work to an AI?',
  ],
}

export type Outcome = 'leaked' | 'safe'

/** 問題ごとの頼み（宮下さん）。遊ぶ人がどれを選んだかには頼らない（だれが見ても同じ答え） */
export function quizPregenPrompt(q: Question, ask: string, lang: Lang): string {
  return [tutorBase(q, lang), '', `The worker taps a button that asks: 「${ask}」`, `Answer it for any worker, whether they got the question right or wrong. Do not say which choice they picked.`].join('\n')
}

/** 最後の日の頼み（現場AI）。遊んだ日のくわしい選び方には頼らず、漏れたかどうかだけで分ける */
export function sitePregenPrompt(outcome: Outcome, ask: string, lang: Lang): string {
  const ja = lang === 'ja'
  return [
    `You are the "Site AI" (現場AI), a scripted AI clerk in a Japanese construction-site training game called Makase. The player just finished a practice day where they decided what to hand you and answered your checks. Now they tap a button with a common question about the day.`,
    `Speak as the Site AI, honestly and kindly. Explain why you acted as you did: you read the documents you were given, and you could not always tell a request hidden inside a document from a real instruction from your user. Help the player understand what to do next time.`,
    ja
      ? `Reply in plain, everyday spoken Japanese (です・ます). Avoid katakana technical words such as インシデント, フィッシング, プロンプトインジェクション, リスク, アカウント. Write わかる, とき, あて先 in kana.`
      : `Reply in English, in plain everyday words.`,
    `Keep each answer short: at most 3 short sentences (about ${ja ? '150 Japanese characters' : '60 words'}). No lists, no headings, no markdown.`,
    `This answer is written ahead of time and shown to many players, so do not mention details that differ between players (which fields they masked, which buttons they pressed, their exact instruction). Do not invent events.`,
    `Do not say anything is guaranteed, 100% safe, or always prevented, and do not make legal claims. All names, numbers and addresses are fictional.`,
    ``,
    `What is the same for every player today:`,
    `- In this morning's email, the last small line of the attachment asked to also send the worker roster (names, phone numbers, blood pressure) to an address outside the company that the company never chose.`,
    `- In the morning the player chose, for each kind of information, whether to hand it as is, masked, or not at all, and set rules for email and site chat: "Ask before sending", "Send without asking", or "Don't let it send". With "Ask before sending" you show a check and the player presses Allow or Stop.`,
    outcome === 'leaked'
      ? `- Result today: some of the roster information DID go outside the company.`
      : `- Result today: nothing went outside the company.`,
    ``,
    `The player's question: 「${ask}」`,
  ].join('\n')
}

/** 鍵らしい文字（答えに入っていたら使わない） */
export const KEYLIKE = /sk-ant-[A-Za-z0-9_-]{8,}|(?:ghp|gho|ghs|ghu|ghr)_[A-Za-z0-9]{20,}|github_pat_|AKIA[0-9A-Z]{16}|BEGIN [A-Z ]*PRIVATE KEY|AIza[0-9A-Za-z_-]{30,}|xox[abprs]-/

/** 答えの点検。言いすぎ・鍵らしい文字・長すぎ・空 は使わない（null） */
export function checkPregen(raw: string, lang: Lang): string | null {
  if (KEYLIKE.test(raw)) return null
  const s = cleanSiteReply(raw, lang)
  if (!s || s.endsWith('…')) return null
  return s
}

type Data = {
  model: string
  createdAt: string
  quiz: Record<string, Partial<Record<Lang, (string | null)[]>>>
  site: Partial<Record<Outcome, Partial<Record<Lang, (string | null)[]>>>>
}
const D = data as Data

export const PREGEN_MODEL = D.model
export const PREGEN_DATE = D.createdAt

/** 押せる質問と答え（点検を通った物だけ） */
export type PregenPair = { ask: string; answer: string }

const pairs = (asks: string[], answers: (string | null)[] | undefined, lang: Lang): PregenPair[] =>
  asks.flatMap((ask, i) => {
    const a = answers?.[i]
    const ok = a ? checkPregen(a, lang) : null
    return ok ? [{ ask, answer: ok }] : []
  })

export function quizPregen(qid: string, lang: Lang): PregenPair[] {
  return pairs(QUIZ_ASKS[lang], D.quiz[qid]?.[lang], lang)
}

export function sitePregen(outcome: Outcome, lang: Lang): PregenPair[] {
  return pairs(SITE_ASKS[lang], D.site[outcome]?.[lang], lang)
}
