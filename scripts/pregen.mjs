#!/usr/bin/env node
// 前もって作る答えを、本物の Claude に作ってもらう（作る人の手元で、1回だけ動かす）。
//
// 鍵：.env.local の ANTHROPIC_API_KEY から読む（VITE_ で始まる名前は読まない。VITE_ の名前は、作ったページに入ってしまうため）。
// 鍵は、画面にも、ログにも、作る答えのファイルにも出さない。送り先は api.anthropic.com だけ。
//
// 使い方：node scripts/pregen.mjs <頼みのファイル.json> <答えを書くファイル.json>
//   頼みのファイルは scripts/pregen-prompts.test.ts で作る。すでに答えがある id は、もう一度は送らない（続きから作れる）
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const MODEL = 'claude-opus-5-5'
const [, , inPath, outPath] = process.argv
if (!inPath || !outPath) {
  console.error('使い方：node scripts/pregen.mjs <頼み.json> <答え.json>')
  process.exit(2)
}

function readKey() {
  if (!existsSync('.env.local')) return null
  for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const m = /^\s*(?:export\s+)?ANTHROPIC_API_KEY\s*=\s*(.*)\s*$/.exec(line)
    if (m) return m[1].replace(/^(['"])(.*)\1$/, '$2').trim() || null
  }
  return null
}
const KEY = readKey()
if (!KEY) {
  console.error('.env.local に ANTHROPIC_API_KEY が見つかりません（値は表示しません）')
  process.exit(2)
}
// 出す文字から鍵を消す（念のため）
const hide = (s) => String(s).split(KEY).join('[鍵]').replace(/sk-ant-[A-Za-z0-9_-]{8,}/g, '[鍵]')

const { items } = JSON.parse(readFileSync(inPath, 'utf8'))
const out = existsSync(outPath) ? JSON.parse(readFileSync(outPath, 'utf8')) : { model: MODEL, createdAt: new Date().toISOString().slice(0, 10), answers: {} }
const todo = items.filter((it) => !out.answers[it.id])
console.log(`頼み ${items.length} 件、これから送る ${todo.length} 件（モデル ${MODEL}）`)

let usageIn = 0
let usageOut = 0
let failed = 0
async function ask(it) {
  for (let tries = 0; tries < 3; tries++) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'anthropic-version': '2023-06-01', 'x-api-key': KEY },
      body: JSON.stringify({ model: MODEL, max_tokens: 600, messages: [{ role: 'user', content: it.prompt }] }),
    }).catch((e) => ({ ok: false, status: 0, text: async () => hide(e.message) }))
    if (res.ok) {
      const j = await res.json()
      usageIn += j.usage?.input_tokens ?? 0
      usageOut += j.usage?.output_tokens ?? 0
      const text = (j.content ?? []).filter((c) => c.type === 'text').map((c) => c.text).join('').trim()
      out.answers[it.id] = { text: hide(text), model: j.model, stop: j.stop_reason }
      return
    }
    const status = res.status
    if (status === 401 || status === 403) {
      console.error(`鍵が使えません（${status}）。止めます`)
      process.exit(1)
    }
    await new Promise((r) => setTimeout(r, 2000 * (tries + 1)))
    if (tries === 2) console.error(`${it.id}：失敗（${status}）`)
  }
  failed++
}

const queue = [...todo]
await Promise.all(
  Array.from({ length: 6 }, async () => {
    while (queue.length) {
      await ask(queue.shift())
      const done = Object.keys(out.answers).length
      if (done % 20 === 0) {
        writeFileSync(outPath, JSON.stringify(out, null, 1) + '\n')
        console.log(`${done}/${items.length}`)
      }
    }
  }),
)
writeFileSync(outPath, JSON.stringify(out, null, 1) + '\n')
const cost = (usageIn * 4 + usageOut * 20) / 1e6
console.log(`できた ${Object.keys(out.answers).length}/${items.length}、失敗 ${failed}。トークン 入力 ${usageIn}・出力 ${usageOut}（およそ $${cost.toFixed(2)}）`)
