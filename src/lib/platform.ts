// ブラウザ依存の小物：保存・効果音・設定
import type { EndingId, PrevRun } from '../game/types'

const KEY = 'sit.ep01.v1'

export interface SaveData {
  endingsSeen: EndingId[]
  prevRun: PrevRun | null
  plays: number
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { endingsSeen: [], prevRun: null, plays: 0, ...JSON.parse(raw) }
  } catch {
    /* プライベートモード等 */
  }
  return { endingsSeen: [], prevRun: null, plays: 0 }
}

export function writeSave(d: SaveData) {
  try {
    localStorage.setItem(KEY, JSON.stringify(d))
  } catch {
    /* noop */
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* noop */
  }
}

// ---- 効果音（WebAudioで合成。音声ファイル不要） ----
let ctx: AudioContext | null = null
export let muted = false
export function setMuted(m: boolean) {
  muted = m
}

function tone(freq: number, dur: number, type: OscillatorType = 'sine', gain = 0.05, when = 0) {
  if (muted) return
  try {
    ctx ??= new AudioContext()
    const t = ctx.currentTime + when
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = type
    o.frequency.setValueAtTime(freq, t)
    g.gain.setValueAtTime(gain, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    o.connect(g).connect(ctx.destination)
    o.start(t)
    o.stop(t + dur)
  } catch {
    /* noop */
  }
}

export const sfx = {
  msg: () => tone(880, 0.06, 'sine', 0.025),
  alert: () => {
    tone(440, 0.18, 'square', 0.04)
    tone(330, 0.25, 'square', 0.04, 0.2)
  },
  click: () => tone(1200, 0.03, 'triangle', 0.03),
  good: () => {
    tone(660, 0.1, 'sine', 0.04)
    tone(990, 0.16, 'sine', 0.04, 0.1)
  },
  siren: () => {
    for (let i = 0; i < 4; i++) {
      tone(620, 0.22, 'sawtooth', 0.035, i * 0.5)
      tone(480, 0.22, 'sawtooth', 0.035, i * 0.5 + 0.25)
    }
  },
  ring: () => {
    tone(740, 0.12, 'sine', 0.04)
    tone(740, 0.12, 'sine', 0.04, 0.2)
  },
}

/** ?fast=1 でセリフ演出をスキップ（テスト・リプレイ用） */
export const FAST = typeof location !== 'undefined' && new URLSearchParams(location.search).has('fast')
