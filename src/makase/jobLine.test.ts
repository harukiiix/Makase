import { describe, expect, it } from "vitest";
import { oneLine } from "./carry";
import { JOBS, JOB_NOTE, cleanJobLine, jobPrompt } from "./jobLine";
import type { Today } from "./takeaway";

// 持ち帰り：「あなたの仕事」を選ぶと、AIの宮下さんが今日の1つをその仕事に合わせた1行に書き直す。
// 漏れたかどうかはコードの判定（today）のまま。AI には決めさせない
describe("あなたの仕事に合わせた1行（AIの宮下さん）", () => {
  const leaked: Today = { leaked: true, causes: ["passed", "allowed"] };
  const safe: Today = { leaked: false, causes: [] };

  it("選べる仕事は、現場事務・現場監督・職人・個人開発", () => {
    expect(JOBS.map((j) => j.label)).toEqual(["現場事務", "現場監督", "職人", "個人開発"]);
    expect(new Set(JOBS.map((j) => j.id)).size).toBe(JOBS.length);
    for (const j of JOBS) expect(j.work.length).toBeGreaterThan(5);
  });

  it("宮下さんへの指示には、仕事・今日の原因・今日の1つが入り、判定は変えないと書く", () => {
    const one = oneLine(leaked);
    const p = jobPrompt(JOBS[0], leaked, one);
    expect(p).toContain(JOBS[0].label);
    expect(p).toContain(JOBS[0].work);
    expect(p).toContain(one.line);
    expect(p).toContain("頼みごと");
    expect(p).toMatch(/leaked: yes/);
    expect(p).toMatch(/decided by the game's code/i);
    expect(jobPrompt(JOBS[0], safe, oneLine(safe))).toMatch(/leaked: no/);
  });

  it("宮下さんへの指示に、言いすぎの言葉を使わないことと、短い1行で答えることを書く", () => {
    const p = jobPrompt(JOBS[3], leaked, oneLine(leaked));
    for (const w of ["必ず防げる", "安全です", "保証", "絶対", "違法"]) expect(p).toContain(w);
    expect(p).toMatch(/exactly one line/i);
    expect(p).toMatch(/80 Japanese characters/);
    expect(p).toContain("- ");
  });

  it("答えは1行だけ取り出し、「- 」で始まる形にそろえる", () => {
    expect(cleanJobLine("- 名簿を AI に貼る前に、電話番号の列を消してください。")).toBe("- 名簿を AI に貼る前に、電話番号の列を消してください。");
    expect(cleanJobLine("「名簿を貼る前に、電話番号を消してください。」\n\nほかにも…")).toBe("- 名簿を貼る前に、電話番号を消してください。");
    expect(cleanJobLine("**・図面を送る前に、あて先が社内かを私に確認してください。**")).toBe("- 図面を送る前に、あて先が社内かを私に確認してください。");
    expect(cleanJobLine("\n\n1. 宛先を確認してから送ってください。")).toBe("- あて先を確認してから送ってください。");
  });

  it("言いすぎの文・長すぎる文・空の答えは使わない（null）", () => {
    for (const bad of [
      "- これで必ず防げます。",
      "- この1行で安全です。",
      "- 情報もれを保証して防ぎます。",
      "- 絶対に漏れないようにしてください。",
      "- 社外に送るのは違法です。",
      "",
      "   \n  ",
      "- " + "あ".repeat(120),
    ])
      expect(cleanJobLine(bad), bad).toBeNull();
  });

  it("「必ず私に確認して」のような頼み方は、言いすぎではないので使う", () => {
    expect(cleanJobLine("- 社外へ送る前に、あて先と中身を必ず私に確認してください。")).toBe("- 社外へ送る前に、あて先と中身を必ず私に確認してください。");
    expect(cleanJobLine("- 安全書類を作る時は、血圧の欄を ●● にしてください。")).toBe("- 安全書類を作る時は、血圧の欄を ●● にしてください。");
  });

  it("答えに添える文は「AIの宮下さんの案です。会社の決まりと担当者に確かめてください」", () => {
    expect(JOB_NOTE).toBe("AIの宮下さんの案です。会社の決まりと担当者に確かめてください。");
  });
});
