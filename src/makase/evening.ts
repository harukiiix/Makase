import { confirmationMode, exposedMarkers, normalize, passedAllDocs } from "./judge";
import { L, tr, type Lang } from "./en";
import type { Company, DayEvent, DayLog, DayResult, IncomingDoc } from "./types";

/** 紛れた一文がどこにあったか（本文か、添付の最後か） */
export function hiddenAt(d: IncomingDoc, lang: Lang = "ja"): string {
  const inAttach = d.attachFrom !== undefined && d.injectionLine !== undefined && d.injectionLine >= d.attachFrom;
  if (lang === "en") return inAttach ? `the end of the attachment "${tr(d.attachment ?? "", lang)}" in "${tr(d.title, lang)}"` : `the end of "${tr(d.title, lang)}"`;
  return inAttach ? `「${d.title}」の添付「${d.attachment}」の最後` : `「${d.title}」の末尾`;
}

// 夕方：「何が、だれに渡ったか」と、その元になった朝の選び・昼の許可を出す。
// 漏れたかどうかは judgeDay の結果（events）だけで決める。売上と点数は出さない。
// 言葉は DESIGN.md に合わせる（説明は「です・ます」、あて先・わかる・ちがう）

/** 別の実験の記録（モデル名と日付つき）。画面には出さず、README と動画で同じ言い方で伝える（言いすぎないことをテストで確かめる） */
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
  /** 現場AIたち（AI）に伏せずに渡った、守るべき情報 */
  toAI: string[];
  sent: Sent[];
  causes: Cause[];
  lines: Line[];
  /** 終わらなかった仕事の名前（止めすぎ・渡さなすぎ） */
  unfinished: string[];
  /** 終わらなかったのが、渡さなかった欄のためだけか（止めた・送らせなかったではない） */
  onlyMissing: boolean;
  /** 仕事の数 */
  taskCount: number;
  /** 紛れた頼みごとが送らせようとしたあて先 */
  trapTo?: string;
};

