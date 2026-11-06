// ============================================================
// 学びの仕組み（画面とは別の、ただの計算）
//   ・思い出して答える：レッスンは問題だけ。答えたらすぐ「なぜ」を見せる
//   ・まちがえた問題は、そのレッスンの最後にもう一度出す（できるまで）
//   ・間をあけて復習：正解すると次に出るまでの日が 1→3→7→14→30日 とのびる。まちがえると1日後に戻る
//   ・復習は話題をまぜて出す
//   ・続ける力：ポイント、階級、続けた日数、バッジ
// ============================================================
import type { Question, TopicId } from './types'

// ---------------- 日付 ----------------
/** その人の暮らしている時間での「何日目」（日付が変わったら1増える） */
export function dayNumber(d = new Date()): number {
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000)
}

// ---------------- 間をあけた復習（ライトナー方式） ----------------
/** 箱の番号ごとの、次に出るまでの日数（箱1 = 1日後 … 箱5 = 30日後） */
export const INTERVALS = [0, 1, 3, 7, 14, 30]
export const MAX_BOX = 5

export interface Card {
  /** 1〜5。大きいほど、よく覚えている */
  box: number
  /** 次に復習する日（dayNumber） */
  due: number
  seen: number
  right: number
  last: number
}

/** 1回目の答えで、箱を動かす */
export function schedule(card: Card | undefined, ok: boolean, today: number): Card {
  const box = ok ? Math.min(MAX_BOX, (card?.box ?? 0) + 1) : 1
  return { box, due: today + INTERVALS[box], seen: (card?.seen ?? 0) + 1, right: (card?.right ?? 0) + (ok ? 1 : 0), last: today }
}

/** 今日、復習する問題（期限が来たもの）。古い順・覚えていない順。話題をまぜる */
export function dueIds(cards: Record<string, Card>, today: number, topicOf: (id: string) => TopicId | undefined, max = 10): string[] {
  const due = Object.entries(cards)
    .filter(([id, c]) => c.due <= today && topicOf(id))
    .sort((a, b) => a[1].due - b[1].due || a[1].box - b[1].box || (a[0] < b[0] ? -1 : 1))
    .map(([id]) => id)
  return interleave(due, topicOf).slice(0, max)
}

/** 話題が続かないように、順番に1つずつ取り出して並べる */
export function interleave(ids: string[], topicOf: (id: string) => TopicId | undefined): string[] {
  const groups = new Map<string, string[]>()
  for (const id of ids) {
    const k = topicOf(id) ?? '?'
    groups.set(k, [...(groups.get(k) ?? []), id])
  }
  const out: string[] = []
  const lists = [...groups.values()]
  for (let i = 0; out.length < ids.length; i++) for (const l of lists) if (l[i]) out.push(l[i])
  return out
}

// ---------------- 1回分（レッスン・復習・まとめテスト・AIの練習） ----------------
export type SessionKind = 'lesson' | 'review' | 'final' | 'ai'

export interface Session {
  kind: SessionKind
  lesson?: TopicId
  /** これから出す問題（先頭が今の問題） */
  queue: string[]
  /** 出す問題の数（まちがえて戻ってきた分は数えない） */
  total: number
  /** 1回目の答えが正しかったか */
  firstTry: Record<string, boolean>
  /** 正しく答え終わった問題 */
  done: string[]
  /** 答えた直後（説明を見ている間） */
  answer: { id: string; pick: number; ok: boolean } | null
  combo: number
  bestCombo: number
  xp: number
}

export function startSession(kind: SessionKind, ids: string[], lesson?: TopicId): Session {
  return { kind, lesson, queue: [...ids], total: ids.length, firstTry: {}, done: [], answer: null, combo: 0, bestCombo: 0, xp: 0 }
}

/** ○ = 0、✕ = 1。3択は 0〜2 */
export function isRight(q: Question, pick: number): boolean {
  return q.kind === 'tf' ? (pick === 0) === q.answer : pick === q.correct
}

export const XP = { first: 10, again: 5, combo: 2, lesson: 20, perfect: 20, review: 10, final: 50 }

