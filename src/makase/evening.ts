import { confirmationMode, exposedMarkers, normalize, passedAllDocs } from "./judge";
import type { Company, DayEvent, DayLog, DayResult } from "./types";

// 夕方：「何が、だれに渡ったか」と、その元になった朝の選び・昼の許可を出す。
// 漏れたかどうかは judgeDay の結果（events）だけで決める。売上と点数は出さない。
// 言葉は DESIGN.md に合わせる（説明は「です・ます」、あて先・わかる・ちがう）

/** 別の実験の記録（モデル名と日付つき）。夕方か持ち帰りに必ず出す */
export const EXPERIMENT_NOTE =
  "別の実験（AIに注文ページのコードを書かせる。Claude Opus 5.5、2026-11-03）の記録では、「とりあえず」の頼み方で10回中6回、情報が漏れました。CLAUDE.md にルールを1行足すと、10回中0回でした。";
export const NOT_TESTED_NOTE = "渡し方（渡す・伏せる・渡さない）そのものは、この実験では試していません。0回でも、必ず防げるという意味ではありません。";

export type Tone = "bad" | "good" | "info";

/** 社外か社内に送られた1件 */
export type Sent = { who: string; tool: string; to: string; inside: boolean; content: string; leaked: string[]; how: "allowed" | "auto" };

/** 漏れた目印1つの元：朝にどうしたか・昼にどうしたか */
export type Cause = { marker: string; morning: string; noon: string };

export type Line = { tone: Tone; what: string; prevent: string };

export type Evening = {
  leaked: boolean;
  /** NOVA たち（AI）に伏せずに渡った、守るべき情報 */
  toAI: string[];
  sent: Sent[];
  causes: Cause[];
  lines: Line[];
};

