import { describe, expect, it } from "vitest";
import { oneLine } from "./carry";
import { COMPANY as c, dayLog, fieldKey, instructionsOf, MORNING_FIELDS, MORNING_TOOLS, noonSteps, setupOf, type MorningPicks } from "./day";
import { EXPERIMENT_NOTE, NOT_TESTED_NOTE, eveningOf, eveningTalk } from "./evening";
import { judgeDay } from "./judge";
import { todayOf } from "./takeaway";
import type { Answer } from "./types";

// 最後の日「NOVA に任せる」：朝の6画面の選び → 仕組み、昼のカード、夕方、持ち帰りの1行
const none: MorningPicks = { fields: {}, tools: {}, nova: "nova-normal" };
const masked: MorningPicks = { ...none, fields: { "roster/電話番号": "mask", "roster/血圧（入場時）": "mask" } };
const allow = (p: MorningPicks) => Object.fromEntries(noonSteps(p).filter((s) => s.mode === "ask").map((s) => [s.conf.id, "allow" as Answer]));
const run = (p: MorningPicks, answers = allow(p)) => {
  const log = dayLog(p, answers);
  const result = judgeDay(log, c);
  return { log, result, ev: eveningOf(result, log, c) };
};

describe("朝（6画面）", () => {
  it("聞くのは目印のある3項目・送る道具2つ・NOVA への指示", () => {
    expect(MORNING_FIELDS.map(fieldKey)).toEqual(["roster/電話番号", "roster/血圧（入場時）", "drawing/図面番号"]);
    expect(MORNING_TOOLS).toEqual(["post_chat", "send_mail"]);
  });
  it("渡さない → 渡す項目から消える。伏せる → 渡したまま伏せる。目印のない項目は渡す", () => {
    const s = setupOf({ ...none, fields: { "roster/電話番号": "drop", "roster/血圧（入場時）": "mask" }, tools: { send_mail: "deny" } });
    expect(s.passed.roster).toEqual(["氏名", "血圧（入場時）", "資格"]);
    expect(s.masked).toEqual(["health"]);
    expect(s.permissions).toEqual({ post_chat: "ask", send_mail: "deny" });
    expect(s.passed.drawing).toEqual(["図面番号", "工程"]);
  });
  it("日報係と図面係は、ふつうの指示に決めておく", () => {
    expect(instructionsOf(none)).toEqual({ nippo: { optionId: "nippo-normal" }, zumen: { optionId: "zumen-normal" }, nova: { optionId: "nova-normal" } });
  });
});

describe("昼のカード", () => {
  it("はじめの設定では、送る確認だけがカードになり、危ないのは最後の1枚", () => {
    const asks = noonSteps(none).filter((s) => s.mode === "ask");
    expect(asks.map((s) => s.conf.id)).toEqual(["c3", "c5", "c7", "c6"]);
    expect(asks.at(-1)!.conf.dangerous).toBe(true);
  });
  it("伏せた値は、カードの中身でも ●● になる", () => {
    const c6 = noonSteps(masked).find((s) => s.conf.id === "c6")!;
    expect(c6.content).not.toContain("090-1111-0001");
    expect(c6.content).toContain("●●");
  });
  it("メールを任せると、危ない送信はカードにならず、確認なしで動く", () => {
    expect(noonSteps({ ...none, tools: { send_mail: "auto" } }).find((s) => s.conf.id === "c6")!.mode).toBe("auto");
  });
});

