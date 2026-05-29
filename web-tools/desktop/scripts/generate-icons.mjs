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

/**
 * Apple macOS 应用图标规范（Sonoma / Sequoia Production Template）：
 * - 画布：1024×1024 px
 * - 主内容安全区：824×824 px 居中（四边各留白 100 px）
 * - 系统会自动套 squircle 遮罩，勿自行加圆角
 * @see https://developer.apple.com/design/resources/
 */
const MAC_ICON_CANVAS = 1024
const MAC_ICON_SAFE_AREA = 824
const MAC_ICON_SAFE_SCALE = MAC_ICON_SAFE_AREA / MAC_ICON_CANVAS // ≈ 0.8047

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

/** 将 SVG 缩放到安全区内并居中，避免满画布图标在系统切换器中显大 */
async function renderMacAppIconPng(size) {
  const inner = Math.max(1, Math.round(size * MAC_ICON_SAFE_SCALE))
  const pad = Math.floor((size - inner) / 2)
  const innerBuf = await sharp(svg).resize(inner, inner).png().toBuffer()
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([{ input: innerBuf, left: pad, top: pad }])
    .png()
    .toBuffer()
}

for (const [size, name] of ICONSET) {
  const out = path.join(iconsetDir, name)
  const buf = await renderMacAppIconPng(size)
  await sharp(buf).toFile(out)
  console.log('wrote', name)
}

const pngPath = path.join(iconsDir, 'icon.png')
await sharp(await renderMacAppIconPng(1024)).toFile(pngPath)
console.log('wrote icon.png')

const traySvgPath = path.join(iconsDir, 'tray-icon.svg')
const traySvg = fs.existsSync(traySvgPath) ? fs.readFileSync(traySvgPath) : svg

/** macOS 菜单栏 Template：线框 + N（与 Notion 等线框图标一致） */
const TRAY_TEMPLATE_SCALE = 0.95

async function renderTrayTemplatePng(size) {
  const inner = Math.max(1, Math.round(size * TRAY_TEMPLATE_SCALE))
  const pad = Math.floor((size - inner) / 2)
  return sharp(traySvg)
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({
      top: pad,
      bottom: pad,
      left: pad,
      right: pad,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toBuffer()
}

for (const [size, name] of [
  [18, 'trayTemplate.png'],
  [36, 'trayTemplate@2x.png']
]) {
  const out = path.join(iconsDir, name)
  await sharp(await renderTrayTemplatePng(size)).toFile(out)
  console.log('wrote', name)
}

if (process.platform === 'darwin') {
  const icnsPath = path.join(iconsDir, 'icon.icns')
  execSync(`iconutil -c icns "${iconsetDir}" -o "${icnsPath}"`, { stdio: 'inherit' })
  console.log('wrote icon.icns')
} else {
  console.warn('Skip .icns (iconutil only on macOS). Pack on Mac or copy icon.icns manually.')
}
