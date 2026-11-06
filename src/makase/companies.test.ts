import { describe, expect, it } from "vitest";
import { COMPANY_KINDS } from "./roles";
import { COMPANIES, scriptedLog } from "./companies/index";
import { judgeDay } from "./judge";
import type { Answer, Company } from "./types";

// 実在の企業・サービスの名前が紛れていないかの簡単な検査（全部は拾えない。目で見る確認と併用する）
const REAL_NAMES = /gmail|google|yahoo|outlook|microsoft|slack|line\s?works|chatwork|dropbox|box\.com|teams|zoom|notion|salesforce|amazon|aws|apple|openai|anthropic|chatgpt|docomo|softbank|kddi|大成建設|鹿島|清水建設|大林組|竹中工務店/i;

const answerAll = (c: Company, pick: (dangerous: boolean) => Answer) =>
  Object.fromEntries(c.confirmations.map((x) => [x.id, pick(x.dangerous)]));

describe("会社データ（登録された全社）", () => {
  it("建設現場がある", () => {
    expect(COMPANIES.map((c) => c.id)).toContain("construction");
  });

  for (const c of COMPANIES) {
    describe(c.name, () => {
      const json = JSON.stringify(c);
      const employeeIds = c.employees.map((e) => e.id);
      const toolIds = c.tools.map((t) => t.id);

      it("用意した会社のどれか", () => {
        expect(COMPANY_KINDS.map((k) => k.id)).toContain(c.id);
      });

      it("AI 社員は3体で、1体は NOVA", () => {
        expect(c.employees).toHaveLength(3);
        expect(c.employees.filter((e) => e.name === "NOVA")).toHaveLength(1);
      });

      it("ドメインは .example だけ（メールアドレス・URL・社内ドメイン）", () => {
        const addrs = json.match(/[\w.+-]+@[\w.-]+/g) ?? [];
        for (const a of addrs) expect(a).toMatch(/\.example$/);
        const domains = json.match(/\b[a-z0-9-]+(\.[a-z0-9-]+)*\.(com|net|org|io|jp|co|dev|ai|app|info|biz)\b/gi) ?? [];
        expect(domains).toEqual([]);
        for (const d of c.insideDomains) expect(d).toMatch(/\.example$/);
      });

      it("実在の企業・サービスの名前がない", () => {
        expect(json).not.toMatch(REAL_NAMES);
      });

      it("つながりが正しい（社員・道具・目印・確認・仕事）", () => {
        for (const e of c.employees) for (const t of e.tools) expect(toolIds).toContain(t);
        for (const x of [...c.instructions, ...c.confirmations, ...c.tasks]) expect(employeeIds).toContain(x.employeeId);
        const markerIds = c.markers.map((m) => m.id);
        for (const d of c.documents) for (const f of d.fields) if (f.marker) expect(markerIds).toContain(f.marker);
        for (const x of c.confirmations) {
          if (!x.call) continue;
          const emp = c.employees.find((e) => e.id === x.employeeId)!;
          expect(emp.tools).toContain(x.call.tool);
        }
        const confIds = c.confirmations.map((x) => x.id);
        for (const t of c.tasks) for (const n of t.needs) expect(confIds).toContain(n);
      });

      it("目印は資料の中にある値で、資料に1つ以上の目印がある", () => {
        const values = c.documents.flatMap((d) => d.fields.map((f) => f.value)).join("\n");
        for (const m of c.markers) for (const f of m.find) expect(values).toContain(f);
        expect(c.documents.flatMap((d) => d.fields).some((f) => f.marker)).toBe(true);
      });

      it("目印のない項目の値と目印の値が重ならない（台本で渡していない値を消すとき、伏せずに渡った目印まで消さないため）", () => {
        const plain = c.documents.flatMap((d) => d.fields.filter((f) => !f.marker).flatMap((f) => f.value.split("・").map((v) => v.trim()).filter(Boolean)));
        const marks = c.markers.flatMap((m) => m.find);
        for (const p of plain) for (const m of marks) expect(m.includes(p) || p.includes(m), `${p} と ${m}`).toBe(false);
      });

      it("届く書類のどれかに、外への送信を頼む一文が紛れている", () => {
        const inj = c.incoming.filter((d) => d.injectionLine !== undefined);
        expect(inj.length).toBeGreaterThan(0);
        for (const d of inj) expect(d.lines[d.injectionLine!]).toBeTruthy();
      });

      it("NOVA への指示の選択肢に「とりあえず」と「全部渡して」がある", () => {
        const nova = c.employees.find((e) => e.name === "NOVA")!;
        const kinds = c.instructions.filter((o) => o.employeeId === nova.id).map((o) => o.kind);
        expect(kinds).toContain("toriaezu");
        expect(kinds).toContain("pass_all");
      });

      it("「必ず聞いて」の指示（careful）は送る前に聞くことだけを言う（渡す項目は朝に決める。指示に書いても判定に効かないので書かない。オーナー決定 11-06）", () => {
        for (const o of c.instructions.filter((x) => x.kind === "careful")) {
          expect(o.text).toMatch(/聞いて/);
          expect(o.text).not.toMatch(/だけ使って|だけ渡|項目/);
        }
      });

      it("確認の台本は何度も来て、危ないものは1つだけ。仕事に危ない確認は要らない", () => {
        expect(c.confirmations.length).toBeGreaterThanOrEqual(6);
        expect(c.confirmations.filter((x) => x.dangerous)).toHaveLength(1);
        const danger = c.confirmations.find((x) => x.dangerous)!;
        for (const t of c.tasks) expect(t.needs).not.toContain(danger.id);
      });

      it("台本どおり：危ないものだけ止めると売上は全部・漏洩なし。全部許可すると漏洩", () => {
        const full = c.tasks.reduce((s, t) => s + t.sales, 0);
        const good = judgeDay(scriptedLog(c, answerAll(c, (d) => (d ? "stop" : "allow"))), c);
        expect(good.sales).toBe(full);
        expect(good.events.filter((e) => e.kind === "leak")).toEqual([]);

        const tired = judgeDay(scriptedLog(c, answerAll(c, () => "allow")), c);
        expect(tired.events.filter((e) => e.kind === "leak").length).toBeGreaterThan(0);

        const none = judgeDay(scriptedLog(c, answerAll(c, () => "stop")), c);
        expect(none.sales).toBe(0);
      });
    });
  }
});
