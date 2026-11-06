import type { Company, Permission, Setup } from "./types";

// 朝の一覧（危険予知）の各行に出す「今の設定」の文。画面はこの文を出すだけにする

/** 送る道具の権限の呼び名（朝の道具のカードと同じ言葉） */
export const PERMISSION_LABEL: Record<Permission, string> = { deny: "使わせない", ask: "聞いてから", auto: "任せる" };

/** 資料をどう渡すか：渡す項目の数（伏せて渡す項目も含む）と、伏せる項目の数 */
export function docSummary(company: Company, setup: Setup, docId: string): string {
  const doc = company.documents.find((d) => d.id === docId);
  if (!doc) return "";
  const passed = new Set(setup.passed[docId] ?? []);
  const given = doc.fields.filter((f) => passed.has(f.label));
  const masked = given.filter((f) => f.marker && setup.masked.includes(f.marker)).length;
  return `${given.length} / ${doc.fields.length} 項目を渡す${masked ? `・伏せる ${masked}` : ""}`;
}

/** 送る道具の権限。書いていない道具は「聞いてから」（判定と同じ扱い） */
export function permissionSummary(setup: Setup, toolId: string): string {
  return PERMISSION_LABEL[setup.permissions[toolId] ?? "ask"];
}

/** その社員に選んだ指示の文。まだ選んでいなければ null */
export function orderSummary(company: Company, employeeId: string, optionId: string): string | null {
  return company.instructions.find((o) => o.id === optionId && o.employeeId === employeeId)?.text ?? null;
}