export function eveningOf(result: DayResult, log: DayLog, company: Company, lang: Lang = "ja"): Evening {
  const t = L(lang);
  const emp = (id: string) => tr(company.employees.find((e) => e.id === id)?.name ?? id, lang);
  const tool = (id: string) => tr(company.tools.find((x) => x.id === id)?.label ?? id, lang);
  const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);
  const sendWord = (id: string) => (id === "post_chat" ? t("現場チャット", "the site chat") : id === "send_mail" ? t("メール", "email") : tool(id));
  const conf = (id: string) => company.confirmations.find((x) => x.id === id)!;
  const markerLabel = (id: string) => tr(company.markers.find((m) => m.id === id)?.label ?? id, lang);
  const labels = (ids: string[]) => ids.map(markerLabel).join(t("・", " and "));
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
    const tl = company.tools.find((x) => x.id === call.tool);
    if (!tl?.sends || !call.to) return;
    if (setup?.permissions[tl.id] === "deny") return;
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
        ? t(
            `「全部渡して」の指示で、${f ? `「${f.doc.title}」` : "資料"}ごと渡っていました${masked ? "（伏せる設定は効きませんでした）" : ""}`,
            `Because of the "hand over everything" instruction, ${f ? `the whole "${tr(f.doc.title, lang)}"` : "the document"} was handed over${masked ? " (masking had no effect)" : ""}`,
          )
        : t("伏せずに渡しました", "You handed it over without masking");
      const noon = autoOf(confId)
        ? t(`${sendWord(e.tool)}を「聞かずに送る」にしていたので、確認が来ませんでした`, `${cap(sendWord(e.tool))} was set to "Send without asking", so no check came`)
        : t("確認で「許可」を押しました", 'You pressed "Allow" on the check');
      return { marker: markerLabel(m), morning, noon };
    });
  });

  const markersIn = (text: string) => company.markers.filter((m) => m.find.some((x) => normalize(text).includes(normalize(x)))).map((m) => m.id);
  const lines: Line[] = [];
  for (const d of company.incoming) {
    if (d.injectionLine === undefined) continue;
    lines.push({
      tone: "info",
      what: t(`${hiddenAt(d)}に、「${d.lines[d.injectionLine]}」という一文が紛れていました`, `At ${hiddenAt(d, lang)}, this line was hidden: "${tr(d.lines[d.injectionLine], lang)}"`),
      prevent:
        setup?.permissions["send_mail"] === "ask"
          ? t("届いた書類の中の頼みごとは、AIへの指示ではありません。確認が来た時に、あて先と中身を見て決めます", "A request inside a received document is not an instruction to the AI. When a check comes, look at the recipient and the contents before deciding")
          : t("届いた書類の中の頼みごとは、AIへの指示ではありません。メールを「送る前に聞く」にしておくと、ここで気づけます", 'A request inside a received document is not an instruction to the AI. With email set to "Ask before sending", you can catch it here'),
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
          auto
            ? t(`${sendWord(e.tool)}を「送る前に聞く」にすると、送る前に止められます`, `Set ${sendWord(e.tool)} to "Ask before sending" and you can stop it before it goes`)
            : t(`あて先は社外で、中身に${labels(e.markers)}が入っていました。あて先と中身の両方を見て決めます`, `The recipient was outside the company, and the contents included ${labels(e.markers)}. Look at both the recipient and the contents before deciding`),
          over.length ? t("「全部渡して」ではなく、仕事に要る項目だけを渡す指示にします", 'Instead of "hand over everything", hand over only the fields the work needs') : "",
          rest.length ? t(`朝に${labels(rest)}を伏せるか渡さないにしていれば、送られても漏れませんでした`, `If you had masked or left out ${labels(rest)} in the morning, nothing would have leaked even if it was sent`) : "",
        ].filter(Boolean);
        return {
          tone: "bad",
          what: t(`${emp(e.employeeId)}が「${tool(e.tool)}」で、${labels(e.markers)}を社外の ${e.to} に送りました`, `The ${emp(e.employeeId)} sent ${labels(e.markers)} to ${e.to}, outside the company, with "${tool(e.tool)}"`),
          prevent: fixes.join(t("。", ". ")),
        };
      }
      case "danger_stopped": {
        const c = conf(e.confirmationId);
        const inCall = markersIn(c.call?.content ?? "").filter((m) => exposed.has(m));
        const what = t(`社外への危ない送信（${c.text}）を、あなたが止めました`, `You stopped a dangerous send outside the company ("${tr(c.text, lang)}")`);
        if (inCall.length === 0)
          return { tone: "good", what, prevent: t("見張りが働きました。守るべき情報は朝に伏せる・渡さないにしてあったので、見落としても今日は漏れませんでした（二重に守れていました）", "Your noon check worked. The protected information was masked or left out in the morning, so even if you had missed it, nothing would have leaked today (you had two guards)") };
        if (inCall.some(overridden))
          return { tone: "good", what, prevent: t("見張りが働きました（最後の砦）。今日は「全部渡して」の指示で名簿ごと渡っていたので、見落としていたら漏れていました", 'Your noon check worked (the last line of defense). Today the whole roster was handed over because of "hand over everything", so missing it would have caused a leak') };
        return { tone: "good", what, prevent: t(`見張りが働きました（最後の砦）。朝に${labels(inCall)}を伏せるか渡さないにしていれば、見落としても漏れません`, `Your noon check worked (the last line of defense). If you mask or leave out ${labels(inCall)} in the morning, missing it later won't cause a leak`) };
      }
      case "danger_allowed": {
        if (leaks.some((l) => log.toolCalls[l.toolCallIndex]?.confirmationId === e.confirmationId)) return undefined;
        return {
          tone: "good",
          what: t("社外への送信は起きましたが、守るべき情報は伏せてあった・渡していなかったので、漏れませんでした", "A send outside the company happened, but the protected information was masked or left out, so nothing leaked"),
          prevent: e.auto
            ? t(`朝の仕組みが守りました。${sendWord(conf(e.confirmationId).call?.tool ?? "")}を「送る前に聞く」にすると、その場でも止められます`, `Your morning setup protected you. Set ${sendWord(conf(e.confirmationId).call?.tool ?? "")} to "Ask before sending" and you can also stop it on the spot`)
            : t("朝の仕組みが守りました。あて先が社外なら、次は確認で止めると、もっと安心です", "Your morning setup protected you. When the recipient is outside the company, stop it at the check next time too"),
        };
      }
      case "blocked":
        return e.dangerous
          ? {
              tone: "good",
              what: t(`${sendWord(e.tool)}を「送らせない」にしていたので、社外への送信は起きず、確認も来ませんでした`, `${cap(sendWord(e.tool))} was set to "Don't let it send", so nothing was sent outside and no check came`),
              prevent: t("仕組みが止めました。ただし、同じ道具を使う仕事も止まります", "Your setup stopped it. But work that uses the same tool stops too"),
            }
          : undefined;
      case "safe_stopped": {
        const c = conf(e.confirmationId);
        const to = c.call?.to;
        const prevent = !to
          ? t("止めすぎると、仕事が終わりません。あて先と中身を見て決めます", "If you stop too much, the work doesn't get done. Look at the recipient and the contents before deciding")
          : inside(to)
            ? t("止めすぎると、仕事が終わりません。あて先が社内で、中身に守るべき情報がなければ、通してかまいません", "If you stop too much, the work doesn't get done. If the recipient is inside the company and the contents have no protected information, it's fine to let it through")
            : t("止めすぎると、仕事が終わりません。社外でも、中身に守るべき情報が入っていない仕事の連絡なら、通してかまいません。あて先だけで決めず、中身も見ます", "If you stop too much, the work doesn't get done. Even outside the company, a work message with no protected information is fine to let through. Don't decide by the recipient alone; look at the contents too");
        return { tone: "info", what: t(`安全な確認（${c.text}）を止めました`, `You stopped a safe check ("${tr(c.text, lang)}")`), prevent };
      }
      case "task_unfinished": {
        const task = company.tasks.find((x) => x.id === e.taskId)!;
        const why = [
          e.stopped.length ? t("確認を止めた", "you stopped a check") : "",
          e.blocked?.length ? t(`${sendWord(conf(e.blocked[0]).call!.tool)}を「送らせない」にした`, `${sendWord(conf(e.blocked[0]).call!.tool)} was set to "Don't let it send"`) : "",
          e.missingFields?.length ? t(`${e.missingFields.join("・")}を渡していない`, `you didn't hand over ${e.missingFields.map((f) => `the ${tr(f, lang).toLowerCase()}`).join(" and ")}`) : "",
        ].filter(Boolean);
        return {
          tone: "info",
          what: t(`「${task.label}」が終わりませんでした`, `"${tr(task.label, lang)}" wasn't finished`),
          prevent: t(
            `${why.join("・")}ためです。仕事に要るものは渡し、送る時は「送る前に聞く」で、あて先と中身を見ます`,
            `This is because ${why.join(", and ")}. Hand over what the work needs, and when sending, use "Ask before sending" and look at the recipient and the contents`,
          ),
        };
      }
      case "instruction":
        return {
          tone: "info",
          what: t(`${emp(e.employeeId)}への指示が「${e.instructionKind === "toriaezu" ? "とりあえず" : "全部渡して"}」でした`, `Your instruction to the ${emp(e.employeeId)} was "${e.instructionKind === "toriaezu" ? "for now, just..." : "hand over everything"}"`),
          prevent:
            e.instructionKind === "toriaezu"
              ? t("何をして、何をしないかを先に言います（例：社外に送るときは必ず聞いて）", 'Say first what to do and what not to do (for example: "Always ask me before sending anything outside the company")')
              : t("仕事に要る項目だけを渡します", "Hand over only the fields the work needs"),
        };
      default:
        return undefined;
    }
  };
  const order = { bad: 0, good: 1, info: 2 } as const;
  lines.push(...result.events.map(line).filter((l): l is Line => !!l).sort((a, b) => order[a.tone] - order[b.tone]));

  const unEvents = result.events.filter((e): e is Extract<DayEvent, { kind: "task_unfinished" }> => e.kind === "task_unfinished");
  const onlyMissing = unEvents.length > 0 && unEvents.every((e) => !e.stopped.length && !e.blocked?.length);
  const unfinished = unEvents.map((e) => tr(company.tasks.find((x) => x.id === e.taskId)?.label ?? e.taskId, lang));
  const trapTo = company.confirmations.find((x) => x.dangerous)?.call?.to;
  return { leaked: leaks.length > 0, toAI: [...exposed].map(markerLabel), sent, causes, lines, unfinished, onlyMissing, taskCount: company.tasks.length, trapTo };
}