export function answer(s: Session, q: Question, pick: number): Session {
  if (s.answer || s.queue[0] !== q.id) return s
  const ok = isRight(q, pick)
  const first = s.firstTry[q.id] === undefined
  const combo = ok ? s.combo + 1 : 0
  const gain = ok ? (first ? XP.first : XP.again) + (combo >= 3 ? XP.combo : 0) : 0
  return {
    ...s,
    firstTry: first ? { ...s.firstTry, [q.id]: ok } : s.firstTry,
    answer: { id: q.id, pick, ok },
    combo,
    bestCombo: Math.max(s.bestCombo, combo),
    xp: s.xp + gain,
  }
}

/** 「つぎへ」：正しければ終わり、まちがえたら最後にもう一度 */
export function next(s: Session): Session {
  if (!s.answer) return s
  const [cur, ...rest] = s.queue
  if (s.answer.ok) return { ...s, queue: rest, done: [...s.done, cur], answer: null }
  return { ...s, queue: [...rest, cur], answer: null }
}

export const finished = (s: Session) => s.queue.length === 0 && !s.answer
/** 1回で正解した数 */
export const firstRight = (s: Session) => Object.values(s.firstTry).filter(Boolean).length

// ---------------- 階級 ----------------
export interface Rank {
  id: string
  xp: number
}
/** 新人 → 見習い → 一人前 → 職長 → 現場監督 */
export const RANKS: Rank[] = [
  { id: 'new', xp: 0 },
  { id: 'apprentice', xp: 120 },
  { id: 'skilled', xp: 300 },
  { id: 'foreman', xp: 550 },
  { id: 'supervisor', xp: 900 },
]
export function rankOf(xp: number): { rank: Rank; index: number; next: Rank | null; toNext: number; share: number } {
  let index = 0
  for (let i = 0; i < RANKS.length; i++) if (xp >= RANKS[i].xp) index = i
  const rank = RANKS[index]
  const nextR = RANKS[index + 1] ?? null
  const span = nextR ? nextR.xp - rank.xp : 1
  return { rank, index, next: nextR, toNext: nextR ? nextR.xp - xp : 0, share: nextR ? Math.min(1, (xp - rank.xp) / span) : 1 }
}

// ---------------- 進み具合（保存する） ----------------
export interface Progress {
  v: 5
  xp: number
  cards: Record<string, Card>
  lessons: Partial<Record<TopicId, { done: boolean; best: number }>>
  /** まとめテストの、1回で正解した割合のいちばんよい値 */
  finalBest: number | null
  streak: number
  bestStreak: number
  lastDay: number | null
  playDays: number
  answered: number
  correct: number
  reviews: number
  aiAsks: number
  badges: string[]
  /** はじめの会話を見たか */
  started: boolean
  /** 結末（建物の完成）を見たか */
  endingSeen: boolean
}

export const newProgress = (): Progress => ({ v: 5, xp: 0, cards: {}, lessons: {}, finalBest: null, streak: 0, bestStreak: 0, lastDay: null, playDays: 0, answered: 0, correct: 0, reviews: 0, aiAsks: 0, badges: [], started: false, endingSeen: false })

/** 合格の目安（まとめテスト）：1回で正解が8割 */
export const PASS = 0.8

export interface Gains {
  xp: number
  bonus: { lesson?: number; perfect?: number; review?: number; final?: number }
  rankUp: Rank | null
  badges: string[]
  /** このレッスンで初めて完了した（建物が1階のびる） */
  newFloor: boolean
  passed: boolean
  accuracy: number
}

