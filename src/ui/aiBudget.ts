// AIの宮下さんの回数の限度を、画面で使う形にする（数え方は lib/aiLimit.ts、保存は lib/platform.ts）
import { useState } from 'react'
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

/** 画面の中で使う：残りの回数と、聞く前に呼ぶ spend */
export function useAiBudget(screen: string) {
  const [left, setLeft] = useState(() => aiLeftNow(screen))
  const spend = () => {
    const ok = spendAi(screen)
    setLeft(aiLeftNow(screen))
    return ok
  }
  return { left, spend }
}
