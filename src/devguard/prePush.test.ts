import { describe, expect, it } from "vitest";
import { scanOutgoingDiff } from "./realPii";

// push の前のフック（.claude/hooks/check-before-push.mjs）が使う判定。
// 送るコミットの差分（git log -p）を読み、公開してはいけないものが入っていないかを見る。
// 鍵の見本は、形だけ似せた架空の文字列を組み立てて使う（本物の鍵ではない）。
const fakeKey = ["sk", "ant", "api03", "x".repeat(40)].join("-");

const diff = (file: string, ...added: string[]) =>
  [`diff --git a/${file} b/${file}`, `--- a/${file}`, `+++ b/${file}`, "@@ -0,0 +1 @@", ...added.map((l) => "+" + l)].join("\n");

describe("scanOutgoingDiff：送るコミットを調べる", () => {
  it("架空のデータと見本の書き方は通す", () => {
    const text = [
      diff("src/makase/companies/construction.ts", '"090-1111-0001"', '"tanaka@kyoryoku-kogyo.example"'),
      diff("README.md", "ANTHROPIC_API_KEY=sk-ant-..."),
      diff(".env.example", "ANTHROPIC_API_KEY="),
    ].join("\n");
    expect(scanOutgoingDiff(text)).toEqual([]);
  });

  it("API キーらしき文字列を見つける", () => {
    expect(scanOutgoingDiff(diff("scripts/run.ts", `const k = "${fakeKey}";`))).toEqual([
      { file: "scripts/run.ts", kind: "apiKey" },
    ]);
  });

  it(".env のファイルそのものを見つける", () => {
    expect(scanOutgoingDiff(diff(".env.local", "X=1"))).toEqual([{ file: ".env.local", kind: "envFile" }]);
  });

  it("作品のコードに入った本物っぽい電話・メールを見つける", () => {
    expect(scanOutgoingDiff(diff("src/data/replays.json", '"090-1234-5678"')).map((f) => f.kind)).toEqual(["phone"]);
    expect(scanOutgoingDiff(diff("app/page.tsx", "yamada@mail.zz")).map((f) => f.kind)).toEqual(["email"]);
  });

  it("消した行（-）は数えない", () => {
    const text = [`diff --git a/a.ts b/a.ts`, "--- a/a.ts", "+++ b/a.ts", `-const k = "${fakeKey}";`].join("\n");
    expect(scanOutgoingDiff(text)).toEqual([]);
  });

  it("見つけた値そのものは返さない", () => {
    expect(JSON.stringify(scanOutgoingDiff(diff("scripts/run.ts", fakeKey)))).not.toContain("xxxx");
  });
});
