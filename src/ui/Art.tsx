// ドット絵を画面に出す：絵を一度だけ画像にして、拡大は「ぼかさない」で表示する
import { SCENES, SPRITES } from '../art'
import { rasterSprite, spriteSize, type Img } from '../art/raster'
import { anchors, rasterScene, SCENE_H, SCENE_W } from '../art/scene'
import type { Box, Day } from '../game/types'

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

/** 絵1枚。scale は1ドットの大きさ（px） */
export function Art({ id, scale = 2, className = '', title }: { id: string; scale?: number; className?: string; title?: string }) {
  const [w, h] = artSize(id)
  return <img src={spriteURL(id)} width={w * scale} height={h * scale} className={`pixelated inline-block shrink-0 ${className}`} alt={title ?? ''} aria-hidden={title ? undefined : true} draggable={false} />
}

/** 絵の名前が "crop:物の id" のときは、その日の場面から切り出す */
export function PicArt({ id, day, boxes, scale = 2, max = 48 }: { id: string; day: Day; boxes: Record<string, Box>; scale?: number; max?: number }) {
  if (id.startsWith('crop:')) {
    const b = boxes[id.slice(5)]
    if (!b) return <Art id="missing" scale={scale} />
    const k = Math.max(1, Math.min(scale * 2, Math.floor(max / Math.max(b[2] + 6, b[3] + 6))))
    return <img src={cropURL(day.scene, b)} width={(b[2] + 6) * k} height={(b[3] + 6) * k} className="pixelated inline-block shrink-0" alt="" aria-hidden draggable={false} />
  }
  return <Art id={id} scale={scale} />
}

/** その日の、押せる物の範囲（書いた範囲 → なければ絵の印） */
export function boxesOf(day: Day): Record<string, Box> {
  const sc = SCENES[day.scene]
  const an = sc ? anchors(sc, SPRITES) : {}
  const out: Record<string, Box> = {}
  for (const s of day.spots) {
    const b = s.box ?? an[s.id]
    if (b) out[s.id] = b
  }
  return out
}
