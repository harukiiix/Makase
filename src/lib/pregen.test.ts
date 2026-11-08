import { describe, expect, it } from 'vitest'
import { ALL_QUESTIONS } from '../game/course'
import { checkPregen, KEYLIKE, PREGEN_DATE, PREGEN_MODEL, QUIZ_ASKS, quizPregen, quizPregenPrompt, SITE_ASKS, sitePregen, sitePregenPrompt } from './pregen'
import data from './pregen.json'
import { tutorBase, tutorRules } from './ai'

// Claude が前もって作った答え。点検を通った物だけが画面に出る。鍵らしい文字は1つも入れない
describe('前もって作った答え', () => {
  it('言いすぎの答え・鍵らしい文字・長すぎる答えは使わない', () => {
    expect(checkPregen('この決まりを守れば、必ず防げます。', 'ja')).toBeNull()
    expect(checkPregen('100%安全です。', 'ja')).toBeNull()
    expect(checkPregen('This is guaranteed to work.', 'en')).toBeNull()
    expect(checkPregen('鍵は sk-ant-api03-' + 'x'.repeat(30) + ' です', 'ja')).toBeNull()
    expect(checkPregen('あ'.repeat(400), 'ja')).toBeNull()
    expect(checkPregen('  ', 'ja')).toBeNull()
    expect(checkPregen('名簿は、会社が決めた相手にだけ送ろうね。', 'ja')).toBe('名簿は、会社が決めた相手にだけ送ろうね。')
  })
  it('質問は、日本語と英語で同じ数', () => {
    expect(QUIZ_ASKS.ja).toHaveLength(QUIZ_ASKS.en.length)
    expect(SITE_ASKS.ja).toHaveLength(SITE_ASKS.en.length)
  })
  it('宮下さんへの頼みは、遊ぶ人の選んだ答えを入れない。今までの頼みは変わらない', () => {
    const q = ALL_QUESTIONS[0]
    const p = quizPregenPrompt(q, QUIZ_ASKS.ja[0], 'ja')
    expect(p).not.toMatch(/The worker chose/)
    expect(p).toContain(QUIZ_ASKS.ja[0])
    expect(tutorRules(q, 0, 'ja').startsWith(tutorBase(q, 'ja'))).toBe(true)
    expect(tutorRules(q, 0, 'ja')).toMatch(/The worker chose/)
  })
  it('現場AIへの頼みは、漏れたかどうかで分かれる', () => {
    expect(sitePregenPrompt('leaked', 'x', 'en')).toMatch(/DID go outside/)
    expect(sitePregenPrompt('safe', 'x', 'en')).toMatch(/nothing went outside/)
  })
  it('データの全体に、鍵らしい文字が0件', () => {
    expect(KEYLIKE.test(JSON.stringify(data))).toBe(false)
  })
  it('答えがある時は、モデル名と作った日が記録されている', () => {
    const any = ALL_QUESTIONS.some((q) => quizPregen(q.id, 'ja').length > 0) || sitePregen('safe', 'ja').length > 0
    if (any) {
      expect(PREGEN_MODEL).toMatch(/^claude-/)
      expect(PREGEN_DATE).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })
  it('出す答えは、どれも点検を通っている', () => {
    for (const lang of ['ja', 'en'] as const) {
      for (const q of ALL_QUESTIONS) for (const x of quizPregen(q.id, lang)) expect(checkPregen(x.answer, lang)).toBe(x.answer)
      for (const o of ['leaked', 'safe'] as const) for (const x of sitePregen(o, lang)) expect(checkPregen(x.answer, lang)).toBe(x.answer)
    }
  })
})
