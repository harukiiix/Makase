// ドット絵を画面に出す：絵を一度だけ画像にして、拡大は「ぼかさない」で表示する
import { SCENES, SPRITES } from '../art'
import { rasterSprite, spriteSize, type Img } from '../art/raster'
import { rasterScene, SCENE_H, SCENE_W } from '../art/scene'
import type { Box } from '../game/types'

const urls = new Map<string, string>()

function toURL(img: Img): string {
  const c = document.createElement('canvas')
  c.width = img.w
  c.height = img.h
  const ctx = c.getContext('2d')
  if (!ctx) return ''
  ctx.putImageData(new ImageData(new Uint8ClampedArray(img.data), img.w, img.h), 0, 0)
  return c.toDataURL('image/png')
}

/** 絵がない時の代わり（足りない絵がすぐわかるように、灰色の箱に×） */
const MISSING = { rows: ['GGGGGGGG', 'GK....KG', 'G.K..K.G', 'G..KK..G', 'G..KK..G', 'G.K..K.G', 'GK....KG', 'GGGGGGGG'] }

/** 計算で描いた絵（建物など）を、名前ごとに一度だけ画像にする */
export function imgURL(key: string, draw: () => Img): string {
  let u = urls.get(`img:${key}`)
  if (!u) {
    u = toURL(draw())
    urls.set(`img:${key}`, u)
  }
  return u
}

export function spriteURL(id: string): string {
  const key = `s:${id}`
  let u = urls.get(key)
  if (!u) {
    u = toURL(rasterSprite(SPRITES[id] ?? MISSING))
    urls.set(key, u)
  }
  return u
}

export function sceneURL(id: string): string {
  const key = `scene:${id}`
  let u = urls.get(key)
  if (!u) {
    const sc = SCENES[id]
    u = sc ? toURL(rasterScene(sc, SPRITES)) : toURL(rasterSprite(MISSING))
    urls.set(key, u)
  }
  return u
}

/** 場面の一部を切り出した絵（結果の一覧で、見つけた物を見せる） */
export function cropURL(sceneId: string, box: Box, pad = 3): string {
  const key = `crop:${sceneId}:${box.join(',')}:${pad}`
  let u = urls.get(key)
  if (!u) {
    const sc = SCENES[sceneId]
    if (!sc) return spriteURL('missing')
    const full = rasterScene(sc, SPRITES)
    const x0 = Math.max(0, box[0] - pad)
    const y0 = Math.max(0, box[1] - pad)
    const x1 = Math.min(SCENE_W, box[0] + box[2] + pad)
    const y1 = Math.min(SCENE_H, box[1] + box[3] + pad)
    const w = Math.max(1, x1 - x0)
    const h = Math.max(1, y1 - y0)
    const out: Img = { w, h, data: new Uint8ClampedArray(w * h * 4) }
    for (let y = 0; y < h; y++) out.data.set(full.data.subarray(((y0 + y) * SCENE_W + x0) * 4, ((y0 + y) * SCENE_W + x0 + w) * 4), y * w * 4)
    u = toURL(out)
    urls.set(key, u)
  }
  return u
}

export function artSize(id: string): [number, number] {
  return spriteSize(SPRITES[id] ?? MISSING)
}

/** 絵1枚。scale は1ドットの大きさ（px）。tint で 'x' の色を変える */
export function Art({ id, scale = 2, className = '', title, tint }: { id: string; scale?: number; className?: string; title?: string; tint?: string }) {
  const [w, h] = artSize(id)
  const src = tint ? imgURL(`${id}@${tint}`, () => rasterSprite({ ...(SPRITES[id] ?? MISSING), pal: { ...(SPRITES[id]?.pal ?? {}), x: tint } })) : spriteURL(id)
  return <img src={src} width={w * scale} height={h * scale} className={`pixelated inline-block shrink-0 ${className}`} alt={title ?? ''} aria-hidden={title ? undefined : true} draggable={false} />
}
