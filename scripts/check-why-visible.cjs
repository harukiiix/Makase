// 画面の確かめ：5日分のすべての問題で、答えたあとに「わけ」の文と「正解のわけ」のボタン、印のついた答えが、
// スクロールせずに見えるかを測る（iPhone 13 と PC 1440×900）。Playwright が入っている環境で動かす：
//   SINGLE=1 npx vite build --outDir dist-single && node scripts/check-why-visible.cjs $PWD/dist-single/index.html
const { chromium, devices } = require('playwright')
;(async () => {
  const b = await chromium.launch()
  for (const [name, opt] of [['iPhone 13', devices['iPhone 13']], ['PC', { viewport: { width: 1440, height: 900 } }]]) {
    const ctx = await b.newContext(opt); const p = await ctx.newPage()
    const vis = (s) => p.locator(s).locator('visible=true'); const has = async (s) => (await vis(s).count()) > 0
    const tap = async (s) => { await vis(s).first().click(); await p.waitForTimeout(450) }
    await p.goto('file://' + process.argv[2] + '?fast=1&lang=ja'); await p.waitForTimeout(800)
    const bad = []; let n = 0
    for (const id of ['see', 'gate', 'photo', 'send', 'outside']) {
      if (!(await has(`[data-lesson="${id}"]:not([disabled])`))) break
      await tap(`[data-lesson="${id}"]`)
      for (let i = 0; i < 20 && !(await has('[data-answer]')); i++) { if (await has('button:has-text("わかった")')) await tap('button:has-text("わかった")'); else if (await has('[data-skip]')) await tap('[data-skip]'); else await p.mouse.click(10, 300) }
      // 1回目はまちがえ、戻ってきた時に正解する（まちがえた時と正解した時の両方を測る）
      const seen = {}
      for (let i = 0; i < 30 && (await has('[data-answer]')); i++) {
        const qtext = await p.locator('h2').first().textContent()
        const wrong = !seen[qtext]; seen[qtext] = 1
        await tap(wrong ? '[data-correct="false"]' : '[data-correct="true"]'); await p.waitForTimeout(400)
        const r = await p.evaluate(() => {
          const vh = innerHeight
          const inView = (el) => { if (!el) return 'none'; const r = el.getBoundingClientRect(); let c = el.parentElement; while (c && c !== document.body) { const cs = getComputedStyle(c); if (/(auto|scroll|hidden)/.test(cs.overflowY)) { const cr = c.getBoundingClientRect(); if (r.top < cr.top - 1 || r.bottom > cr.bottom + 1) return 'hidden'; } c = c.parentElement } return r.top >= 0 && r.bottom <= vh ? 'ok' : 'hidden' }
          const why = [...document.querySelectorAll('[data-why]')].find((e) => e.offsetParent)
          const more = [...document.querySelectorAll('[data-more]')].find((e) => e.offsetParent)
          const marks = [...document.querySelectorAll('[data-answer]')].filter((e) => /border-ng|border-ok/.test(e.className)); const markOk = marks.every((m) => inView(m) === 'ok') && marks.every((m) => m.getBoundingClientRect().top >= (document.querySelector('header')?.getBoundingClientRect().bottom ?? 0) - 1); return { why: inView(why), more: more ? inView(more) : 'n/a', text: why ? why.textContent.length : 0, marks: markOk ? 'ok' : 'hidden' }
        })
        n++
        if (r.why !== 'ok' || (wrong && r.more !== 'ok') || r.marks !== 'ok') bad.push(`${id} ${wrong ? '✕' : '○'} ${qtext.slice(0, 14)} why:${r.why} more:${r.more} marks:${r.marks} len:${r.text}`)
        await tap('[data-next]')
      }
      await p.waitForTimeout(900); await tap('[data-home]')
    }
    console.log(name, 'checked', n, 'hidden', bad.length); bad.slice(0, 40).forEach((x) => console.log('  ' + x))
    await ctx.close()
  }
  await b.close()
})()
