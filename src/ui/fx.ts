// 粒子・画面揺れ・フラッシュ（DOM直接操作で軽量に）
let motion = true
export function setMotion(m: boolean) {
  motion = m
}

export function burst(target: Element | null, color: string, n = 14, spread = 70) {
  if (!motion || !target) return
  const r = target.getBoundingClientRect()
  const cx = r.left + r.width / 2
  const cy = r.top + r.height / 2
  for (let i = 0; i < n; i++) {
    const p = document.createElement('div')
    p.className = 'particle'
    const a = (Math.PI * 2 * i) / n + Math.random() * 0.4
    const d = spread * (0.4 + Math.random() * 0.8)
    p.style.left = `${cx}px`
    p.style.top = `${cy}px`
    p.style.background = color
    p.style.setProperty('--dx', `${Math.cos(a) * d}px`)
    p.style.setProperty('--dy', `${Math.sin(a) * d}px`)
    p.style.setProperty('--t', `${380 + Math.random() * 300}ms`)
    document.body.appendChild(p)
    setTimeout(() => p.remove(), 800)
  }
}

/** データが端から流れ出していく演出 */
export function stream(target: Element | null, color: string, n = 18) {
  if (!motion || !target) return
  const r = target.getBoundingClientRect()
  for (let i = 0; i < n; i++) {
    const p = document.createElement('div')
    p.className = 'particle'
    p.style.left = `${r.right - 8}px`
    p.style.top = `${r.top + r.height / 2 + (Math.random() - 0.5) * r.height}px`
    p.style.background = color
    p.style.setProperty('--dx', `${window.innerWidth - r.right + 40}px`)
    p.style.setProperty('--dy', `${(Math.random() - 0.5) * 80}px`)
    p.style.setProperty('--t', `${500 + i * 40}ms`)
    p.style.animationDelay = `${i * 35}ms`
    document.body.appendChild(p)
    setTimeout(() => p.remove(), 1600)
  }
}

export function shake(el: Element | null, big = false) {
  if (!motion || !el) return
  const cls = big ? 'shake-l' : 'shake-s'
  el.classList.remove('shake-l', 'shake-s')
  void (el as HTMLElement).offsetWidth
  el.classList.add(cls)
  setTimeout(() => el.classList.remove(cls), big ? 500 : 160)
}

export const q = (sel: string) => document.querySelector(sel)
export const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
