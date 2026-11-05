// ブラウザ依存：保存・設定・サウンド（WebAudioで合成。音声ファイル不要）
import type { Campaign, EndingId } from '../game/campaign'
import type { Lang } from '../game/types'

const KEY = 'sit.v2'

export interface SaveData {
  campaign: Campaign | null
  /** 現在のキャンペーンで次に遊ぶDIVE番号 */
  at: number
  best: Record<string, number> // DIVE別の最高★
  endings: EndingId[]
  codex: string[]
  plays: number
}

export const emptySave = (): SaveData => ({ campaign: null, at: 0, best: {}, endings: [], codex: [], plays: 0 })

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...emptySave(), ...JSON.parse(raw) }
  } catch {
    /* プライベートモード等 */
  }
  return emptySave()
}
export function writeSave(d: SaveData) {
  try {
    localStorage.setItem(KEY, JSON.stringify(d))
  } catch {
    /* noop */
  }
}

export interface Settings {
  /** 表示言語（日本語／英語） */
  lang: Lang
  sound: boolean
  music: boolean
  textSpeed: 'normal' | 'fast' | 'instant'
  motion: boolean
}
const SKEY = 'sit.settings'
/** ?lang=en / ?lang=ja が付いていれば、それを優先する（英語版のリンクを共有できるように） */
function urlLang(): Lang | null {
  try {
    const l = new URLSearchParams(location.search).get('lang')
    return l === 'en' || l === 'ja' ? l : null
  } catch {
    return null
  }
}
function browserLang(): Lang {
  try {
    const l = (navigator.languages?.[0] ?? navigator.language ?? 'ja').toLowerCase()
    return l.startsWith('ja') ? 'ja' : 'en'
  } catch {
    return 'ja'
  }
}
export function loadSettings(): Settings {
  const d: Settings = { lang: browserLang(), sound: true, music: true, textSpeed: 'normal', motion: true }
  const forced = urlLang()
  try {
    const raw = localStorage.getItem(SKEY)
    if (raw) {
      const s: Settings = { ...d, ...JSON.parse(raw) }
      if (s.lang !== 'ja' && s.lang !== 'en') s.lang = d.lang
      return forced ? { ...s, lang: forced } : s
    }
  } catch {
    /* noop */
  }
  if (typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches) d.motion = false
  return forced ? { ...d, lang: forced } : d
}
export function writeSettings(s: Settings) {
  try {
    localStorage.setItem(SKEY, JSON.stringify(s))
  } catch {
    /* noop */
  }
}

export const FAST = typeof location !== 'undefined' && new URLSearchParams(location.search).has('fast')

// =============== Audio ===============
let ctx: AudioContext | null = null
let master: GainNode | null = null
let sfxOn = true
let musicOn = true

function ac() {
  if (!ctx) {
    ctx = new AudioContext()
    master = ctx.createGain()
    master.gain.value = 0.6
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

export function setAudio(sound: boolean, music: boolean) {
  sfxOn = sound
  musicOn = music
  if (!music) stopMusic()
}

function tone(freq: number, dur: number, type: OscillatorType = 'square', gain = 0.05, when = 0, slide = 0) {
  if (!sfxOn) return
  try {
    const c = ac()
    const t = c.currentTime + when
    const o = c.createOscillator()
    const g = c.createGain()
    o.type = type
    o.frequency.setValueAtTime(freq, t)
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), t + dur)
    g.gain.setValueAtTime(gain, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    o.connect(g).connect(master!)
    o.start(t)
    o.stop(t + dur + 0.02)
  } catch {
    /* noop */
  }
}

function noise(dur: number, gain = 0.06, when = 0, hp = 800) {
  if (!sfxOn) return
  try {
    const c = ac()
    const t = c.currentTime + when
    const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length)
    const src = c.createBufferSource()
    src.buffer = buf
    const f = c.createBiquadFilter()
    f.type = 'highpass'
    f.frequency.value = hp
    const g = c.createGain()
    g.gain.value = gain
    src.connect(f).connect(g).connect(master!)
    src.start(t)
  } catch {
    /* noop */
  }
}

