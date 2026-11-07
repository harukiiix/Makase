import { describe, expect, it } from "vitest";
import { construction as c } from "./companies/construction";
import { defaultSetup, DROPPED, scriptedLog } from "./companies/index";
import { confirmationMode, judgeDay } from "./judge";
import type { Answer, DayLog, Setup } from "./types";

// 朝の仕組み（渡す項目・伏せる・道具の権限）が判定にどう効くか（SPEC.md 4.2・5章）。建設現場の本番データで確かめる
const all = (a: Answer) => Object.fromEntries(c.confirmations.map((x) => [x.id, a]));
const allowAll = all("allow");
const onlyDangerStopped = Object.fromEntries(c.confirmations.map((x) => [x.id, x.dangerous ? "stop" : "allow"] as const));
const nova = (optionId: string): DayLog["instructions"] => ({ nova: { optionId } });
const setup = (patch: Partial<Setup>): Setup => ({ ...defaultSetup(c), ...patch });
const run = (s: Setup, answers = allowAll, instructions = nova("nova-normal")) => judgeDay(scriptedLog(c, answers, instructions, s), c);
const leaks = (r: ReturnType<typeof judgeDay>) => r.events.filter((e) => e.kind === "leak");
const full = c.tasks.reduce((s, t) => s + t.sales, 0);
const danger = c.confirmations.find((x) => x.dangerous)!;

describe("朝の仕組み（建設現場）", () => {
  it("はじめの設定（全部渡す・伏せない・聞いてから）で全部許可すると漏洩する", () => {
    const r = run(defaultSetup(c));
    expect(leaks(r)).toHaveLength(1);
    expect(r.sales).toBe(full);
  });

  it("伏せた項目は目印として数えない：電話番号と血圧を伏せれば、許可しても漏洩にならない", () => {
    const r = run(setup({ masked: ["phone", "health"] }));
    expect(leaks(r)).toEqual([]);
    expect(r.sales).toBe(full);
  });

  it("伏せたのが電話番号だけなら、血圧が漏れる", () => {
    const r = run(setup({ masked: ["phone"] }));
    expect(leaks(r).flatMap((e) => (e.kind === "leak" ? e.markers : []))).toEqual(["health"]);
  });

  it("渡していない項目は目印として数えない：名簿を氏名と資格だけ渡せば漏洩にならない", () => {
    const r = run(setup({ passed: { ...defaultSetup(c).passed, roster: ["氏名", "資格"] } }));
    expect(leaks(r)).toEqual([]);
    expect(r.sales).toBe(full);
  });

  it("送る中身からも、伏せた・渡していない値は消える（台本の記録）", () => {
    const log = scriptedLog(c, allowAll, nova("nova-normal"), setup({ masked: ["phone"] }));
    const body = log.toolCalls.map((t) => t.content).join("\n");
    expect(body).not.toContain("090-0000-0001");
    expect(body).toContain("●●");
  });

  it("渡していない項目は、目印がなくても送る中身から消え「（なし）」になる（伏せた ●● とは見分けられる）", () => {
    const s = setup({ passed: { ...defaultSetup(c).passed, roster: ["資格"] } });
    const body = scriptedLog(c, allowAll, nova("nova-normal"), s).toolCalls.map((t) => t.content).join("\n");
    expect(body).not.toContain("山田 一郎");
    expect(body).not.toContain("090-0000-0001");
    expect(body).toContain(DROPPED);
    expect(body).not.toContain("●●");
  });

  it("仕事に要る項目を渡していないと、その仕事は終わらない（全部渡さないのが得にならない）", () => {
    const r = run(setup({ passed: { ...defaultSetup(c).passed, roster: [] } }));
    expect(r.sales).toBeLessThan(full);
    expect(r.events).toContainEqual(expect.objectContaining({ kind: "task_unfinished", taskId: "t-kyoiku", missingFields: ["氏名", "資格"] }));
  });

  it("「使わせない」道具は送られず、確認も来ない。その道具が要る仕事は終わらない", () => {
    const s = setup({ permissions: { send_mail: "deny", post_chat: "ask" } });
    expect(confirmationMode(c, nova("nova-normal"), s, danger.id)).toBe("blocked");
    const r = run(s);
    expect(leaks(r)).toEqual([]);
    expect(r.events).toContainEqual(expect.objectContaining({ kind: "blocked", confirmationId: danger.id, dangerous: true }));
    expect(r.events).toContainEqual(expect.objectContaining({ kind: "task_unfinished", taskId: "t-koutei" }));
    expect(scriptedLog(c, allowAll, nova("nova-normal"), s).toolCalls.some((t) => t.tool === "send_mail")).toBe(false);
  });

  it("「任せる」道具は確認なしで動く：遊ぶ人が止めても、危ない送信が起きて漏洩する", () => {
    const s = setup({ permissions: { send_mail: "auto", post_chat: "ask" } });
    expect(confirmationMode(c, nova("nova-normal"), s, danger.id)).toBe("auto");
    const r = run(s, onlyDangerStopped);
    expect(leaks(r)).toHaveLength(1);
    expect(r.events).toContainEqual(expect.objectContaining({ kind: "danger_allowed", confirmationId: danger.id, auto: true }));
  });

  it("送らない道具（名簿を読む・記録を作る）は確認を出さずに動く", () => {
    const write = c.confirmations.find((x) => x.call?.tool === "write_record")!;
    expect(confirmationMode(c, nova("nova-normal"), defaultSetup(c), write.id)).toBe("auto");
    const r = run(defaultSetup(c), all("stop"));
    expect(r.events).toContainEqual(expect.objectContaining({ kind: "task_done", taskId: "t-ky" }));
  });

  it("【提案】指示「社外に送るときは必ず聞いて」は、任せた道具でも NOVA の送信は確認に来る", () => {
    const s = setup({ permissions: { send_mail: "auto", post_chat: "ask" } });
    expect(confirmationMode(c, nova("nova-careful"), s, danger.id)).toBe("ask");
    expect(leaks(run(s, onlyDangerStopped, nova("nova-careful")))).toEqual([]);
  });

  it("【提案】指示「全部渡して」は、伏せても名簿が全部渡り、許可すると漏れる", () => {
    const s = setup({ masked: ["phone", "health"], passed: { ...defaultSetup(c).passed, roster: ["氏名"] } });
    expect(leaks(run(s, allowAll, nova("nova-all")))).toHaveLength(1);
  });

  describe("バランス：4つの遊び方", () => {
    const sales = (r: ReturnType<typeof judgeDay>) => r.sales;
    const allAllow = run(defaultSetup(c), allowAll);
    const allStop = run(defaultSetup(c), all("stop"));
    const watchOnly = run(defaultSetup(c), onlyDangerStopped);
    // 朝に仕組み：名簿は氏名と資格だけ・送る道具は聞いてから。昼に全部許可しても漏れない
    const morning = run(setup({ passed: { ...defaultSetup(c).passed, roster: ["氏名", "資格"] } }), allowAll);

    it("全部許可は漏れる", () => expect(leaks(allAllow).length).toBeGreaterThan(0));
    it("全部止めるは漏れないが売上が低い", () => {
      expect(leaks(allStop)).toEqual([]);
      expect(sales(allStop)).toBeLessThan(full);
    });
    it("見張りだけは、危ない1つを見つけたときだけ漏れない", () => expect(leaks(watchOnly)).toEqual([]));
    it("朝に仕組みを作ると、昼に見落としても漏れず、売上も全部", () => {
      expect(leaks(morning)).toEqual([]);
      expect(sales(morning)).toBe(full);
    });
  });
});
