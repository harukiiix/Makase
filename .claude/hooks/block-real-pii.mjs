// PreToolUse フック：作品のコードやテストデータに、本物っぽい電話番号・メールアドレスを書き込もうとしたら止める。
// 「人は間違える前提で、仕組みで守る」を開発にも当てはめる。判定は src/devguard/realPii.ts（テストあり）。
// 止めた回数は .claude/hooks/pii-blocked.log に残す（見つけた値は残さない。.gitignore の *.log で公開しない）。
import { appendFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { findRealPii, isGuardedPath } from "../../src/devguard/realPii.ts";

// このフックが置いてあるリポジトリ（.claude/hooks の2つ上）。開いたフォルダがリポジトリの外でも、正しい場所を見る
const projectDir = fileURLToPath(new URL("../..", import.meta.url)).replace(/\/$/, "");
let input;
try {
  input = JSON.parse(readFileSync(0, "utf8"));
} catch {
  process.exit(0);
}
const ti = input.tool_input ?? {};
const filePath = ti.file_path ?? ti.notebook_path ?? "";
if (!isGuardedPath(filePath, projectDir)) process.exit(0);

const texts = [ti.content, ti.new_string, ti.new_source, ...(ti.edits ?? []).map((e) => e.new_string)];
const found = texts.filter((t) => typeof t === "string").flatMap((t) => findRealPii(t));
if (found.length === 0) process.exit(0);

const kinds = [...new Set(found.map((f) => (f.kind === "phone" ? "電話番号" : "メールアドレス")))].join("・");
const rel = filePath.slice(projectDir.length + 1);
try {
  appendFileSync(join(projectDir, ".claude/hooks/pii-blocked.log"), `${new Date().toISOString()}\t${input.tool_name}\t${rel}\t${kinds}\n`);
} catch {}
console.error(
  `止めました：${rel} に本物っぽい${kinds}があります（${found.length}件）。` +
    "データは架空にしてください。電話番号は真ん中の4桁を同じ数字に（例 090-1111-0001）、メールは .example のドメインに。",
);
process.exit(2);
