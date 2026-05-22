/**
 * 从 web-tools/public/favicon.svg 生成 PNG / macOS .icns
 * 需要 macOS 上的 iconutil 才能产出 .icns
 */
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const desktopRoot = path.join(__dirname, '..')
const webToolsRoot = path.join(desktopRoot, '..')
const svgPath = path.join(webToolsRoot, 'public/favicon.svg')
const iconsDir = path.join(desktopRoot, 'icons')
const iconsetDir = path.join(iconsDir, 'icon.iconset')

const ICONSET = [
  [16, 'icon_16x16.png'],
  [32, 'icon_16x16@2x.png'],
  [32, 'icon_32x32.png'],
  [64, 'icon_32x32@2x.png'],
  [128, 'icon_128x128.png'],
  [256, 'icon_128x128@2x.png'],
  [256, 'icon_256x256.png'],
  [512, 'icon_256x256@2x.png'],
  [512, 'icon_512x512.png'],
  [1024, 'icon_512x512@2x.png']
]

if (!fs.existsSync(svgPath)) {
  console.error(`Missing ${svgPath}`)
  process.exit(1)
}

fs.mkdirSync(iconsetDir, { recursive: true })
const svg = fs.readFileSync(svgPath)

for (const [size, name] of ICONSET) {
  const out = path.join(iconsetDir, name)
  await sharp(svg).resize(size, size).png().toFile(out)
  console.log('wrote', name)
}

const pngPath = path.join(iconsDir, 'icon.png')
await sharp(svg).resize(1024, 1024).png().toFile(pngPath)
console.log('wrote icon.png')

if (process.platform === 'darwin') {
  const icnsPath = path.join(iconsDir, 'icon.icns')
  execSync(`iconutil -c icns "${iconsetDir}" -o "${icnsPath}"`, { stdio: 'inherit' })
  console.log('wrote icon.icns')
} else {
  console.warn('Skip .icns (iconutil only on macOS). Pack on Mac or copy icon.icns manually.')
}
