import { afterEach, describe, expect, it, vi } from "vitest";
import { clearUserKey, getAI, hasUserKey, setUserKey, subscribeAI } from "./ai";

// 公開ページで、遊ぶ人が自分の鍵を入れて AI を使う道。
// 鍵はそのタブのメモリの中だけに置く（保存しない）。送り先は Anthropic だけ。テストに本物の鍵は使わない
const FAKE = "sk-ant-api03-" + "f".repeat(40); // 形だけ鍵に似せた、ただの文字
const sse = (text: string) =>
  [
    { type: "message_start", message: { id: "m", type: "message", role: "assistant", model: "claude-opus-5-5", content: [], stop_reason: null, stop_sequence: null, usage: { input_tokens: 1, output_tokens: 1 } } },
    { type: "content_block_start", index: 0, content_block: { type: "text", text: "" } },
    { type: "content_block_delta", index: 0, delta: { type: "text_delta", text } },
    { type: "content_block_stop", index: 0 },
    { type: "message_delta", delta: { stop_reason: "end_turn", stop_sequence: null }, usage: { output_tokens: 1 } },
    { type: "message_stop" },
  ]
    .map((e) => `event: ${e.type}\ndata: ${JSON.stringify(e)}\n\n`)
    .join("");

afterEach(() => {
  clearUserKey();
  vi.unstubAllGlobals();
});

describe("遊ぶ人が入れる鍵", () => {
  it("鍵がない時、AI は使えない（null）", async () => {
    expect(hasUserKey()).toBe(false);
    expect(await getAI()).toBeNull();
  });
  it("鍵の形でない物は受け取らない", () => {
    expect(setUserKey("")).toBe(false);
    expect(setUserKey("hello")).toBe(false);
    expect(setUserKey("sk-ant-short")).toBe(false);
    expect(setUserKey("sk-ant-" + "a".repeat(400))).toBe(false);
    expect(hasUserKey()).toBe(false);
  });
  it("入れると使えるようになり、送り先は Anthropic だけ。鍵はその頼みの見出しにだけ入る", async () => {
    const seen: { url: string; auth: string | null }[] = [];
    vi.stubGlobal("fetch", async (url: string | URL | Request, init?: RequestInit) => {
      const h = new Headers(init?.headers);
      seen.push({ url: String(url), auth: h.get("authorization") ?? h.get("x-api-key") });
      return new Response(sse("こんにちは"), { status: 200, headers: { "content-type": "text/event-stream" } });
    });
    expect(setUserKey(`  ${FAKE}\n`)).toBe(true); // 前後の空白は取る
    expect(hasUserKey()).toBe(true);
    const ai = await getAI();
    expect(ai).not.toBeNull();
    expect((await ai!("聞きたい")).text).toBe("こんにちは");
    expect(seen).toHaveLength(1);
    expect(new URL(seen[0].url).host).toBe("api.anthropic.com");
    // 送ったのは、入れた鍵だけ（環境のほかの資格情報ではない）。値は出さずに比べる
    expect(seen[0].auth === FAKE || seen[0].auth === `Bearer ${FAKE}`).toBe(true);
  });
  it("鍵はどこにも保存しない（localStorage・sessionStorage を使わない）", async () => {
    const touched: string[] = [];
    const store = { getItem: () => null, setItem: (k: string) => touched.push(k), removeItem: () => {}, clear: () => {}, key: () => null, length: 0 };
    vi.stubGlobal("localStorage", store);
    vi.stubGlobal("sessionStorage", store);
    setUserKey(FAKE);
    await getAI();
    clearUserKey();
    expect(touched).toEqual([]);
  });
  it("消すと、また使えなくなる。変わるたびに知らせる", async () => {
    const calls: number[] = [];
    const off = subscribeAI(() => calls.push(1));
    setUserKey(FAKE);
    expect(await getAI()).not.toBeNull();
    clearUserKey();
    expect(hasUserKey()).toBe(false);
    expect(await getAI()).toBeNull();
    expect(calls.length).toBe(2);
    off();
  });
});
