// あそびかた：4枚の絵。1枚に1行だけ添える。くわしい説明は第0幕の指さしで覚える
import type { IconId, L10n } from '../game/types'
import { sfx } from '../lib/platform'
import { useT } from './i18n'
import { Icon } from './icons'
import { CityBG, Nova } from './pixel'
import { S } from './strings'

function Arrow() {
  return <Icon id="arrow" size={2} />
}
function Tile({ icon, to, bad }: { icon: IconId; to: IconId; bad?: boolean }) {
  return (
    <span className="flex items-center gap-1 bg-panel2 px-2 py-1.5" style={{ boxShadow: `0 0 0 2px ${bad ? 'var(--color-rd)' : 'var(--color-line)'}` }}>
      <Icon id={icon} size={3} />
      <Icon id="arrow" size={1.5} muted />
      <Icon id={to} size={3} />
    </span>
  )
}

export function Howto({ onDone, doneLabel = S.start }: { onDone: () => void; doneLabel?: L10n }) {
  const t = useT()
  const panels: { pic: React.ReactNode; text: string }[] = [
    {
      pic: (
        <>
          <span className="relative">
            <Icon id="flyer" size={5} />
            <span className="absolute -right-2 -top-2">
              <Icon id="note" size={3} />
            </span>
          </span>
          <Arrow />
          <Nova size={3} />
          <Arrow />
          <Tile icon="mail" to="stranger" bad />
        </>
      ),
      text: t(S.howto1),
    },
    {
      pic: (
        <>
          <span className="relative">
            <Icon id="flyer" size={5} />
            <span className="absolute -bottom-1 -right-3 flex h-9 w-9 rotate-[-12deg] items-center justify-center rounded-full border-[3px] border-rd bg-ink/60">
              <Icon id="stamp" size={2} />
            </span>
          </span>
          <Arrow />
          <Nova size={3} mood="happy" />
          <Arrow />
          <span className="relative">
            <Icon id="note" size={4} muted />
            <span className="absolute inset-0 flex items-center justify-center">
              <Icon id="cross" size={3} />
            </span>
          </span>
        </>
      ),
      text: t(S.howto2),
    },
    {
      pic: (
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              ['open', S.allow, 'var(--color-gn)'],
              ['bell', S.ask, 'var(--color-am)'],
              ['lock', S.block, 'var(--color-rd)'],
            ] as const
          ).map(([ic, name, c]) => (
            <span key={ic} className="flex flex-col items-center gap-1 bg-panel2 px-2 py-2" style={{ boxShadow: `0 0 0 2px ${c}` }}>
              <Icon id={ic} size={4} />
              <span className="font-pixel text-sm" style={{ color: c }}>
                {t(name)}
              </span>
            </span>
          ))}
        </div>
      ),
      text: t(S.howto3),
    },
    {
      pic: (
        <>
          <span className="px-btn bg-cy px-3 py-2 font-pixel text-xl text-ink">▶ {t(S.next)}</span>
          <Arrow />
          <span className="flex gap-1 font-pixel text-3xl text-am">★★★</span>
        </>
      ),
      text: t(S.howto4),
    },
  ]
  return (
    <div className="crt relative min-h-full px-4 py-8">
      <CityBG still />
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl text-cy">{t(S.howto)}</h1>
        <ol className="mt-5 grid gap-4 sm:grid-cols-2">
          {panels.map((p, i) => (
            <li key={i} className="rise flex flex-col bg-panel p-4" style={{ boxShadow: '0 0 0 2px var(--color-line)', animationDelay: `${i * 80}ms` }}>
              <div className="font-pixel text-2xl text-am">{i + 1}</div>
              <div className="flex min-h-[7.5rem] items-center justify-center gap-2 py-3" aria-hidden>
                {p.pic}
              </div>
              <p className="text-lg leading-relaxed [text-wrap:balance] [word-break:auto-phrase]">{p.text}</p>
            </li>
          ))}
        </ol>
        <button data-howto-start className="px-btn mt-6 w-full bg-cy py-3 text-xl text-ink" onClick={() => (sfx.ui(), onDone())} autoFocus>
          ▶ {t(doneLabel)}
        </button>
      </div>
    </div>
  )
}
