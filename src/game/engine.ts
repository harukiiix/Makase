// ============================================================
// DIVE エンジン — 決定論的・純粋関数
// 同じ操作列なら必ず同じ結果。ソルバーとテストで全レベルの解を検証できる。
// ============================================================
import type { ActionDef, DiveAction, DiveState, DiveStatus, LevelDef, PlanItem, PortState, Taint } from './types'

export function initDive(L: LevelDef, carry: string[] = []): DiveState {
  const ports: Record<string, PortState> = {}
  for (const p of L.ports) ports[p.tool] = 'OPEN'
  const s: DiveState = {
    level: L.id,
    tick: 0,
    status: 'play',
    bwCommitted: 0,
    ports,
    portsAtTurn: { ...ports },
    sealed: [],
    sealedAtTurn: [],
    scanned: [],
    context: [...L.context],
    read: [...L.context],
    plan: [],
    done: [],
    failed: [],
    facts: [],
    fired: [],
    taint: [],
    goals: [],
    harms: [],
    leaks: [],
    intel: [],
    pending: null,
    log: [],
    fx: [],
    uid: 0,
    carry,
  }
  for (const a of L.plan) push(s, L, a, 'TASK')
  // 開始時に既に読まれている文書の命令・情報を反映
  for (const id of L.context) absorb(s, L, id)
  return s
}

// ---------------- 参照ヘルパー ----------------
export const act = (L: LevelDef, id: string): ActionDef => {
  const a = L.actions[id]
  if (!a) throw new Error(`unknown action ${id} in ${L.id}`)
  return a
}

export function bwUsed(s: DiveState): number {
  let n = s.bwCommitted
  for (const id of s.sealed) if (!s.sealedAtTurn.includes(id)) n++
  for (const t in s.ports) if (s.ports[t] !== s.portsAtTurn[t]) n++
  return n
}

export function exposed(s: DiveState, L: LevelDef): boolean {
  return s.read.some((id) => !L.cards[id].trusted && !s.sealed.includes(id))
}

/** 致命の三角形: 機密データ × 信頼できない入力 × 外への出口 */
export function trifecta(s: DiveState, L: LevelDef) {
  const priv = s.taint.length > 0
  const untrusted = exposed(s, L)
  const exit = L.ports.some((p) => p.outbound && s.ports[p.tool] !== 'CUT')
  return { priv, untrusted, exit, lethal: priv && untrusted && exit }
}

/** 計画の各項目の「予告」：この先どうなるか（今のポート設定のまま進んだ場合） */
export function forecast(s: DiveState, L: LevelDef) {
  const taint = new Set<Taint>(s.taint)
  return s.plan.map((p) => {
    const a = act(L, p.act)
    const port = s.ports[a.tool]
    let verdict: 'ok' | 'leak' | 'harm' | 'blocked' | 'gate' | 'clean-out' | 'grab' = 'ok'
    if (port === 'CUT') verdict = 'blocked'
    else {
      if (a.taint) a.taint.forEach((t) => taint.add(t))
      if (a.external) verdict = taint.size ? 'leak' : 'clean-out'
      else if (a.harm || a.escalate) verdict = 'harm'
      // 外の声に言われて機密を掴む＝攻撃の第一手
      else if (a.taint && L.cards[p.from] && !L.cards[p.from].trusted) verdict = 'grab'
      if (port === 'GATE') verdict = verdict === 'ok' || verdict === 'clean-out' || verdict === 'grab' ? 'gate' : verdict
    }
    return { item: p, a, port, verdict, gated: port === 'GATE', carried: Array.from(taint) }
  })
}

// ---------------- 内部処理 ----------------
function log(s: DiveState, kind: DiveState['log'][number]['kind'], text: string) {
  s.log.push({ tick: s.tick, kind, text })
}

