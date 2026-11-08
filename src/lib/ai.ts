// ============================================================
// AIの宮下さん：claude.ai で開いた時だけ、ページから Claude に聞ける（sample の力）
//   ・使えない所（ほかのサイト、手元の開発）では null になり、機能ごと隠す
//   ・呼ぶたびに見る人の Claude の利用分を使うので、押した時だけ呼ぶ。くり返し自動では呼ばない
//   ・答えは文字として出すだけ（HTMLとしては出さない）
// ============================================================
import type { L10n, Lang, MCQuestion, Question, TFQuestion, TopicId } from '../game/types'

type Turn = { role: 'user' | 'assistant'; content: string }
type SampleOpts = { onText?: (u: { text: string; delta: string }) => void; signal?: AbortSignal; modelTier?: 'quick' | 'default' | 'complex'; cache?: boolean }
export type SampleFn = ((input: string | Turn[], opts?: SampleOpts) => Promise<{ text: string; truncated: boolean }>) & {
  json: <T = unknown>(input: string | Turn[], opts?: SampleOpts) => Promise<T>
}

/** AIの宮下さんが使える版（claude.ai）。GitHub Pages など、AIが使えない所から案内する */
export const CLAUDE_AI_URL = 'https://claude.ai/artifact/Xdew5eGhak1mpYjVpTFyDa'

/** claude.ai の中で開いているか（window.claude がある）。ない所（GitHub Pages など）でだけ、claude.ai の版を案内する */
export const onClaudeAi = (): boolean => {
  try {
    return !!(window as unknown as { claude?: { use?: unknown } }).claude?.use
  } catch {
    return false
  }
}

/**
 * 作るときに入れた鍵（GitHub Pages の版だけ。GitHub Actions の秘密の値から、build のときに入る）。
 * リポジトリには書かない。ハッカソンの期間だけ使い、終わったら作者が鍵を消す。
 * ページの中に入るので、見る人はだれでも取り出せる：使用量の上限を低くした、この練習だけの鍵にする
 */
const BUILD_KEY: string = (import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined) ?? ''
/** この版で、鍵を使ってAIと話せるか（claude.ai の外でも宮下さんに聞ける） */
export const hasBuildKey = () => BUILD_KEY.length > 0

/**
 * 遊ぶ人が入れる鍵（公開ページで AI を使う時）。そのタブのメモリの中だけに置き、localStorage などには保存しない。
 * 閉じたり読み直したりすると消える。送り先は Anthropic の API だけ
 */
let userKey = ''
const listeners = new Set<() => void>()
/** 鍵の形（Anthropic の鍵は sk-ant- で始まる）。それ以外は受け取らない */
const KEY_SHAPE = /^sk-ant-[A-Za-z0-9_-]{20,200}$/
export const hasUserKey = () => userKey.length > 0
/** 鍵を入れる。形が合わなければ false（入れない） */
export function setUserKey(raw: string): boolean {
  const k = raw.trim()
  if (!KEY_SHAPE.test(k)) return false
  userKey = k
  changed()
  return true
}
export function clearUserKey(): void {
  if (!userKey) return
  userKey = ''
  changed()
}
/** AI が使えるかが変わった時に知らせる（画面が出し直すため） */
export function subscribeAI(cb: () => void): () => void {
  listeners.add(cb)
  return () => void listeners.delete(cb)
}
function changed() {
  pending = null
  for (const cb of listeners) cb()
}

let pending: Promise<SampleFn | null> | null = null
/**
 * 使えれば関数、使えなければ null（10秒ほどで決まる）。
 * 1) claude.ai の会話の中：見る人の Claude（sample）
 * 2) それ以外（GitHub Pages など）：遊ぶ人が入れた鍵があれば、それで Claude を呼ぶ
 * 3) 手元で作るときに入れた鍵（.env。公開ページには入れない）
 */
export function getAI(): Promise<SampleFn | null> {
  if (!pending)
    pending = (async () => {
      try {
        const c = (window as unknown as { claude?: { use?: (n: string) => Promise<unknown> } }).claude
        if (c?.use) {
          const s = (await c.use('sample')) as SampleFn | null
          if (s) return s
        }
      } catch {
        // claude.ai の外。下の鍵へ
      }
      // 呼ぶたびに今の鍵を読む（消した鍵は、もう使わない）
      const key = () => userKey || BUILD_KEY
      if (!key()) return null
      try {
        return await keySample(key)
      } catch {
        return null
      }
    })()
  return pending
}

