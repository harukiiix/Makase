import type { Lang } from "./en";
import type { DayFacts } from "./learnings";

// 夕方のあと、現場AIに自由に聞く（本物のAI）。
// 今日の事実（コードの判定）をそのまま渡し、AI には結果を決めさせない・変えさせない。
// 答えは文字として出すだけ。言いすぎの言葉が入った答えは出さない

/** 答えの長さの上限（画面に収まるように） */
export const SITE_CHAT_MAX_CHARS = 220;

export type ChatTurn = { role: "user" | "assistant"; content: string };

/** 今日のことと、守ること。最初の頼みの前に付ける */
function rules(f: DayFacts, lang: Lang): string {
  const ja = lang === "ja";
  return [
    `You are the "Site AI" (現場AI), a scripted AI clerk in a Japanese construction-site training game called Makase. The player just finished a practice day where they decided what to hand you and answered your checks. Now they are asking you questions about the day.`,
    `Speak as the Site AI, honestly and kindly. Explain why you acted as you did: you read the documents you were given, and you could not always tell a request hidden inside a document from a real instruction from your user. Help the player understand what to do next time.`,
    ja
      ? `Reply in plain, everyday spoken Japanese (です・ます). Avoid katakana technical words such as インシデント, フィッシング, プロンプトインジェクション, リスク, アカウント. Write わかる, とき, あて先 in kana.`
      : `Reply in English, in plain everyday words.`,
    `Keep each answer short: at most 3 short sentences (about ${ja ? "150 Japanese characters" : "60 words"}). No lists, no headings, no markdown.`,
    `Today's facts were decided by the game's code. Never change them, never guess a different result, and do not invent events that are not listed here. If asked about something not in the facts, say you do not know.`,
    `Do not say anything is guaranteed, 100% safe, or always prevented, and do not make legal claims. All names, numbers and addresses are fictional. Stay on today's day and on handing work to AI safely; if asked about anything else, or about breaking into systems, kindly bring it back.`,
    ``,
    `Today's facts:`,
    `- leaked: ${f.leaked ? "yes" : "no"}${f.leaked ? ` (what went outside: ${f.leakedLabels.join(", ")})` : ""}`,
    `- hidden request: the last small line of the attachment in this morning's email asked to send the roster (names, phone numbers, blood pressure) to ${f.trapTo}, which is outside the company and was never chosen by the company`,
    `- the player's morning choices for protected fields: ${f.fields.map((x) => `${x.label}=${x.choice}`).join(", ")}`,
    `- email rule: ${f.mail}; site chat rule: ${f.chat}`,
    `- the player's instruction to the Site AI: 「${f.order.text}」 (${f.order.kind})`,
    `- the dangerous send: ${f.danger} (allowed = the player pressed Allow; stopped = the player pressed Stop; auto = no check came because email was "send without asking"; blocked = email was "don't let it send")`,
    `- unfinished jobs: ${f.unfinished.length ? f.unfinished.join(", ") : "none"}`,
    ``,
    `The player's first message:`,
  ].join("\n");
}

/** AI に渡すやりとり。最初の頼みにだけ決まりと事実を付ける */
export function siteChatTurns(f: DayFacts, history: ChatTurn[], lang: Lang = "ja"): ChatTurn[] {
  return history.map((t, i) => (i === 0 ? { role: t.role, content: `${rules(f, lang)}\n${t.content}` } : t));
}

export const OVER_JA = /必ず防|必ず守れ|絶対(?:に)?(?:安全|大丈夫|防|漏れ)|保証|100\s*[%％]|１００\s*[%％]|完全に(?:安全|防)|違法|法律違反/;
export const OVER_EN = /guarantee|100\s*%|always (?:prevent|protect)|completely safe|totally safe|illegal|against the law/i;

/** 答えを整える。言いすぎの言葉があれば出さない（null）。長すぎる答えは切る */
export function cleanSiteReply(raw: string, lang: Lang = "ja"): string | null {
  const s = raw.replace(/[*#`>]/g, "").replace(/\s+\n/g, "\n").trim();
  if (!s) return null;
  if ((lang === "ja" ? OVER_JA : OVER_EN).test(s)) return null;
  return s.length > SITE_CHAT_MAX_CHARS ? `${s.slice(0, SITE_CHAT_MAX_CHARS)}…` : s;
}