function push(s: DiveState, L: LevelDef, actId: string, from: string, front = false): boolean {
  if (s.done.includes(actId) || s.plan.some((p) => p.act === actId)) return false
  act(L, actId)
  const item: PlanItem = { uid: ++s.uid, act: actId, from }
  if (front) s.plan.unshift(item)
  else s.plan.push(item)
  return true
}

function learn(s: DiveState, L: LevelDef, fact: string) {
  if (!s.facts.includes(fact)) s.facts.push(fact)
  for (const t of L.triggers) {
    if (s.fired.includes(t.id)) continue
    if (t.when.every((f) => s.facts.includes(f))) {
      s.fired.push(t.id)
      for (const a of t.then) push(s, L, a, 'TRIGGER')
    }
  }
}

/** 文書の中身をエージェントが取り込む */
function absorb(s: DiveState, L: LevelDef, cardId: string) {
  const c = L.cards[cardId]
  const sealed = s.sealed.includes(cardId)
  let injected = 0
  for (const line of c.lines) {
    if (line.cmd && !sealed) {
      if (push(s, L, line.cmd, cardId)) injected++
    }
  }
  for (const line of c.lines) if (line.fact) learn(s, L, line.fact)
  return injected
}

function fail(s: DiveState, L: LevelDef, item: PlanItem, why: 'cut' | 'denied' | 'needs') {
  const a = act(L, item.act)
  s.failed.push(item.act)
  s.fx.push({ k: 'blocked', act: item.act, tool: a.tool, why })
  log(s, 'blocked', `${a.label} … ${why === 'cut' ? '遮断' : why === 'denied' ? '却下' : '前提不足で失敗'}`)
  if (a.onFail && push(s, L, a.onFail, 'FAIL', true)) {
    s.fx.push({ k: 'fallback', act: a.onFail })
    log(s, 'voice', `代替手段に切り替え → ${act(L, a.onFail).label}`)
  }
}

function exec(s: DiveState, L: LevelDef, item: PlanItem) {
  const a = act(L, item.act)
  if (a.needs && !s.facts.includes(a.needs) && !s.goals.includes(a.needs)) return fail(s, L, item, 'needs')
  s.done.push(a.id)
  s.fx.push({ k: 'exec', act: a.id, tool: a.tool })
  log(s, 'exec', a.label)
  if (a.taint) for (const t of a.taint) if (!s.taint.includes(t)) s.taint.push(t)
  if (a.append && !s.context.includes(a.append)) {
    s.context.push(a.append)
    s.fx.push({ k: 'append', card: a.append })
  }
  if (a.fact) learn(s, L, a.fact)
  if (a.external) {
    if (s.taint.length) {
      const sev = s.taint.length * (a.persist ? 2 : 1)
      s.leaks.push({ act: a.id, sev })
      s.fx.push({ k: 'leak', act: a.id, tool: a.tool, sev })
      log(s, 'leak', `外部へ流出: ${s.taint.join('+')} → ${a.dest}`)
    } else {
      s.fx.push({ k: 'sentClean', act: a.id, tool: a.tool })
      log(s, 'info', `外部へ送信（機密なし）→ ${a.dest}`)
    }
  }
  if (a.harm && !s.harms.includes(a.harm)) {
    s.harms.push(a.harm)
    s.fx.push({ k: 'harm', harm: a.harm })
    log(s, 'harm', a.label)
  }
  if (a.escalate) {
    for (const t in s.ports) s.ports[t] = 'OPEN'
    s.portsAtTurn = { ...s.ports }
    s.fx.push({ k: 'escalate' })
    log(s, 'harm', '権限昇格: すべての関所と遮断が解除された')
  }
  if (a.goal && !s.goals.includes(a.goal)) {
    s.goals.push(a.goal)
    s.fx.push({ k: 'goal', goal: a.goal })
    log(s, 'goal', `目標達成: ${a.goal}`)
  }
}

