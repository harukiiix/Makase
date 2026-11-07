import { describe, expect, it } from "vitest";
import { oneLine } from "./carry";
import { COMPANY as c, dayLog, fieldKey, MORNING_FIELDS, MORNING_TOOLS, noonSteps, type MorningPicks } from "./day";
import { tr } from "./en";
import { eveningOf, eveningTalk, guardsOf, hiddenAt, whyOutside } from "./evening";
import { judgeDay } from "./judge";
import { JOBS, JOB_NOTE_EN, cleanJobLines, jobPrompt } from "./jobLine";
import { todayOf } from "./takeaway";
import type { Answer } from "./types";
import * as WJA from "./words";
import * as WEN from "./words.en";

// 英語の画面で、最後の日に日本語が残らないことを確かめる（判定は日本語のデータのまま動く）
const JA = /[぀-ヿ㐀-鿿！-～]/;
const noJa = (s: string, where: string) => expect(JA.test(s), `${where}: ${s}`).toBe(false);

/** words の値を、文字列・関数（見本の引数で呼ぶ）・配列・オブジェクトの中まで、すべて集める */
function texts(v: unknown, where: string, out: [string, string][] = []): [string, string][] {
  if (typeof v === "string") out.push([where, v]);
  else if (typeof v === "function") out.push([where, String((v as (...a: unknown[]) => unknown)("send_mail", "tool", "content", "to@example.example"))]);
  else if (Array.isArray(v)) v.forEach((x, i) => texts(x, `${where}[${i}]`, out));
  else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) if (k !== "id" && k !== "who") texts(x, `${where}.${k}`, out);
  return out;
}

describe("英語の最後の日", () => {
  it("画面の言葉は、日本語と同じものがすべて英語でそろっている", () => {
    expect(Object.keys(WEN).sort()).toEqual(Object.keys(WJA).sort());
  });

  it("画面の言葉（英語）に日本語が残っていない", () => {
    for (const [k, v] of Object.entries(WEN)) for (const [where, s] of texts(v, k)) noJa(s, where);
  });

  it("会社のデータ（名前・書類・メール・指示・確認・仕事・道具）は、英語ではすべて英語で出る", () => {
    const shown = [
      ...c.employees.map((e) => e.name),
      ...c.tools.map((t) => t.label),
      ...c.documents.flatMap((d) => [d.title, ...d.fields.flatMap((f) => [f.label, f.value])]),
      ...c.markers.map((m) => m.label),
      ...c.incoming.flatMap((d) => [d.title, ...d.lines, d.attachment ?? ""]),
      ...c.instructions.map((i) => i.text),
      ...c.confirmations.flatMap((x) => [x.text, x.call?.content ?? ""]),
      ...c.tasks.map((t) => t.label),
    ].filter(Boolean);
    for (const s of shown) noJa(tr(s, "en"), s);
    for (const d of c.incoming) noJa(hiddenAt(d, "en"), d.id);
    // 日本語の画面では、そのまま
    for (const s of shown) expect(tr(s, "ja")).toBe(s);
  });

  const none: MorningPicks = { fields: {}, tools: {}, nova: "nova-normal" };
  const allF = (v: "mask" | "drop") => Object.fromEntries(MORNING_FIELDS.map((f) => [fieldKey(f), v]));
  const allT = (v: string) => Object.fromEntries(MORNING_TOOLS.map((t) => [t, v]));
  const ans = (p: MorningPicks, f: (danger: boolean) => Answer) => Object.fromEntries(noonSteps(p).filter((s) => s.mode === "ask").map((s) => [s.conf.id, f(!!s.conf.dangerous)]));
  const ways: [string, MorningPicks, (d: boolean) => Answer][] = [
    ["全部許可", none, () => "allow"],
    ["伏せて許可", { ...none, fields: allF("mask") } as MorningPicks, () => "allow"],
    ["伏せて危ないのだけ止める", { ...none, fields: allF("mask") } as MorningPicks, (d) => (d ? "stop" : "allow")],
    ["全部止める", none, () => "stop"],
    ["送らせない・渡さない", { ...none, fields: allF("drop"), tools: allT("deny") } as MorningPicks, () => "stop"],
    ["聞かずに送る", { ...none, tools: allT("auto") } as MorningPicks, () => "allow"],
    ["全部渡して", { ...none, fields: allF("mask"), nova: "nova-all" } as MorningPicks, () => "allow"],
    ["とりあえず", { ...none, nova: "nova-toriaezu" } as MorningPicks, () => "allow"],
  ];

  it("どう遊んでも、夕方・くわしいふり返り・会話・持ち帰り・昼のカードに日本語が残らない", () => {
    for (const [name, p, f] of ways) {
      const log = dayLog(p, ans(p, f));
      const result = judgeDay(log, c);
      const ev = eveningOf(result, log, c, "en");
      const g = guardsOf(ev, log, c, "en");
      const all: string[] = [
        ...ev.toAI, ...ev.unfinished,
        ...ev.sent.flatMap((s) => [s.who, s.tool, tr(s.content, "en"), ...s.leaked]),
        ...ev.causes.flatMap((x) => [x.marker, x.morning, x.noon]),
        ...ev.lines.flatMap((l) => [l.what, l.prevent]),
        g.trap, g.morning.text, g.noon.text, g.work.text, g.lesson,
        ...whyOutside(ev, c, "en").flatMap((w) => [w.head, w.text]),
        ...eveningTalk(ev, "en").map((l) => l.text),
        ...noonSteps(p).flatMap((s) => [tr(s.conf.text, "en"), tr(s.content ?? s.conf.call?.content ?? "", "en")]),
      ];
      for (const s of all) noJa(s, name);
      const one = oneLine(todayOf(result, log, c), "en");
      for (const s of [...one.lines, one.why, one.note, one.text]) noJa(s, `${name} 持ち帰り`);
      expect(one.lines[0]).not.toMatch(/^- /);
      expect(one.line).toMatch(/^- /);
    }
  });

  it("英語でも、判定と漏れたかどうかは日本語と同じ", () => {
    for (const [, p, f] of ways) {
      const log = dayLog(p, ans(p, f));
      const r = judgeDay(log, c);
      expect(eveningOf(r, log, c, "en").leaked).toBe(eveningOf(r, log, c).leaked);
      expect(guardsOf(eveningOf(r, log, c, "en"), log, c, "en").work.ok).toBe(guardsOf(eveningOf(r, log, c), log, c).work.ok);
    }
  });

  it("あなたの仕事に合わせる：英語では、英語で答えるよう頼み、英語の答えを確かめる", () => {
    const log = dayLog(none, ans(none, () => "allow"));
    const today = todayOf(judgeDay(log, c), log, c);
    const p = jobPrompt(JOBS[0], today, oneLine(today, "en"), "en");
    expect(p).toMatch(/Reply in English/);
    expect(p).toContain(oneLine(today, "en").line);
    noJa(JOB_NOTE_EN, "JOB_NOTE_EN");
    expect(cleanJobLines("- Before you send the roster, check the address with me.\n- This guarantees nothing leaks.", "en")).toEqual(["- Before you send the roster, check the address with me."]);
    expect(cleanJobLines("- Today the roster leaked, so mask it.", "en")).toBeNull();
    expect(cleanJobLines("- 名簿を貼る前に、電話番号を消してください。", "en")).toBeNull();
  });
});

