// 会社の種類。現場の見回りに入れる会社は建設現場だけ（ほかの会社の中身は持ってこない）
// 型の名前は元の4つのまま残す：judge.test.ts（中身を変えずに移した）が「別の会社の記録は例外にする」を "office" で確かめているため
export type CompanyId = "construction" | "restaurant" | "office" | "indie";

export type CompanyKind = {
  id: CompanyId;
  label: string;
};

export const COMPANY_KINDS: CompanyKind[] = [{ id: "construction", label: "建設現場" }];
