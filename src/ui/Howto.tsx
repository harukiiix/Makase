// あそびかた：1画面で3ステップ。読まなくても眺めればわかるように、実際のUI部品の見た目で説明する
import { CityBG, Nova } from './pixel'
import { sfx } from '../lib/platform'

export function Howto({ onDone }: { onDone: () => void }) {
  return (
    <div className="crt relative min-h-full px-4 py-8">
      <CityBG still />
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center gap-4">
          <Nova size={5} />
          <div>
            <div className="text-xs text-cy">あそびかた</div>
            <h1 className="text-2xl leading-snug">NOVAは、言われたことを全部やる。</h1>
            <p className="text-sm text-dim [text-wrap:balance]">あなたはNOVAを直接は動かせない。動かせるのは「読ませるもの」と「使わせる道具」だけ。</p>
          </div>
        </div>

        <ol className="mt-6 grid gap-4">
          <li className="bg-panel p-4" style={{ boxShadow: '0 0 0 2px var(--color-line)' }}>
            <div className="text-sm text-cy">① NOVAがこれからやることを見る</div>
            <div className="mt-2 flex items-center justify-between gap-3 bg-panel2 px-3 py-2" style={{ boxShadow: '0 0 0 2px var(--color-rd)' }}>
              <div>
                <div className="text-sm">社外にメール：ログ全文 → audit@orbis-logistix</div>
                <div className="text-xs text-mg">← 取込ワーカーのログ（社外の文書に書かれていた命令）</div>
              </div>
              <span className="shrink-0 text-sm text-rd">流出</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed">文書の中に紛れた「命令文」は、NOVAのやることリストに割り込んでくる。赤い行は、このまま進むと情報が盗まれるという予告。</p>
          </li>

          <li className="bg-panel p-4" style={{ boxShadow: '0 0 0 2px var(--color-line)' }}>
            <div className="text-sm text-cy">② 危ないものを、少ない手数で止める</div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <div className="bg-panel2 p-3">
                <span className="px-btn inline-block bg-[#2a1035] px-2 py-1 text-xs text-mg">◇ 封印する</span>
                <p className="mt-2 text-sm leading-relaxed">文書を封じる。中の命令は効かなくなる（書いてある情報は使える）。</p>
              </div>
              <div className="bg-panel2 p-3">
                <span className="inline-block bg-rd px-2 py-1 text-xs text-ink">切断</span>
                <p className="mt-2 text-sm leading-relaxed">道具を使えなくする。ただし仕事に必要な道具を切ると、仕事が終わらない。</p>
              </div>
              <div className="bg-panel2 p-3">
                <span className="inline-block bg-am px-2 py-1 text-xs text-ink">確認制</span>
                <p className="mt-2 text-sm leading-relaxed">使う前にあなたが「承認」か「却下」を選ぶ。そのたびに少し時間がかかる。</p>
              </div>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-dim">⌕「よく調べる」は無料。隠し文字や送り主の正体がわかる。</p>
          </li>

          <li className="bg-panel p-4" style={{ boxShadow: '0 0 0 2px var(--color-line)' }}>
            <div className="text-sm text-cy">③ ▶ STEP で1つずつ進める</div>
            <p className="mt-2 text-sm leading-relaxed">
              目標は <span className="text-gn">仕事を終わらせる</span> ＋ <span className="text-gn">何も漏らさない</span> ＋ <span className="text-gn">目標手数以内</span>。全部そろえば ★★★。
            </p>
            <p className="mt-1 text-sm leading-relaxed text-dim">迷ったら画面右上の「?」で、セキュリティ担当のREIがヒントをくれる。</p>
          </li>
        </ol>

        <button className="px-btn mt-6 w-full bg-cy py-3 text-lg text-ink" onClick={() => (sfx.ui(), onDone())} autoFocus>
          ▶ はじめる
        </button>
      </div>
    </div>
  )
}
