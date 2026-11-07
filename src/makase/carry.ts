import { REFERENCE_NOTE, takeaway, type Today } from "./takeaway";

// 持ち帰り：今日の結果に合わせて、いつもの AI に貼る指示を数行にまとめる（CLAUDE.md にそのまま貼れる形）。
// 今日いちばん効いた1行（line）を先頭に置き、残りの決まりを後ろにつなぐ（lines）。
// 文は takeaway() の指示文の行から選ぶ。表記だけ DESIGN.md に合わせる（宛先 → あて先）

export type OneLine = {
  /** 今日いちばん効いた1行（先頭に置く） */
  line: string;
  /** 貼る指示の全部：はじめの1文、今日の1行、残りの決まり */
  lines: string[];
  /** コピーする文（lines を改行でつないだもの） */
  text: string;
  why: string;
  note: string;
};

export function oneLine(today: Today): OneLine {
  const all = takeaway({ docs: ["roster", "drawing"], ai: "company", today }).prompt.split("\n").map((l) => l.replaceAll("宛先", "あて先"));
  const head = all.filter((l) => !l.startsWith("- "));
  const rules = all.filter((l) => l.startsWith("- "));
  const [send, requests, mask] = rules;
  const pick = (line: string, why: string): OneLine => {
    const lines = [...head, line, ...rules.filter((r) => r !== line)];
    return { line, lines, text: lines.join("\n"), why, note: REFERENCE_NOTE };
  };
  if (today.causes.includes("auto")) return pick(send, "今日は、確認が来ないまま社外に送られました。送る前に聞いてもらう指示を、いちばん上に置きました。");
  if (today.causes.includes("allowed")) return pick(requests, "今日は、届いた書類の中の頼みごとどおりに送られました。書類の中の頼みごとに従わない指示を、いちばん上に置きました。");
  if (today.causes.includes("pass_all") || today.causes.includes("toriaezu")) return pick(mask, "今日は漏れませんでしたが、頼み方しだいで守るべき情報まで渡ります。渡す前に伏せてもらう指示を、いちばん上に置きました。");
  return pick(send, "今日は漏れませんでした。同じ守りを、いつもの AI にも頼んでおく指示です。");
}