export const sfx = {
  ui: () => tone(1320, 0.04, 'square', 0.025),
  hover: () => tone(2200, 0.015, 'square', 0.008),
  step: () => {
    tone(220, 0.06, 'square', 0.04, 0, 1.6)
    noise(0.03, 0.03, 0, 3000)
  },
  read: () => {
    tone(880, 0.05, 'triangle', 0.03)
    tone(1175, 0.05, 'triangle', 0.03, 0.05)
  },
  inject: () => {
    tone(140, 0.18, 'sawtooth', 0.05, 0, 0.5)
    tone(1800, 0.05, 'square', 0.02, 0.02)
    tone(1500, 0.05, 'square', 0.02, 0.08)
  },
  seal: () => {
    noise(0.08, 0.12, 0, 200)
    tone(90, 0.16, 'square', 0.09, 0, 0.6)
    tone(660, 0.05, 'square', 0.03, 0.09)
  },
  unseal: () => tone(500, 0.08, 'square', 0.03, 0, 1.5),
  cut: () => {
    noise(0.12, 0.1, 0, 2500)
    tone(1600, 0.1, 'sawtooth', 0.04, 0, 0.2)
  },
  gate: () => {
    tone(330, 0.05, 'square', 0.05)
    tone(247, 0.09, 'square', 0.05, 0.05)
  },
  open: () => tone(440, 0.06, 'square', 0.03, 0, 1.4),
  exec: () => tone(523, 0.05, 'square', 0.03),
  blocked: () => {
    tone(196, 0.07, 'square', 0.06)
    tone(147, 0.12, 'square', 0.06, 0.07)
  },
  goal: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12, 'square', 0.04, i * 0.06)),
  leak: () => {
    for (let i = 0; i < 6; i++) tone(i % 2 ? 494 : 740, 0.12, 'sawtooth', 0.06, i * 0.12)
    noise(0.6, 0.05, 0, 400)
  },
  harm: () => tone(110, 0.4, 'sawtooth', 0.07, 0, 0.5),
  gateAsk: () => [880, 880].forEach((f, i) => tone(f, 0.06, 'square', 0.04, i * 0.12)),
  scan: () => {
    for (let i = 0; i < 5; i++) tone(1200 + i * 220, 0.03, 'square', 0.02, i * 0.03)
  },
  intel: () => [784, 988, 1319].forEach((f, i) => tone(f, 0.1, 'triangle', 0.05, i * 0.07)),
  denied: () => tone(160, 0.2, 'square', 0.05),
  star: (n: number) => tone(660 + n * 220, 0.15, 'square', 0.05),
  win: () => [392, 523, 659, 784, 659, 784, 1047].forEach((f, i) => tone(f, 0.11, 'square', 0.04, i * 0.08)),
  lose: () => [392, 370, 349, 311].forEach((f, i) => tone(f, 0.2, 'square', 0.04, i * 0.16)),
  type: () => tone(1800 + Math.random() * 400, 0.012, 'square', 0.01),
}

// --------- BGM: ダークシンセのアルペジオ（危険度で緊張が上がる） ---------
let musicTimer: number | null = null
let tension = 0
export function setTension(v: number) {
  tension = v
}
export function startMusic() {
  if (!musicOn || musicTimer !== null) return
  try {
    ac()
  } catch {
    return
  }
  const prog = [
    [110, 131, 165, 196],
    [87, 110, 131, 175],
    [98, 123, 147, 185],
    [82, 104, 123, 165],
  ]
  let step = 0
  const tick = () => {
    if (!musicOn || !ctx) return
    const bar = Math.floor(step / 16) % prog.length
    const ch = prog[bar]
    const s = step % 16
    const t = ctx.currentTime
    const play = (f: number, d: number, type: OscillatorType, g: number) => {
      const o = ctx!.createOscillator()
      const gn = ctx!.createGain()
      o.type = type
      o.frequency.value = f
      gn.gain.setValueAtTime(g, t)
      gn.gain.exponentialRampToValueAtTime(0.0001, t + d)
      o.connect(gn).connect(master!)
      o.start(t)
      o.stop(t + d + 0.02)
    }
    if (s % 8 === 0) play(ch[0] / 2, 0.9, 'triangle', 0.05)
    if (s % 2 === 0) play(ch[(s / 2) % 4] * 2, 0.18, 'square', 0.012 + tension * 0.01)
    if (tension > 0.3 && s % 4 === 2) play(4000, 0.02, 'square', 0.006 + tension * 0.01)
    if (tension > 0.66 && s % 4 === 0) play(55, 0.15, 'sawtooth', 0.03)
    step++
  }
  musicTimer = window.setInterval(tick, 140)
}
export function stopMusic() {
  if (musicTimer !== null) clearInterval(musicTimer)
  musicTimer = null
}
