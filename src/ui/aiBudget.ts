// AIの宮下さんの回数の限度を、画面で使う形にする（数え方は lib/aiLimit.ts、保存は lib/platform.ts）
import { useEffect, useState } from 'react'
import { aiLeft, countAiUse, dayKey, type AiLeft } from '../lib/aiLimit'
import { loadAiUse, writeAiUse } from '../lib/platform'

/** いま、その画面であと何回聞けるか */
export const aiLeftNow = (screen: string): AiLeft => aiLeft(loadAiUse(), dayKey(new Date()), screen)

/** 聞く前に呼ぶ。限度に来ていたら false（数えない）。聞けるなら1回数えて true */
export function spendAi(screen: string): boolean {
  const day = dayKey(new Date())
  const u = loadAiUse()
  if (aiLeft(u, day, screen).left === 0) return false
  writeAiUse(countAiUse(u, day, screen))
  return true
}

/**
 * 画面の中で使う：残りの回数と、聞く前に呼ぶ spend。
 * 残りは描くたびに数え直す。開いたまま日付が変わった時や、ほかのタブで聞いた時も合うように、
 * 画面にもどった時・ほかのタブが記録を変えた時・1分ごとに描き直す
 */
export function useAiBudget(screen: string) {
  const [, setTick] = useState(0)
  useEffect(() => {
    const again = () => setTick((n) => n + 1)
    const vis = () => document.visibilityState === 'visible' && again()
    window.addEventListener('focus', again)
    window.addEventListener('storage', again)
    document.addEventListener('visibilitychange', vis)
    const timer = window.setInterval(again, 60_000)
    return () => {
      window.removeEventListener('focus', again)
      window.removeEventListener('storage', again)
      document.removeEventListener('visibilitychange', vis)
      window.clearInterval(timer)
    }
  }, [])
  const left = aiLeftNow(screen)
  const spend = () => {
    const ok = spendAi(screen)
    setTick((n) => n + 1)
    return ok
  }
  return { left, spend }
}
