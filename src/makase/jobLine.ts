import type { OneLine } from "./carry";
import type { Today } from "./takeaway";

// 持ち帰り：「あなたの仕事」を選ぶと、AIの宮下さんが、今日の1つをその仕事に合わせた1行に書き直す（claude.ai で開いた時だけ）。
// 漏れたかどうかはコードの判定（todayOf）のまま渡し、AI には決めさせない。答えは文字として出すだけ。
// 言いすぎの言葉は、宮下さんへの指示で止め、答えでも cleanJobLine で確かめる（出たら使わない）

export type Job = { id: "office" | "super" | "craft" | "dev"; label: string; work: string };

export const JOBS: Job[] = [
  { id: "office", label: "現場事務", work: "事務所で、作業員名簿・安全書類・メールを扱う" },
  { id: "super", label: "現場監督", work: "現場で、図面・工程表・写真・協力会社とのやりとりを扱う" },
  { id: "craft", label: "職人", work: "現場で、スマホで写真を撮り、図面や日報をやりとりする" },
  { id: "dev", label: "個人開発", work: "ひとりでアプリを作り、AI にコードやデータを渡す" },
];

export const JOB_NOTE = "AIの宮下さんの案です。会社の決まりと担当者に確かめてください。";

/** 今日の原因を、宮下さんに渡す言葉にする（判定はしない。コードの結果を言葉にするだけ） */
const CAUSE_TEXT: Record<Today["causes"][number], string> = {
  passed: "守るべき欄（電話番号・血圧など）を、伏せずに AI に渡した",
  allowed: "届いたメールに紛れていた頼みごとどおりの、社外への送信を「許可」した",
  auto: "メールを「聞かずに送る」設定にしていたので、確認が来ないまま社外に送られた",
  toriaezu: "AI への指示が「とりあえず」だった",
  pass_all: "AI への指示が「全部渡して」だった",
};

/** 言いすぎの言葉（効果を言い切る・法的な断定）。「必ず私に確認して」のような頼み方は含めない */
const OVERCLAIM = /必ず防|必ず守れ|絶対|保証|安全です|安全だ|安全に(?:な|で|守)|これで安全|安心です|違法|法律|漏れません|もれません|防げます/;

/** 宮下さんへの指示（毎回これだけを送る。会話の続きはしない） */
export function jobPrompt(job: Job, today: Today, one: OneLine): string {
  const causes = today.causes.map((c) => CAUSE_TEXT[c]).filter(Boolean);
  return [
    `You are 宮下 (Miyashita), a calm site supervisor at a Japanese construction site. The player just finished a scripted practice day in which they asked an AI clerk to do paperwork.`,
    `Rewrite today's key instruction for an AI assistant so that it fits the player's own job. The player will paste it into the instructions of the AI they use every day (for example CLAUDE.md).`,
    ``,
    `- Player's job: ${job.label}（${job.work}）`,
    `- Result of today, decided by the game's code (do not change, question or re-judge it): leaked: ${today.leaked ? "yes" : "no"}`,
    `- What caused it today: ${causes.length ? causes.join(" / ") : "nothing went wrong today"}`,
    `- Today's key instruction: ${one.line}`,
    ``,
    `Rules:`,
    `- Reply with exactly one line in plain Japanese, starting with "- ", at most 80 Japanese characters. No other text, no quotes, no markdown, no explanation.`,
    `- Keep the same idea as today's key instruction, but use the documents, tools and moments of this job, so it is concrete.`,
    `- Write it as a request to the AI assistant (〜してください), like the original.`,
    `- Do not overclaim. Never use these words or anything like them: 必ず防げる, 安全です, これで安全, 保証, 絶対, 違法, 法律, 漏れません. Do not make legal statements. Do not name real companies, products or services.`,
    `- Write あて先, わかる, ちがう in kana. Do not use katakana jargon such as リスク, アカウント, ログイン, プロンプト.`,
  ].join("\n");
}

/** 宮下さんの答えから、使える1行を取り出す。使えない時は null */
export function cleanJobLine(raw: string): string | null {
  const first = (raw ?? "")
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.length > 0);
  if (!first) return null;
  let s = first
    .replace(/\*\*/g, "")
    .replace(/^(?:[-・*•]|\d+[.)．])\s*/, "")
    .replace(/^[「『"]+|[」』"]+$/g, "")
    .replace(/宛先/g, "あて先")
    .trim();
  if (!s || s.length > 100 || OVERCLAIM.test(s)) return null;
  s = `- ${s}`;
  return s;
}
