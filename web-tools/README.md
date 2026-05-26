# Nexus Tools（桌面端）

Electron 开发者工具箱：JSON、Base64、时间戳等，数据仅在本地处理。

## 结构

```text
app/
  core/              # 工具注册、搜索、预填、路由
  components/        # DesktopSearchPanel、ToolGrid 等
  layouts/desktop.vue
  pages/desktop/     # search | hub
  pages/tools/       # 各工具页
desktop/             # Electron 主进程
```

## 开发

```bash
npm install
npm run dev              # 终端 1：Nuxt（http://localhost:3000）
npm run desktop:dev      # 终端 2：Electron（需先 dev 或 generate）
```

## 脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | Nuxt 开发（供 Electron 加载） |
| `npm run generate` | 静态导出（桌面打包用） |
| `npm run desktop:dev` | Electron 开发 |
| `npm run desktop:dist` | 生成静态资源 + 打包 DMG |

桌面发布：`git tag web-tools-v0.x.x && git push origin web-tools-v0.x.x`，见 [`docs/RELEASE_TAGS.md`](../docs/RELEASE_TAGS.md)。