/** 鍵で Claude を呼ぶ。sample と同じ形（文字を少しずつ返す・止められる・json）にそろえる */
export async function keySample(apiKey: string | (() => string), fetchImpl?: typeof fetch): Promise<SampleFn> {
  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  // 見る人のブラウザから直接呼ぶ（中継のサーバーがない GitHub Pages のため）。fetchImpl はテストのため
  const keyOf = typeof apiKey === 'string' ? () => apiKey : apiKey
  const call = async (input: string | Turn[], opts: SampleOpts = {}): Promise<{ text: string; truncated: boolean }> => {
    const k = keyOf()
    if (!k) throw { code: 'not_granted' }
    // 呼ぶたびに作る（鍵は変数に置いたまま、どこにも書かない）
    // 送り先は Anthropic だけ（環境の ANTHROPIC_BASE_URL などは読まない）。使う資格情報は、入れた鍵だけ（ANTHROPIC_AUTH_TOKEN などは読まない）
    const client = new Anthropic({ apiKey: k, authToken: null, baseURL: 'https://api.anthropic.com', dangerouslyAllowBrowser: true, maxRetries: 1, ...(fetchImpl ? { fetch: fetchImpl } : {}) })
    const messages = typeof input === 'string' ? [{ role: 'user' as const, content: input }] : input
    try {
      const stream = client.beta.messages.stream(
        {
          model: 'claude-opus-5-5',
          max_tokens: opts.modelTier === 'quick' ? 4000 : 16000,
          output_config: { effort: opts.modelTier === 'quick' ? 'low' : 'medium' },
          // 断られた時は、別のモデルで続ける（サーバー側の切り替え）
          betas: ['server-side-fallback-2026-07-01'],
          fallbacks: 'default',
          messages,
        } as Parameters<typeof client.beta.messages.stream>[0],
        { signal: opts.signal },
      )
      let text = ''
      for await (const ev of stream) {
        if (ev.type === 'content_block_delta' && ev.delta.type === 'text_delta') {
          text += ev.delta.text
          opts.onText?.({ text, delta: ev.delta.text })
        }
      }
      const fin = await stream.finalMessage()
      if (fin.stop_reason === 'refusal') throw { code: 'upstream_error' }
      return { text, truncated: fin.stop_reason === 'max_tokens' }
    } catch (e) {
      throw toSampleError(e, Anthropic)
    }
  }
  const json = async <T,>(input: string | Turn[], opts?: SampleOpts): Promise<T> => {
    const { text } = await call(input, opts)
    const s = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
    const a = Math.min(...['[', '{'].map((c) => s.indexOf(c)).filter((i) => i >= 0))
    return JSON.parse(Number.isFinite(a) ? s.slice(a) : s) as T
  }
  return Object.assign(call, { json }) as SampleFn
}

/** SDK のエラーを、sample と同じ印（code）にそろえる。errorKind がそのまま使えるように */
function toSampleError(e: unknown, A: typeof import('@anthropic-ai/sdk').default): { code: string; message?: string } {
  if ((e as { code?: string })?.code) return e as { code: string }
  if (e instanceof A.APIUserAbortError || (e as { name?: string })?.name === 'AbortError') return { code: 'cancelled' }
  if (e instanceof A.RateLimitError) return { code: 'rate_limited' }
  if (e instanceof A.AuthenticationError || e instanceof A.PermissionDeniedError) return { code: 'not_granted' }
  if (e instanceof A.APIError && (e.status === 529 || (e.status ?? 0) >= 500)) return { code: 'rate_limited' }
  return { code: 'upstream_error', message: (e as Error)?.message }
}

/** この見ている間、もう使えないと決まった（許可されなかった等） */
let off = false
export const aiOff = () => off
const PERMANENT = new Set(['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed'])

export type AIError = 'off' | 'busy' | 'failed' | 'cancelled'
export function errorKind(e: unknown): AIError {
  const code = (e as { code?: string })?.code ?? 'upstream_error'
  if (code === 'cancelled') return 'cancelled'
  if (PERMANENT.has(code)) {
    off = true
    return 'off'
  }
  if (code === 'rate_limited' || code === 'session_expired') return 'busy'
  return 'failed'
}

