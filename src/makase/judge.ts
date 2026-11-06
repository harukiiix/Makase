import type { Company, ConfirmationMode, DayEvent, DayLog, DayResult, InstructionOption, Setup } from "./types";

// 1日の結果をコードだけで決める（SPEC.md 5章）。同じ記録なら必ず同じ結果
// 【提案】数値は仮。「漏れると信用が大きく下がる」に合わせた初期値で、オーナーが調整できる
export const START_TRUST = 100;
export const LEAK_PENALTY = 40;

/** 全角半角・大文字小文字・空白とハイフンの違いをならす */
export function normalize(s: string): string {
  return s.normalize("NFKC").toLowerCase().replace(/[\s\-‐‑‒–—―ー－]/g, "");
}

function domainOf(address: string): string {
  const at = address.lastIndexOf("@");
  return (at >= 0 ? address.slice(at + 1) : address).trim().toLowerCase();
}

function instructionOf(company: Company, instructions: DayLog["instructions"], employeeId: string): InstructionOption | undefined {
  const id = instructions[employeeId]?.optionId;
  return company.instructions.find((o) => o.id === id && o.employeeId === employeeId);
}

/** 「全部渡して」の指示で全部渡った資料（朝に伏せた・渡さないにした所も渡る） */
export function passedAllDocs(company: Company, instructions: DayLog["instructions"]): Set<string> {
  const docs = new Set<string>();
  for (const e of company.employees) {
    const o = instructionOf(company, instructions, e.id);
    if (o?.kind === "pass_all") for (const d of o.passAll ?? []) docs.add(d);
  }
  return docs;
}

/** AI 社員に渡った項目（資料 id → 項目名）。「全部渡して」の資料は全項目 */
export function passedFields(company: Company, instructions: DayLog["instructions"], setup: Setup): Record<string, string[]> {
  const all = passedAllDocs(company, instructions);
  return Object.fromEntries(
    company.documents.map((d) => [d.id, all.has(d.id) ? d.fields.map((f) => f.label) : (setup.passed[d.id] ?? []).filter((l) => d.fields.some((f) => f.label === l))]),
  );
}

/** AI 社員が伏せずに受け取った目印。渡していない・伏せた項目の目印は入らない */
export function exposedMarkers(company: Company, instructions: DayLog["instructions"], setup: Setup): Set<string> {
  const all = passedAllDocs(company, instructions);
  const passed = passedFields(company, instructions, setup);
  const out = new Set<string>();
  for (const d of company.documents)
    for (const f of d.fields)
      if (f.marker && passed[d.id].includes(f.label) && (all.has(d.id) || !setup.masked.includes(f.marker))) out.add(f.marker);
  return out;
}

/**
 * 確認の扱い（SPEC.md 4.3）：送る道具は朝の権限どおり（使わせない＝止まる、任せる＝確認なしで動く、聞いてから＝遊ぶ人に聞く）。
 * 送らない道具は確認なしで動く。【提案】「社外に送るときは必ず聞いて」の指示（careful）があると、その社員の送信は任せても確認に来る
 */
export function confirmationMode(company: Company, instructions: DayLog["instructions"], setup: Setup | undefined, confirmationId: string): ConfirmationMode {
  if (!setup) return "ask";
  const conf = company.confirmations.find((x) => x.id === confirmationId);
  const tool = company.tools.find((t) => t.id === conf?.call?.tool);
  if (!conf || !tool || !tool.sends) return "auto";
  const perm = setup.permissions[tool.id] ?? "ask";
  if (perm === "deny") return "blocked";
  if (perm === "auto" && instructionOf(company, instructions, conf.employeeId)?.kind !== "careful") return "auto";
  return "ask";
}

