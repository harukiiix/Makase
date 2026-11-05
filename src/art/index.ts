// 絵と場面の一覧（ここに集める）
import type { Sprite } from './raster'
import type { SceneArt } from './scene'
import { SPRITES as people } from './sprites/people'
import { SPRITES as icons } from './sprites/icons'
import { SPRITES as office } from './sprites/office'
import { SPRITES as gate } from './sprites/gate'
import { SPRITES as photo } from './sprites/photo'
import { SPRITES as pc } from './sprites/pc'
import { SPRITES as train } from './sprites/train'
import { SCENE as officeScene } from './scenes/office'
import { SCENE as gateScene } from './scenes/gate'
import { SCENE as photoScene } from './scenes/photo'
import { SCENE as pcScene } from './scenes/pc'
import { SCENE as trainScene } from './scenes/train'

export const SPRITES: Record<string, Sprite> = { ...people, ...icons, ...office, ...gate, ...photo, ...pc, ...train }

export const SCENES: Record<string, SceneArt> = {
  office: officeScene,
  gate: gateScene,
  photo: photoScene,
  pc: pcScene,
  train: trainScene,
}

/** 絵のまとまりごとの一覧（確認用） */
export const SPRITE_GROUPS: Record<string, Record<string, Sprite>> = { people, icons, office, gate, photo, pc, train }