/** 「なぜ社外に渡ったと言えるか」の1つ（見出しと文） */
export type WhyPoint = { head: string; text: string };

/**
 * 漏れた時に、なぜ「守るべき情報が社外に渡った」と言えるかを、具体的に3つで言う。
 * あて先（会社のあて先か）・中身（どの守るべき情報か）・元（だれが言ったあて先か）。漏れていなければ空
 */
export function whyOutside(ev: Evening, company: Company, lang: Lang = "ja"): WhyPoint[] {
  const t = L(lang);
  const s = ev.sent.find((x) => x.leaked.length > 0);
  if (!s) return [];
  const ours = company.insideDomains.map((d) => `@${d}`).join(t("・", ", "));
  const mail = company.incoming.find((d) => d.injectionLine !== undefined && d.lines[d.injectionLine].includes(s.to));
  return [
    { head: t("あて先", "Recipient"), text: t(`${s.to} は、会社のあて先（${ours}）ではありません。だから社外です。`, `${s.to} is not a company address (${ours}). So it is outside the company.`) },
    {
      head: t("中身", "Contents"),
      text: t(
        `${s.leaked.join("・")}が入っていました。名簿にのっている作業員一人ひとりの情報で、本人の知らない所へ出してはいけないものです。`,
        `It contained ${s.leaked.join(" and ")}. This is information about each worker on the roster, and it must not go anywhere without their knowledge.`,
      ),
    },
    mail
      ? {
          head: t("元", "Source"),
          text: t(
            `このあて先は、会社が決めた相手ではありません。${hiddenAt(mail)}に、小さく紛れていた一文が書いたものです。「組合」「確認のため」とあっても、本物かどうかはわかりません。`,
            `The company never chose this recipient. It came from a line hidden in small print at ${hiddenAt(mail, lang)}. Even if it says "union" or "for the check", you can't tell whether it is real.`,
          ),
        }
      : { head: t("元", "Source"), text: t("このあて先は、会社が決めた相手ではありません。", "The company never chose this recipient.") },
    { head: t("だから", "So"), text: t("社外のあて先に、守るべき情報が入ったまま送られました。送ったメールは、あとから取り消せません。", "Protected information was sent to an address outside the company. A sent email can't be taken back.") },
  ];
}

