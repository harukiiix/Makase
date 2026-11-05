// ブラウザ依存：保存・設定・サウンド（WebAudioで合成。音声ファイル不要）
import { newProgress, type Progress } from '../game/learn'
import type { Lang } from '../game/types'

const KEY = 'sit.v5'

/** 学びの記録（このブラウザに保存。消えても遊べるように、読めない時は新しく始める） */
export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const p = JSON.parse(raw)
      if (p && p.v === 5) return { ...newProgress(), ...p }
    }
  } catch {
    /* プライベートモード等 */
  }
  return newProgress()
}
export function writeProgress(p: Progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p))
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
  /** 文字が1つ出る音（会話） */
  type: () => tone(1700 + Math.random() * 300, 0.012, 'square', 0.008),
  /** 何もない所を押した */
  tap: () => tone(520, 0.03, 'triangle', 0.02),
  /** 危ない物を見つけた（赤い丸） */
  found: () => {
    tone(880, 0.07, 'square', 0.045)
    tone(1175, 0.1, 'square', 0.04, 0.06)
  },
  /** 正しい対応 */
  right: () => [784, 988, 1319].forEach((f, i) => tone(f, 0.09, 'square', 0.04, i * 0.06)),
  /** もう一つの対応（責めない音） */
  other: () => {
    tone(660, 0.09, 'triangle', 0.05)
    tone(587, 0.12, 'triangle', 0.045, 0.08)
  },
  /** 大丈夫な物 */
  safe: () => tone(988, 0.05, 'triangle', 0.035),
  /** 気になる人 */
  bonus: () => [523, 659, 494, 740].forEach((f, i) => tone(f, 0.08, 'square', 0.03, i * 0.07)),
  /** 監督に聞く */
  hint: () => {
    tone(1047, 0.06, 'triangle', 0.04)
    tone(1397, 0.08, 'triangle', 0.035, 0.07)
  },
  /** 「どうする？」に答える前に、ほかを押した */
  wait: () => tone(220, 0.12, 'square', 0.035),
  /** 全部見つけた */
  complete: () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, 0.12, 'square', 0.04, i * 0.09)),
  /** 見落としのコマ */
  miss: () => [392, 370, 349].forEach((f, i) => tone(f, 0.16, 'triangle', 0.045, i * 0.14)),
  win: () => [392, 523, 659, 784, 659, 784, 1047].forEach((f, i) => tone(f, 0.11, 'square', 0.04, i * 0.08)),
  lose: () => [392, 370, 349, 311].forEach((f, i) => tone(f, 0.2, 'square', 0.04, i * 0.16)),
  page: () => noise(0.05, 0.03, 0, 2500),
}

// --------- BGM：明るく、落ちついた現場の朝（長調のゆっくりした8ビット） ---------
let musicTimer: number | null = null
export function startMusic() {
  if (!musicOn || musicTimer !== null) return
  try {
    ac()
  } catch {
    return
  }
  // C - G - Am - F（各1小節）
  const prog = [
    [131, 165, 196, 262],
    [98, 123, 147, 196],
    [110, 131, 165, 220],
    [87, 110, 131, 175],
  ]
  const melody = [0, 2, 3, 2, 1, 2, 0, -1]
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
    if (s % 8 === 0) play(ch[0] / 2, 1.0, 'triangle', 0.045)
    if (s % 4 === 2) play(ch[1], 0.12, 'square', 0.008)
    if (s % 4 === 0) {
      const m = melody[(Math.floor(step / 4) + bar) % melody.length]
      if (m >= 0) play(ch[m] * 2, 0.22, 'square', 0.012)
    }
    step++
  }
  musicTimer = window.setInterval(tick, 150)
}
export function stopMusic() {
  if (musicTimer !== null) clearInterval(musicTimer)
  musicTimer = null
}