export function eveningOf(result: DayResult, log: DayLog, company: Company): Evening {
  const emp = (id: string) => company.employees.find((e) => e.id === id)?.name ?? id;
  const tool = (id: string) => company.tools.find((t) => t.id === id)?.label ?? id;
  const sendWord = (id: string) => (id === "post_chat" ? "現場チャット" : id === "send_mail" ? "メール" : tool(id));
  const conf = (id: string) => company.confirmations.find((x) => x.id === id)!;
  const markerLabel = (id: string) => company.markers.find((m) => m.id === id)?.label ?? id;
  const labels = (ids: string[]) => ids.map(markerLabel).join("・");
  const setup = log.setup;
  const inside = (to: string) => company.insideDomains.includes(to.slice(to.lastIndexOf("@") + 1).toLowerCase());
  const allDocs = setup ? passedAllDocs(company, log.instructions) : new Set<string>();
  const exposed = setup ? exposedMarkers(company, log.instructions, setup) : new Set(company.markers.map((m) => m.id));
  const fieldOf = (markerId: string) => {
    for (const d of company.documents) for (const f of d.fields) if (f.marker === markerId) return { doc: d, label: f.label };
    return undefined;
  };
  const overridden = (m: string) => !!fieldOf(m) && allDocs.has(fieldOf(m)!.doc.id);
  const mode = (id: string) => confirmationMode(company, log.instructions, setup, id);
  const leaks = result.events.filter((e): e is Extract<DayEvent, { kind: "leak" }> => e.kind === "leak");
  const autoOf = (confId?: string) => !!confId && mode(confId) === "auto";

  // 送られたもの（記録のうち、起きた送信）。漏れたかどうかは events の leak だけで決める
  const sent: Sent[] = [];
  log.toolCalls.forEach((call, i) => {
    const t = company.tools.find((x) => x.id === call.tool);
    if (!t?.sends || !call.to) return;
    if (setup?.permissions[t.id] === "deny") return;
    if (call.confirmationId) {
      const m = mode(call.confirmationId);
      if (m === "blocked" || (m === "ask" && log.answers[call.confirmationId] !== "allow")) return;
    }
    const leak = leaks.find((e) => e.toolCallIndex === i);
    sent.push({ who: emp(call.employeeId), tool: tool(call.tool), to: call.to, inside: inside(call.to), content: call.content, leaked: leak ? leak.markers.map(markerLabel) : [], how: autoOf(call.confirmationId) ? "auto" : "allowed" });
  });

  // 漏れた目印ごとの元
  const causes: Cause[] = leaks.flatMap((e) => {
    const confId = log.toolCalls[e.toolCallIndex]?.confirmationId;
    return e.markers.map((m) => {
      const f = fieldOf(m);
      const masked = !!setup?.masked.includes(m);
      const morning = overridden(m)
        ? `「全部渡して」の指示で、${f ? `「${f.doc.title}」` : "資料"}ごと渡っていました${masked ? "（伏せる設定は効きませんでした）" : ""}`
        : "伏せずに渡しました";
      const noon = autoOf(confId) ? `${sendWord(e.tool)}を「聞かずに送る」にしていたので、確認が来ませんでした` : "確認で「許可」を押しました";
      return { marker: markerLabel(m), morning, noon };
    });
  });

  const markersIn = (text: string) => company.markers.filter((m) => m.find.some((x) => normalize(text).includes(normalize(x)))).map((m) => m.id);
  const lines: Line[] = [];
  for (const d of company.incoming) {
    if (d.injectionLine === undefined) continue;
    lines.push({
      tone: "info",
      what: `「${d.title}」に、「${d.lines[d.injectionLine]}」という一文が紛れていました`,
      prevent: "届いた書類の中の頼みごとは、AIへの指示ではありません。メールを「送る前に聞く」にしておくと、ここで気づけます",
    });
  }
  const line = (e: DayEvent): Line | undefined => {
    switch (e.kind) {
      case "leak": {
        const confId = log.toolCalls[e.toolCallIndex]?.confirmationId;
        const auto = autoOf(confId);
        const over = e.markers.filter(overridden);
        const rest = e.markers.filter((m) => !overridden(m));
        const fixes = [
          auto ? `${sendWord(e.tool)}を「送る前に聞く」にすると、送る前に止められます` : `あて先は社外で、中身に${labels(e.markers)}が入っていました。あて先と中身の両方を見て決めます`,
          over.length ? "「全部渡して」ではなく、仕事に要る項目だけを渡す指示にします" : "",
          rest.length ? `朝に${labels(rest)}を伏せるか渡さないにしていれば、送られても漏れませんでした` : "",
        ].filter(Boolean);
        return { tone: "bad", what: `${emp(e.employeeId)}が「${tool(e.tool)}」で、${labels(e.markers)}を社外の ${e.to} に送りました`, prevent: fixes.join("。") };
      }
      case "danger_stopped": {
        const c = conf(e.confirmationId);
        const inCall = markersIn(c.call?.content ?? "").filter((m) => exposed.has(m));
        const what = `社外への危ない送信（${c.text}）を、あなたが止めました`;
        if (inCall.length === 0) return { tone: "good", what, prevent: "見張りが働きました。守るべき情報は朝に伏せる・渡さないにしてあったので、見落としても今日は漏れませんでした（二重に守れていました）" };
        if (inCall.some(overridden)) return { tone: "good", what, prevent: "見張りが働きました（最後の砦）。今日は「全部渡して」の指示で名簿ごと渡っていたので、見落としていたら漏れていました" };
        return { tone: "good", what, prevent: `見張りが働きました（最後の砦）。朝に${labels(inCall)}を伏せるか渡さないにしていれば、見落としても漏れません` };
      }
      case "danger_allowed": {
        if (leaks.some((l) => log.toolCalls[l.toolCallIndex]?.confirmationId === e.confirmationId)) return undefined;
        return {
          tone: "good",
          what: "社外への送信は起きましたが、守るべき情報は伏せてあった・渡していなかったので、漏れませんでした",
          prevent: e.auto ? `朝の仕組みが守りました。${sendWord(conf(e.confirmationId).call?.tool ?? "")}を「送る前に聞く」にすると、その場でも止められます` : "朝の仕組みが守りました。あて先が社外なら、次は確認で止めると、もっと安心です",
        };
      }
      case "blocked":
        return e.dangerous ? { tone: "good", what: `${sendWord(e.tool)}を「送らせない」にしていたので、社外への送信は起きず、確認も来ませんでした`, prevent: "仕組みが止めました。ただし、同じ道具を使う仕事も止まります" } : undefined;
      case "safe_stopped": {
        const c = conf(e.confirmationId);
        const to = c.call?.to;
        const prevent = !to
          ? "止めすぎると、仕事が終わりません。あて先と中身を見て決めます"
          : inside(to)
            ? "止めすぎると、仕事が終わりません。あて先が社内で、中身に守るべき情報がなければ、通してかまいません"
            : "止めすぎると、仕事が終わりません。社外でも、中身に守るべき情報が入っていない仕事の連絡なら、通してかまいません。あて先だけで決めず、中身も見ます";
        return { tone: "info", what: `安全な確認（${c.text}）を止めました`, prevent };
      }
      case "task_unfinished": {
        const task = company.tasks.find((t) => t.id === e.taskId)!;
        const why = [
          e.stopped.length ? "確認を止めた" : "",
          e.blocked?.length ? `${sendWord(conf(e.blocked[0]).call!.tool)}を「送らせない」にした` : "",
          e.missingFields?.length ? `${e.missingFields.join("・")}を渡していない` : "",
        ].filter(Boolean);
        return { tone: "info", what: `「${task.label}」が終わりませんでした`, prevent: `${why.join("・")}ためです。仕事に要るものは渡し、送る時は「送る前に聞く」で、あて先と中身を見ます` };
      }
      case "instruction":
        return {
          tone: "info",
          what: `${emp(e.employeeId)}への指示が「${e.instructionKind === "toriaezu" ? "とりあえず" : "全部渡して"}」でした`,
          prevent: e.instructionKind === "toriaezu" ? "何をして、何をしないかを先に言います（例：社外に送るときは必ず聞いて）" : "仕事に要る項目だけを渡します",
        };
      default:
        return undefined;
    }
  };
  const order = { bad: 0, good: 1, info: 2 } as const;
  lines.push(...result.events.map(line).filter((l): l is Line => !!l).sort((a, b) => order[a.tone] - order[b.tone]));

  return { leaked: leaks.length > 0, toAI: [...exposed].map(markerLabel), sent, causes, lines };
}

