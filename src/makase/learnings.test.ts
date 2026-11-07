import { describe, expect, it } from "vitest";
import { COMPANY as c, dayLog, fieldKey, MORNING_FIELDS, MORNING_TOOLS, noonSteps, type MorningPicks } from "./day";
import { eveningOf, guardsOf } from "./evening";
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

describe("見直しで見つかった、選びとちがうことを言う所", () => {
  const F = (phone: "mask" | "drop" | "pass", health: "mask" | "drop" | "pass", drawing: "mask" | "drop" | "pass") =>
    Object.fromEntries(MORNING_FIELDS.map((f) => [fieldKey(f), f.field === "電話番号" ? phone : f.field === "図面番号" ? drawing : health]));
  const facts = (w: ReturnType<typeof play>) => dayFacts(w.picks, w.log, w.result, c);
  const allText = (w: ReturnType<typeof play>, lang: "ja" | "en" = "ja") => {
    const f = facts(w);
    return [...ideasOf(f, lang).flatMap((i) => [i.title, i.body, i.today, i.use]), ...storyOf(f, lang).flatMap((s) => [s.did, s.happened, s.why, s.next ?? ""]), ...takeHome(f, lang).rules.flatMap((r) => [r.line, r.because]), takeHome(f, lang).why];
  };
  const stopDanger = (d: boolean): Answer => (d ? "stop" : "allow");

  it("図面番号を渡さなかった時：図面番号を使うなとは言わず、「伏せて渡す」をすすめる", () => {
    const w = play({ ...none, fields: F("mask", "mask", "drop"), nova: "nova-careful" } as MorningPicks, stopDanger);
    const t = takeHome(facts(w), "ja");
    expect(t.rules.map((r) => r.id)).toContain("missing");
    for (const r of t.rules) expect(r.line).not.toMatch(/図面番号[^。]*使わずに/);
    for (const s of allText(w)) expect(s).not.toContain("名前や資格");
    expect(storyOf(facts(w)).find((s) => s.key === "fields")!.next ?? "").toContain("そのまま渡し");
  });
  it("「全部渡して」で、伏せていないのに「伏せた欄まで」とは言わない", () => {
    const w = play({ ...none, fields: F("pass", "pass", "pass"), nova: "nova-all" } as MorningPicks, () => "allow");
    for (const s of allText(w)) expect(s, s).not.toContain("伏せた欄まで");
  });
  it("「全部渡して」で伏せた時、「伏せずに渡した」とは言わない", () => {
    const w = play({ ...none, fields: F("mask", "mask", "mask"), nova: "nova-all" } as MorningPicks, stopDanger);
    for (const s of allText(w)) expect(s, s).not.toContain("伏せずに");
    expect(allText(w).some((s) => s.includes("全部渡して"))).toBe(true);
  });
  it("図面番号だけをそのまま渡した時、朝の守り（✓）と食いちがわない", () => {
    const w = play({ ...none, fields: F("mask", "mask", "pass") } as MorningPicks, stopDanger);
    const f = facts(w);
    expect(ideasOf(f).map((i) => i.id)).not.toContain("need");
    expect(storyOf(f).find((s) => s.key === "fields")!.tone).not.toBe("bad");
    for (const s of allText(w)) expect(s).not.toMatch(/伏せずに渡しました|気をつける所が/);
  });
  it("メールを「聞かずに送る」でも「必ず聞いて」と頼んだ時、確認が来なかったとは言わない", () => {
    for (const ans of [() => "allow" as Answer, stopDanger]) {
      const w = play({ ...none, tools: { send_mail: "auto" }, nova: "nova-careful" } as MorningPicks, ans);
      for (const s of allText(w)) expect(s, s).not.toContain("確認が来ないまま");
    }
  });
  it("「送らせない」で仕事が止まった時、「止めすぎ」とも「あなたが止めた」とも言わない", () => {
    for (const tools of [{ send_mail: "deny" }, { post_chat: "deny" }] as Record<string, "deny">[]) {
      const w = play({ ...none, fields: F("mask", "mask", "mask"), tools } as MorningPicks, () => "allow");
      for (const s of allText(w)) expect(s, s).not.toMatch(/止めすぎ|今日は止められました/);
      expect(allText(w).some((s) => s.includes("送らせない"))).toBe(true);
    }
  });
  it("「渡さない」を選んだのに「伏せて」とだけは言わない", () => {
    const w = play({ ...none, fields: F("drop", "drop", "mask"), nova: "nova-careful" } as MorningPicks, stopDanger);
    for (const s of allText(w)) expect(s, s).not.toMatch(/朝に伏せて、|今日は伏せて渡せました/);
  });
  it("全部止めた時、社外でも守るべき情報のない仕事の連絡は通してよいと伝える", () => {
    expect(allText(WAYS.stopAll).some((s) => s.includes("社外でも"))).toBe(true);
  });
  it("安全な確認を止めて危ない1枚だけ許可した時は、「確認が続くと」の考え方を出さない", () => {
    const w = play(none, (d) => (d ? "allow" : "stop"));
    expect(ids(w)).not.toContain("fatigue");
  });
  it("英語：文は大文字で始まり、欄の名前には the、3つ並ぶ時はコンマで", () => {
    for (const w of [WAYS.allowAll, play({ ...none, fields: F("mask", "mask", "drop") } as MorningPicks, stopDanger)])
      for (const s of allText(w, "en").filter(Boolean)) {
        expect(s, s).toMatch(/^[A-Z0-9"-]/);
        expect(s, s).not.toMatch(/hand over drawing number|over (?!the )drawing/);
        expect(s, s).not.toMatch(/ and [^.]* and the drawing/);
      }
  });
});

describe("全部の遊び方の見直しで見つかった所", () => {
  const F = (phone: "mask" | "drop" | "pass", health: "mask" | "drop" | "pass", drawing: "mask" | "drop" | "pass") =>
    Object.fromEntries(MORNING_FIELDS.map((f) => [fieldKey(f), f.field === "電話番号" ? phone : f.field === "図面番号" ? drawing : health]));
  const P = (p: Partial<MorningPicks>) => ({ ...none, ...p }) as MorningPicks;
  const stopDanger = (d: boolean): Answer => (d ? "stop" : "allow");
  const texts = (w: ReturnType<typeof play>, lang: "ja" | "en" = "ja") => {
    const f = dayFacts(w.picks, w.log, w.result, c);
    const ev = eveningOf(w.result, w.log, c, lang);
    const g = guardsOf(ev, w.log, c, lang);
    return [g.morning.text, g.noon.text, g.work.text, g.lesson, ...ideasOf(f, lang).flatMap((i) => [i.today, i.use]), ...storyOf(f, lang).flatMap((s) => [s.did, s.happened, s.next ?? ""]), ...takeHome(f, lang).rules.map((r) => r.because)];
  };
  it("「全部渡して」で上書きされたのは名簿だけ。渡さなかった図面番号まで渡ったとは言わない", () => {
    const w = play(P({ fields: F("mask", "mask", "drop"), nova: "nova-all" }), stopDanger);
    for (const s of texts(w)) expect(s, s).not.toMatch(/伏せたり渡さなかったりした欄|渡さなかった欄まで|渡さなかった欄も/);
  });
  it("「全部渡して」で渡さなかった欄が渡った時、朝の守りは「そのまま渡しました」と言わない", () => {
    for (const ans of [() => "allow" as Answer, stopDanger]) {
      const w = play(P({ fields: F("drop", "drop", "pass"), nova: "nova-all" }), ans);
      const ts = texts(w);
      expect(ts[0]).not.toContain("そのまま渡しました");
      expect(ts[0]).toContain("全部渡して");
      expect(texts(w, "en")[0]).not.toContain("as is");
    }
  });
  it("危ない送信を止めた時、社外あての安全な連絡が出ていても「社外への送信は起きなかった」とは言わない", () => {
    const w = play(P({ nova: "nova-careful" }), stopDanger);
    for (const s of texts(w)) expect(s).not.toContain("社外への送信は起きませんでした");
    for (const s of texts(w, "en")) expect(s).not.toContain("Nothing was sent outside the company");
  });
  it("仕事に要る欄（図面番号）を伏せるようには、すすめない", () => {
    for (const d of ["drop", "pass"] as const) {
      const w = play(P({ fields: F("mask", "mask", d), nova: "nova-careful" }), stopDanger);
      for (const s of texts(w)) expect(s, s).not.toMatch(/「伏せて渡す」にし|伏せて渡せば仕事|伏せても、仕事/);
    }
  });
  it("日本語のくずれ（渡さないにして渡しました・でしたため）がない", () => {
    for (const p of [P({ fields: F("drop", "drop", "pass"), nova: "nova-careful" }), P({ fields: F("mask", "drop", "pass"), nova: "nova-careful" }), P({ fields: F("mask", "mask", "pass"), nova: "nova-careful" })])
      for (const ans of [stopDanger, () => "stop" as Answer]) for (const s of texts(play(p, ans))) expect(s, s).not.toMatch(/渡さないにして渡しました|伏せるか渡さないにして渡しました|でしたため/);
  });
  it("チャットを「送らせない」にして仕事が止まった時は、メールが「聞かずに送る」でも理由に出る", () => {
    const w = play(P({ fields: F("mask", "mask", "pass"), tools: { send_mail: "auto", post_chat: "deny" }, nova: "nova-careful" }), stopDanger);
    expect(takeHome(dayFacts(w.picks, w.log, w.result, c), "ja").rules.some((r) => r.because.includes("現場チャット"))).toBe(true);
  });
  it("仕事が終わらなかった時は、その指示が5行の中に残る", () => {
    const w = play(P({ fields: F("pass", "pass", "pass"), nova: "nova-all" }), (d) => (d ? "allow" : "stop"));
    expect(takeHome(dayFacts(w.picks, w.log, w.result, c), "ja").rules.map((r) => r.id)).toContain("balance");
  });
  it("英語：数の合う動詞、仕事の名前は文の形、them だけで言わない、自然な言い方", () => {
    const plays = [
      play(P({ fields: F("mask", "mask", "mask"), tools: { send_mail: "deny", post_chat: "deny" }, nova: "nova-careful" }), stopDanger),
      play(P({ fields: F("mask", "mask", "mask"), nova: "nova-careful" }), () => "stop"),
      play(P({ fields: F("mask", "mask", "pass"), nova: "nova-careful" }), stopDanger),
      play(P({ fields: F("pass", "mask", "pass"), nova: "nova-all" }), () => "allow"),
      play(P({ nova: "nova-careful" }), stopDanger),
    ];
    for (const w of plays)
      for (const s of texts(w, "en")) {
        expect(s, s).not.toMatch(/ and email was|chat and email was/);
        expect(s, s).not.toMatch(/ and Schedule|Daily report and/);
        expect(s, s).not.toMatch(/masked them|left them out/);
        expect(s, s).not.toContain("A miss would have leaked");
      }
  });
});
