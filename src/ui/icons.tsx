// ドット絵アイコン。文字を読まなくても意味が伝わることが目的
import type { IconId } from '../game/types'
import { ICONS, type IconArt } from './iconData'

/** 絵が見つからないときの代わり（落ちないように） */
const MISSING: IconArt = { rows: ['....', '.aa.', '.aa.', '....'], pal: { a: '#8590c0' } }

export function Icon({ id, size = 3, className, title, muted }: { id: IconId; size?: number; className?: string; title?: string; muted?: boolean }) {
  const art = ICONS[id] ?? MISSING
  // 12×12 以外の絵（代わりの絵など）も、同じ大きさで表示する
  const scale = 12 / Math.max(art.rows.length, 1)
  const w = Math.max(...art.rows.map((r) => r.length))
  const h = art.rows.length
  const rects: React.ReactElement[] = []
  art.rows.forEach((r, y) => {
    for (let x = 0; x < r.length; x++) {
      const c = art.pal[r[x]]
      if (c) rects.push(<rect key={`${x},${y}`} x={x} y={y} width={1.02} height={1.02} fill={c} />)
    }
  })
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={w * size * scale}
      height={h * size * scale}
      shapeRendering="crispEdges"
      className={className}
      style={muted ? { opacity: 0.35, filter: 'grayscale(1)' } : undefined}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {rects}
    </svg>
  )
}
