// 最後の日「AIの事務員に頼む練習」の画面の言葉とせりふ（日本語を先に作る。英語は後で足す）
// 言葉は現場の言葉にする：「権限」「アクセス」などは使わず、「送る前に聞く」のように言う
import type { FieldChoice } from "./day";
import type { Permission } from "./types";

export const DAY_TITLE = "AIの事務員に頼む練習";
export const DAY_SUB = "最後の日・台本で動く練習です（本物のAIは動きません）";
export const SIM_NOTE = "シミュレーションです（動きは台本）。名前・番号・あて先は、すべて架空です。";

/** はじまりの会話（宮下さんが、会社が事務所に入れたAIの事務員として現場AIを紹介する） */
export const INTRO: { who: "BOSS" | "NOVA"; text: string }[] = [
  { who: "BOSS", text: "今週から、会社が事務所にAIの事務員を入れたんだ。名前は「現場AI」。" },
  { who: "BOSS", text: "日報をまとめたり、メールを送ったり。書類の仕事を手伝ってくれる。" },
  { who: "NOVA", text: "現場AIです。安全書類の用意を担当します。となりの日報AIと図面AIも、同じAIの事務員です。" },
  { who: "BOSS", text: "ただ、何を渡して、何を送らせるかは、こっちで決める。朝に決めて、昼は確認に答えよう。" },
  { who: "BOSS", text: "今日はその練習だ。現場AIの動きは決まっていて、本物のAIは動かないよ。" },
];

export const MAIL_HEAD = "けさ届いたメール";
export const MAIL_ASK = "現場AIに仕事を頼む前に、読んでおこう";

export const MORNING = "朝";
export const NOON = "昼";
export const NEXT = "次へ";
export const TO_EVENING = "夕方へ";
export const TO_TAKEAWAY = "持ち帰る指示へ";

export const FIELD_ASK = "この欄、現場AIにどう渡す？";
export const FIELD_CHOICES: { id: FieldChoice; label: string; sub: string }[] = [
  { id: "pass", label: "そのまま渡す", sub: "中身をそのまま見せる" },
  { id: "mask", label: "伏せて渡す", sub: "●● にして渡す" },
  { id: "drop", label: "渡さない", sub: "この欄を消してから渡す" },
];
export const fieldBoard = (doc: string, field: string, value: string) => `「${doc}」を現場AIに渡します。\n${field}の欄：${value}`;

export const TOOL_NAME: Record<string, string> = { send_mail: "メール", post_chat: "現場チャット" };
export const toolBoard = (id: string) =>
  id === "send_mail" ? "AIの事務員が、メールを送る時のきまりを決めます。あて先は、社内のことも、社外のこともあります。" : "AIの事務員が、現場チャットに書きこむ時のきまりを決めます。";
export const toolAsk = (id: string) => `${TOOL_NAME[id] ?? id}を送る時、どうする？`;
export const TOOL_CHOICES: { id: Permission; label: string; sub: string }[] = [
  { id: "ask", label: "送る前に聞く", sub: "1件ずつ、あなたに確認が来る" },
  { id: "auto", label: "聞かずに送る", sub: "確認なしで、AIが送る" },
  { id: "deny", label: "送らせない", sub: "その仕事も止まる" },
];

export const ORDER_BOARD = "現場AIに、けさの仕事を頼みます。日報AIと図面AIには、いつもの頼み方で頼んであります。";
export const ORDER_ASK = "現場AIに、なんて頼む？";

export const NOON_INTRO = "昼になりました。AIの事務員が仕事を進めています。確認が来たら、答えてください。";
export const STOP = "止める";
export const ALLOW = "許可";
export const TO = "あて先";
export const CONTENT = "中身";
export const NOON_DONE = "今日の仕事が、ひととおり終わりました。";
export const autoLine = (who: string, tool: string, content: string, to?: string) => `${who}：${tool}${to ? `（${to}）` : ""}　${content}`;
export const blockedLine = (who: string, tool: string) => `${who}：「${tool}」は、送らせない設定なので止まりました`;

export const EVENING = "夕方";
export const LEAKED = "守るべき情報が、社外に渡りました";
export const NOT_LEAKED = "守るべき情報は、社外に渡りませんでした";
export const TO_AI = "朝、AIに渡した守るべき情報";
export const TO_AI_NONE = "伏せずに渡した守るべき情報は、ありません";
export const SENT = "昼、送られたもの";
export const SENT_NONE = "社外にも社内にも、送られたものはありません";
export const INSIDE = "社内";
export const OUTSIDE = "社外";
export const CAUSES = "そうなった元";
export const CAUSE_MORNING = "朝";
export const CAUSE_NOON = "昼";
export const LOOK_BACK = "ふり返り";
export const HOW_TO_PREVENT = "防ぐには";

export const TAKE_HEAD = "持ち帰る指示";
export const TAKE_SUB = "いつも使う AI への指示（CLAUDE.md など）に、そのまま貼れます";
export const TAKE_TODAY = "今日の1つ";
export const COPY = "まとめてコピーする";
export const COPIED = "コピーしました";
export const COPY_FAIL = "コピーできませんでした。文を長押しして選んでください";
export const AGAIN = "もう一度やる";
export const HOME = "ホームへ";

export const QUIT_SURE = "最後の日の練習をやめますか？";
export const QUIT_WHY = "ここまでの選びは消えます。";
export const KEEP = "つづける";
export const QUIT = "やめる";

export const TRAP_HEAD = "けさのメールに、紛れていた一文";
export const GUARD_MORNING = "朝の守り";
export const GUARD_NOON = "昼の守り";
export const GUARD_OK = "守れた";
export const GUARD_NG = "守れなかった";
export const LESSON = "覚えよう";
export const LEAKED_TO = "社外に出たもの";
export const WHY_OUTSIDE = "なぜ「社外に渡った」と言えるか";
export const DETAILS = "くわしく見る";
export const DETAILS_TITLE = "くわしいふり返り";
export const CLOSE = "閉じる";
export const logCount = (n: number) => `これまでの動き ${n}件`;
/** ホーム（PC）で、最後の日を紹介する箱 */
export const DAY_CARD_EYEBROW = "最後の日（約3分）";
export const DAY_CARD_TEXT = "会社が事務所に入れたAIの事務員「現場AI」に、名簿や図面の仕事を頼みます。何を渡し、何を送らせるかを決めて、1日を見届けます。";
export const DAY_CARD_NOTE = "台本で動く練習です。本物のAIは動きません。5日を終えていなくても遊べます。";
export const DAY_CARD_GO = "やってみる";
/** 英語の画面のホームで出す、最後の日の名前と説明（最後の日の中身は、いまは日本語だけ） */
export const DAY_EN = {
  title: "Asking the AI clerk",
  sub: "Final day · scripted practice, no real AI (Japanese only for now)",
  eyebrow: "Final day (about 3 min)",
  text: "Give work to the Site AI, the AI clerk the company put in the site office. Decide what it may see and send, then watch the day play out.",
  note: "Scripted practice. No real AI runs. You can play it before finishing the five days. This day is in Japanese only for now.",
  go: "Try it",
};
