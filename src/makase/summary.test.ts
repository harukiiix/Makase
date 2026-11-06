import { describe, expect, it } from "vitest";
import { construction as c } from "./companies/construction";
import { defaultSetup } from "./companies/index";
import { docSummary, orderSummary, permissionSummary } from "./summary";
import type { Setup } from "./types";

// 朝の一覧（危険予知）の各行に出す「今の設定」の文。押す前に、何を決めたかが一目で分かるように
const base = defaultSetup(c);
const setup = (patch: Partial<Setup>): Setup => ({ ...base, ...patch });
const rosterOnly = (labels: string[]) => ({ ...base.passed, roster: labels });

describe("朝の一覧の状態（建設現場）", () => {
  it("はじめは、名簿の4項目を全部渡し、メールは聞いてから、指示はまだ", () => {
    expect(docSummary(c, base, "roster")).toBe("4 / 4 項目を渡す");
    expect(permissionSummary(base, "send_mail")).toBe("聞いてから");
    expect(orderSummary(c, "nova", "")).toBeNull();
  });

  it("伏せた項目は「伏せる」の数に入る（伏せても渡している）", () => {
    expect(docSummary(c, setup({ masked: ["health"] }), "roster")).toBe("4 / 4 項目を渡す・伏せる 1");
  });

  it("渡さない項目は渡す数から外れ、伏せる数にも入らない", () => {
    const s = setup({ passed: rosterOnly(["氏名", "血圧（入場時）", "資格"]), masked: ["phone", "health"] });
    expect(docSummary(c, s, "roster")).toBe("3 / 4 項目を渡す・伏せる 1");
  });

  it("全部渡さないときも、数で分かる", () => {
    expect(docSummary(c, setup({ passed: rosterOnly([]) }), "roster")).toBe("0 / 4 項目を渡す");
  });

  it("メールの道具は、使わせない・聞いてから・任せる の言葉で出る", () => {
    expect(permissionSummary(setup({ permissions: { ...base.permissions, send_mail: "deny" } }), "send_mail")).toBe("使わせない");
    expect(permissionSummary(setup({ permissions: { ...base.permissions, send_mail: "auto" } }), "send_mail")).toBe("任せる");
    expect(permissionSummary(setup({ permissions: {} }), "send_mail")).toBe("聞いてから");
  });

  it("選んだ指示は、その文のまま出る。ほかの社員の指示や知らない id は出ない", () => {
    expect(orderSummary(c, "nova", "nova-toriaezu")).toBe("とりあえず届いた書類のとおりに進めておいて");
    expect(orderSummary(c, "nova", "nippo-normal")).toBeNull();
    expect(orderSummary(c, "nova", "nope")).toBeNull();
  });
});
