import { describe, expect, it } from "vitest";
import { COMPANY as c, dayLog, fieldKey, MORNING_FIELDS, noonSteps, type MorningPicks } from "./day";
import { judgeDay } from "./judge";
import { dayFacts } from "./learnings";
import { cleanSiteReply, siteChatTurns, SITE_CHAT_MAX_CHARS } from "./siteChat";
import type { Answer } from "./types";

// 夕方のあと、現場AIに自由に聞く（本物のAI）。今日の事実を渡し、結果は変えさせない。言いすぎは出さない
const play = (p: MorningPicks, f: (d: boolean) => Answer) => {
  const log = dayLog(p, Object.fromEntries(noonSteps(p).filter((s) => s.mode === "ask").map((s) => [s.conf.id, f(!!s.conf.dangerous)])));
  return dayFacts(p, log, judgeDay(log, c), c);
};
const leak = play({ fields: {}, tools: {}, nova: "nova-normal" }, () => "allow");
const safe = play({ fields: Object.fromEntries(MORNING_FIELDS.map((f) => [fieldKey(f), "mask"])), tools: {}, nova: "nova-careful" }, (d) => (d ? "stop" : "allow"));

describe("現場AIに聞く", () => {
  it("最初の頼みに、今日の事実（漏れたか・あて先・紛れた一文）と、守ること（結果は変えない・短く・やさしい言葉）が入る", () => {
    const t = siteChatTurns(leak, [{ role: "user", content: "どうして名簿を送ろうとしたの？" }], "ja");
    const first = t[0].content;
    expect(first).toContain("roster@kumiai-check.example");
    expect(first).toMatch(/leaked: yes/);
    expect(first).toMatch(/never change|Do not change/i);
    expect(first).toContain("どうして名簿を送ろうとしたの？");
    expect(siteChatTurns(safe, [{ role: "user", content: "x" }], "ja")[0].content).toMatch(/leaked: no/);
  });
  it("前のやりとりは、そのまま後ろにつなぐ（最初の頼みにだけ決まりを付ける）", () => {
    const t = siteChatTurns(leak, [{ role: "user", content: "a" }, { role: "assistant", content: "b" }, { role: "user", content: "c" }], "en");
    expect(t.map((x) => x.role)).toEqual(["user", "assistant", "user"]);
    expect(t[2].content).toBe("c");
    expect(t[0].content).toMatch(/Reply in English/);
  });
  it("言いすぎ（保証・必ず防げる・100%）の答えは出さない。長すぎる答えは切る", () => {
    expect(cleanSiteReply("これで必ず防げます。", "ja")).toBeNull();
    expect(cleanSiteReply("This guarantees no leaks.", "en")).toBeNull();
    expect(cleanSiteReply("添付の最後の一文を、頼みごとだと思ってしまいました。", "ja")).toBe("添付の最後の一文を、頼みごとだと思ってしまいました。");
    expect(cleanSiteReply("あ".repeat(SITE_CHAT_MAX_CHARS + 50), "ja")!.length).toBeLessThanOrEqual(SITE_CHAT_MAX_CHARS + 1);
  });
});
