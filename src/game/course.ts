// コース全体：5つのレッスン（月〜金）と、最後のまとめテスト。ほかに番外の1日（スマホとネット）
import { LESSON as see } from './lessons/see'
import { LESSON as gate } from './lessons/gate'
import { LESSON as photo } from './lessons/photo'
import { LESSON as send } from './lessons/send'
import { LESSON as outside } from './lessons/outside'
import { LESSON as net } from './lessons/net'
import type { Lesson, Question, TopicId } from './types'

export const LESSONS: Lesson[] = [see, gate, photo, send, outside]
/** 番外の1日（「5日間の見回り」とまとめテストには入れない。最初から遊べる） */
export const EXTRA_LESSONS: Lesson[] = [net]
export const lessonOf = (id: TopicId) => [...LESSONS, ...EXTRA_LESSONS].find((l) => l.id === id)!
/** すべての問題（復習・ノートで使う。番外の問題も入る） */
export const ALL_QUESTIONS: Question[] = [...LESSONS, ...EXTRA_LESSONS].flatMap((l) => l.questions)
const byId = new Map(ALL_QUESTIONS.map((q) => [q.id, q]))
export const questionOf = (id: string) => byId.get(id)
