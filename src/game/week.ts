// 1週間の流れ：月〜金の見回りと、最後の結末
import { DAY as mon } from './days/mon'
import { DAY as tue } from './days/tue'
import { DAY as wed } from './days/wed'
import { DAY as thu } from './days/thu'
import { DAY as fri } from './days/fri'
import type { Day, DayId } from './types'

export const DAYS: Day[] = [mon, tue, wed, thu, fri]
export const DAY_IDS: DayId[] = DAYS.map((d) => d.id)
export const dayOf = (id: DayId) => DAYS.find((d) => d.id === id)!
