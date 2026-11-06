// PreToolUse フック（Bash）：Claude Code が git push しようとしたら、まだ公開していないコミットを全部調べ、
// API キーらしき文字列・.env のファイル・作品のコードに入った本物っぽい電話やメールがあれば止める。
// 判定は src/devguard/realPii.ts の scanOutgoingDiff（テストあり）。止めた回数は .claude/hooks/pii-blocked.log（値は残さない）。
import { execFileSync } from "node:child_process";
import { appendFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { scanOutgoingDiff } from "../../src/devguard/realPii.ts";

// このフックが置いてあるリポジトリ（.claude/hooks の2つ上）。開いたフォルダがリポジトリの外でも、正しい場所を見る
const projectDir = fileURLToPath(new URL("../..", import.meta.url)).replace(/\/$/, "");
let input;
try {
  input = JSON.parse(readFileSync(0, "utf8"));
} catch {
  process.exit(0);
}
const command = input.tool_input?.command ?? "";
if (!/(^|[\s;&|(])git\s+(-C\s+\S+\s+)?push\b/.test(command)) process.exit(0);

let diffText;
try {
  // まだどのリモートにもないコミットの、足した行
  diffText = execFileSync("git", ["log", "--branches", "--not", "--remotes", "-p", "--format=", "--no-color", "--no-ext-diff"], {
    cwd: projectDir,
    encoding: "utf8",
    maxBuffer: 256 * 1024 * 1024,
  });
} catch {
  console.error("push の前の検査ができませんでした（git log が失敗）。念のため止めます。");
  process.exit(2);
}

const found = scanOutgoingDiff(diffText);
if (found.length === 0) process.exit(0);

const NAMES = { apiKey: "API キーらしき文字列", envFile: ".env のファイル", phone: "本物っぽい電話番号", email: "本物っぽいメールアドレス" };
const lines = found.map((f) => `- ${f.file}：${NAMES[f.kind]}`).join("\n");
try {
  appendFileSync(
    join(projectDir, ".claude/hooks/pii-blocked.log"),
    found.map((f) => `${new Date().toISOString()}\tgit push\t${f.file}\t${NAMES[f.kind]}\n`).join(""),
  );
} catch {}
console.error(`push を止めました。まだ公開していないコミットに、公開してはいけないものがあります：\n${lines}\nコミットから取り除いてから push してください（値はここに出していません）。`);
process.exit(2);
