// 絵の確認用 PNG を作る（ブラウザ不要）
//   npx jiti scripts/preview.ts scene office [倍率] [--boxes]   場面（--boxes で押せる範囲を枠で出す）
//   npx jiti scripts/preview.ts sheet people [倍率]              まとまりの絵を一覧で
//   npx jiti scripts/preview.ts sprite face.boss [倍率]          1枚
//   npx jiti scripts/preview.ts all                              全部の場面と一覧
// 出力：.previews/（--out=フォルダ で変更）
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { deflateSync } from 'node:zlib'
import { SCENES, SPRITES, SPRITE_GROUPS } from '../src/art/index'
import { drawSprite, newImg, rect, scaleImg, spriteSize, type Img } from '../src/art/raster'
import { anchors, rasterScene, SCENE_H, SCENE_W } from '../src/art/scene'

const args = process.argv.slice(2)
const out = resolve(args.find((a) => a.startsWith('--out='))?.slice(6) ?? '.previews')
mkdirSync(out, { recursive: true })
const pos = args.filter((a) => !a.startsWith('--'))

// ---- PNG
const CRC = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()
function crc32(buf: Buffer) {
  let c = 0xffffffff
  for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function chunk(type: string, data: Buffer) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(td))
  return Buffer.concat([len, td, crc])
}
function png(img: Img): Buffer {
  const raw = Buffer.alloc((img.w * 4 + 1) * img.h)
  for (let y = 0; y < img.h; y++) {
    raw[y * (img.w * 4 + 1)] = 0
    Buffer.from(img.data.buffer, img.data.byteOffset + y * img.w * 4, img.w * 4).copy(raw, y * (img.w * 4 + 1) + 1)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(img.w, 0)
  ihdr.writeUInt32BE(img.h, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))])
}
const save = (name: string, img: Img) => {
  const p = join(out, name)
  writeFileSync(p, png(img))
  console.log(p)
}

/** 拡大した絵に、1px の枠を描く */
function frame(img: Img, k: number, b: [number, number, number, number], color: string) {
  const [x, y, w, h] = b.map((v) => v * k)
  rect(img, x, y, w, 1, color)
  rect(img, x, y + h - 1, w, 1, color)
  rect(img, x, y, 1, h, color)
  rect(img, x + w - 1, y, 1, h, color)
}

function scene(id: string, k = 4, boxes = false) {
  const sc = SCENES[id]
  if (!sc) throw new Error(`no scene ${id}`)
  const img = scaleImg(rasterScene(sc, SPRITES), k)
  if (boxes)
    for (const [aid, b] of Object.entries(anchors(sc, SPRITES))) {
      frame(img, k, b, '#ff2020')
      console.log(aid, b.join(','))
    }
  save(`scene-${id}${boxes ? '-boxes' : ''}.png`, img)
}

function sheet(group: string, k = 4) {
  const g = SPRITE_GROUPS[group]
  if (!g) throw new Error(`no group ${group}`)
  const names = Object.keys(g)
  if (!names.length) return console.log(`(${group} is empty)`)
  const cell = Math.max(16, ...names.map((n) => Math.max(...spriteSize(g[n])))) + 4
  const cols = Math.max(1, Math.min(8, Math.floor(256 / cell)))
  const rows = Math.ceil(names.length / cols)
  const img = newImg(cols * cell, rows * cell)
  // 市松の背景（透明がわかるように）
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) rect(img, x, y, 1, 1, (Math.floor(x / 4) + Math.floor(y / 4)) % 2 ? '#d8d8d8' : '#f0f0f0')
  names.forEach((n, i) => {
    const [w, h] = spriteSize(g[n])
    const cx = (i % cols) * cell + Math.floor((cell - w) / 2)
    const cy = Math.floor(i / cols) * cell + Math.floor((cell - h) / 2)
    drawSprite(img, g[n], cx, cy)
    console.log(`${String(i).padStart(2)} ${n} ${w}x${h}`)
  })
  save(`sheet-${group}.png`, scaleImg(img, k))
}

function one(name: string, k = 8) {
  const s = SPRITES[name]
  if (!s) throw new Error(`no sprite ${name}`)
  const [w, h] = spriteSize(s)
  const img = newImg(w + 2, h + 2, '#e8e8e8')
  drawSprite(img, s, 1, 1)
  save(`sprite-${name}.png`, scaleImg(img, k))
}

const [mode, a, b] = pos
const k = b ? Number(b) : undefined
if (mode === 'scene') scene(a, k ?? 4, args.includes('--boxes'))
else if (mode === 'sheet') sheet(a, k ?? 4)
else if (mode === 'sprite') one(a, k ?? 8)
else if (mode === 'all') {
  for (const id of Object.keys(SCENES)) {
    scene(id, 4)
    scene(id, 4, true)
  }
  for (const g of Object.keys(SPRITE_GROUPS)) sheet(g)
} else console.log(`usage: scene <id> [scale] [--boxes] | sheet <group> [scale] | sprite <name> [scale] | all   (scene is ${SCENE_W}x${SCENE_H})`)
