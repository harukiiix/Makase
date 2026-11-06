// 絵の一覧（ここに集める）
import type { Sprite } from './raster'
import type { SceneArt } from './scene'
import { SPRITES as people } from './sprites/people'
import { SPRITES as icons } from './sprites/icons'
import { SPRITES as pics } from './sprites/pics'
import { SPRITES as picsSee } from './sprites/pics-see'
import { SPRITES as picsGate } from './sprites/pics-gate'
import { SPRITES as picsPhoto } from './sprites/pics-photo'
import { SPRITES as picsSend } from './sprites/pics-send'
import { SPRITES as picsOutside } from './sprites/pics-outside'
import { SPRITES as nova } from './sprites/nova'

export const SPRITES: Record<string, Sprite> = { ...people, ...icons, ...pics, ...picsSee, ...picsGate, ...picsPhoto, ...picsSend, ...picsOutside, ...nova }

/** 大きな場面の絵（いまは使っていない。使う時はここに足す） */
export const SCENES: Record<string, SceneArt> = {}

/** 絵のまとまりごとの一覧（確認用：npx jiti scripts/preview.ts sheet <名前>） */
export const SPRITE_GROUPS: Record<string, Record<string, Sprite>> = { people, icons, pics, 'pics-see': picsSee, 'pics-gate': picsGate, 'pics-photo': picsPhoto, 'pics-send': picsSend, 'pics-outside': picsOutside, nova }
