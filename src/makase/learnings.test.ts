import { describe, expect, it } from "vitest";
import { COMPANY as c, dayLog, fieldKey, MORNING_FIELDS, MORNING_TOOLS, noonSteps, type MorningPicks } from "./day";
import { judgeDay } from "./judge";
import { dayFacts, ideasOf, IDEA_IDS, storyOf, takeHome } from "./learnings";
import type { Answer } from "./types";

// 夕方に学ぶ「考え方」・くわしいふり返り（時間の順のカード）・持ち帰る指示を、遊んだ人の選びから作る
const JA = /[぀-ヿ㐀-鿿]/;
const OVER = /保証|必ず防げ|安全です|これで安全|AIは危険|guarantee|always prevent|completely safe/i;

const none: MorningPicks = { fields: {}, tools: {}, nova: "nova-normal" };
const allF = (v: "mask" | "drop" | "pass") => Object.fromEntries(MORNING_FIELDS.map((f) => [fieldKey(f), v]));
const allT = (v: string) => Object.fromEntries(MORNING_TOOLS.map((t) => [t, v]));
const ans = (p: MorningPicks, f: (danger: boolean) => Answer) => Object.fromEntries(noonSteps(p).filter((s) => s.mode === "ask").map((s) => [s.conf.id, f(!!s.conf.dangerous)]));
const play = (p: MorningPicks, f: (danger: boolean) => Answer) => {
  const log = dayLog(p, ans(p, f));
  return { picks: p, log, result: judgeDay(log, c) };
};
const WAYS = {
  allowAll: play(none, () => "allow"),
  maskAllow: play({ ...none, fields: allF("mask") } as MorningPicks, () => "allow"),
  good: play({ ...none, fields: allF("mask") } as MorningPicks, (d) => (d ? "stop" : "allow")),
  best: play({ ...none, fields: allF("mask"), tools: { send_mail: "ask" }, nova: "nova-careful" } as MorningPicks, (d) => (d ? "stop" : "allow")),
  stopAll: play(none, () => "stop"),
  denyDrop: play({ ...none, fields: allF("drop"), tools: allT("deny") } as MorningPicks, () => "stop"),
  auto: play({ ...none, tools: allT("auto") } as MorningPicks, () => "allow"),
  passAll: play({ ...none, fields: allF("mask"), nova: "nova-all" } as MorningPicks, () => "allow"),
  toriaezu: play({ ...none, nova: "nova-toriaezu" } as MorningPicks, () => "allow"),
};
const ids = (w: (typeof WAYS)[keyof typeof WAYS]) => ideasOf(dayFacts(w.picks, w.log, w.result, c)).map((i) => i.id);

describe("今日学ぶ考え方（遊んだ人の選びで変わる）", () => {
  it("どの遊び方でも、2〜3個。同じ物は出さない", () => {
    for (const [name, w] of Object.entries(WAYS)) {
      const list = ids(w);
      expect(list.length, name).toBeGreaterThanOrEqual(2);
      expect(list.length, name).toBeLessThanOrEqual(3);
      expect(new Set(list).size, name).toBe(list.length);
      for (const id of list) expect(IDEA_IDS).toContain(id);
    }
  });
  it("選びに合った考え方が出る", () => {
    expect(ids(WAYS.allowAll)).toEqual(expect.arrayContaining(["need", "inject"]));
    expect(ids(WAYS.auto)).toContain("human");
    expect(ids(WAYS.stopAll)).toContain("balance");
    expect(ids(WAYS.denyDrop)).toContain("balance");
    expect(ids(WAYS.toriaezu)).toContain("words");
    expect(ids(WAYS.passAll)).toContain("words");
    expect(ids(WAYS.best)).toContain("layers");
    expect(ids(WAYS.maskAllow)).toContain("verify");
  });
  it("考え方の文には、今日のあなたのこと（したこと）と、ふだんの使い方が入る", () => {
    for (const [name, w] of Object.entries(WAYS))
      for (const lang of ["ja", "en"] as const)
        for (const i of ideasOf(dayFacts(w.picks, w.log, w.result, c), lang)) {
          for (const s of [i.title, i.body, i.today, i.use]) {
            expect(s.length, `${name} ${i.id}`).toBeGreaterThan(5);
            expect(OVER.test(s), `${name} ${s}`).toBe(false);
            if (lang === "en") expect(JA.test(s), `${name} ${s}`).toBe(false);
          }
          if (lang === "ja") expect(i.title.length, i.title).toBeLessThanOrEqual(22);
        }
  });
  it("遊び方がちがえば、出る考え方の組み合わせもちがう（少なくとも5通り）", () => {
    expect(new Set(Object.values(WAYS).map((w) => ids(w).join(","))).size).toBeGreaterThanOrEqual(5);
  });
});

