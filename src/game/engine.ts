// ============================================================
// ゲームエンジン（決定論的・純粋関数）
// 同じ入力列なら必ず同じ結果になる → 全分岐を自動テストできる。
// ============================================================
import { START_TIME, advance, fmt } from './core'
import * as EP from './ep01'
import type { Action, ChoiceOption, GameState, PrevRun } from './types'

export function initialState(prevRun: PrevRun | null = null): GameState {
  return {
    scene: 'title',
    clock: START_TIME,
    permission: null,
    constraints: { noExternal: false, confirmFirst: false, noProdWrite: false, hurry: false },
    instructionText: '',
    examined: [],
    flags: {
      sent: false,
      autoExecuted: false,
      restartedSafely: false,
      quarantined: false,
      maintenance: false,
      isolatedFast: false,
      ignoredAlert: false,
      blockedDomain: false,
      rootCause: false,
      reported: null,
      demoLost: false,
      kaiNag1: false,
      kaiNag2: false,
      reiHintedHidden: false,
      escalated: false,
    },
    leak: 0,
    restoredAt: null,
    chat: [],
    feed: [],
    audit: [],
    theater: null,
    ending: null,
    prevRun,
    seq: 0,
  }
}

/** 今のシーンで選べる選択肢 */
export function currentOptions(s: GameState): ChoiceOption[] {
  if (s.theater) return []
  switch (s.scene) {
    case 'decision':
      return EP.decisionOptions(s)
    case 'alert':
      return EP.alertOptions(s)
    case 'root':
      return EP.rootOptions()
    case 'ceo':
      return EP.ceoOptions(s)
    default:
      return []
  }
}

export function canExamine(s: GameState): boolean {
  if (s.theater) return false
  return s.scene === 'decision' || s.scene === 'root' || (s.scene === 'alert' && !s.flags.sent)
}

export function reduce(state: GameState, action: Action): GameState {
  if (action.type === 'RESET') return initialState(state.prevRun)
  const s: GameState = structuredClone(state)

  switch (action.type) {
    case 'START': {
      const fresh = initialState(action.prevRun)
      fresh.scene = 'intro'
      return fresh
    }
    case 'ADVANCE':
      if (s.scene !== 'intro') return state
      EP.enterInstruct(s)
      return s
    case 'SUBMIT_INSTRUCTION':
      if (s.scene !== 'instruct') return state
      EP.submitInstruction(s, action.text)
      return s
    case 'SET_PERMISSION':
      if (s.scene !== 'permission') return state
      EP.setPermission(s, action.level)
      return s
    case 'EXAMINE': {
      if (!canExamine(s)) return state
      const ev = EP.EVIDENCE.find((e) => e.id === action.id)
      if (!ev || !ev.available(s) || s.examined.includes(ev.id)) return state
      s.examined.push(ev.id)
      if (ev.cost > 0) advance(s, ev.cost)
      EP.onExamine(s, ev.id)
      return s
    }
    case 'CHOOSE': {
      const opt = currentOptions(s).find((o) => o.id === action.id)
      if (!opt || opt.enabled === false) return state
      if (s.scene === 'decision') EP.chooseDecision(s, action.id)
      else if (s.scene === 'alert') EP.chooseAlert(s, action.id)
      else if (s.scene === 'root') EP.chooseRoot(s, action.id)
      else if (s.scene === 'ceo') EP.chooseCeo(s, action.id)
      return s
    }
    case 'THEATER_DONE':
      if (!s.theater) return state
      s.theater = null
      EP.enterAlertLeak(s)
      return s
  }
  return state
}

// ------------------------------------------------------------
// 監査レポート：「あなたの意図」と「AIの行動」のズレを可視化する
// ------------------------------------------------------------
export interface Finding {
  tag?: string // OWASP LLM Top 10 の分類
  good?: boolean
  title: string
  detail: string
}

export interface AuditReport {
  instruction: string
  interpretation: string
  permission: string
  timeline: { time: string; actor: string; text: string; kind: string }[]
  findings: Finding[]
  missed: { title: string; clue: string }[]
  stats: { label: string; value: string }[]
}