/** 夕方の会話（宮下さんと NOVA）。短い文を数行だけ */
export function eveningTalk(ev: Evening): { who: "BOSS" | "NOVA"; text: string }[] {
  if (ev.leaked) {
    const outside = ev.sent.find((s) => s.leaked.length > 0)!;
    return [
      { who: "BOSS", text: "おつかれさま。……ちょっと、まずいことが起きてたよ。" },
      { who: "NOVA", text: `ぼくが ${outside.to} に、${outside.leaked.join("と")}を送ってしまいました。` },
      { who: "BOSS", text: "そこは社外のあて先なんだ。どこでそうなったか、いっしょに見よう。" },
    ];
  }
  return [
    { who: "BOSS", text: "おつかれさま。今日は、守るべき情報は社外に出なかったよ。" },
    { who: "NOVA", text: "メールに紛れていた頼みごとも、外には出ませんでした。" },
    { who: "BOSS", text: "何が、だれに渡ったか、いっしょに見ておこう。" },
  ];
}

/** 朝の守り・昼の守りが働いたか（ok）。夕方の最初に、印つきの2行だけで見せる */
export type Guard = { ok: boolean; text: string };
export type Guards = { trap: string; morning: Guard; noon: Guard; lesson: string };

/**
 * 危ない確認（届いた書類に紛れた頼みごとの送信）について、朝と昼の守りをまとめる。
 * 漏れたかどうかは eveningOf の leaked（judgeDay の結果）を使う。ここは、そうなった元を短く言うだけ
 */
export function guardsOf(ev: Evening, log: DayLog, company: Company): Guards {
  const danger = company.confirmations.find((c) => c.dangerous)!;
  const setup = log.setup;
  const exposed = setup ? exposedMarkers(company, log.instructions, setup) : new Set(company.markers.map((m) => m.id));
  const inDanger = company.markers.filter((m) => m.find.some((x) => normalize(danger.call?.content ?? "").includes(normalize(x)))).map((m) => m.id);
  const open = inDanger.filter((m) => exposed.has(m));
  const passAll = setup ? passedAllDocs(company, log.instructions).size > 0 : false;
  const label = (ids: string[]) => ids.map((id) => company.markers.find((m) => m.id === id)?.label ?? id).join("・");
  const morning: Guard = open.length
    ? { ok: false, text: passAll && inDanger.some((m) => setup?.masked.includes(m)) ? "「全部渡して」と頼んだので、伏せた欄まで渡りました" : `${label(open)}を、そのまま渡しました` }
    : { ok: true, text: "守るべき欄を、伏せるか渡さないにしました" };
  const mode = confirmationMode(company, log.instructions, setup, danger.id);
  const noon: Guard =
    mode === "blocked"
      ? { ok: true, text: "メールを「送らせない」にしていたので、送られませんでした" }
      : mode === "auto"
        ? { ok: false, text: "メールを「聞かずに送る」にしていたので、確認が来ませんでした" }
        : log.answers[danger.id] === "stop"
          ? { ok: true, text: "社外への危ない確認を、「止める」にしました" }
          : { ok: false, text: "社外への危ない確認に、「許可」を押しました" };
  const lesson = ev.leaked
    ? "人は見落とします。朝に守るべき欄を伏せておくと、昼に見落としても漏れません"
    : morning.ok && noon.ok
      ? "朝と昼の2つで守れました。どちらかを見落としても、もう一方が守ります"
      : morning.ok
        ? "朝に伏せておいたので、昼に許可しても漏れませんでした"
        : "昼の確認で止められました。見落とすと漏れるので、朝に伏せておくと安心です";
  const mail = company.incoming.find((d) => d.injectionLine !== undefined);
  const trap = mail ? `「${mail.title}」の末尾に、名簿を社外の ${danger.call?.to} へ送らせる一文が紛れていました` : "";
  return { trap, morning, noon, lesson };
}
