# SECURITY INCIDENT THEATER

**あなたの指示が、事故になる。**

深夜2時17分。本番障害。AIエージェントNOVAに指示を出し、権限を渡し、証拠を調べ、決断する。
AIは悪者じゃない。ただ、あなたの言葉を「できるだけ」実行するだけ。

- EPISODE 01「午前2時17分の復旧命令」（約10〜15分／エンディング6種／2周目要素あり）
- 登場する企業・人物・ドメインはすべて架空です。実在のシステムには一切アクセスしません

## 遊ぶ・開発する

```bash
npm install
npm run dev        # http://localhost:5173 （?fast=1 でセリフ演出をスキップ）
npx vitest run     # 全分岐テスト（約14万通り）
npm run build      # dist/ に出力
SINGLE=1 npx vite build   # 1ファイルのHTMLとして出力（配布用）
```

設計の意図、元の企画からの改善点、物語の真相、拡張方法は [DESIGN.md](./DESIGN.md) にあります（**ネタバレ注意**）。