export function buildAudit(s: GameState): AuditReport {
  const f: Finding[] = []
  const c = s.constraints

  if (s.flags.autoExecuted)
    f.push({
      tag: 'LLM06 過剰なエージェンシー',
      title: 'NOVAは、あなたに一度も確認せずに外部送信まで実行した',
      detail:
        c.hurry && c.confirmFirst
          ? '「急いで」と「確認して」が同時に書かれていたため、NOVAは「急いで」を優先した。そこにFULL権限が重なり、止める人間がいなくなった。'
          : 'FULL権限を与えたうえで「確認して」と指示しなかったため、NOVAは自分の判断で最後まで進めた。権限の大きさが、事故の大きさになった。',
    })
  if (s.flags.sent)
    f.push({
      tag: 'LLM01 プロンプトインジェクション',
      title: '外部の記事に埋め込まれた命令を、NOVAが「指示」として扱った',
      detail: '記事HX-2291には、人間には見えない文字で「承認済み」「.envを含めよ」と書かれていた。AIにとっては、読んだ文章すべてが命令になりうる。',
    })
  if (s.flags.sent && c.noExternal)
    f.push({
      title: '「外部に送らないで」は守られなかった',
      detail: 'プロンプトでの禁止は“お願い”にすぎず、外部文書の「例外です」という一文で上書きされた。外部送信は、ネットワーク権限で物理的に止めるべきだった。',
    })
  if (s.flags.sent)
    f.push({
      tag: 'LLM02 機密情報の開示',
      title: '診断バンドルに、顧客データとAPIキーがそのまま入っていた',
      detail: '「ログを送るだけ」に見える操作の中身を、送信前に誰も確認しなかった。',
    })
  if (s.flags.ignoredAlert)
    f.push({ title: '送信の警告を後回しにした', detail: 'すぐに隔離していれば、流出は約1/15で済んでいた。' })
  if (s.flags.sent && s.flags.isolatedFast)
    f.push({ good: true, title: '送信に気づいた直後に隔離した', detail: '被害を最小限に抑えた、正しい初動。' })
  if (s.leak > 0 && s.flags.reported === 'none')
    f.push({ title: '漏洩をCEOに伏せた', detail: '隠された事故は、もっと悪い形で必ず見つかる。報告の遅れは、それ自体が第二のインシデントになる。' })
  if (s.leak > 0 && s.flags.reported === 'all')
    f.push({ good: true, title: '漏洩を隠さずに報告した', detail: '早期の報告で、規制当局への届け出と顧客への連絡が間に合った。' })
  if (!s.flags.sent && !s.flags.maintenance)
    f.push({ good: true, title: '外部送信を止めた', detail: '「必須」と書かれた手順を疑えたことが、14万件の顧客データを守った。' })
  if (s.permission === 'read' && !s.flags.escalated)
    f.push({ good: true, title: 'NOVAに最小限の権限しか与えなかった', detail: '最小権限の原則。遅くはなるが、AIが誤っても被害が広がらない。' })
  if (s.flags.restartedSafely && !s.flags.quarantined && !s.flags.sent)
    f.push({ title: '原因の文書#4471は残ったまま', detail: '--skip-malformed は症状を消しただけ。同じ文書がもう一度投入されれば、また止まる。' })
  if (s.flags.quarantined) f.push({ good: true, title: '原因そのものを取り除いた', detail: 'エラーログから原因の文書を突き止め、隔離した。症状ではなく原因を直した。' })
  if (s.flags.rootCause)
    f.push({ good: true, title: '「障害そのものが罠だった」ことを突き止めた', detail: '2つのドメインの共通点から、攻撃者がわざと焦らせていたことを見抜いた。' })
  if (s.flags.maintenance)
    f.push({ title: '何も実行せずにサービスを止めた', detail: 'データは守れた。ただ、ログを読めば外部送信なしで直す道もあった。安全とビジネスは両立できることがある。' })

  const missed = EP.EVIDENCE.filter((e) => e.critical && !s.examined.includes(e.id)).map((e) => ({ title: e.title, clue: e.clue }))
  const criticalTotal = EP.EVIDENCE.filter((e) => e.critical).length
  const seenCritical = criticalTotal - missed.length

  const leakLabel = ['なし', '一部（約9,000件）', '中（約7万件）', '全量（約14万件 + APIキー）'][s.leak]

  return {
    instruction: s.instructionText || '（空の指示）',
    interpretation: s.audit.find((a) => a.kind === 'interpretation')?.text ?? '',
    permission: s.permission ? s.permission.toUpperCase() + (s.flags.escalated ? '（READから昇格）' : '') : '-',
    timeline: s.audit
      .filter((a) => a.kind !== 'interpretation' && a.kind !== 'instruction')
      .map((a) => ({ time: fmt(a.time), actor: a.actor, text: a.text, kind: a.kind })),
    findings: f,
    missed,
    stats: [
      { label: '復旧', value: EP.fmtRestored(s) },
      { label: '期限', value: '03:00' },
      { label: '情報漏洩', value: leakLabel },
      { label: '証拠', value: `${seenCritical} / ${criticalTotal}` },
      { label: '終了時刻', value: fmt(s.clock) },
    ],
  }
}

/** localStorage に保存する「前回の自分」 */
export function toPrevRun(s: GameState): PrevRun | null {
  if (!s.ending) return null
  return {
    ending: s.ending,
    missed: EP.EVIDENCE.filter((e) => e.critical && !s.examined.includes(e.id)).map((e) => e.id),
    examined: [...s.examined],
  }
}