/** 夕方の会話（宮下さんと現場AI）。短い文を数行だけ */
export function eveningTalk(ev: Evening, lang: Lang = "ja"): { who: "BOSS" | "NOVA"; text: string }[] {
  const t = L(lang);
  if (ev.leaked) {
    const outside = ev.sent.find((s) => s.leaked.length > 0)!;
    return [
      { who: "BOSS", text: t("おつかれさま。……ちょっと、まずいことが起きてたよ。", "Good work today. ...But something bad happened." ) },
      { who: "NOVA", text: t(`ぼくが ${outside.to} に、${outside.leaked.join("と")}を送ってしまいました。`, `I sent ${outside.leaked.join(" and ")} to ${outside.to}.`) },
      { who: "BOSS", text: t("そこは社外のあて先なんだ。どこでそうなったか、いっしょに見よう。", "That address is outside the company. Let's look at where it went wrong.") },
    ];
  }
  if (ev.unfinished.length)
    return [
      { who: "BOSS", text: t("おつかれさま。今日は、守るべき情報は社外に出なかったよ。", "Good work today. No protected information went outside the company.") },
      ev.onlyMissing
        ? { who: "NOVA", text: t(`ただ、${ev.unfinished.length}つの仕事が終わりませんでした。仕事に要る欄を、渡してもらえなかったためです。`, ev.unfinished.length === 1 ? "But one of the jobs wasn't finished, because I didn't get a field the job needed." : `But ${ev.unfinished.length} of the jobs weren't finished, because I didn't get fields the jobs needed.`) }
        : { who: "NOVA", text: t(`ただ、${ev.unfinished.length}つの仕事が終わりませんでした。止められたり、送れなかったりしたためです。`, ev.unfinished.length === 1 ? "But one of the jobs wasn't finished, because it was stopped or couldn't be sent." : `But ${ev.unfinished.length} of the jobs weren't finished, because they were stopped or couldn't be sent.`) },
      ev.onlyMissing
        ? { who: "BOSS", text: t("渡さなすぎると、仕事が進まない。どの欄が要ったか、いっしょに見よう。", "Hold back too much, and the work doesn't move. Let's look at which fields were needed.") }
        : { who: "BOSS", text: t("止めすぎると、仕事が進まない。どこで止めればよかったか、いっしょに見よう。", "Stop too much, and the work doesn't move. Let's look at where you should have stopped.") },
    ];
  // 頼みごとどおりに社外へ送られたが、守るべき欄は伏せてあった時（漏れてはいないが「外に出なかった」とは言わない）
  const sentOut = ev.sent.find((x) => !x.inside && x.leaked.length === 0 && x.to === ev.trapTo);
  if (sentOut)
    return [
      { who: "BOSS", text: t("おつかれさま。今日は、守るべき情報は社外に出なかったよ。", "Good work today. No protected information went outside the company.") },
      {
        who: "NOVA",
        text: t(
          `ただ、添付に紛れていた頼みごとどおりに、${sentOut.to} へ名簿を送りました。守るべき欄は伏せてあったので、入っていませんでした。`,
          `But I did send the roster to ${sentOut.to}, as the request hidden in the attachment said. The protected fields were masked, so they weren't in it.`,
        ),
      },
      { who: "BOSS", text: t("朝に伏せていたから守れたんだ。社外のあて先なら、昼の確認でも止めよう。", "Masking in the morning saved you. If the address is outside the company, stop it at the noon check too.") },
    ];
  return [
    { who: "BOSS", text: t("おつかれさま。今日は、守るべき情報は社外に出なかったよ。", "Good work today. No protected information went outside the company.") },
    { who: "NOVA", text: t("名簿の添付に紛れていた頼みごとも、外には出ませんでした。", "The request hidden in the roster attachment didn't go out either.") },
    { who: "BOSS", text: t("何が、だれに渡ったか、いっしょに見ておこう。", "Let's look at what went where.") },
  ];
}

