import { confirmationMode, exposedMarkers, passedFields } from "../judge";
import type { Answer, Company, DayLog, Setup } from "../types";
import { construction } from "./construction";

// 用意した会社。飲食店・大きな会社の事務・個人開発は中身が決まってから足す（TASKS.md T9・T10）
export const COMPANIES: Company[] = [construction];

/** 朝のはじめの設定：資料は全部渡す・伏せない・送る道具は聞いてから（何も考えずに渡した状態） */
export function defaultSetup(company: Company): Setup {
  return {
    passed: Object.fromEntries(company.documents.map((d) => [d.id, d.fields.map((f) => f.label)])),
    masked: [],
    permissions: Object.fromEntries(company.tools.filter((t) => t.sends).map((t) => [t.id, "ask" as const])),
  };
}

export const MASK = "●●";
/** 渡していない項目の値。伏せて渡した ●● と見分けられるように別の印にする */
export const DROPPED = "（なし）";

/**
 * 台本で動くときの1日の記録：確認ごとの答えから、社員が使った道具の記録を作る（判定は judgeDay がする）。
 * 朝の仕組みがあれば、送る中身の値は：渡していない項目 →「（なし）」、伏せた項目 →「●●」。使わせない道具の呼び出しは起きない
 */
export function scriptedLog(company: Company, answers: Record<string, Answer>, instructions: DayLog["instructions"] = {}, setup?: Setup): DayLog {
  const exposed = setup ? exposedMarkers(company, instructions, setup) : undefined;
  const passed = setup ? passedFields(company, instructions, setup) : undefined;
  const hide = (text: string) => {
    if (!exposed || !passed) return text;
    let out = text;
    for (const d of company.documents)
      for (const f of d.fields) {
        // 目印のある項目は目印の値で、ない項目（氏名など）は「・」で区切った値で探す
        const values = f.marker ? (company.markers.find((m) => m.id === f.marker)?.find ?? []) : f.value.split("・").map((v) => v.trim()).filter(Boolean);
        const to = !passed[d.id]?.includes(f.label) ? DROPPED : f.marker && !exposed.has(f.marker) ? MASK : undefined;
        if (to) for (const v of values) out = out.split(v).join(to);
      }
    return out;
  };
  return {
    companyId: company.id,
    instructions,
    answers,
    toolCalls: company.confirmations
      .filter((c) => c.call && confirmationMode(company, instructions, setup, c.id) !== "blocked")
      .map((c) => ({ employeeId: c.employeeId, confirmationId: c.id, ...c.call!, content: hide(c.call!.content) })),
    ...(setup ? { setup } : {}),
  };
}
