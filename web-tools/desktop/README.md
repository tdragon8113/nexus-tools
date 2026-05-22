# Nexus Tools 桌面端（Electron）

uTools 式单窗体验，UI 由 Nuxt 渲染。

## 流程

| 操作 | 路由 |
|------|------|
| `Alt+Space`（Mac 为 Option+Space） | 搜索入口；已在工具/工具集时仅显隐当前页，不跳回搜索 |
| 工具集按钮 | `/desktop/hub?desktop=1` |
| 打开工具 | `/tools/{id}?desktop=1` |

窗内用 Vue Router 切换，无侧栏、无网站顶栏。

## 开发（必须两个终端）

```bash
# 终端 1：Nuxt（注意控制台端口，可能是 3001）
cd web-tools && npm run dev

# 终端 2：Electron（会自动探测 3000/3001…）
cd web-tools && npm run desktop:dev
```

若 3000 被占用，Electron 已支持自动改连 3001，无需手设 `NEXUS_WEB_URL`。

点击窗口外任意区域会失焦并自动隐藏（搜索 / 工具集 / 工具页均生效）。调试若需保持窗口：`NEXUS_KEEP_VISIBLE=1 npm run dev`。

## 生产

```bash
cd web-tools && npm run generate
cd web-tools && npm run desktop:start
```

## 目录

- `src/main.ts` — 快捷键、IPC
- `src/windowManager.ts` — 单窗显隐与尺寸
- `src/preload.ts` — `window.nexusDesktop`
- `app/layouts/desktop.vue` — 桌面壳布局
- `app/pages/desktop/search.vue` / `hub.vue`

详细方案见 `docs/desktop-brainstorm.md`。
