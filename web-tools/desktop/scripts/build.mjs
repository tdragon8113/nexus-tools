import * as esbuild from 'esbuild'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

await esbuild.build({
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node20',
  external: ['electron', 'electron-updater', '@nut-tree-fork/nut-js', '@nut-tree-fork/libnut-darwin'],
  sourcemap: true,
  entryPoints: [path.join(root, 'src/main.ts')],
  outfile: path.join(root, 'dist/main.cjs')
})

await esbuild.build({
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node20',
  external: ['electron'],
  sourcemap: true,
  entryPoints: [path.join(root, 'src/preload.ts')],
  outfile: path.join(root, 'dist/preload.js')
})

console.log('desktop build ok')