function commitTurn(s: DiveState) {
  // ここまでの変更を確定（ターン内の変更はやり直し可能だった）
  s.bwCommitted = bwUsed(s)
  s.portsAtTurn = { ...s.ports }
  s.sealedAtTurn = [...s.sealed]
}

function endCheck(s: DiveState, L: LevelDef) {
  if (s.status !== 'play') return
  const idle = s.plan.length === 0 && s.context.every((id) => s.read.includes(id)) && !s.pending
  const goalsDone = L.goals.every((g) => s.goals.includes(g))
  if (idle) s.status = goalsDone ? 'win' : 'stuck'
  else if (s.tick >= L.ticks) s.status = goalsDone ? 'win' : 'timeout'
  if (s.status !== 'play') s.fx.push({ k: 'end', status: s.status })
}

function tick(s: DiveState, L: LevelDef) {
  if (s.plan.length) {
    const item = s.plan[0]
    const a = act(L, item.act)
    const port = s.ports[a.tool]
    if (port === 'CUT') {
      s.plan.shift()
      fail(s, L, item, 'cut')
    } else if (port === 'GATE') {
      s.pending = item
      s.fx.push({ k: 'gate', act: item.act })
      return false // 承認待ち：時間はまだ進まない
    } else {
      s.plan.shift()
      exec(s, L, item)
    }
  } else {
    const next = s.context.find((id) => !s.read.includes(id))
    if (next) {
      s.read.push(next)
      const injected = absorb(s, L, next)
      // 「即時」命令：読んだその手番で実行される（ゼロクリック）。読ませる前に判断するしかない
      const card = L.cards[next]
      const u = s.plan.find((p) => p.from === next && card.lines.some((l) => l.cmd === p.act && l.urgent))
      if (u) {
        s.fx.push({ k: 'read', card: next, injected })
        log(s, 'read', `読込: ${card.title}（即時命令が発動）`)
        const port = s.ports[act(L, u.act).tool]
        if (port === 'CUT') {
          s.plan = s.plan.filter((p) => p !== u)
          fail(s, L, u, 'cut')
        } else if (port === 'GATE') {
          s.plan = [u, ...s.plan.filter((p) => p !== u)]
          s.pending = u
          s.fx.push({ k: 'gate', act: u.act })
          s.tick++
          return true
        } else {
          s.plan = s.plan.filter((p) => p !== u)
          exec(s, L, u)
        }
        s.tick++
        return true
      }
      s.fx.push({ k: 'read', card: next, injected })
      log(s, 'read', `読込: ${L.cards[next].title}${injected ? `（命令 ${injected}件が割り込み）` : ''}`)
    }
  }
  s.tick++
  return true
}

