// 学び方のわけ（下書き。研究の出典つきで、あとで書く）
import type { L10n } from './types'

export interface Ref {
  cite: string
  url: string
}
export interface Principle {
  id: string
  name: L10n
  what: L10n
  here: L10n
  refs: Ref[]
}

export const PRINCIPLES: Principle[] = []
