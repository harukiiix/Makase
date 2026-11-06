// 工事中の銀行の建物：レッスンを1つ終えるごとに1階分できる。まとめテストに合格すると完成
import { dither, line, newImg, rect, type Img } from '../art/raster'
import { imgURL } from './Art'

const W = 72
const H = 72
const FLOOR = 9
const BASE = 58 // 1階の床の高さ（y）
const X0 = 16
const X1 = 52

/** i 階目（0から）の床と窓 */
function floor(img: Img, i: number, done: boolean) {
  const y = BASE - (i + 1) * FLOOR
  rect(img, X0, y, X1 - X0, FLOOR, 'c')
  rect(img, X0, y + FLOOR - 1, X1 - X0, 1, 'C')
  rect(img, X0, y, 1, FLOOR, 'C')
  rect(img, X1 - 1, y, 1, FLOOR, 'C')
  for (let k = 0; k < 4; k++) {
    const wx = X0 + 3 + k * 8
    rect(img, wx, y + 2, 5, 4, done ? 't' : 'I')
    rect(img, wx, y + 2, 5, 1, done ? 'S' : 'k')
  }
}

/** 絵を描く（確かめ用の PNG にも使う） */
export function drawBuilding(floors: number, all: number, done: boolean): Img {
  const img = newImg(W, H, '#d4f0ff')
  // 空と雲
  rect(img, 0, 0, W, 30, '#d4f0ff')
  rect(img, 0, 30, W, 34, '#bfe6fb')
  rect(img, 6, 8, 10, 3, 'W')
  rect(img, 8, 6, 6, 2, 'W')
  rect(img, 50, 14, 12, 3, 'W')
  // 地面
  rect(img, 0, BASE + 6, W, H - BASE - 6, 'a')
  dither(img, 0, BASE + 5, W, 1, 'a', 'C')
  // 建物：できた階
  for (let i = 0; i < floors; i++) floor(img, i, done)
  // まだの階：足場とネット
  for (let i = floors; i < all; i++) {
    const y = BASE - (i + 1) * FLOOR
    for (let x = X0; x <= X1; x += 6) rect(img, x, y, 1, FLOOR, 'g')
    rect(img, X0, y, X1 - X0 + 1, 1, 'g')
    dither(img, X0 + 1, y + 1, X1 - X0 - 1, FLOOR - 1, '#9bd3a0', '.')
  }
  const top = BASE - all * FLOOR
  if (done) {
    // 完成：地面と歩道を建物の床の高さから（宙に浮いて見えないように）
    rect(img, 0, BASE, W, H - BASE, 'a')
    rect(img, 0, BASE, W, 3, 'c')
    rect(img, 0, BASE + 3, W, 1, 'C')
    // 屋上の手すりと、小さな設備（看板は文字が読めないので置かない）
    rect(img, X0 - 1, top - 2, X1 - X0 + 2, 2, 'C')
    rect(img, X0 + 4, top - 5, 7, 3, 'G')
    rect(img, X0 + 4, top - 5, 7, 1, 'w')
    rect(img, X1 - 10, top - 4, 5, 2, 'G')
    // 入口とひさし
    rect(img, X0 + 12, BASE - 8, 12, 1, 'n')
    rect(img, X0 + 14, BASE - 6, 8, 6, 'I')
    rect(img, X0 + 15, BASE - 5, 6, 5, 't')
    rect(img, X0 + 17, BASE - 5, 2, 5, 'I')
    // 植え込みの木（根もとは歩道の上）
    for (const tx of [4, 60]) {
      rect(img, tx + 3, BASE - 3, 2, 4, 'D')
      rect(img, tx, BASE - 10, 8, 7, 'l')
      rect(img, tx + 1, BASE - 11, 6, 1, 'l')
      dither(img, tx, BASE - 10, 8, 7, 'l', 'e')
    }
  } else {
    // 仮囲い（白い板に緑の帯）
    rect(img, 0, BASE - 2, W, 8, 'W')
    rect(img, 0, BASE + 3, W, 2, 'e')
    for (let x = 0; x < W; x += 9) rect(img, x, BASE - 2, 1, 8, 'G')
    rect(img, 28, BASE - 2, 14, 8, 'a')
    rect(img, 28, BASE - 2, 14, 1, 'y')
    // クレーン
    const cx = 60
    rect(img, cx, 4, 3, BASE - 4, 'y')
    for (let y = 6; y < BASE; y += 4) line(img, cx, y, cx + 2, y + 2, 'Y')
    rect(img, 22, 4, 44, 2, 'y')
    rect(img, 62, 2, 4, 2, 'Y')
    line(img, 30, 6, 30, Math.max(8, top - 2), 'k')
    rect(img, 28, Math.max(8, top - 2), 5, 3, 'o')
  }
  return img
}

/**
 * drop = true の時は、いちばん上の新しい階が、クレーンで上から降りてくる（終わった時の1回だけの動き）
 */
export function Building({ floors, all, done, scale = 3, drop = false, className = '' }: { floors: number; all: number; done: boolean; scale?: number; drop?: boolean; className?: string }) {
  const base = drop && floors > 0 ? floors - 1 : floors
  const src = imgURL(`building:${base}/${all}:${done}`, () => drawBuilding(base, all, done))
  if (base === floors) return <img src={src} width={W * scale} height={H * scale} className={`pixelated ${className}`} alt="" aria-hidden draggable={false} />
  const top = imgURL(`building-floor:${floors - 1}:${done}`, () => {
    const img = newImg(W, H)
    floor(img, floors - 1, done)
    return img
  })
  return (
    <span className={`relative inline-block ${className}`} style={{ width: W * scale, height: H * scale }} aria-hidden>
      <img src={src} width={W * scale} height={H * scale} className="pixelated absolute inset-0" alt="" draggable={false} />
      <img src={top} width={W * scale} height={H * scale} className="pixelated lower absolute inset-0" alt="" draggable={false} />
    </span>
  )
}