export function judgeDay(log: DayLog, company: Company): DayResult {
  if (log.companyId !== company.id) throw new Error(`記録の会社 ${log.companyId} と会社データ ${company.id} が違います`);
  const tools = new Map(company.tools.map((t) => [t.id, t]));
  const employees = new Set(company.employees.map((e) => e.id));
  const inside = new Set(company.insideDomains.map((d) => d.toLowerCase()));
  const setup = log.setup;
  const mode = (id: string) => confirmationMode(company, log.instructions, setup, id);
  /** その確認の先の動きが起きたか */
  const allowed = (id: string) => {
    const m = mode(id);
    return m === "auto" || (m === "ask" && log.answers[id] === "allow");
  };
  const exposed = setup ? exposedMarkers(company, log.instructions, setup) : undefined;
  const passed = setup ? passedFields(company, log.instructions, setup) : undefined;

  const events: DayEvent[] = [];

  // 朝の指示（夕方の振り返り用）
  for (const [employeeId, choice] of Object.entries(log.instructions)) {
    const opt = company.instructions.find((o) => o.id === choice.optionId && o.employeeId === employeeId);
    if (opt && (opt.kind === "toriaezu" || opt.kind === "pass_all")) {
      events.push({ kind: "instruction", employeeId, instructionKind: opt.kind });
    }
  }

  // 昼の確認への答え
  for (const c of company.confirmations) {
    const m = mode(c.id);
    if (m === "blocked") {
      events.push({ kind: "blocked", confirmationId: c.id, employeeId: c.employeeId, tool: c.call!.tool, dangerous: c.dangerous });
      continue;
    }
    if (m === "auto") {
      if (c.dangerous) events.push({ kind: "danger_allowed", confirmationId: c.id, employeeId: c.employeeId, auto: true });
      continue;
    }
    const ok = allowed(c.id);
    if (c.dangerous) events.push({ kind: ok ? "danger_allowed" : "danger_stopped", confirmationId: c.id, employeeId: c.employeeId });
    else if (log.answers[c.id] === "stop") events.push({ kind: "safe_stopped", confirmationId: c.id, employeeId: c.employeeId });
  }

  // 道具の記録から漏洩を決める
  let leaks = 0;
  log.toolCalls.forEach((call, i) => {
    const tool = tools.get(call.tool);
    if (!tool) throw new Error(`知らない道具：${call.tool}`);
    if (!employees.has(call.employeeId)) throw new Error(`知らない社員：${call.employeeId}`);
    if (call.confirmationId && !allowed(call.confirmationId)) return; // 許可されなかった呼び出しは起きていない
    if (setup && tool.sends && setup.permissions[tool.id] === "deny") return; // 使わせない道具は送られない
    if (!tool.sends || !call.to || inside.has(domainOf(call.to))) return;
    const body = normalize(call.content);
    const hit = company.markers.filter((m) => m.find.some((f) => body.includes(normalize(f)))).map((m) => m.id)
      .filter((id) => !exposed || exposed.has(id)); // 伏せた・渡していない項目は目印として数えない
    if (hit.length === 0) return;
    leaks++;
    events.push({ kind: "leak", employeeId: call.employeeId, tool: call.tool, to: call.to, markers: hit, toolCallIndex: i });
  });

  // 仕事と売上
  let sales = 0;
  for (const t of company.tasks) {
    const notDone = t.needs.filter((id) => !allowed(id));
    if (!setup) {
      if (notDone.length === 0) {
        sales += t.sales;
        events.push({ kind: "task_done", taskId: t.id, employeeId: t.employeeId, sales: t.sales });
      } else events.push({ kind: "task_unfinished", taskId: t.id, employeeId: t.employeeId, stopped: notDone });
      continue;
    }
    const blocked = notDone.filter((id) => mode(id) === "blocked");
    const stopped = notDone.filter((id) => mode(id) !== "blocked");
    const missingFields = (t.needsFields ?? []).filter((f) => !passed![f.doc]?.includes(f.field)).map((f) => f.field);
    if (notDone.length === 0 && missingFields.length === 0) {
      sales += t.sales;
      events.push({ kind: "task_done", taskId: t.id, employeeId: t.employeeId, sales: t.sales });
    } else {
      events.push({ kind: "task_unfinished", taskId: t.id, employeeId: t.employeeId, stopped, blocked, missingFields });
    }
  }

  return { sales, trust: Math.max(0, START_TRUST - leaks * LEAK_PENALTY), events };
}