describe("くわしいふり返り（時間の順のカード）", () => {
  it("朝の渡し方・送る道具・頼み方、昼の危ない確認、夕方の結果が、この順で並ぶ", () => {
    for (const [name, w] of Object.entries(WAYS)) {
      const story = storyOf(dayFacts(w.picks, w.log, w.result, c));
      const keys = story.map((s) => s.key);
      expect(keys.slice(0, 3), name).toEqual(["fields", "tools", "order"]);
      expect(keys, name).toContain("danger");
      expect(keys[keys.length - 1], name).toBe("result");
      for (const s of story) for (const t of [s.did, s.happened, s.why]) expect(t.length, `${name} ${s.key}`).toBeGreaterThan(4);
    }
  });
  it("止めすぎて仕事が終わらなかった時は、その理由のカードが出る", () => {
    const keys = storyOf(dayFacts(WAYS.stopAll.picks, WAYS.stopAll.log, WAYS.stopAll.result, c)).map((s) => s.key);
    expect(keys).toContain("work");
    expect(storyOf(dayFacts(WAYS.good.picks, WAYS.good.log, WAYS.good.result, c)).map((s) => s.key)).not.toContain("work");
  });
  it("カードの文は、何をしたかを具体的に言う（渡した欄・押したボタン・あて先）", () => {
    const st = storyOf(dayFacts(WAYS.allowAll.picks, WAYS.allowAll.log, WAYS.allowAll.result, c));
    expect(st.find((s) => s.key === "fields")!.did).toContain("電話番号");
    expect(st.find((s) => s.key === "danger")!.did).toContain("許可");
    expect(st.find((s) => s.key === "danger")!.happened).toContain("roster@kumiai-check.example");
    const good = storyOf(dayFacts(WAYS.good.picks, WAYS.good.log, WAYS.good.result, c));
    expect(good.find((s) => s.key === "danger")!.did).toContain("止め");
  });
  it("英語のカードに日本語が残らない", () => {
    for (const [name, w] of Object.entries(WAYS))
      for (const s of storyOf(dayFacts(w.picks, w.log, w.result, c), "en")) for (const t of [s.title, s.did, s.happened, s.why, s.next ?? ""]) expect(JA.test(t), `${name} ${t}`).toBe(false);
  });
});

describe("持ち帰る指示（遊んだ人の選びから組み立てる）", () => {
  const rules = (w: (typeof WAYS)[keyof typeof WAYS], lang: "ja" | "en" = "ja") => takeHome(dayFacts(w.picks, w.log, w.result, c), lang);
  it("行ごとに、貼れる形の指示と、今日の理由がつく。3〜5行", () => {
    for (const [name, w] of Object.entries(WAYS))
      for (const lang of ["ja", "en"] as const) {
        const t = rules(w, lang);
        expect(t.rules.length, name).toBeGreaterThanOrEqual(3);
        expect(t.rules.length, name).toBeLessThanOrEqual(5);
        for (const r of t.rules) {
          expect(r.line, name).toMatch(/^- /);
          expect(r.because.length, name).toBeGreaterThan(5);
          expect(OVER.test(r.line + r.because), r.line).toBe(false);
          if (lang === "en") expect(JA.test(r.line + r.because + t.head + t.why), `${name} ${r.line}`).toBe(false);
        }
        expect(t.line).toBe(t.rules[0].line);
        expect(t.text.split("\n").filter((l) => l.startsWith("- "))).toEqual(t.rules.map((r) => r.line));
        expect(t.text).not.toContain(t.rules[0].because);
      }
  });
  it("選びに合った指示が、先に来る", () => {
    expect(rules(WAYS.allowAll).rules.map((r) => r.id)).toEqual(expect.arrayContaining(["mask", "inject"]));
    expect(rules(WAYS.auto).rules[0].id).toBe("ask");
    expect(rules(WAYS.stopAll).rules.map((r) => r.id)).toContain("balance");
    expect(rules(WAYS.passAll).rules.map((r) => r.id)).toContain("only");
    expect(rules(WAYS.toriaezu).rules.map((r) => r.id)).toContain("scope");
    expect(rules(WAYS.good).rules.map((r) => r.id)).not.toContain("balance");
  });
  it("遊び方がちがえば、持ち帰る指示もちがう（少なくとも6通り）", () => {
    expect(new Set(Object.values(WAYS).map((w) => rules(w).rules.map((r) => r.id + r.because).join("|"))).size).toBeGreaterThanOrEqual(6);
  });
  it("理由の文は、今日したことを言う", () => {
    expect(rules(WAYS.allowAll).rules.find((r) => r.id === "mask")!.because).toContain("電話番号");
    expect(rules(WAYS.auto).rules[0].because).toContain("聞かずに送る");
  });
});

describe("渡さなすぎて終わらなかった時は、止めすぎとは言わない", () => {
  const dropOnly = play({ ...none, fields: allF("drop") } as MorningPicks, () => "allow");
  const f = dayFacts(dropOnly.picks, dropOnly.log, dropOnly.result, c);
  it("理由は、渡さなかった欄", () => {
    expect(f.onlyMissing).toBe(true);
    expect(f.missing.length).toBeGreaterThan(0);
    const bal = ideasOf(f).find((i) => i.id === "balance")!;
    expect(bal.today).toContain("渡さなかった");
    const t = takeHome(f, "ja");
    expect(t.rules.map((r) => r.id)).toContain("missing");
    expect(t.rules.map((r) => r.id)).not.toContain("balance");
    for (const r of t.rules) expect(r.because).not.toContain("止めすぎ");
  });
  it("英語でも、仕事が1つだけの時は単数で言う", () => {
    for (const s of [...ideasOf(f, "en").map((i) => i.today), ...storyOf(f, "en").map((x) => x.happened)]) expect(s).not.toMatch(/\b1 of \d+ jobs weren't/);
  });
});
