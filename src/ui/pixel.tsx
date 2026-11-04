// ドット絵スプライト（文字列グリッド → SVG）。画像ファイル不要。
import { useEffect, useRef } from 'react'

type Pal = Record<string, string>

export function Sprite({ rows, pal, size = 4, className, title }: { rows: string[]; pal: Pal; size?: number; className?: string; title?: string }) {
  const w = Math.max(...rows.map((r) => r.length))
  const rects: React.ReactElement[] = []
  rows.forEach((r, y) => {
    for (let x = 0; x < r.length; x++) {
      const c = pal[r[x]]
      if (c) rects.push(<rect key={`${x},${y}`} x={x} y={y} width={1.02} height={1.02} fill={c} />)
    }
  })
  return (
    <svg
      viewBox={`0 0 ${w} ${rows.length}`}
      width={w * size}
      height={rows.length * size}
      shapeRendering="crispEdges"
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {rects}
    </svg>
  )
}

// ---------------- NOVA ----------------
const NOVA_BASE = [
  '.......gg.......',
  '.......gg.......',
  '.....aaaaaa.....',
  '...aabbbbbbaa...',
  '..abbbbbbbbbba..',
  '.abbccccccccbba.',
  '.abcddddddddcba.',
  'abbcd######dcbba',
  'abbcd######dcbba',
  'abbcd######dcbba',
  'abbcd######dcbba',
  '.abcddddddddcba.',
  '.abbccccccccbba.',
  '..abbbbbbbbbba..',
  '...aabbbbbbaa...',
  '.....aaaaaa.....',
]
const EYES: Record<NovaMood, string[]> = {
  idle: ['dddddd', 'dffdff', 'dffdff', 'dddddd'],
  think: ['dddddd', 'dddddd', 'fffddd', 'dddddd'],
  happy: ['dddddd', 'dfdddf', 'fdfdfd', 'dddddd'],
  alarm: ['fdddfd', 'dfdfdd', 'dfdfdd', 'fdddfd'],
  glitch: ['ddmmdd', 'dfmdff', 'mffdmd', 'ddmdmd'],
}
export type NovaMood = 'idle' | 'think' | 'happy' | 'alarm' | 'glitch'

export function Nova({ mood = 'idle', size = 5 }: { mood?: NovaMood; size?: number }) {
  let ei = 0
  const rows = NOVA_BASE.map((r) => (r.includes('#') ? r.replace('######', EYES[mood][ei++]) : r))
  const accent = mood === 'alarm' ? '#ff4060' : mood === 'glitch' ? '#ff3df0' : mood === 'happy' ? '#4dff9a' : '#3ef0ff'
  return (
    <Sprite
      rows={rows}
      size={size}
      title="NOVA"
      pal={{ a: '#05060d', b: '#c7d3ff', c: '#7380c4', d: '#0a0e1d', f: accent, g: accent, m: '#ff3df0' }}
    />
  )
}

// ---------------- 立ち絵（顔） ----------------
const FACE: Record<string, { rows: string[]; pal: Pal }> = {
  REI: {
    rows: [
      '....hhhhhhhh....',
      '..hhhhhhhhhhhh..',
      '.hhhhhhhhhhhhhh.',
      '.hhhsssssssshhh.',
      '.hhsssssssssshh.',
      '.hhsoooosoooo.h.',
      '.hhso.eoso.eoshh',
      '.hhsoooosoooosh.',
      '.hhssssssssssshh',
      '.hhhsssssssshhh.',
      '.hhhssssmmsshhh.',
      '.hhh.ssssssshhh.',
      '.hh...ssssss.hh.',
      '....kkkkkkkkk...',
      '..kkkkkwwkkkkkk.',
      '.kkkkkkwwkkkkkkk',
    ],
    pal: { h: '#2b2350', s: '#f2c9a8', o: '#ffc23d', e: '#1a1030', m: '#c4675a', k: '#263063', w: '#e4ebff' },
  },
  KAI: {
    rows: [
      '................',
      '....hhhhhhhh....',
      '...hhhhhhhhhhh..',
      '..hhhhhhhhhhhhh.',
      '..hhsssssssssh..',
      '..hbbbsssbbbsh..',
      '..hsessssessss..',
      '..ssssssssssss..',
      '..ssssssnsssss..',
      '...sssssssssss..',
      '...sssmmmmssss..',
      '....sssssssss...',
      '......sssss.....',
      '...kkkwwrwwkkk..',
      '..kkkkkwrwkkkkk.',
      '.kkkkkkkrkkkkkkk',
    ],
    pal: { h: '#111426', s: '#e6b896', b: '#111426', e: '#1a1030', n: '#c99876', m: '#7a3b3b', k: '#1a1f3a', w: '#e4ebff', r: '#ff4060' },
  },
  MIRAGE: {
    rows: [
      '.....hhhhhh.....',
      '...hhhhhhhhhh...',
      '..hhhhhhhhhhhh..',
      '.hhhwwwwwwwwhhh.',
      '.hhwwwwwwwwwwhh.',
      '.hhwwxwwwwxwwhh.',
      '.hhwxxxwwxxxwhh.',
      '.hhwwxwwwwxwwhh.',
      '.hhwwwwwwwwwwhh.',
      '.hhwwwwmmwwwwhh.',
      '.hhhwwwwwwwwhhh.',
      '.hhhhwwwwwwhhhh.',
      'hhhhhhhhhhhhhhhh',
      'hhhhhhhhhhhhhhhh',
      'hhhhhhhhhhhhhhhh',
      'hhhhhhhhhhhhhhhh',
    ],
    pal: { h: '#140a24', w: '#e9e4ff', x: '#ff3df0', m: '#ff3df0' },
  },
}

