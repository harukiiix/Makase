#!/usr/bin/env node
// 前もって作る答えを、本物の Claude に作ってもらう（作る人の手元で、1回だけ動かす）。
//
// 鍵：.env.local の ANTHROPIC_API_KEY から読む（VITE_ で始まる名前は読まない。VITE_ の名前は、作ったページに入ってしまうため）。
// 鍵は、画面にも、ログにも、作る答えのファイルにも出さない。送り先は api.anthropic.com だけ。
//
// 使い方：node scripts/pregen.mjs <頼みのファイル.json> <答えを書くファイル.json> [--only-one]
//   --only-one：まだ答えのない1件だけを送って止まる（ためし）。1件でも失敗したら、残りは送らずに止まる
//   頼みのファイルは scripts/pregen-prompts.test.ts で作る。すでに答えがある id は、もう一度は送らない（続きから作れる）
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const MODEL = 'claude-opus-5-5'
const args = process.argv.slice(2)
const ONLY_ONE = args.includes('--only-one')
const [inPath, outPath] = args.filter((a) => !a.startsWith('--'))
if (!inPath || !outPath) {
  console.error('使い方：node scripts/pregen.mjs <頼み.json> <答え.json> [--only-one]')
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
const todo = items.filter((it) => !out.answers[it.id]).slice(0, ONLY_ONE ? 1 : undefined)
console.log(`頼み ${items.length} 件、これから送る ${todo.length} 件（モデル ${MODEL}）`)

let usageIn = 0
let usageOut = 0
let failed = 0
let stop = false
/** Claude API のエラーの type と message だけを出す（鍵は出さない） */
async function errorText(res) {
  const body = await res.text().catch(() => '')
  try {
    const e = JSON.parse(body).error
    if (e) return hide(`type=${e.type} message=${e.message}`)
  } catch {}
  return hide(body.slice(0, 300))
}
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
    const why = await errorText(res)
    // 混んでいる時（429・500番台・つながらない）だけ、少し待ってやり直す。それ以外はすぐ止める
    if (status === 429 || status === 0 || status >= 500) {
      console.error(`${it.id}：待ってやり直します（${status}）${why}`)
      await new Promise((r) => setTimeout(r, 3000 * (tries + 1)))
      continue
    }
    console.error(`${it.id}：失敗（${status}）${why}`)
    break
  }
  failed++
  stop = true
}

const queue = [...todo]
// 最初の1件は1つだけ送る。失敗したら、ほかは送らない
if (queue.length) await ask(queue.shift())
await Promise.all(
  Array.from({ length: stop ? 0 : 6 }, async () => {
    while (queue.length && !stop) {
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
if (ONLY_ONE && todo[0] && out.answers[todo[0].id]) console.log(`ためしの答え（${todo[0].id}）：\n${out.answers[todo[0].id].text}`)
if (stop) console.error('失敗したので、残りは送らずに止めました。答えのファイルには、できた分だけ入っています')
const cost = (usageIn * 4 + usageOut * 20) / 1e6
console.log(`できた ${Object.keys(out.answers).length}/${items.length}、失敗 ${failed}。トークン 入力 ${usageIn}・出力 ${usageOut}（およそ $${cost.toFixed(2)}）`)
