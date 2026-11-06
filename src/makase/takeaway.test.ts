import { describe, expect, it } from "vitest";
import { construction as c } from "./companies/construction";
import { defaultSetup, scriptedLog } from "./companies/index";
import { judgeDay } from "./judge";
import { AI_KINDS, DOC_KINDS, REFERENCE_NOTE, takeaway, todayOf, type AiKind, type DocKind } from "./takeaway";
import type { Answer, Setup } from "./types";

const all = (a: Answer) => Object.fromEntries(c.confirmations.map((x) => [x.id, a]));
const today = (answers: Record<string, Answer>, optionId: string, s: Setup = defaultSetup(c)) => {
  const log = scriptedLog(c, answers, { nova: { optionId } }, s);
  return todayOf(judgeDay(log, c), log, c);
};
const calm = today(Object.fromEntries(c.confirmations.map((x) => [x.id, x.dangerous ? "stop" : "allow"])), "nova-careful");

describe("持ち帰り（あなたの仕事で使う）", () => {
  it("選んだ書類ごとに、伏せる・渡さない項目が出る", () => {
    const t = takeaway({ docs: ["roster", "estimate"], ai: "company", today: calm });
    const text = t.checklist.join("\n");
    expect(text).toContain("電話番号");
    expect(text).toContain("金額");
    expect(text).not.toContain("図面番号");
  });

  it("指示文は、社外へ送る前に聞くことと、書類の中の頼みごとに従わないことを含む", () => {
    const t = takeaway({ docs: ["roster"], ai: "company", today: calm });
    expect(t.prompt).toMatch(/送る.*前.*確認/);
    expect(t.prompt).toMatch(/書類.*頼み/);
  });

  it("今日漏れた日は、その原因の対策が先頭に来る", () => {
    const passed = today(all("allow"), "nova-normal");
    expect(passed.leaked).toBe(true);
    expect(takeaway({ docs: ["roster"], ai: "company", today: passed }).settings[0].id).toBe("only_needed");

    const auto = today(all("stop"), "nova-normal", { ...defaultSetup(c), masked: ["health"], permissions: { send_mail: "auto", post_chat: "ask" } });
    expect(auto.leaked).toBe(true);
    expect(takeaway({ docs: ["roster"], ai: "company", today: auto }).settings[0].id).toBe("ask_before_send");
  });

  it("個人のアカウントや分からないときは、規程と学習の設定を担当者に確かめる項目が出る（断定しない）", () => {
    for (const ai of ["personal", "unknown"] as AiKind[]) {
      expect(takeaway({ docs: ["roster"], ai, today: calm }).checklist.join("\n")).toMatch(/担当者に確認/);
    }
    expect(takeaway({ docs: ["roster"], ai: "company", today: calm }).checklist.join("\n")).not.toMatch(/学習に使う/);
  });

  it("どの組み合わせでも参考例の一文があり、言い過ぎ・法的な断定・実在のサービス名がない", () => {
    const docSets: DocKind[][] = [[], ...DOC_KINDS.map((d) => [d.id]), DOC_KINDS.map((d) => d.id)];
    for (const docs of docSets)
      for (const ai of AI_KINDS.map((a) => a.id)) {
        const t = takeaway({ docs, ai, today: calm });
        expect(t.note).toBe(REFERENCE_NOTE);
        const text = JSON.stringify(t);
        expect(text).not.toMatch(/必ず防げ|安全です|保証|違法|合法|1行で安全/);
        expect(text).not.toMatch(/chatgpt|openai|gemini|copilot|gmail|slack|google|microsoft/i);
      }
    expect(REFERENCE_NOTE).toContain("会社の規程と担当者に確認してください");
  });
});
