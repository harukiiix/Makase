// ============================================================
// 場面の絵（160×120）。描く順に「操作」を並べる
//   ['rect', x, y, w, h, 色]          四角をぬる
//   ['dither', x, y, w, h, 色1, 色2]  2色の市松
//   ['line', x0, y0, x1, y1, 色]      線
//   ['sprite', 絵の名前, x, y, 左右反転?, 印?]
//      印（anchor）を付けた絵は、その範囲が「押せる所」になる（Spot の id と同じ名前にする）
//   ['spot', 印, x, y, w, h]          絵とは別に、押せる範囲だけを決める
// 色は PALETTE の1文字か '#rrggbb'
// ============================================================
import type { Box } from '../game/types'
import { dither, drawSprite, line, newImg, rect, spriteSize, type Img, type Sprite } from './raster'

export const SCENE_W = 160
export const SCENE_H = 120

export type Op =
  | ['rect', number, number, number, number, string]
  | ['dither', number, number, number, number, string, string]
  | ['line', number, number, number, number, string]
  | ['sprite', string, number, number, boolean?, string?]
  | ['spot', string, number, number, number, number]

export interface SceneArt {
  id: string
  /** 一番下の色（なにも描かれていない所） */
  bg: string
  ops: Op[]
}

export function rasterScene(scene: SceneArt, sprites: Record<string, Sprite>): Img {
  const img = newImg(SCENE_W, SCENE_H, scene.bg)
  for (const op of scene.ops) {
    switch (op[0]) {
      case 'rect':
        rect(img, op[1], op[2], op[3], op[4], op[5])
        break
      case 'dither':
        dither(img, op[1], op[2], op[3], op[4], op[5], op[6])
        break
      case 'line':
        line(img, op[1], op[2], op[3], op[4], op[5])
        break
      case 'sprite': {
        const s = sprites[op[1]]
        if (s) drawSprite(img, s, op[2], op[3], !!op[4])
        break
      }
      case 'spot':
        break
    }
  }
  return img
}

/** 印 → 押せる範囲。同じ印の絵が2つ以上あれば、全部を囲む範囲にする */
export function anchors(scene: SceneArt, sprites: Record<string, Sprite>): Record<string, Box> {
  const out: Record<string, Box> = {}
  const add = (id: string, b: Box) => {
    const p = out[id]
    if (!p) {
      out[id] = b
      return
    }
    const x0 = Math.min(p[0], b[0])
    const y0 = Math.min(p[1], b[1])
    const x1 = Math.max(p[0] + p[2], b[0] + b[2])
    const y1 = Math.max(p[1] + p[3], b[1] + b[3])
    out[id] = [x0, y0, x1 - x0, y1 - y0]
  }
  for (const op of scene.ops) {
    if (op[0] === 'sprite' && op[5]) {
      const s = sprites[op[1]]
      if (!s) continue
      const [w, h] = spriteSize(s)
      add(op[5], [op[2], op[3], w, h])
    }
    if (op[0] === 'spot') add(op[1], [op[2], op[3], op[4], op[5]])
  }
  return out
}
