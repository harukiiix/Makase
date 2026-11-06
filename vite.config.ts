import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// SINGLE=1 npm run build で 1ファイルHTMLとして出力（共有・配布用）
export default defineConfig({
  plugins: [react(), tailwindcss(), ...(process.env.SINGLE ? [viteSingleFile()] : [])],
  // GitHub Pages では /makase/ の下に置く（.github/workflows/pages.yml が PAGES_BASE を渡す）
  base: process.env.PAGES_BASE || '/',
})