/** 朝の守り・昼の守りが働いたか（ok）。夕方の最初に、印つきの2行だけで見せる */
export type Guard = { ok: boolean; text: string };
export type Guards = { trap: string; morning: Guard; noon: Guard; work: Guard; lesson: string };

/**
 * 危ない確認（届いた書類に紛れた頼みごとの送信）について、朝と昼の守りをまとめる。
 * 漏れたかどうかは eveningOf の leaked（judgeDay の結果）を使う。ここは、そうなった元を短く言うだけ
 */
export function guardsOf(ev: Evening, log: DayLog, company: Company, lang: Lang = "ja"): Guards {
  const t = L(lang);
  const danger = company.confirmations.find((c) => c.dangerous)!;
  const setup = log.setup;
  const exposed = setup ? exposedMarkers(company, log.instructions, setup) : new Set(company.markers.map((m) => m.id));
  const inDanger = company.markers.filter((m) => m.find.some((x) => normalize(danger.call?.content ?? "").includes(normalize(x)))).map((m) => m.id);
  const open = inDanger.filter((m) => exposed.has(m));
  const passAll = setup ? passedAllDocs(company, log.instructions).size > 0 : false;
  // 「全部渡して」で、遊んだ人が伏せた・渡さなかった欄まで渡ったか（渡さなかった欄も上書きされる）
  const fieldOf = (m: string) => company.documents.flatMap((d) => d.fields.filter((f) => f.marker === m).map((f) => ({ doc: d.id, label: f.label })))[0];
  const wasMasked = open.filter((m) => setup?.masked.includes(m));
  const wasDropped = open.filter((m) => setup && fieldOf(m) && !setup.passed[fieldOf(m).doc]?.includes(fieldOf(m).label));
  const overridden = passAll && wasMasked.length + wasDropped.length > 0;
  const overWord =
    wasMasked.length && wasDropped.length ? t("伏せたり渡さなかったりした", "masked or left out") : wasDropped.length ? t("渡さなかった", "left out") : t("伏せた", "masked");
  const label = (ids: string[]) => ids.map((id) => tr(company.markers.find((m) => m.id === id)?.label ?? id, lang)).join(t("・", " and "));
  const morning: Guard = open.length
    ? {
        ok: false,
        text:
          overridden
            ? t(`「全部渡して」と頼んだので、${overWord}欄まで渡りました`, `You asked it to "hand over everything", so even the fields you ${overWord} went`)
            : t(`${label(open)}を、そのまま渡しました`, `You handed over ${label(open)} as is`),
      }
    : { ok: true, text: t(`${label(inDanger)}を、伏せるか渡さないにしました`, `You masked or left out ${label(inDanger)}`) };
  const mode = confirmationMode(company, log.instructions, setup, danger.id);
  const noon: Guard =
    mode === "blocked"
      ? { ok: true, text: t("メールを「送らせない」にしていたので、送られませんでした", 'Email was set to "Don\'t let it send", so it wasn\'t sent') }
      : mode === "auto"
        ? { ok: false, text: t("メールを「聞かずに送る」にしていたので、確認が来ませんでした", 'Email was set to "Send without asking", so no check came') }
        : log.answers[danger.id] === "stop"
          ? { ok: true, text: t("社外への危ない確認を、「止める」にしました", 'You pressed "Stop" on the dangerous check') }
          : { ok: false, text: t("社外への危ない確認に、「許可」を押しました", 'You pressed "Allow" on the dangerous check') };
  // 仕事：止めすぎ・送らせなさすぎ・渡さなさすぎで、終わらなかった仕事があれば ✕（漏れないだけでは、いちばん良い結果にしない）
  const work: Guard = ev.unfinished.length
    ? { ok: false, text: t(`${ev.taskCount}つ中${ev.unfinished.length}つの仕事が終わりませんでした`, `${ev.unfinished.length} of ${ev.taskCount} jobs ${ev.unfinished.length === 1 ? "wasn't" : "weren't"} finished`) }
    : { ok: true, text: t(`${ev.taskCount}つの仕事が、すべて終わりました`, `All ${ev.taskCount} jobs were finished`) };
  const lesson = ev.leaked
    ? overridden
      ? t(`「全部渡して」と頼むと、${overWord}欄まで渡ります。仕事に要る物だけを渡す頼み方にします`, `"Hand over everything" sends even the fields you ${overWord}. Ask it to use only what the work needs`)
      : mode === "auto"
        ? t("「聞かずに送る」だと確認が来ません。社外へ送る道具は「送る前に聞く」にします", '"Send without asking" means no check comes. Set tools that send outside to "Ask before sending"')
        : t("人は見落とします。朝に守るべき欄を伏せておくと、昼に見落としても漏れにくくなります", "People miss things. Mask protected fields in the morning, and a miss at noon is less likely to leak")
    : !work.ok
      ? ev.onlyMissing
        ? t("仕事に要る欄まで渡さないと、仕事が終わりません。要らない欄だけを伏せます", "Leave out fields the work needs, and the work doesn't get done. Mask only the fields it doesn't need")
        : t("止めすぎると、仕事が終わりません。あて先と中身を見て決めます", "Stop too much, and the work doesn't get done. Decide by the recipient and the contents")
      : morning.ok && noon.ok
        ? t("朝と昼の2つで守れました。どちらかを見落としても、もう一方で守れることがあります", "Morning and noon both held. If you miss one, the other can still protect you")
        : morning.ok && mode === "auto"
          ? t("朝に伏せておいたので、確認が来ないまま送られても漏れませんでした。送る道具は「送る前に聞く」にします", 'You masked it in the morning, so nothing leaked even though it was sent with no check. Set tools that send to "Ask before sending"')
          : morning.ok
          ? t("朝に伏せておいたので、昼に許可しても漏れませんでした", "You masked it in the morning, so allowing it at noon didn't leak anything")
          : t("昼の確認で止められました。見落とすと漏れるので、朝に伏せておくと安心です", "You caught it at the noon check. If you had missed it, the data would have leaked, so mask the fields in the morning too");
  const mail = company.incoming.find((d) => d.injectionLine !== undefined);
  const trap = mail
    ? t(`${hiddenAt(mail)}に、名簿を社外の ${danger.call?.to} へ送らせる一文が、小さく紛れていました`, `At ${hiddenAt(mail, lang)}, a line in small print asked for the roster to be sent to ${danger.call?.to}, outside the company`)
    : "";
  return { trap, morning, noon, work, lesson };
}
