// 実際にあった話。どれも元の記事・発表を開いて、中身を確かめたもの（2026年11月）。11-07 に、公式の発表が見つかった物は出典を公式に替え、数と言い方を元の発表・記事に合わせて直した
// 書いてあることだけを、自分の言葉で短くまとめる。働いている人の名前も、会社や自治体の名前も出さない（出典の名前とリンクだけ残す）
import type { RealCase } from './types'

export const CASES: Record<string, RealCase> = {
  'nexco-usb': {
    id: 'nexco-usb',
    head: { ja: 'USBメモリのパスワードを、本体に貼っていた', en: 'The USB stick had its password stuck on it' },
    body: {
      ja: '高速道路の会社が、USBメモリをなくしました。191人分の名前や住所などが入っていた可能性があります。中身は暗号化していましたが、パスワードをメモリ本体に貼っていました。',
      en: 'A highway company lost a USB stick. It may have held the names, addresses and other details of 191 people. The data was encrypted, but the password was stuck on the stick itself.',
    },
    who: { ja: '高速道路の会社', en: 'A highway company' },
    when: { ja: '2024年3月', en: 'March 2024' },
    source: { ja: '西日本高速道路 関西支社 お詫び', en: 'NEXCO West, Kansai branch apology (in Japanese)' },
    url: 'https://corp.w-nexco.co.jp/corporate/release/kansai/r6/0315/',
  },
  'gunma-shred': {
    id: 'gunma-shred',
    head: { ja: 'シュレッダーにかけずに捨てた書類が、道路に散らばった', en: 'Unshredded papers fell off a recycling truck and scattered across a road' },
    body: {
      ja: '県の土木事務所が、名前などが書かれた書類を、シュレッダーにかけずに資源ゴミに出しました。書類は回収車から道路に落ちて散らばりました。関係業者148人を含む、455人分の情報が書かれていました。',
      en: 'A prefectural public works office put papers with names and other personal details out as recycling without shredding them. The papers fell from the collection truck and scattered across a road. They held details of 455 people, including 148 from partner companies.',
    },
    who: { ja: '県の土木事務所', en: 'A prefectural public works office' },
    when: { ja: '2024年2月', en: 'February 2024' },
    source: { ja: '群馬県 報道提供資料', en: 'Gunma Prefecture press release (in Japanese)' },
    url: 'https://www.pref.gunma.jp/site/houdou/630649.html',
  },
  'moriyasu-bereal': {
    id: 'moriyasu-bereal',
    head: { ja: '職場で撮った写真をSNSに出したら、画面と見積書のような紙が写っていた', en: 'A workplace photo on social media showed a screen and what looked like an estimate' },
    body: {
      ja: '建設機械の部品を作る会社で、社員が職場の写真をSNSアプリに投稿しました。広まった画像には、社内メールを開いた画面と、見積書のような紙が写っていました。紙には、取引先の名前が入っていました。',
      en: 'At a company that makes construction machine parts, an employee posted a photo taken at work on social media. The image that spread showed a screen with company email open and a paper that looked like an estimate. The paper had a client company\'s name on it.',
    },
    who: { ja: '建設機械の部品を作る会社', en: 'A maker of construction machine parts' },
    when: { ja: '2026年4月', en: 'April 2026' },
    source: { ja: 'ITmedia NEWS', en: 'ITmedia NEWS (in Japanese)' },
    url: 'https://www.itmedia.co.jp/news/articles/2604/30/news135.html',
  },
  'niigata-mail': {
    id: 'niigata-mail',
    head: { ja: 'メールで送った図面に、ほかの人の名前が残っていた', en: 'A drawing sent by email still had other people\'s names on it' },
    body: {
      ja: '県から測量の仕事を受けた会社が、土地の関係者の会社に、図面をメールで送りました。その図面には、土地の関係者19人の名前と、12人の住所、14人の印鑑を押した跡が残っていました。県は、受け取った会社にメールを消してもらい、名前が載っていた人たちに謝りました。',
      en: 'A survey company working for the prefecture emailed a drawing to a company involved with the land. The drawing still showed the names of 19 people connected to the land, the addresses of 12 and the personal seal stamps (used like signatures in Japan) of 14. The prefecture had the recipient delete the email and apologized to the people listed.',
    },
    who: { ja: '県と、委託先の測量会社', en: 'A prefecture and its survey contractor' },
    when: { ja: '2025年10月', en: 'October 2025' },
    source: { ja: 'Security NEXT', en: 'Security NEXT (in Japanese)' },
    url: 'https://www.security-next.com/176245',
  },
  'iwade-emotet': {
    id: 'iwade-emotet',
    head: { ja: 'メールからウイルスが入り、会社の名前で偽のメールが送られた', en: 'A virus came in by email, then fake emails went out in the company\'s name' },
    body: {
      ja: '建設会社で、社員のパソコンが、メールで広がるウイルスに感染しました。社内と社外のメールアドレスや、やり取りしたメールの中身が、外に出たおそれがあります。この会社の社員を名乗る、偽のメールも送られました。',
      en: 'At a construction company, an employee\'s PC was infected by a virus that spreads by email. Email addresses inside and outside the company, and the contents of past emails, may have leaked. Fake emails pretending to be from its staff were also sent.',
    },
    who: { ja: '建設会社', en: 'A construction company' },
    when: { ja: '2020年9月', en: 'September 2020' },
    source: { ja: '岩出建設 お知らせ', en: 'Iwade Kensetsu notice (in Japanese)' },
    url: 'https://www.iwade.co.jp/information/%E5%BD%93%E7%A4%BE%E3%83%91%E3%82%BD%E3%82%B3%E3%83%B3%E3%81%8B%E3%82%89%E3%81%AE%E5%80%8B%E4%BA%BA%E6%83%85%E5%A0%B1%E7%AD%89%E3%81%AE%E3%83%87%E3%83%BC%E3%82%BF%E6%B5%81%E5%87%BA%E3%81%AE%E5%8F%AF/',
  },
  'toda-access': {
    id: 'toda-access',
    head: { ja: '建設会社のシステムに外から入られ、社員と取引先の情報がもれた', en: 'Outsiders broke into a builder\'s system; staff and partner data leaked' },
    body: {
      ja: '大手の建設会社で、取引先への支払いを扱うシステムに、外から不正に入られました。社員4,778人分の名前や住所などと、取引先の担当者のメールアドレスがもれました。発表の時点では、もれた情報が公開されたり、悪用されたりしたことは確認されていません。',
      en: 'Outsiders broke into a major construction company\'s system for paying its partners. The names, addresses and other details of 4,778 employees leaked, along with partners\' contact email addresses. At the time of the notice, there was no sign that the data had been published or misused.',
    },
    who: { ja: '大手の建設会社', en: 'A major construction company' },
    when: { ja: '2026年10月', en: 'October 2026' },
    source: { ja: '戸田建設 お知らせ', en: 'Toda Corporation notice (in Japanese)' },
    url: 'https://www.toda.co.jp/news/2026/20261007_006350.html',
  },
  'yokosuka-roadside': {
    id: 'yokosuka-roadside',
    head: { ja: '図面を道路わきに置いたまま、次の現場へ行ってしまった', en: 'Drawings were left by the road while the crew drove to the next site' },
    body: {
      ja: '水道管の工事をしていた下請けの会社が、図面などの書類を道路わきに置いたまま、車で次の現場へ向かいました。図面には、水道を使う282人分の名前と住所が載っていました。通りがかった人が見つけて近くの家に届け、その家の人が市に知らせました。',
      en: 'A subcontractor on a water pipe job left drawings and other papers by the road and drove off to the next site. The drawings showed the names and addresses of 282 water users. A passerby found them and took them to a nearby house, and the resident told the city.',
    },
    who: { ja: '市の水道工事（下請けの会社）', en: 'A city water works job (a subcontractor)' },
    when: { ja: '2019年4月', en: 'April 2019' },
    source: { ja: 'Security NEXT', en: 'Security NEXT (in Japanese)' },
    url: 'https://www.security-next.com/104119',
  },
}
