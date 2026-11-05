// ============================================================
// ドット絵を、色の並び（RGBA）に描く。ブラウザでも Node（確認用の PNG）でも同じ結果になる
// ============================================================
import { CLEAR, PALETTE } from './palette'

/** 絵：文字の行。pal で文字の色を変えたり足したりできる */
export interface Sprite {
  rows: string[]
  pal?: Record<string, string>
}

export interface Img {
  w: number
  h: number
  data: Uint8ClampedArray
}

type RGBA = [number, number, number, number]
const colorCache = new Map<string, RGBA>()

/** '#rrggbb' か、パレットの1文字 → RGBA */
export function toRGBA(c: string, pal?: Record<string, string>): RGBA | null {
  if (CLEAR.has(c)) return null
  const hex = c.startsWith('#') ? c : (pal?.[c] ?? PALETTE[c])
  if (!hex) return null
  let v = colorCache.get(hex)
  if (!v) {
    const h = hex.slice(1)
    const n = h.length === 3 ? h.split('').map((x) => x + x).join('') : h
    v = [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16), n.length >= 8 ? parseInt(n.slice(6, 8), 16) : 255]
    colorCache.set(hex, v)
  }
  return v
}

export function newImg(w: number, h: number, bg?: string): Img {
  const img = { w, h, data: new Uint8ClampedArray(w * h * 4) }
  if (bg) rect(img, 0, 0, w, h, bg)
  return img
}

function put(img: Img, x: number, y: number, c: RGBA) {
  if (x < 0 || y < 0 || x >= img.w || y >= img.h) return
  const i = (y * img.w + x) * 4
  if (c[3] === 255) {
    img.data[i] = c[0]
    img.data[i + 1] = c[1]
    img.data[i + 2] = c[2]
    img.data[i + 3] = 255
    return
  }
  // 半透明（影など）
  const a = c[3] / 255
  img.data[i] = Math.round(c[0] * a + img.data[i] * (1 - a))
  img.data[i + 1] = Math.round(c[1] * a + img.data[i + 1] * (1 - a))
  img.data[i + 2] = Math.round(c[2] * a + img.data[i + 2] * (1 - a))
  img.data[i + 3] = Math.max(img.data[i + 3], c[3])
}

export function rect(img: Img, x: number, y: number, w: number, h: number, color: string) {
  const c = toRGBA(color)
  if (!c) return
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) put(img, xx, yy, c)
}

/** 2色の市松模様（ざらっとした面、遠くの地面など） */
export function dither(img: Img, x: number, y: number, w: number, h: number, c1: string, c2: string) {
  const a = toRGBA(c1)
  const b = toRGBA(c2)
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
    const c = (xx + yy) % 2 === 0 ? a : b
    if (c) put(img, xx, yy, c)
  }
}

export function line(img: Img, x0: number, y0: number, x1: number, y1: number, color: string) {
  const c = toRGBA(color)
  if (!c) return
  const dx = Math.abs(x1 - x0)
  const dy = -Math.abs(y1 - y0)
  const sx = x0 < x1 ? 1 : -1
  const sy = y0 < y1 ? 1 : -1
  let err = dx + dy
  let x = x0
  let y = y0
  for (let n = 0; n < 1000; n++) {
    put(img, x, y, c)
    if (x === x1 && y === y1) break
    const e2 = 2 * err
    if (e2 >= dy) {
      err += dy
      x += sx
    }
    if (e2 <= dx) {
      err += dx
      y += sy
    }
  }
}

export function spriteSize(s: Sprite): [number, number] {
  return [Math.max(0, ...s.rows.map((r) => r.length)), s.rows.length]
}

export function drawSprite(img: Img, s: Sprite, x: number, y: number, flip = false) {
  const [w] = spriteSize(s)
  s.rows.forEach((row, yy) => {
    for (let xx = 0; xx < row.length; xx++) {
      const c = toRGBA(row[xx], s.pal)
      if (c) put(img, flip ? x + (w - 1 - xx) : x + xx, y + yy, c)
    }
  })
}

/** 絵1枚を、その大きさの Img にする */
export function rasterSprite(s: Sprite, bg?: string): Img {
  const [w, h] = spriteSize(s)
  const img = newImg(Math.max(1, w), Math.max(1, h), bg)
  drawSprite(img, s, 0, 0)
  return img
}

/** 整数倍に拡大（確認用の画像など） */
export function scaleImg(src: Img, k: number): Img {
  const out = newImg(src.w * k, src.h * k)
  for (let y = 0; y < out.h; y++)
    for (let x = 0; x < out.w; x++) {
      const si = (Math.floor(y / k) * src.w + Math.floor(x / k)) * 4
      const di = (y * out.w + x) * 4
      out.data[di] = src.data[si]
      out.data[di + 1] = src.data[si + 1]
      out.data[di + 2] = src.data[si + 2]
      out.data[di + 3] = src.data[si + 3]
    }
  return out
}
