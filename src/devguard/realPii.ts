// 開発中のフック（.claude/hooks/block-real-pii.mjs）が使う判定。
// 作品のコードやテストデータに、本物っぽい電話番号・メールアドレスが紛れ込んだら止める。
// 架空の決まり：電話番号は真ん中の4桁を同じ数字にする（090-1111-0001 など）。メールは .example などの予約ドメインだけ。
// 名前の並びや健康情報は形で見分けられないので、ここでは見ない（人の目と /claim-check で確かめる）。

export type RealPiiFinding = { kind: "phone" | "email"; line: number };

const PHONE = /(?<![\d-])(0\d{1,4})-(\d{1,4})-(\d{3,4})(?![\d-])|(?<!\d)0[5789]0(\d{4})(\d{4})(?!\d)/g;
const EMAIL = /(?<![\w.%+-])[A-Za-z0-9._%+-]+@([A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+)/g;
const RESERVED_DOMAIN = /(?:^|\.)(?:example|test|invalid|localhost)$|^example\.(?:com|net|org)$/i;

const isFictionalMiddle = (digits: string) => /^(\d)\1{3}$/.test(digits);

export function findRealPii(text: string): RealPiiFinding[] {
  const found: RealPiiFinding[] = [];
  text.split("\n").forEach((row, i) => {
    for (const m of row.matchAll(PHONE)) {
      const middle = m[2] ?? m[4];
      if (!isFictionalMiddle(middle)) found.push({ kind: "phone", line: i + 1 });
    }
    for (const m of row.matchAll(EMAIL)) {
      if (!RESERVED_DOMAIN.test(m[1])) found.push({ kind: "email", line: i + 1 });
    }
  });
  return found;
}

const GUARDED = ["src/", "app/", "scripts/", "public/", "docs/"];

export function isGuardedPath(filePath: string, projectDir: string): boolean {
  const root = projectDir.endsWith("/") ? projectDir : projectDir + "/";
  if (!filePath.startsWith(root)) return false;
  const rel = filePath.slice(root.length);
  // 見分けるためのテスト自身は、わざと本物っぽい形の見本を持つので外す（見本は実在しえない形にしてある）
  if (rel.startsWith("src/devguard/")) return false;
  return GUARDED.some((dir) => rel.startsWith(dir));
}

// push の前のフック（.claude/hooks/check-before-push.mjs）が使う判定。送るコミットの差分（git log -p）の、足した行だけを見る。
// 1つのファイルにまとめているのは、フック（node が直接読む）から import を1つで済ませるため。
export type OutgoingFinding = { file: string; kind: "apiKey" | "envFile" | RealPiiFinding["kind"] };

const API_KEY = /sk-ant-[A-Za-z0-9_-]{20,}/;
const ENV_FILE = /(^|\/)\.env(\.(?!example$)[^/]+)?$/;

export function scanOutgoingDiff(diffText: string): OutgoingFinding[] {
  const found: OutgoingFinding[] = [];
  const seen = new Set<string>();
  const add = (f: OutgoingFinding) => {
    const key = f.file + "\t" + f.kind;
    if (!seen.has(key)) (seen.add(key), found.push(f));
  };
  let file = "";
  for (const row of diffText.split("\n")) {
    if (row.startsWith("+++ ")) {
      file = row.slice(4).replace(/^b\//, "");
      if (file !== "/dev/null" && ENV_FILE.test(file)) add({ file, kind: "envFile" });
      continue;
    }
    if (!row.startsWith("+") || file === "/dev/null") continue;
    const line = row.slice(1);
    if (API_KEY.test(line)) add({ file, kind: "apiKey" });
    if (isGuardedPath("/r/" + file, "/r")) for (const f of findRealPii(line)) add({ file, kind: f.kind });
  }
  return found;
}