/** 1回分が終わった時に、進み具合へ反映する */
export function applySession(p: Progress, s: Session, today: number, lessonCount: number): { p: Progress; gains: Gains } {
  const ids = Object.keys(s.firstTry)
  const right = ids.filter((id) => s.firstTry[id]).length
  const accuracy = ids.length ? right / ids.length : 0
  const cards = { ...p.cards }
  // AIの練習問題は、その時だけ（復習の箱には入れない）
  if (s.kind !== 'ai') for (const id of ids) cards[id] = schedule(cards[id], s.firstTry[id], today)

  const bonus: Gains['bonus'] = {}
  const lessons = { ...p.lessons }
  let newFloor = false
  if (s.kind === 'lesson' && s.lesson) {
    const prev = lessons[s.lesson]
    if (!prev?.done) {
      bonus.lesson = XP.lesson
      newFloor = true
    }
    if (accuracy === 1 && !(prev && prev.best === 1)) bonus.perfect = XP.perfect
    lessons[s.lesson] = { done: true, best: Math.max(prev?.best ?? 0, accuracy) }
  }
  if (s.kind === 'review') bonus.review = XP.review
  const passed = s.kind === 'final' && accuracy >= PASS
  if (passed && !(p.finalBest !== null && p.finalBest >= PASS)) bonus.final = XP.final
  const gained = s.xp + Object.values(bonus).reduce((a, b) => a + (b ?? 0), 0)

  // 続けた日数
  let streak = p.streak
  let playDays = p.playDays
  if (p.lastDay !== today) {
    streak = p.lastDay === today - 1 ? p.streak + 1 : 1
    playDays += 1
  }
  const xp = p.xp + gained
  const before = rankOf(p.xp).index
  const after = rankOf(xp).index
  const np: Progress = {
    ...p,
    xp,
    cards,
    lessons,
    finalBest: s.kind === 'final' ? Math.max(p.finalBest ?? 0, accuracy) : p.finalBest,
    streak,
    bestStreak: Math.max(p.bestStreak, streak),
    lastDay: today,
    playDays,
    answered: p.answered + ids.length,
    correct: p.correct + right,
    reviews: p.reviews + (s.kind === 'review' ? ids.length : 0),
  }
  const earned = badgesOf(np, s, accuracy, lessonCount).filter((b) => !p.badges.includes(b))
  np.badges = [...p.badges, ...earned]
  return { p: np, gains: { xp: gained, bonus, rankUp: after > before ? RANKS[after] : null, badges: earned, newFloor, passed, accuracy } }
}

// ---------------- バッジ ----------------
export const BADGES = ['first', 'perfect', 'combo5', 'streak3', 'streak7', 'review10', 'allLessons', 'graduate', 'askAI'] as const
export type BadgeId = (typeof BADGES)[number]

function badgesOf(p: Progress, s: Session, accuracy: number, lessonCount: number): BadgeId[] {
  const out: BadgeId[] = []
  if (Object.values(p.lessons).some((l) => l?.done)) out.push('first')
  if (s.kind === 'lesson' && accuracy === 1) out.push('perfect')
  if (s.bestCombo >= 5) out.push('combo5')
  if (p.streak >= 3) out.push('streak3')
  if (p.streak >= 7) out.push('streak7')
  if (p.reviews >= 10) out.push('review10')
  if (Object.values(p.lessons).filter((l) => l?.done).length >= lessonCount) out.push('allLessons')
  if (p.finalBest !== null && p.finalBest >= PASS) out.push('graduate')
  if (p.aiAsks > 0) out.push('askAI')
  return out
}

/** AIに質問した時（バッジのため） */
export function countAsk(p: Progress): Progress {
  const np = { ...p, aiAsks: p.aiAsks + 1 }
  if (!np.badges.includes('askAI')) np.badges = [...np.badges, 'askAI']
  return np
}

// ---------------- そのほか ----------------
/** レッスンが開いているか（前のレッスンを終えると、次が開く） */
export function lessonOpen(p: Progress, order: TopicId[], id: TopicId): boolean {
  const i = order.indexOf(id)
  return i <= 0 || !!p.lessons[order[i - 1]]?.done || !!p.lessons[id]?.done
}

/** 苦手な話題（まちがいが多い順）。AIの練習で使う */
export function weakTopic(p: Progress, topicOf: (id: string) => TopicId | undefined, fallback: TopicId): TopicId {
  const score = new Map<TopicId, number>()
  for (const [id, c] of Object.entries(p.cards)) {
    const t = topicOf(id)
    if (!t) continue
    score.set(t, (score.get(t) ?? 0) + (c.seen - c.right) * 2 + (MAX_BOX - c.box))
  }
  let best: TopicId = fallback
  let bestScore = -1
  for (const [t, v] of score) if (v > bestScore) [best, bestScore] = [t, v]
  return best
}

/** 決まった順に混ぜる（テストの問題を選ぶ時。毎回ちがう並びにするため、日付を種にする） */
export function shuffle<T>(xs: T[], seed: number): T[] {
  const a = [...xs]
  let s = seed >>> 0 || 1
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0
    const j = s % (i + 1)
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
