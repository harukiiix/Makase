// 実際にあった話。どれも元の記事・発表を開いて、中身を確かめたもの（2026年11月）
// 書いてあることだけを書く。働いている人の名前は出さない
import type { RealCase } from './types'

export const CASES: Record<string, RealCase> = {
  'nexco-usb': {
    id: 'nexco-usb',
    head: { ja: 'USBメモリのパスワードを、本体に貼っていた', en: 'The USB stick had its password stuck on it' },
    body: {
      ja: '高速道路の会社が、191人分の名前や住所などが入っていたかもしれないUSBメモリをなくしました。中身は暗号化していましたが、パスワードをメモリ本体に貼っていました。',
      en: 'A highway company lost a USB stick that may have held the names and addresses of 191 people. The data was encrypted, but the password was stuck on the stick itself.',
    },
    who: { ja: '西日本高速道路（NEXCO西日本）', en: 'West Nippon Expressway (NEXCO West)' },
    when: { ja: '2024年3月', en: 'March 2024' },
    source: 'ITmedia NEWS',
    url: 'https://www.itmedia.co.jp/news/articles/2403/25/news170.html',
  },
  'gunma-shred': {
    id: 'gunma-shred',
    head: { ja: 'シュレッダーにかけずに捨てた書類が、道路に散らばった', en: 'Papers thrown out without shredding scattered on a road' },
    body: {
      ja: '県の土木事務所が、名前などが書かれた書類をシュレッダーにかけずに資源ゴミに出しました。回収の車から道路に落ちて散らばり、関係業者148人を含む455人分の情報が入っていました。',
      en: 'A prefectural public works office put papers with personal details out as recycling without shredding them. They fell from the collection truck onto a road. The papers held details of 455 people, including 148 from partner companies.',
    },
    who: { ja: '群馬県 藤岡土木事務所', en: 'Gunma Prefecture, Fujioka Public Works Office' },
    when: { ja: '2024年2月', en: 'February 2024' },
    source: '群馬県 報道提供資料',
    url: 'https://www.pref.gunma.jp/site/houdou/630649.html',
  },
  'moriyasu-bereal': {
    id: 'moriyasu-bereal',
    head: { ja: '職場で撮った写真をSNSに出したら、画面と見積書が写っていた', en: 'A workplace photo on social media showed a screen and an estimate' },
    body: {
      ja: '建設機械の部品を作る会社で、社員が職場の写真をSNSアプリに投稿しました。広まった画像には、社内メールが映った画面や、取引先の名前が入った見積書のような紙が写っていました。',
      en: 'At a company that makes construction machine parts, an employee posted a workplace photo to a social app. The image that spread showed a screen with company email and what looked like an estimate with a client company name on it.',
    },
    who: { ja: '森康（石川県小松市）', en: 'Moriyasu (Komatsu, Ishikawa)' },
    when: { ja: '2026年4月', en: 'April 2026' },
    source: 'ITmedia NEWS',
    url: 'https://www.itmedia.co.jp/news/articles/2604/30/news135.html',
  },
  'niigata-mail': {
    id: 'niigata-mail',
    head: { ja: 'メールで送った図面に、ほかの人の名前が残っていた', en: 'A drawing sent by email still had other people\'s names on it' },
    body: {
      ja: '県から測量の仕事を受けた会社が、頼まれた図面をメールで送りました。その図面には、土地の持ち主19人の名前や住所、印かんの跡が載っていました。県は相手にメールを消してもらい、持ち主に謝りました。',
      en: 'A survey company working for the prefecture emailed a drawing it had been asked for. The drawing still showed the names, addresses and seal marks of 19 landowners. The prefecture asked the recipient to delete the email and apologized to the owners.',
    },
    who: { ja: '新潟県（委託先の測量会社）', en: 'Niigata Prefecture (its survey contractor)' },
    when: { ja: '2025年10月', en: 'October 2025' },
    source: 'Security NEXT',
    url: 'https://www.security-next.com/176245',
  },
  'iwade-emotet': {
    id: 'iwade-emotet',
    head: { ja: 'メールからウイルスが入り、会社の名前でにせのメールが送られた', en: 'A virus came in by email, then fake emails went out in the company\'s name' },
    body: {
      ja: '建設会社の社員のパソコンが、メールで広がるウイルスに感染しました。取引先のメールアドレスやメールの中身が外に出たおそれがあり、その会社になりすましたメールも送られました。',
      en: 'A PC at a construction company was infected by a virus that spreads by email. Partners\' email addresses and email text may have leaked, and fake emails pretending to be the company were sent out.',
    },
    who: { ja: '岩出建設', en: 'Iwade Kensetsu (a construction company)' },
    when: { ja: '2020年9月', en: 'September 2020' },
    source: 'Security NEXT',
    url: 'https://www.security-next.com/118291',
  },
  'toda-access': {
    id: 'toda-access',
    head: { ja: '建設会社のシステムに外から入られ、社員と取引先の情報がもれた', en: 'Outsiders broke into a builder\'s system; staff and partner data leaked' },
    body: {
      ja: '大手の建設会社のシステムの一部に外から不正に入られ、社員4,778人分の名前や住所などと、取引先の担当者のメールアドレスがもれました。会社は、会社を名のるあやしいメールに気をつけるよう呼びかけています。',
      en: 'Outsiders got into part of a major construction company\'s systems. Names, addresses and other details of 4,778 employees and partners\' contact email addresses leaked. The company asked people to watch out for suspicious emails using its name.',
    },
    who: { ja: '戸田建設', en: 'Toda Corporation' },
    when: { ja: '2026年10月', en: 'October 2026' },
    source: '戸田建設 お知らせ',
    url: 'https://www.toda.co.jp/news/2026/20261007_006350.html',
  },
  'yokosuka-roadside': {
    id: 'yokosuka-roadside',
    head: { ja: '図面を道路わきに置いたまま、次の現場へ行ってしまった', en: 'Drawings were left by the road while the crew drove to the next site' },
    body: {
      ja: '水道管の工事をしていた下請けの会社が、図面などを道路わきに置いたまま、車で次の現場へ向かいました。図面には、水道を使う282人分の名前と住所が載っていました。通りがかった人が見つけて届けてくれました。',
      en: 'A subcontractor on a water pipe job left drawings by the road and drove to the next site. The drawings showed the names and addresses of 282 water users. A passerby found them and handed them in.',
    },
    who: { ja: '神奈川県横須賀市（水道の工事）', en: 'Yokosuka City, Kanagawa (water works)' },
    when: { ja: '2019年4月', en: 'April 2019' },
    source: 'Security NEXT',
    url: 'https://www.security-next.com/104119',
  },
}
