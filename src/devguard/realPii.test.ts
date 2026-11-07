import { describe, expect, it } from "vitest";
import { findRealPii, isGuardedPath } from "./realPii";

// 開発中のフック（.claude/hooks/block-real-pii.mjs）が使う判定。
// 「人は間違える前提で、仕組みで守る」を、作り手の開発にも当てはめる。
// 本物っぽい見本は、よく見本に使われる 1234-5678 の並びと、どの国にも割り当てられない .zz のドメインにしている。
describe("findRealPii：本物っぽい個人情報を見つける", () => {
  it("架空の決まりに沿った番号とドメインは通す", () => {
    const text = [
      "090-0000-0001・090-0000-1111",
      "tanaka@kyoryoku-kogyo.example",
      "x@outside.example X@Outside.Example",
      "a@b.test c@d.invalid e@localhost.localhost",
      'import Anthropic from "@anthropic-ai/sdk";',
    ].join("\n");
    expect(findRealPii(text)).toEqual([]);
  });

  it("本物っぽい携帯・固定電話の番号を見つける", () => {
    expect(findRealPii("連絡先 090-1234-5678").map((f) => f.kind)).toEqual(["phone"]);
    expect(findRealPii("03-1234-5678").map((f) => f.kind)).toEqual(["phone"]);
    expect(findRealPii("08012345678").map((f) => f.kind)).toEqual(["phone"]);
  });

  it(".example 以外のメールアドレスを見つける", () => {
    expect(findRealPii("送り先 yamada@mail.zz").map((f) => f.kind)).toEqual(["email"]);
    expect(findRealPii("info@kensetsu.zz").map((f) => f.kind)).toEqual(["email"]);
  });

  it("見つけた値そのものは返さない（記録に残さないため）", () => {
    const found = findRealPii("yamada@mail.zz 090-1234-5678");
    expect(JSON.stringify(found)).not.toContain("mail.zz");
    expect(JSON.stringify(found)).not.toContain("5678");
  });
});

describe("isGuardedPath：見張る場所", () => {
  it("作品のコードとデータは見張る", () => {
    expect(isGuardedPath("/p/src/makase/companies/construction.ts", "/p")).toBe(true);
    expect(isGuardedPath("/p/app/page.tsx", "/p")).toBe(true);
    expect(isGuardedPath("/p/src/data/replays.json", "/p")).toBe(true);
  });

  it("非公開のメモや依存関係は見張らない", () => {
    expect(isGuardedPath("/p/private/インタビュー.md", "/p")).toBe(false);
    expect(isGuardedPath("/p/node_modules/x/index.js", "/p")).toBe(false);
    expect(isGuardedPath("/other/src/a.ts", "/p")).toBe(false);
    expect(isGuardedPath("/p/src/devguard/realPii.test.ts", "/p")).toBe(false);
  });
});
