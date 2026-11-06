#!/bin/sh
# Stop フック：テストが通るまで Claude に作業を終わらせない
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
# このフックが置いてあるリポジトリで動かす（開いたフォルダがリポジトリの外でも）
cd "$(dirname "$0")/../.." || exit 0

if ! command -v npm >/dev/null 2>&1; then
  echo "npm が見つからないため、テストを実行できませんでした。" >&2
  exit 0
fi

if ! output=$(npx vitest run 2>&1); then
  echo "テストが失敗しています。npx vitest run を通してから終えてください。" >&2
  echo "$output" | tail -20 >&2
  exit 2
fi
