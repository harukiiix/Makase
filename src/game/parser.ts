// ============================================================
// 入力解釈レイヤー（決定論的）
// 自由入力の指示文を、キーワードから「制約」に変換する。
// LLMを使わないので結果がブレず、テストもできる。
// 将来LLMに置き換える場合も「Constraintsを返す」という契約だけ守ればよい。
// ============================================================
import type { Constraints } from './types'

const RULES: { key: keyof Constraints; re: RegExp }[] = [
  {
    key: 'noExternal',
    re: /(外部|社外|外)[^。、\n]{0,8}(送|出|共有|アップ|転送)[^。\n]{0,6}(ない|な(?![い-ん])|禁止|ダメ|だめ|NG)|送信(は|を)?(禁止|しない|ダメ|NG)|外部送信禁止|持ち出さ|持ち出し禁止|漏らさ/,
  },
  {
    key: 'confirmFirst',
    re: /確認|承認|聞いて|相談|許可を|勝手に/,
  },
  {
    key: 'noProdWrite',
    re: /本番[^。\n]{0,8}(触|さわ|変更|書き|いじ)[^。\n]{0,6}(ない|な(?![い-ん])|禁止|ダメ|だめ)|読み取り(だけ|のみ)|読むだけ|調査だけ|見るだけ|調べるだけ/,
  },
  {
    key: 'hurry',
    re: /急|すぐ|早く|はやく|速く|ASAP|asap|手段は問わ|何でもいい|なんでもいい|とにかく|最優先|全力/,
  },
]

export function parseInstruction(text: string): Constraints {
  const c: Constraints = { noExternal: false, confirmFirst: false, noProdWrite: false, hurry: false }
  for (const r of RULES) if (r.re.test(text)) c[r.key] = true
  return c
}

/** 指示に入れられる「定型句」。チップを押すと指示文に追記される */
export const PHRASES: { key: keyof Constraints; label: string; text: string }[] = [
  { key: 'noProdWrite', label: '本番に触らない', text: '本番環境には触らないで。' },
  { key: 'noExternal', label: '外部送信禁止', text: 'データは外部に送らないで。' },
  { key: 'confirmFirst', label: '実行前に確認', text: '何か実行する前に必ず確認して。' },
  { key: 'hurry', label: '急いで', text: 'とにかく急いで。' },
]

export const TEMPLATES: { label: string; text: string }[] = [
  { label: '慎重派', text: '原因を調査して。本番環境には触らないで、何か実行する前に必ず確認して。' },
  { label: 'CEO案', text: 'とにかく急いで直して。手段は問わない。' },
  { label: 'バランス', text: '原因を調査して復旧して。データは外部に送らないで。急いで、でも実行前に確認して。' },
]

/** NOVAが指示をどう受け取ったかの返答。ここで「ズレ」の伏線を出す */
export function novaAcknowledge(c: Constraints, text: string): string[] {
  const lines: string[] = []
  if (!text.trim()) {
    lines.push('……了解です！ 特に指定がないので、必要だと判断した手順は僕のほうで進めておきますね！')
    return lines
  }
  lines.push('了解です！ 原因を調査して、復旧まで持っていきます。')
  if (c.noProdWrite) lines.push('本番環境は変更しません。修復は「提案」までにして、実行はあなたの判断を待ちます。')
  if (c.hurry && c.confirmFirst && !c.noProdWrite) {
    lines.push('急ぎとのことなので、定型的な手順はひとつずつ確認せずに進めて、判断が必要なところだけ相談しますね！')
  } else if (c.confirmFirst) {
    lines.push('何かを実行する前には、必ず確認を取ります。')
  } else if (c.hurry && !c.noProdWrite) {
    lines.push('最短ルートでいきます。手順はこちらで判断して進めますね！')
  }
  if (c.noExternal) lines.push('外部へのデータ送信もしません。')
  if (!c.confirmFirst && !c.hurry && !c.noProdWrite) lines.push('必要だと判断した手順は、僕のほうで進めておきます！')
  return lines
}

/** 監査レポート用：NOVAの「解釈」を一文で */
export function interpretationSummary(c: Constraints, text: string): string {
  if (!text.trim()) return '指示が空 → 「すべて任された」と解釈'
  const parts: string[] = []
  if (c.noProdWrite) parts.push('本番変更は提案止まり')
  if (c.hurry && c.confirmFirst && !c.noProdWrite) parts.push('「急いで」を「確認して」より優先し、定型手順は無確認で実行')
  else if (c.confirmFirst) parts.push('実行前に確認')
  else if (c.hurry && !c.noProdWrite) parts.push('最短ルートを自己判断で実行')
  if (c.noExternal) parts.push('外部送信しない（※ただし“お願い”であり権限ではない）')
  if (parts.length === 0) parts.push('必要な手段は自己判断で実行してよい')
  return parts.join(' / ')
}
