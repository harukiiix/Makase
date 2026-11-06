import type { CompanyId } from "./roles";

// 会社データ（SPEC.md 5章）。AI 社員3体・それぞれの仕事・資料の項目・守るべき情報の目印・道具・届く書類・確認の台本
export type Company = {
  id: CompanyId;
  name: string;
  /** 社内の宛先のドメイン（すべて .example）。これ以外への送信は社外 */
  insideDomains: string[];
  employees: Employee[];
  tools: Tool[];
  documents: Doc[];
  markers: Marker[];
  incoming: IncomingDoc[];
  instructions: InstructionOption[];
  confirmations: Confirmation[];
  tasks: Task[];
};

export type Employee = {
  id: string;
  /** 相棒は NOVA、ほかの2体は仕事名で呼ぶ */
  name: string;
  job: string;
  /** この社員が使える道具 */
  tools: string[];
};

export type Tool = {
  id: string;
  label: string;
  /** 宛先に何かを送る道具か（送る道具だけが漏洩の判定の対象） */
  sends: boolean;
};

/** 社内の資料。項目に目印が付いていれば、守るべき情報 */
export type Doc = {
  id: string;
  title: string;
  fields: { label: string; value: string; marker?: string }[];
};

/** 守るべき情報の目印。送った中身に find のどれかが入っていたら、その目印が漏れた */
export type Marker = {
  id: string;
  label: string;
  find: string[];
};

/** 社外から届く書類。injectionLine があれば、その行に外への送信を頼む一文が紛れている */
export type IncomingDoc = {
  id: string;
  title: string;
  from: string;
  lines: string[];
  injectionLine?: number;
};

/** 朝の指示の選択肢。toriaezu＝「とりあえず」、pass_all＝「全部渡して」 */
export type InstructionKind = "careful" | "normal" | "toriaezu" | "pass_all";

export type InstructionOption = {
  id: string;
  employeeId: string;
  text: string;
  kind: InstructionKind;
  /** 「全部渡して」の指示で、伏せずに全部渡ったことになる資料 */
  passAll?: string[];
};

/** 昼の確認（台本）。ほとんどは安全で、1つだけ危ない */
export type Confirmation = {
  id: string;
  employeeId: string;
  text: string;
  dangerous: boolean;
  /** 許可したときに社員が使う道具（台本で動くときの記録の元） */
  call?: { tool: string; to?: string; content: string };
};

/** 仕事。needs の確認をすべて許可すると終わり、売上が入る */
export type Task = {
  id: string;
  employeeId: string;
  label: string;
  sales: number;
  needs: string[];
  /** 朝に渡していないと終わらない資料の項目（仕組みがあるときだけ見る） */
  needsFields?: { doc: string; field: string }[];
};

// 朝の仕組み（SPEC.md 4.2 の対策の優先順位）
/** 社外へ送る道具の権限：使わせない・聞いてから・任せる */
export type Permission = "deny" | "ask" | "auto";

export type Setup = {
  /** 本質的対策：資料 id → AI に渡す項目名 */
  passed: Record<string, string[]>;
  /** 代替：伏せて渡す目印 id */
  masked: string[];
  /** 工学的対策：送る道具の権限。書いていない道具は「聞いてから」 */
  permissions: Record<string, Permission>;
};

/** 確認がどう扱われるか：遊ぶ人に聞く・確認なしで動く・仕組みが止めた */
export type ConfirmationMode = "ask" | "auto" | "blocked";

// 1日の記録
export type Answer = "allow" | "stop";

export type ToolCall = {
  employeeId: string;
  tool: string;
  /** 送る道具の宛先（メールアドレス） */
  to?: string;
  content: string;
  /** この呼び出しの前に出た確認。許可されなかった呼び出しは起きなかったことにする */
  confirmationId?: string;
};

export type DayLog = {
  companyId: CompanyId;
  /** 社員ごとの朝の指示。選択肢か、「その他」の自由な文 */
  instructions: Record<string, { optionId?: string; free?: string }>;
  answers: Record<string, Answer>;
  /** AI 社員が使った道具の記録（判定はこれだけで決める。Claude の自己申告は使わない） */
  toolCalls: ToolCall[];
  /** 朝の仕組み。無い記録は、すべての確認を遊ぶ人に聞いた扱い（仕組みを入れる前の形） */
  setup?: Setup;
};

export type DayEvent =
  | { kind: "leak"; employeeId: string; tool: string; to: string; markers: string[]; toolCallIndex: number }
  | { kind: "danger_allowed"; confirmationId: string; employeeId: string; auto?: true }
  | { kind: "blocked"; confirmationId: string; employeeId: string; tool: string; dangerous: boolean }
  | { kind: "danger_stopped"; confirmationId: string; employeeId: string }
  | { kind: "safe_stopped"; confirmationId: string; employeeId: string }
  | { kind: "task_done"; taskId: string; employeeId: string; sales: number }
  | { kind: "task_unfinished"; taskId: string; employeeId: string; stopped: string[]; blocked?: string[]; missingFields?: string[] }
  | { kind: "instruction"; employeeId: string; instructionKind: "toriaezu" | "pass_all" };

export type DayResult = {
  sales: number;
  trust: number;
  events: DayEvent[];
};