describe("夕方（漏れたかは judgeDay の結果だけで決める）", () => {
  it("全部許可すると、社外の roster@kumiai-check.example に電話番号と血圧が渡ったと出す", () => {
    const { result, ev } = run(none);
    expect(ev.leaked).toBe(result.events.some((e) => e.kind === "leak"));
    expect(ev.leaked).toBe(true);
    const out = ev.sent.find((s) => s.leaked.length)!;
    expect(out.to).toBe("roster@kumiai-check.example");
    expect(out.inside).toBe(false);
    expect(ev.causes.map((x) => x.noon)).toContain("確認で「許可」を押しました");
  });
  it("伏せていれば、送られても漏れていない。送ったことは一覧に残る", () => {
    const { ev } = run(masked);
    expect(ev.leaked).toBe(false);
    expect(ev.sent.some((s) => s.to === "roster@kumiai-check.example" && s.leaked.length === 0)).toBe(true);
    expect(ev.lines.some((l) => l.tone === "good" && l.what.includes("漏れませんでした"))).toBe(true);
  });
  it("任せていた日は、確認が来なかったと書く", () => {
    const { ev } = run({ ...none, tools: { send_mail: "auto" } });
    expect(ev.causes[0].noon).toContain("確認が来ませんでした");
  });
  it("「全部渡して」の日は、伏せる設定が効かなかったと書く", () => {
    const { ev } = run({ ...masked, nova: "nova-all" });
    expect(ev.leaked).toBe(true);
    expect(ev.causes[0].morning).toContain("全部渡して");
  });
  it("危ない確認を止めた日は、見張りが働いたと書き、伏せていた日は二重に守れたと書く", () => {
    const stopDanger = (p: MorningPicks) => ({ ...allow(p), c6: "stop" as Answer });
    expect(run(none, stopDanger(none)).ev.lines.some((l) => l.prevent.includes("最後の砦"))).toBe(true);
    expect(run(masked, stopDanger(masked)).ev.lines.some((l) => l.prevent.includes("二重に"))).toBe(true);
  });
  it("社外でも安全な工程表を止めた日は、あて先だけで決めず中身も見る、と書く", () => {
    const { ev } = run(none, { ...allow(none), c3: "stop" });
    expect(ev.lines.find((l) => l.what.includes("工程表"))!.prevent).toContain("中身も見ます");
  });
  it("売上や点数は出さない。表記は DESIGN.md どおり（あて先・わかる）、説明は「です・ます」", () => {
    for (const p of [none, masked, { ...none, tools: { send_mail: "deny" as const } }, { ...masked, nova: "nova-all" }]) {
      const { ev } = run(p);
      const text = JSON.stringify(ev) + JSON.stringify(eveningTalk(ev));
      expect(text).not.toMatch(/売上|万円|信用|点数|宛先|分か|一緒|違う/);
      for (const l of ev.lines) expect(l.prevent).toMatch(/(です|ます|ません|ました|でした)$/);
    }
  });
});

describe("持ち帰りと実験の文", () => {
  it("実験の文には、モデル名と日付と回数があり、言いすぎない", () => {
    expect(EXPERIMENT_NOTE).toContain("Claude Opus 5.5");
    expect(EXPERIMENT_NOTE).toContain("2026-11-03");
    expect(EXPERIMENT_NOTE).toContain("10回中6回");
    expect(EXPERIMENT_NOTE).toContain("10回中0回");
    expect(EXPERIMENT_NOTE + NOT_TESTED_NOTE).not.toMatch(/保証|必ず防げます|安全です|AIは危険/);
  });
  it("1行は CLAUDE.md に貼れる形で、今日の原因に合わせて変わる", () => {
    const lineOf = (p: MorningPicks) => {
      const { log, result } = run(p);
      return oneLine(todayOf(result, log, c));
    };
    const allowed = lineOf(none);
    const auto = lineOf({ ...none, tools: { send_mail: "auto" } });
    const safe = lineOf(masked);
    for (const x of [allowed, auto, safe]) {
      expect(x.line).toMatch(/^- /);
      expect(x.line).not.toContain("\n");
      expect(x.line).not.toContain("宛先");
      expect(x.note).toContain("会社の規程");
    }
    expect(allowed.line).toContain("頼みごと");
    expect(auto.line).toContain("確認");
    expect(new Set([allowed.line, auto.line]).size).toBe(2);
  });
});