describe("夕方の文の正しさ（見直しで見つかった所）", () => {
  const none: MorningPicks = { fields: {}, tools: {}, nova: "nova-normal" };
  const allF = (v: string) => Object.fromEntries(MORNING_FIELDS.map((f) => [fieldKey(f), v]));
  const run = (p: MorningPicks, f: (d: boolean) => Answer) => {
    const log = dayLog(p, Object.fromEntries(noonSteps(p).filter((s) => s.mode === "ask").map((s) => [s.conf.id, f(!!s.conf.dangerous)])));
    return { log, ev: eveningOf(judgeDay(log, c), log, c, "en"), evJa: eveningOf(judgeDay(log, c), log, c, "ja") };
  };
  it("渡さなかった欄のためだけに終わらなかった時、「止めすぎ」とは言わない", () => {
    const { log, ev, evJa } = run({ ...none, fields: allF("drop") } as MorningPicks, () => "allow");
    expect(ev.onlyMissing).toBe(true);
    for (const b of eveningTalk(evJa, "ja")) expect(b.text).not.toContain("止めすぎ");
    expect(guardsOf(evJa, log, c, "ja").lesson).not.toContain("止めすぎ");
    for (const b of eveningTalk(ev, "en")) expect(b.text).not.toMatch(/\b1 of the jobs weren't|Stop too much/);
  });
  it("聞かずに送る時、「昼に許可しても」とは言わない", () => {
    const { log, evJa } = run({ ...none, fields: allF("mask"), tools: Object.fromEntries(MORNING_TOOLS.map((t) => [t, "auto"])) } as MorningPicks, () => "allow");
    expect(guardsOf(evJa, log, c, "ja").lesson).not.toContain("昼に許可しても");
  });
  it("英語の文は大文字で始まり、現場チャットは post で言う", () => {
    expect(WEN.toolAsk("post_chat")).toContain("post to the site chat");
    for (const p of [{ ...none, tools: { send_mail: "deny" } }, { ...none, tools: { send_mail: "auto" } }] as MorningPicks[]) {
      const { ev } = run(p, () => "allow");
      for (const l of ev.lines) expect(l.what, l.what).toMatch(/^[A-Z"]/);
    }
  });
});
