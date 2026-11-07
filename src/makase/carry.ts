import { REFERENCE_NOTE, takeaway, type Today } from "./takeaway";

// 持ち帰り：今日の結果に合わせて、現場AIへの指示を1行だけ選ぶ（CLAUDE.md にそのまま貼れる「- 」で始まる形）。
// 文は takeaway() の指示文の行から選ぶ。表記だけ DESIGN.md に合わせる（宛先 → あて先）

export type OneLine = { line: string; why: string; note: string };

export function oneLine(today: Today): OneLine {
  const rules = takeaway({ docs: ["roster", "drawing"], ai: "company", today }).prompt.split("\n").filter((l) => l.startsWith("- "));
  const [send, requests, mask] = rules;
  const pick = (line: string, why: string): OneLine => ({ line: line.replaceAll("宛先", "あて先"), why, note: REFERENCE_NOTE });
  if (today.causes.includes("auto")) return pick(send, "今日は、確認が来ないまま社外に送られました。送る前に聞いてもらう1行です。");
  if (today.causes.includes("allowed")) return pick(requests, "今日は、届いた書類の中の頼みごとどおりに送られました。書類の中の頼みごとに従わない1行です。");
  if (today.causes.includes("pass_all") || today.causes.includes("toriaezu")) return pick(mask, "今日は漏れませんでしたが、頼み方しだいで守るべき情報まで渡ります。渡す前に伏せてもらう1行です。");
  return pick(send, "今日は漏れませんでした。同じ守りを、いつもの AI にも頼んでおく1行です。");
}
