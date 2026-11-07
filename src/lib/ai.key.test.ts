import { describe, expect, it } from "vitest";
import { errorKind, keySample } from "./ai";

// 鍵で Claude を呼ぶ道（GitHub Pages の版）。本物には送らず、送る中身と、返事の読み方を確かめる
const sse = (events: object[]) =>
  new Response(events.map((e) => `event: ${(e as { type: string }).type}\ndata: ${JSON.stringify(e)}\n\n`).join(""), { status: 200, headers: { "content-type": "text/event-stream" } });
const reply = (text: string, stop = "end_turn") =>
  sse([
    { type: "message_start", message: { id: "msg_1", type: "message", role: "assistant", model: "claude-opus-5-5", content: [], stop_reason: null, stop_sequence: null, usage: { input_tokens: 1, output_tokens: 1 } } },
    { type: "content_block_start", index: 0, content_block: { type: "text", text: "" } },
    { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: text.slice(0, 3) } },
    { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: text.slice(3) } },
    { type: "content_block_stop", index: 0 },
    { type: "message_delta", delta: { stop_reason: stop, stop_sequence: null }, usage: { output_tokens: 5 } },
    { type: "message_stop" },
  ]);

describe("鍵で Claude を呼ぶ", () => {
  it("ブラウザから直接呼ぶ印・モデル・断られた時の切り替えを付けて送り、文字を少しずつ返す", async () => {
    const seen: { url: string; headers: Headers; body: Record<string, unknown> }[] = [];
    const fake = (async (url: string | URL | Request, init?: RequestInit) => {
      seen.push({ url: String(url), headers: new Headers(init?.headers), body: JSON.parse(String(init?.body)) });
      return reply("こんにちは、宮下だよ");
    }) as typeof fetch;
    const ai = await keySample("sk-test", fake);
    const parts: string[] = [];
    const out = await ai("聞きたい", { modelTier: "quick", onText: ({ text }) => parts.push(text) });
    expect(out.text).toBe("こんにちは、宮下だよ");
    expect(parts.length).toBeGreaterThanOrEqual(2);
    const req = seen[0];
    expect(req.url).toContain("/v1/messages");
    expect(req.headers.get("anthropic-dangerous-direct-browser-access")).toBe("true");
    expect(req.headers.get("anthropic-beta")).toContain("server-side-fallback-2026-07-01");
    expect(req.body.model).toBe("claude-opus-5-5");
    expect(req.body.fallbacks).toBe("default");
    expect(req.body.stream).toBe(true);
    expect(req.body.messages).toEqual([{ role: "user", content: "聞きたい" }]);
  });
  it("json は、前後の ``` を外して読む", async () => {
    const fake = (async () => reply('```json\n[{"a":1}]\n```')) as unknown as typeof fetch;
    const ai = await keySample("sk-test", fake);
    expect(await ai.json("x")).toEqual([{ a: 1 }]);
  });
  it("回数の上限や鍵のまちがいは、宮下さんの窓が知っている印にそろえる", async () => {
    const limited = (async () => new Response(JSON.stringify({ type: "error", error: { type: "rate_limit_error", message: "x" } }), { status: 429, headers: { "content-type": "application/json" } })) as unknown as typeof fetch;
    await expect((await keySample("sk-test", limited))("x")).rejects.toSatisfy((e) => errorKind(e) === "busy");
    const bad = (async () => new Response(JSON.stringify({ type: "error", error: { type: "authentication_error", message: "x" } }), { status: 401, headers: { "content-type": "application/json" } })) as unknown as typeof fetch;
    await expect((await keySample("sk-test", bad))("x")).rejects.toSatisfy((e) => errorKind(e) === "off");
  });
});
