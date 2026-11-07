// 最後の日「AIの事務員に頼む練習」の英語の画面の言葉（words.ts と同じ名前を、すべてそろえる。テストで確かめる）
import type { FieldChoice } from "./day";
import type { Permission } from "./types";

export const DAY_TITLE = "Asking the AI clerk";
export const DAY_SUB = "Final day · scripted practice (no real AI runs)";
export const SIM_NOTE = "This is a simulation (the AI follows a script). All names, numbers and addresses are made up.";

export const INTRO: { who: "BOSS" | "NOVA"; text: string }[] = [
  { who: "BOSS", text: "This week the company put an AI clerk in the site office. It's called the Site AI." },
  { who: "BOSS", text: "It writes up daily reports and sends emails. It helps with the paperwork." },
  { who: "NOVA", text: "I'm the Site AI. I prepare the safety documents. The Report AI and the Drawing AI next to me are AI clerks too." },
  { who: "BOSS", text: "But we decide what to hand over and what it may send. We decide in the morning, and answer its checks at noon." },
  { who: "BOSS", text: "Today is practice for that. The Site AI follows a script. No real AI runs." },
];

export const MAIL_HEAD = "This morning's email";
export const ATTACH = "Attachment";
export const ATTACH_OPEN = "Open attachment";
export const ATTACH_CLOSE = "Close attachment";
export const attachPages = (n: number) => (n === 1 ? "1 page" : `${n} pages`);
export const MAIL_ASK = "Read this before you give the Site AI its work";

export const MORNING = "Morning";
export const NOON = "Noon";
export const NEXT = "Next";
export const TO_EVENING = "To the evening";
export const TO_TAKEAWAY = "Instructions to take home";

export const FIELD_ASK = "How do you hand this field to the Site AI?";
export const FIELD_CHOICES: { id: FieldChoice; label: string; sub: string }[] = [
  { id: "pass", label: "Hand it over as is", sub: "It sees the contents as they are" },
  { id: "mask", label: "Mask it", sub: "Replace it with ●●" },
  { id: "drop", label: "Leave it out", sub: "Delete this field first" },
];
export const fieldBoard = (doc: string, field: string, value: string) => `You hand "${doc}" to the Site AI.\n${field}: ${value}`;

export const TOOL_NAME: Record<string, string> = { send_mail: "email", post_chat: "the site chat" };
export const toolBoard = (id: string) =>
  id === "send_mail"
    ? "Set the rule for when the AI clerks send email. Recipients can be inside or outside the company."
    : "Set the rule for when the AI clerks post to the site chat.";
export const toolAsk = (id: string) => `When they send ${TOOL_NAME[id] ?? id}, what happens?`;
export const TOOL_CHOICES: { id: Permission; label: string; sub: string }[] = [
  { id: "ask", label: "Ask before sending", sub: "You get a check for each one" },
  { id: "auto", label: "Send without asking", sub: "The AI sends with no check" },
  { id: "deny", label: "Don't let it send", sub: "That work stops too" },
];

export const ORDER_BOARD = "You give the Site AI this morning's work. The Report AI and the Drawing AI already have their usual instructions.";
export const ORDER_ASK = "What do you tell the Site AI?";

export const NOON_INTRO = "It's noon. The AI clerks are working. Answer their checks when they come.";
export const STOP = "Stop";
export const ALLOW = "Allow";
export const TO = "To";
export const CONTENT = "Contents";
export const NOON_DONE = "Today's work is done.";
export const autoLine = (who: string, tool: string, content: string, to?: string) => `${who}: ${tool}${to ? ` (${to})` : ""}  ${content}`;
export const blockedLine = (who: string, tool: string) => `${who}: "${tool}" stopped, because it isn't allowed to send`;

export const EVENING = "Evening";
export const LEAKED = "Protected information went outside the company";
export const NOT_LEAKED = "No protected information went outside the company";
export const TO_AI = "Protected information you gave the AI in the morning";
export const TO_AI_NONE = "You gave it no protected information without masking";
export const SENT = "What was sent at noon";
export const SENT_NONE = "Nothing was sent, inside or outside the company";
export const INSIDE = "Inside";
export const OUTSIDE = "Outside";
export const CAUSES = "What led to it";
export const CAUSE_MORNING = "Morning";
export const CAUSE_NOON = "Noon";
export const LOOK_BACK = "Looking back";
export const HOW_TO_PREVENT = "How to prevent it";

export const TAKE_HEAD = "Instructions to take home";
export const TAKE_SUB = "You can paste these into the instructions of the AI you use (such as CLAUDE.md)";
export const TAKE_TODAY = "Today's key one";
export const COPY = "Copy all";
export const COPIED = "Copied";
export const COPY_FAIL = "Couldn't copy. Press and hold the text to select it";
export const AGAIN = "Play again";
export const JOB_HEAD = "Fit it to your job";
export const JOB_SUB = "Pick or type your job, and AI Miyashita rewrites today's key instruction as 2 to 3 lines for that job.";
export const JOB_OWN = "Another job (type it)";
export const JOB_OWN_HINT = "e.g. scaffolder, plumber, interior finisher";
export const JOB_OWN_GO = "Ask for this job";
export const JOB_COPY = "Copy these instructions";
export const JOB_ASK = "What is your job?";
export const JOB_THINKING = "Miyashita is thinking...";
export const JOB_LEFT_WHY = "AI Miyashita uses your own Claude usage. You can ask 3 times on this screen and 20 times a day.";
export const JOB_LIMIT = "That's all for this screen. Ask me again when you play again.";
export const JOB_RETRY = "Couldn't turn it into instructions. Please press again.";
export const HOME = "Home";

export const QUIT_SURE = "Quit the final day?";
export const QUIT_WHY = "Your choices so far will be lost.";
export const KEEP = "Keep going";
export const QUIT = "Quit";

export const TRAP_HEAD = "The line hidden in this morning's email attachment";
export const GUARD_MORNING = "Morning guard (decide before handing over)";
export const GUARD_NOON = "Noon guard (check before sending)";
export const GUARD_WORK = "Work";
export const WORK_OK = "done";
export const WORK_NG = "not done";
export const GUARD_OK = "held";
export const GUARD_NG = "didn't hold";
export const LESSON = "Remember";
export const LEAKED_TO = "What went out";
export const WHY_OUTSIDE = 'Why we can say it "went outside the company"';
export const DETAILS = "See details";
export const DETAILS_TITLE = "Detailed review";
export const CLOSE = "Close";
export const logCount = (n: number) => (n === 1 ? "1 action so far" : `${n} actions so far`);
export const DAY_CARD_EYEBROW = "Final day (about 3 min)";
export const DAY_CARD_TEXT = "Give work on the roster and drawings to the Site AI, the AI clerk the company put in the site office. Decide what it may see and send, then watch the day play out.";
export const DAY_CARD_NOTE = "Scripted practice. No real AI runs. You can play it before finishing the five days.";
export const DAY_CARD_GO = "Try it";
export const DAY_EN = {
  title: "Asking the AI clerk",
  sub: "Final day · scripted practice (no real AI runs)",
  eyebrow: "Final day (about 3 min)",
  text: "Give work to the Site AI, the AI clerk the company put in the site office. Decide what it may see and send, then watch the day play out.",
  note: "Scripted practice. No real AI runs. You can play it before finishing the five days.",
  go: "Try it",
};
