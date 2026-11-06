import { construction } from "./companies/construction";
import { defaultSetup, scriptedLog } from "./companies/index";
import { confirmationMode } from "./judge";
import type { Answer, Company, Confirmation, ConfirmationMode, DayLog, Permission, Setup } from "./types";

// 最後の日「NOVA に任せる」の流れを決める純粋関数。画面は、ここで決めたものを出すだけにする
// 朝は6画面：守るべき情報の目印がある3項目（渡す・伏せる・渡さない）、送る道具2つ（使わせない・聞いてから・任せる）、NOVA への指示。
// 目印のない項目（氏名・資格・工程）は、仕事に要るので「渡す」に決めておく。日報係と図面係への指示は、ふつうの指示に決めておく

export const COMPANY: Company = construction;

export type FieldChoice = "pass" | "mask" | "drop";

/** 朝に聞く項目（目印のある項目だけ） */
export const MORNING_FIELDS: { doc: string; field: string }[] = COMPANY.documents.flatMap((d) =>
  d.fields.filter((f) => f.marker).map((f) => ({ doc: d.id, field: f.label })),
);
/** 朝に聞く道具（送る道具だけ） */
export const MORNING_TOOLS: string[] = COMPANY.tools.filter((t) => t.sends).map((t) => t.id);
/** 朝に選ばない社員への指示（ふつうの指示） */
export const FIXED_ORDERS: Record<string, string> = { nippo: "nippo-normal", zumen: "zumen-normal" };

export const fieldKey = (f: { doc: string; field: string }) => `${f.doc}/${f.field}`;

export type MorningPicks = {
  /** fieldKey → 選び */
  fields: Record<string, FieldChoice>;
  /** 道具 id → 権限 */
  tools: Record<string, Permission>;
  /** NOVA への指示（選択肢の id） */
  nova?: string;
};

/** 朝の選びから、判定に渡す仕組みを作る（選んでいない所は、はじめの設定のまま） */
export function setupOf(picks: MorningPicks, company: Company = COMPANY): Setup {
  const s = defaultSetup(company);
  const passed = Object.fromEntries(Object.entries(s.passed).map(([k, v]) => [k, [...v]]));
  const masked: string[] = [];
  for (const d of company.documents)
    for (const f of d.fields) {
      const pick = picks.fields[fieldKey({ doc: d.id, field: f.label })];
      if (pick === "drop") passed[d.id] = passed[d.id].filter((l) => l !== f.label);
      if (pick === "mask" && f.marker) masked.push(f.marker);
    }
  return { passed, masked, permissions: { ...s.permissions, ...picks.tools } };
}

export function instructionsOf(picks: MorningPicks): DayLog["instructions"] {
  return {
    ...Object.fromEntries(Object.entries(FIXED_ORDERS).map(([e, o]) => [e, { optionId: o }])),
    ...(picks.nova ? { nova: { optionId: picks.nova } } : {}),
  };
}

/** 昼の1件：遊ぶ人に聞く（ask）・確認なしで動いた（auto）・使わせない設定で止まった（blocked） */
export type NoonStep = { conf: Confirmation; mode: ConfirmationMode; to?: string; content?: string };

/** 昼の流れ（データの順）。送る中身は、伏せた・渡していない値を置きかえた後のもの */
export function noonSteps(picks: MorningPicks, company: Company = COMPANY): NoonStep[] {
  const setup = setupOf(picks, company);
  const instructions = instructionsOf(picks);
  const calls = new Map(scriptedLog(company, {}, instructions, setup).toolCalls.map((t) => [t.confirmationId!, t]));
  return company.confirmations.map((conf) => {
    const call = calls.get(conf.id);
    return { conf, mode: confirmationMode(company, instructions, setup, conf.id), to: call?.to ?? conf.call?.to, content: call?.content ?? conf.call?.content };
  });
}

/** 1日の記録（判定は judgeDay がする） */
export function dayLog(picks: MorningPicks, answers: Record<string, Answer>, company: Company = COMPANY): DayLog {
  return scriptedLog(company, answers, instructionsOf(picks), setupOf(picks, company));
}
