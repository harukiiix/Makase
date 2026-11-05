// ドット絵アイコンのデータ（12×12）。'.' は透明。pal で文字→色を決める。
// ※ このファイルは絵の担当が描き直す。API（ICONS の形）は変えないこと。
import type { IconId } from '../game/types'

export interface IconArt {
  rows: string[]
  pal: Record<string, string>
}

const PLACEHOLDER: IconArt = {
  rows: ['............', '.aaaaaaaaaa.', '.a........a.', '.a.aaaaaa.a.', '.a.a....a.a.', '.a.a.aa.a.a.', '.a.a.aa.a.a.', '.a.a....a.a.', '.a.aaaaaa.a.', '.a........a.', '.aaaaaaaaaa.', '............'],
  pal: { a: '#8590c0' },
}

export const ICONS: Record<IconId, IconArt> = {
  read: PLACEHOLDER,
  post: PLACEHOLDER,
  mail: PLACEHOLDER,
  upload: PLACEHOLDER,
  web: PLACEHOLDER,
  key: PLACEHOLDER,
  notebook: PLACEHOLDER,
  restart: PLACEHOLDER,
  files: PLACEHOLDER,
  box: PLACEHOLDER,
  forward: PLACEHOLDER,
  db: PLACEHOLDER,
  inbox: PLACEHOLDER,
  export: PLACEHOLDER,
  crown: PLACEHOLDER,
  trash: PLACEHOLDER,
  check: PLACEHOLDER,
  report: PLACEHOLDER,
  phone: PLACEHOLDER,
  mask: PLACEHOLDER,
  download: PLACEHOLDER,
  person: PLACEHOLDER,
  house: PLACEHOLDER,
  stranger: PLACEHOLDER,
  door: PLACEHOLDER,
  window: PLACEHOLDER,
  flyer: PLACEHOLDER,
  lock: PLACEHOLDER,
  bell: PLACEHOLDER,
  open: PLACEHOLDER,
  stamp: PLACEHOLDER,
  magnifier: PLACEHOLDER,
  hand: PLACEHOLDER,
  star: PLACEHOLDER,
  warning: PLACEHOLDER,
  tick: PLACEHOLDER,
  cross: PLACEHOLDER,
  moon: PLACEHOLDER,
  sun: PLACEHOLDER,
  arrow: PLACEHOLDER,
  note: PLACEHOLDER,
  paper: PLACEHOLDER,
  pointer: PLACEHOLDER,
  undo: PLACEHOLDER,
  speaker: PLACEHOLDER,
  clock: PLACEHOLDER,
  av_boss: PLACEHOLDER,
  av_rei: PLACEHOLDER,
  av_stranger: PLACEHOLDER,
  av_vendor: PLACEHOLDER,
  av_toki: PLACEHOLDER,
  av_nova: PLACEHOLDER,
  av_system: PLACEHOLDER,
  av_minato: PLACEHOLDER,
  av_kuze: PLACEHOLDER,
}
