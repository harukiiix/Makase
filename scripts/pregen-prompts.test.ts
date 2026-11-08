import { writeFileSync } from 'node:fs'
import { it } from 'vitest'
import { ALL_QUESTIONS } from '../src/game/course'
import { QUIZ_ASKS, quizPregenPrompt, SITE_ASKS, sitePregenPrompt } from '../src/lib/pregen'

// 前もって作る答えの「頼み」を、1つのファイルにまとめる（鍵は使わない・送らない）。
// ふだんのテストでは動かさない。使い方：PREGEN_OUT=scripts/pregen-prompts.json npx vitest run scripts/pregen-prompts.test.ts
it.runIf(!!process.env.PREGEN_OUT)('前もって作る答えの頼みを書き出す', () => {
  const items: { id: string; prompt: string }[] = []
  for (const lang of ['ja', 'en'] as const) {
    for (const q of ALL_QUESTIONS) QUIZ_ASKS[lang].forEach((ask, i) => items.push({ id: `quiz/${q.id}/${lang}/${i}`, prompt: quizPregenPrompt(q, ask, lang) }))
    for (const o of ['leaked', 'safe'] as const) SITE_ASKS[lang].forEach((ask, i) => items.push({ id: `site/${o}/${lang}/${i}`, prompt: sitePregenPrompt(o, ask, lang) }))
  }
  writeFileSync(process.env.PREGEN_OUT!, JSON.stringify({ items }, null, 1) + '\n')
})
