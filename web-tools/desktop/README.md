# Nexus Tools 桌面端（Electron）

uTools 式单窗体验，UI 由 Nuxt 静态站嵌入。

## 开发

```bash
# 终端 1
cd web-tools && npm run dev

# 终端 2
cd web-tools && npm run desktop:dev
```

`NEXUS_KEEP_VISIBLE=1` 可保持窗口不因失焦隐藏。

## 本地打包 DMG（macOS）

```bash
cd web-tools && npm run desktop:dist
# 产物：web-tools/desktop/release/NexusTools.dmg
```

## 发布（GitHub + Homebrew）

仅 **`web-tools-v*`** tag 会触发桌面发布（不会部署服务器）。规则见 [`docs/RELEASE_TAGS.md`](../../../docs/RELEASE_TAGS.md)。

推送 tag 后自动执行 [`.github/workflows/release.yml`](../../../.github/workflows/release.yml)：

1. `npm run generate` 预渲染 Web
2. `electron-builder` 打出 **通用架构** `NexusTools.dmg`
3. 上传到 GitHub Releases（tag 如 `web-tools-v0.2.0`）
4. 更新 [`tdragon8113/homebrew-tap`](https://github.com/tdragon8113/homebrew-tap) 中的 `nexus-tools` cask

```bash
git tag web-tools-v0.2.0 && git push origin web-tools-v0.2.0
```

仓库 Settings → Secrets 需配置 **`TAP_TOKEN`**（对 `homebrew-tap` 有写权限 PAT）。

安装：

```bash
brew tap tdragon8113/tap
brew install --cask nexus-tools
```

首次打开若被 Gatekeeper 拦截，可在「隐私与安全性」中允许，或对 app 执行 `xattr -cr "/Applications/Nexus Tools.app"`。

## 路由

| 操作 | 路由 |
|------|------|
| `Alt+Space`（Mac 为 Option+Space） | 搜索；已在工具/工具集时仅显隐 |
| 工具集 | `/desktop/hub?desktop=1` |
| 工具 | `/tools/{id}?desktop=1` |

## 目录

- `src/main.ts` — 快捷键、IPC
- `src/windowManager.ts` — 单窗显隐与尺寸
- `src/preload.ts` — `window.nexusDesktop`
- `../app/layouts/desktop.vue` — 桌面壳布局
