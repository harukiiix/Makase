// コース全体：5つのレッスン（月〜金）と、最後のまとめテスト
import { LESSON as see } from './lessons/see'
import { LESSON as gate } from './lessons/gate'
import { LESSON as photo } from './lessons/photo'
import { LESSON as send } from './lessons/send'
import { LESSON as outside } from './lessons/outside'
import type { Lesson, Question, TopicId } from './types'

export const LESSONS: Lesson[] = [see, gate, photo, send, outside]
export const lessonOf = (id: TopicId) => LESSONS.find((l) => l.id === id)!
export const ALL_QUESTIONS: Question[] = LESSONS.flatMap((l) => l.questions)
const byId = new Map(ALL_QUESTIONS.map((q) => [q.id, q]))
export const questionOf = (id: string) => byId.get(id)