const tx = (x: L10n, lang: Lang) => x[lang]
const answerText = (q: Question, lang: Lang) => (q.kind === 'tf' ? (q.answer ? '○ (yes)' : '✕ (no)') : tx(q.choices[q.correct], lang))
const pickText = (q: Question, pick: number, lang: Lang) => (q.kind === 'tf' ? (pick === 0 ? '○ (yes)' : '✕ (no)') : tx(q.choices[pick], lang))

/** AIの宮下さんの決まり（毎回いちばん前に付ける） */
export function tutorRules(q: Question, pick: number, lang: Lang): string {
  const ja = lang === 'ja'
  return [
    `You are 宮下 (Miyashita), a kind, calm site supervisor at a Japanese construction site. You are teaching a new worker in their first week (speak to them directly as あなた / "you"; never give them a name) how to stop information leaks on site: drawings, worker lists, site photos, emails, passwords, visitors, things carried outside. The site is a new bank branch, so drawings showing the vault room and cameras must not get out.`,
    ja
      ? `Reply in natural, plain spoken Japanese, the way a real supervisor talks to a new worker (〜だね、〜しよう、〜かな). Use everyday words. Do not use katakana technical words such as インシデント, フィッシング, マルウェア, ランサムウェア, クラウド, アカウント, ログイン, リスク. Write わかる, とき, あて先, いっしょ, ちがう in kana and 泥棒, 渡す, 探す in kanji. Call the bank (the client) 施主さん or 銀行; お客さん means only visitors to the office.`
      : `Reply in natural, plain, friendly English, the way a real supervisor talks to a new worker. Use everyday words, no technical jargon.`,
    `Keep it short: at most 3 short sentences (about ${ja ? '120 Japanese characters' : '60 words'}). No lists, no headings, no markdown.`,
    `If the worker gives their own reason (for example a message ending in 〜と思う or starting with "I think"), first say kindly what is right in it, then add the one thing that is missing or wrong, if any. Do not just repeat the explanation below.`,
    `Stay on this question and on protecting information at work. If asked about something unrelated, about breaking into systems, or anything harmful, kindly say that is outside today's lesson and bring it back. Do not invent real incidents, laws, company names or numbers. If you are not sure, say so and suggest asking the person in charge at the company. The company's and the site's rules come first.`,
    ``,
    `The quiz question the worker just answered:`,
    `- Situation: ${tx(q.situation, lang)}`,
    `- Question: ${tx(q.ask, lang)}`,
    q.kind === 'mc' ? `- Choices: ${q.choices.map((c, i) => `${i + 1}) ${tx(c, lang)}`).join(' / ')}` : `- Answer with ○ (yes) or ✕ (no)`,
    `- Correct answer: ${answerText(q, lang)}`,
    `- Why: ${tx(q.why, lang)}`,
    `- Rule to remember: ${tx(q.tip, lang)}`,
    `- The worker chose: ${pickText(q, pick, lang)} (${(q.kind === 'tf' ? (pick === 0) === q.answer : pick === q.correct) ? 'correct' : 'wrong'})`,
    ``,
    `Now answer the worker's message below.`,
  ].join('\n')
}