export function Face({ who, size = 3 }: { who: string; size?: number }) {
  const f = FACE[who]
  if (!f) return null
  return <Sprite rows={f.rows} pal={f.pal} size={size} title={who} />
}

// ---------------- 背景：雨の湾岸の夜景（低解像度キャンバス） ----------------
export function CityBG({ intensity = 0, still = false, dim = false }: { intensity?: number; still?: boolean; dim?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const inten = useRef(intensity)
  inten.current = intensity
  useEffect(() => {
    const cv = ref.current!
    const ctx = cv.getContext('2d')!
    const W = 240
    const H = 135
    cv.width = W
    cv.height = H
    let seed = 7
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    type B = { x: number; w: number; h: number; layer: number; win: boolean[] }
    const bs: B[] = []
    for (let layer = 0; layer < 3; layer++) {
      let x = -10
      while (x < W + 10) {
        const w = 10 + Math.floor(rnd() * (layer === 2 ? 30 : 22))
        const h = [40, 60, 85][layer] * (0.45 + rnd() * 0.75)
        bs.push({ x, w, h, layer, win: Array.from({ length: 200 }, () => rnd() < [0.04, 0.06, 0.09][layer]) })
        x += w + Math.floor(rnd() * 4)
      }
    }
    const drops = Array.from({ length: 140 }, () => ({ x: rnd() * W, y: rnd() * H, s: 2 + rnd() * 3 }))
    // ネオンは細い線で。大きな四角は表示崩れに見えるので避ける
    const neon = [
      { x: 38, y: 64, w: 7, h: 1, c: 'rgba(255,61,240,.55)' },
      { x: 152, y: 50, w: 1, h: 6, c: 'rgba(62,240,255,.5)' },
      { x: 202, y: 76, w: 8, h: 1, c: 'rgba(255,194,61,.5)' },
    ]
    let t = 0
    let raf = 0
    let last = 0
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw)
      if (now - last < 66) return // 15fps：ドット絵らしいカクつき
      last = now
      t++
      const k = inten.current
      const g = ctx.createLinearGradient(0, 0, 0, H)
      g.addColorStop(0, k > 0.66 ? '#1a0610' : '#060818')
      g.addColorStop(1, k > 0.66 ? '#2a0a1a' : '#0d1430')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, W, H)
      // 月（ドットで丸く）
      ctx.fillStyle = '#2a3366'
      ctx.fillRect(198, 14, 4, 1)
      ctx.fillRect(197, 15, 6, 4)
      ctx.fillRect(198, 19, 4, 1)
      for (const b of bs) {
        const shade = ['#0b1026', '#080c1d', '#05070f'][b.layer]
        ctx.fillStyle = shade
        const top = H - b.h - [16, 8, 0][b.layer]
        ctx.fillRect(Math.floor(b.x), Math.floor(top), b.w, H)
        let i = 0
        for (let wy = top + 3; wy < H - 4; wy += 4)
          for (let wx = b.x + 2; wx < b.x + b.w - 2; wx += 3) {
            if (b.win[i++ % 200]) {
              const flick = (i * 31 + t) % 97 === 0
              ctx.fillStyle = flick ? '#05070f' : b.layer === 2 ? '#b8975a' : b.layer === 1 ? '#6b5d44' : '#34323d'
              ctx.fillRect(Math.floor(wx), Math.floor(wy), 1, 1)
            }
          }
      }
      for (const n of neon) {
        const on = (t + n.x) % 53 > 2
        ctx.fillStyle = on ? n.c : 'rgba(32,21,42,.6)'
        ctx.fillRect(n.x, n.y, n.w, n.h)
      }
      // 雨
      ctx.fillStyle = k > 0.66 ? 'rgba(255,120,160,.45)' : 'rgba(140,170,255,.35)'
      for (const d of drops) {
        if (!still) {
          d.y += d.s + k * 2
          d.x -= 0.6
          if (d.y > H) {
            d.y = -4
            d.x = Math.random() * W + 20
          }
        }
        ctx.fillRect(Math.floor(d.x), Math.floor(d.y), 1, 3)
      }
      // 水面の反射
      ctx.fillStyle = 'rgba(62,240,255,.06)'
      ctx.fillRect(0, H - 6, W, 6)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [still])
  return <canvas ref={ref} className={`pixelated pointer-events-none fixed inset-0 -z-10 h-full w-full object-cover ${dim ? 'opacity-25' : 'opacity-50'}`} aria-hidden />
}
