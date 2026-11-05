// ドット絵アイコン。文字を読まなくても意味が伝わることが目的
import type { IconId } from '../game/types'
import { ICONS } from './iconData'

export function Icon({ id, size = 3, className, title, muted }: { id: IconId; size?: number; className?: string; title?: string; muted?: boolean }) {
  const art = ICONS[id]
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
      width={w * size}
      height={h * size}
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
