# Nexus Web Tools

浏览器端 + Electron 桌面端的开发者工具箱。

## 架构（v2）

```text
app/
  core/           # 工具注册、搜索/拼音、预填、桌面路由约定
  components/     # WebGlobalSearch、DesktopSearchPanel、ToolGrid 等
  layouts/        # default（网站）| desktop（Electron）
  pages/
    tools/        # 各工具实现页
    desktop/      # search | hub
  composables/    # useDesktop、useDesktopSearchPanel、useToolSearch、use*Prefill
  components/search/  # ToolMatchChips 等搜索 UI 片段
desktop/          # Electron 主进程（单窗 SPA）
```

## 网站

- `/tools` — 工具集
- `/tools/*` — 单工具（无侧栏、无面包屑）
- 顶栏全局搜索（⌘K / Ctrl+K）

## 桌面（uTools 式）

- `Alt+Space` — 搜索 + 剪贴板匹配
- 工具集 — `/desktop/hub`
- 工具页 — `/tools/*?desktop=1`，无目录侧栏

```bash
npm run dev
npm run desktop:dev   # 需先 dev 或 generate
```

## 脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | Nuxt 开发 |
| `npm run generate` | 静态导出 |
| `npm run desktop:dev` | Electron 开发 |
| `npm run desktop:start` | 生成 + 打包 + 启动桌面 |