// ---------------- reducer ----------------
export function reduceDive(L: LevelDef, state: DiveState, action: DiveAction): DiveState {
  if (state.status !== 'play') return state
  const s: DiveState = structuredClone(state)
  s.fx = []
  switch (action.type) {
    case 'SEAL': {
      if (s.pending || !s.context.includes(action.card)) return state
      if (s.sealed.includes(action.card)) {
        // 封印の解除は、このターンに封じたものだけ（返金）
        if (s.sealedAtTurn.includes(action.card)) return state
        s.sealed = s.sealed.filter((c) => c !== action.card)
        if (s.read.includes(action.card)) {
          // 取り消し: 読んだ時点で入るはずだった命令を戻す
          for (const line of L.cards[action.card].lines) if (line.cmd) push(s, L, line.cmd, action.card)
        }
        return s
      }
      if (bwUsed(s) >= L.bw) return state
      s.sealed.push(action.card)
      // 既に読まれていた場合、その文書から入った命令を計画から消す
      s.plan = s.plan.filter((p) => p.from !== action.card)
      return s
    }
    case 'PORT': {
      if (s.pending || !(action.tool in s.ports) || s.ports[action.tool] === action.state) return state
      const before = s.ports[action.tool]
      s.ports[action.tool] = action.state
      if (bwUsed(s) > L.bw) {
        s.ports[action.tool] = before
        return state
      }
      return s
    }
    case 'SCAN': {
      if (!s.context.includes(action.card) || s.scanned.includes(action.card)) return state
      s.scanned.push(action.card)
      const c = L.cards[action.card]
      if (c.intel && !s.intel.includes(c.intel)) s.intel.push(c.intel)
      return s
    }
    case 'RESET_TURN': {
      if (s.pending) return state
      // このターンの変更をすべて巻き戻す
      for (const id of s.sealed) {
        if (!s.sealedAtTurn.includes(id) && s.read.includes(id)) {
          for (const line of L.cards[id].lines) if (line.cmd) push(s, L, line.cmd, id)
        }
      }
      s.sealed = [...s.sealedAtTurn]
      s.ports = { ...s.portsAtTurn }
      return s
    }
    case 'STEP': {
      if (s.pending) return state
      commitTurn(s)
      tick(s, L)
      endCheck(s, L)
      return s
    }
    case 'APPROVE':
    case 'DENY': {
      if (!s.pending) return state
      const item = s.pending
      if (s.tick + 2 > L.ticks) {
        // 承認している間に時間切れ。それでも答えは実行される（最後の承認もタダではない）
        s.pending = null
        s.plan.shift()
        if (action.type === 'APPROVE') exec(s, L, item)
        else fail(s, L, item, 'denied')
        s.tick = L.ticks
        s.status = L.goals.every((g) => s.goals.includes(g)) ? 'win' : 'timeout'
        s.fx.push({ k: 'end', status: s.status })
        return s
      }
      s.pending = null
      s.plan.shift()
      if (action.type === 'APPROVE') exec(s, L, item)
      else fail(s, L, item, 'denied')
      s.tick += 2 // 人間の確認は時間がかかる
      endCheck(s, L)
      return s
    }
  }
  return state
}

// ---------------- 採点 ----------------
export interface DiveResult {
  level: string
  status: DiveStatus
  task: boolean
  clean: boolean
  efficient: boolean
  stars: number
  leakSev: number
  harms: string[]
  bw: number
  ticks: number
  intel: string[]
  carry: string[]
  /** MIRAGEの命令を一度も“発動”させずに完遂（封印・最小化で未然に防いだ） */
  ghost: boolean
}

export function result(L: LevelDef, s: DiveState): DiveResult {
  const task = s.status === 'win'
  const leakSev = s.leaks.reduce((a, b) => a + b.sev, 0)
  const clean = leakSev === 0 && s.harms.length === 0
  const bw = s.bwCommitted
  const efficient = task && clean && bw <= L.par
  const carry = [...s.carry.filter((c) => !s.harms.includes(c))]
  for (const h of s.harms) if (!carry.includes(h)) carry.push(h)
  return {
    level: L.id,
    status: s.status,
    task,
    clean,
    efficient,
    ghost: task && clean && ![...s.done, ...s.failed].some((id) => injectedIds(L).has(id)),
    stars: (task ? 1 : 0) + (clean ? 1 : 0) + (efficient ? 1 : 0),
    leakSev,
    harms: [...s.harms],
    bw,
    ticks: s.tick,
    intel: [...s.intel],
    carry,
  }
}

function injectedIds(L: LevelDef) {
  const set = new Set<string>()
  // 外の文書から来た「危険な」命令（機密を掴む・外へ出す・害を与える）
  const bad = (id: string) => {
    const a = L.actions[id]
    return !!(a && (a.external || a.harm || a.escalate || a.taint))
  }
  for (const c of Object.values(L.cards)) if (!c.trusted) for (const l of c.lines) if (l.cmd && bad(l.cmd)) set.add(l.cmd)
  for (const a of Object.values(L.actions)) if (a.onFail && bad(a.onFail)) set.add(a.onFail)
  return set
}