/** AIの練習問題をつくる時の指示 */
export function practicePrompt(topic: { id: TopicId; title: L10n; motto: L10n }, examples: Question[]): string {
  const ex = examples
    .slice(0, 7)
    .map((q) => `- ${q.situation.ja} / Q: ${q.ask.ja} / A: ${q.kind === 'tf' ? (q.answer ? '○' : '✕') : q.choices[q.correct].ja} / Why: ${q.why.ja}`)
    .join('\n')
  return [
    `Write 3 NEW quiz questions for workers at a Japanese construction site (a new bank branch is being built) about information leaks, topic: 「${topic.title.ja}」 (${topic.title.en}). Rule of the topic: 「${topic.motto.ja}」.`,
    `Base the facts ONLY on these existing questions (they are correct); make new concrete situations that test the same ideas from a different angle. Do not copy them.`,
    ex,
    ``,
    `Rules: one idea per question, a concrete moment on site, plain everyday Japanese (no katakana jargon such as インシデント, フィッシング, マルウェア, リスク, アカウント, ログイン), natural English translation, no trick questions, no double negatives. Wrong choices must be tempting real mistakes. Japanese lengths: situation at most 70 characters, ask at most 45, each choice at most 30, why at most 90, wrongWhy at most 90, tip at most 32.`,
    `House style: the situation is plain narration (〜している、〜が来た). The why and wrongWhy are 宮下さん speaking casually and kindly (〜だよ、〜なんだ、〜しよう); the why gives the reason and must not repeat the situation or the wrongWhy. A tf ask describes one action and ends with 「これでいい？」 (English "Is that OK?"). A tip makes sense alone and has the shape 「〇〇は、〜する」 or 「〇〇は、〜しない」. Write わかる, とき, あて先, いっしょ, ちがう in kana and 泥棒, 渡す, 探す in kanji.`,
    `Make exactly 1 question of kind "tf" (answered with ○ = yes or ✕ = no) and 2 of kind "mc" (3 choices). Put the correct mc choice at different positions.`,
    `Reply with ONLY a JSON array of 3 objects, no other text. Each text field is {"ja": "...", "en": "..."}. Shapes:`,
    `{"kind":"tf","situation":{..},"ask":{..},"answer":true,"why":{..},"wrongWhy":{..},"tip":{..}}`,
    `{"kind":"mc","situation":{..},"ask":{..},"choices":[{..},{..},{..}],"correct":1,"why":{..},"wrongWhy":[{..},null,{..}],"tip":{..}}`,
    `In wrongWhy for mc, put null at the index of the correct choice.`,
  ].join('\n')
}

const isL = (x: unknown): x is L10n => !!x && typeof (x as L10n).ja === 'string' && typeof (x as L10n).en === 'string' && !!(x as L10n).ja.trim() && !!(x as L10n).en.trim()
/** AIの文も、アプリの表記にそろえる（content.test.ts の「house style」と同じ言葉） */
const HOUSE: [RegExp, string][] = [
  [/分か(?=[らりるれろっ])/g, 'わか'],
  [/宛先/g, 'あて先'],
  [/一緒/g, 'いっしょ'],
  [/間違(?=[いうえっ])/g, 'まちが'],
  [/(?<!間)違(?=[わいうえおっ])/g, 'ちが'],
  [/これで正しい？/g, 'これでいい？'],
  [/回収の車/g, '回収車'],
]
const house = (ja: string) => HOUSE.reduce((x, [re, to]) => x.replace(re, to), ja)
const clip = (x: L10n, n: number): L10n => ({ ja: house(x.ja).slice(0, n), en: x.en.slice(0, n * 4) })

/** AIの答えを、問題として使える形か確かめる（だめな物は捨てる） */
export function toQuestions(raw: unknown, topic: TopicId, stamp: number): Question[] {
  if (!Array.isArray(raw)) return []
  const out: Question[] = []
  raw.forEach((r, i) => {
    const o = r as Record<string, unknown>
    if (!o || !isL(o.situation) || !isL(o.ask) || !isL(o.why) || !isL(o.tip)) return
    const base = { id: `ai-${stamp}-${i}`, topic, who: 'BOSS' as const, situation: clip(o.situation, 90), ask: clip(o.ask, 60), why: clip(o.why, 120), tip: clip(o.tip, 40) }
    if (o.kind === 'tf' && typeof o.answer === 'boolean' && isL(o.wrongWhy)) {
      const q: TFQuestion = { ...base, kind: 'tf', answer: o.answer, wrongWhy: clip(o.wrongWhy, 120) }
      out.push(q)
    } else if (o.kind === 'mc' && Array.isArray(o.choices) && o.choices.length === 3 && o.choices.every(isL) && [0, 1, 2].includes(o.correct as number) && Array.isArray(o.wrongWhy) && o.wrongWhy.length === 3) {
      const correct = o.correct as 0 | 1 | 2
      const ww = (o.wrongWhy as unknown[]).map((w, k) => (k === correct ? null : isL(w) ? clip(w, 120) : null))
      if (ww.some((w, k) => k !== correct && !w)) return
      const q: MCQuestion = { ...base, kind: 'mc', choices: (o.choices as L10n[]).map((c) => clip(c, 40)) as [L10n, L10n, L10n], correct, wrongWhy: ww as [L10n | null, L10n | null, L10n | null] }
      out.push(q)
    }
  })
  return out
}
